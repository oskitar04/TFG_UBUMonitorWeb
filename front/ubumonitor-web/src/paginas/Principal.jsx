import { useState } from "react";

// import { getCursos } from "../api/cursos";
import { login, getSiteInfo } from "../api/login"
import { getSsoConfig, iniciarLoginSso, completarLoginSso } from "../api/loginSso"

import { useNavigate } from "react-router-dom";

export default function Principal() {
    
    // Conseguir token
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // sessionStorage
    const [host, setHost] = useState(() => sessionStorage.getItem("host")   || "");
    const [token, setToken] = useState(() => sessionStorage.getItem("token")  || null);
    const [userId, setUserId] = useState(() => sessionStorage.getItem("userId") || null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [logs, setLogs] = useState([]);

    // Login SSO + 2FA
    const [modoSso, setModoSso] = useState(false);
    const [sessionIdSso, setSessionIdSso] = useState(null);
    const [codigoSso, setCodigoSso] = useState("");

    // fullname para mostrar que usuario está iniciado, va junto al userId
    const [fullname, setFullname] = useState(() => sessionStorage.getItem("fullname") || null);


    // Para cambiar de páginas sin necesidad de recargar. "Ver cursos" para ir a /cursos
    const navigate = useNavigate();

    //sessionStorage
    const addLog = (mensaje, tipo = "info") => {                                                                                                                                           
    const hora = new Date().toLocaleTimeString();                                                                                                                                      
    setLogs(prev => [...prev, { hora, mensaje, tipo }]);                                                                                                                               
    console.log(`[${hora}] [${tipo.toUpperCase()}] ${mensaje}`);                                                                                                                       
    }; 

    // Común al login clásico y al SSO: pide site/info, guarda todo en
    // sessionStorage y navega a /cursos.
    const finalizarLogin = async (tokenObtenido, privatetokenObtenido, hostUsado) => {
        addLog("Paso 2: obteniendo info del sitio (userId, username)...");

        const siteData = await getSiteInfo(tokenObtenido, hostUsado);
        const userIdObtenido = siteData.siteinfo.userid;

        addLog(`Paso 2 OK — userId: ${userIdObtenido}, nombre: ${siteData.siteinfo.fullname}`, "ok");
        
        setToken(tokenObtenido);
        setUserId(userIdObtenido);

        // sessionStorage
        sessionStorage.setItem("token", tokenObtenido);
        sessionStorage.setItem("host", hostUsado);
        sessionStorage.setItem("userId", userIdObtenido);
        // Moodle solo lo devuelve por HTTPS y a usuarios no admin; si no, viene null.
        sessionStorage.setItem("privatetoken", privatetokenObtenido ?? "");
        // Incluyo fullname
        sessionStorage.setItem("fullname", siteData.siteinfo.fullname);
        setFullname(siteData.siteinfo.fullname);
        // debug
        addLog("Sesión guardada en sessionStorage.", "ok");
        addLog("Redirigiendo a /cursos...");
        navigate("/cursos");
    };

    // Para guardar el token y el userId
    const handleLogin = async () => {
        setError(null);
        setCargando(true);

        //sessionStorage
        setLogs([]);                                                                                                                                                                       
        addLog(`Host: ${host}`);                                                                                                                                                           
        addLog(`Usuario: ${username}`);

        try {
            // Pregunto a Moodle si se necesita SSO antes de intentar el login normal.
            addLog("Paso 0: comprobando el tipo de login del Moodle...");
            const config = await getSsoConfig(host);
            addLog(`Paso 0 OK — typeoflogin: ${config.typeoflogin}`, "ok");

            if (config.typeoflogin !== 1) {
                if (!config.ssoLoginUrl) {
                    throw new Error("Este Moodle exige SSO pero no se ha encontrado la URL del proveedor de identidad.");
                }
                addLog("Este Moodle exige SSO. Paso 1: mandando usuario/contraseña...");
                const { sessionId } = await iniciarLoginSso(host, config.ssoLoginUrl, username, password);
                addLog("Paso 1 OK — código enviado por email.", "ok");
                setSessionIdSso(sessionId);
                setModoSso(true);
                setCargando(false);
                return;
            }

            //Debug
            addLog("Paso 1: solicitando token a Moodle..."); 
            
            // Saco el token
            const loginData = await login(host, username, password);

            //debug
            addLog(`Paso 1 OK — token: ${loginData.token.substring(0, 10)}...`, "ok");
            // Aviso si Moodle no manda privatetoken
            addLog(loginData.privatetoken
                ? "privatetoken recibido."
                : "Sin privatetoken (Moodle en HTTP o usuario admin): se usará el flujo manual.",
                loginData.privatetoken ? "ok" : "info");

            await finalizarLogin(loginData.token, loginData.privatetoken, host);
        } catch (e) {
            //debug
            addLog(`Error: ${e.message}`, "error");
            setError("Error al iniciar sesión. Revisa las credenciales.");
            console.error(e);
            setCargando(false);
        }
    };

    // Comprueba el código que ha llegado por email y termina el login SSO.
    const handleConfirmarCodigoSso = async () => {
        setError(null);
        setCargando(true);

        try {
            addLog("Paso 2: comprobando el código...");
            const { token: tokenObtenido, privatetoken } = await completarLoginSso(sessionIdSso, codigoSso);
            addLog("Código correcto.", "ok");
            await finalizarLogin(tokenObtenido, privatetoken, host);
        } catch (e) {
            addLog(`Error: ${e.message}`, "error");
            setError("Código incorrecto o caducado. Vuelve a intentarlo.");
            console.error(e);
            setCargando(false);
        }
    };

    // Vuelve al formulario de usuario/contraseña, por si el usuario se ha equivocado o el código ha caducado.
    const handleVolverDeSso = () => {
        setModoSso(false);
        setSessionIdSso(null);
        setCodigoSso("");
        setError(null);
    };

    const handleLogout = () => {
        setToken(null);
        setUserId(null);
        setHost("");

        //sessionStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("host");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("privatetoken");

        //fullname para mostrar
        sessionStorage.removeItem("fullname");
        setFullname(null);
        setLogs([]);
    };

    const sessionToken = sessionStorage.getItem("token");
    const sessionHost = sessionStorage.getItem("host");
    const sessionUserId = sessionStorage.getItem("userId");
    
    // fullname para mostrar
    const sessionFullname = sessionStorage.getItem("fullname");

    
    return (
        <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1>UBUMonitor Web</h1>

            {!token ? (
                modoSso ? (
                    // Login SSO: pedir el código que ha llegado por email
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "400px" }}>
                        <p>Se ha enviado un código por email. Introdúcelo para continuar.</p>
                        <input placeholder="Código" value={codigoSso} onChange={e => setCodigoSso(e.target.value)} />
                        <button onClick={handleConfirmarCodigoSso} disabled={cargando}>
                            {cargando ? "Comprobando..." : "Confirmar código"}
                        </button>
                        <button onClick={handleVolverDeSso}>Volver</button>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </div>
                ) : (
                    // Pantalla del login
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "400px" }}>
                        <input placeholder="Host (ej: https://ubuvirtual.ubu.es)" value={host} onChange={e => setHost(e.target.value)} />
                        <input placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
                        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                        <button onClick={handleLogin} disabled={cargando}>
                            {cargando ? "Iniciando sesión..." : "Login"}
                        </button>
                        {/* Mensaje de error si el login falla */}
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </div>
                )
            ) : (
                // Inicio de sesión correcto (aparece cuando das a "Atrás" en los cursos)
                <div>
                    <p style={{ color: "#888", fontSize: "14px", margin: "0 0 4px 0" }}>
                        Ubicación actual: <strong>Página Principal</strong>
                        {/* Ir ajustando tamaño y echar un ojo a ver si es necesario ponerlo en la página principal*/}
                    </p>
                    
                    {/* Nombre del usuario completo junto con el userId para ver quien está con la sesión activa en caso de volver a la pagina principal */}
                    <p>Sesión activa: <strong>{fullname} ({userId})</strong></p>
                    <button onClick={() => navigate("/cursos")}>Ver cursos</button>

                </div>
            )}

            {/* Panel de debug: logs del login */}                                                                                                                                         
            {logs.length > 0 && (                                                                                                                                                          
                <div style={{
                    marginTop: "30px", padding: "15px", width: "100%", maxWidth: "600px",
                    backgroundColor: "#115f5f", borderRadius: "8px",
                    fontFamily: "monospace", fontSize: "13px", textAlign: "left"
                }}>                                                                                                                                                                      
                    <strong style={{ color: "#ccda0b" }}>Debug — flujo de login</strong>                                                                                                      
                    <div style={{ marginTop: "8px" }}>                                                                                                                                     
                        {logs.map((log, i) => (                                                                                                                                            
                            <div key={i} style={{                                                                                                                                          
                                color: log.tipo === "error" ? "#f88" : log.tipo === "ok" ? "#8f8" : "#ccc",                                                                                
                                padding: "2px 0"                                                                                                                                           
                            }}>                                                                                                                                                            
                                <span style={{ color: "#666" }}>[{log.hora}]</span> {log.mensaje}                                                                                          
                            </div>                                                                                                                                                         
                        ))}                                                                                                                                                                
                    </div>                                                                                                                                                                 
                </div>                                                                                                                                                                     
            )}

            {/* Panel de debug: estado de sessionStorage */}                                                                                                                               
            <div style={{
                marginTop: "20px", padding: "12px", width: "100%", maxWidth: "600px",
                backgroundColor: "#f0f0f0", borderRadius: "8px",
                fontFamily: "monospace", fontSize: "12px", textAlign: "left"
            }}>                                                                                                                                                                          
                <strong>sessionStorage actual</strong>
                <div>token: {sessionToken ? `${sessionToken.substring(0, 10)}...` : "—"}</div>
                <div>privatetoken: {sessionStorage.getItem("privatetoken") ? "sí" : "—"}</div>
                <div>host: {sessionHost || "—"}</div>
                <div>userId: {sessionUserId || "—"}</div>
                <div>fullname: {sessionFullname || "—"}</div>
            </div> 

            <button onClick={handleLogout} style={{                                                                                                                                        
                position: "absolute", 
                top: "10px", 
                right: "5px",                                                                                                                          
                padding: "8px 16px", 
                                
                // marginTop: "2px", // El espacio "libre" que se respeta con
                // marginRight: "2px", // respecto a otros elementos de la página

                fontSize: "14px",                                                                                                                                     
                backgroundColor: "black", 
                color: "white",                                                                                                                                  
                border: "none", 
                borderRadius: "5px", 
                cursor: "pointer"                                                                                                                     
            }}> 
                Cerrar sesión                                                                                                                                                              
            </button> 
        </div>
);
}
