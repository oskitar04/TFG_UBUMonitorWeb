import { useState } from "react";

// import { getCursos } from "../api/cursos";
import { login, getSiteInfo } from "../api/login"

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

    // Para guardar el token y el userId
    const handleLogin = async () => {
        setError(null);
        setCargando(true);

        //sessionStorage
        setLogs([]);                                                                                                                                                                       
        addLog(`Host: ${host}`);                                                                                                                                                           
        addLog(`Usuario: ${username}`);

        try {
            //Debug
            addLog("Paso 1: solicitando token a Moodle..."); 
            
            // Saco el token
            const loginData = await login(host, username, password);

            //debug
            addLog(`Paso 1 OK — token: ${loginData.token.substring(0, 10)}...`, "ok");   

            //debug
            addLog("Paso 2: obteniendo info del sitio (userId, username)...");  

            // Uso el token para obtener el userId y demás datos
            const siteData = await getSiteInfo(loginData.token, host);
            const userIdObtenido = siteData.siteinfo.userid;

            //debug
            addLog(`Paso 2 OK — userId: ${userIdObtenido}, nombre: ${siteData.siteinfo.fullname}`, "ok");

            // setToken(tokenObtenido);
            setToken(loginData.token);
            setUserId(userIdObtenido);
            
            //sessionStorage
            sessionStorage.setItem("token", loginData.token);
            sessionStorage.setItem("host", host);
            sessionStorage.setItem("userId", userIdObtenido);
            // Incluyo fullname
            sessionStorage.setItem("fullname", siteData.siteinfo.fullname);
            setFullname(siteData.siteinfo.fullname);
            //debug
            addLog("Sesión guardada en sessionStorage.", "ok");

            //debug
            addLog("Redirigiendo a /cursos..."); 
            // Redirigir automáticamente a la lista de cursos
            navigate("/cursos");
        } catch (e) {
            //debug
            addLog(`Error: ${e.message}`, "error"); 
            setError("Error al iniciar sesión. Revisa las credenciales.");
            console.error(e);
        } finally {
            setCargando(false);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUserId(null);
        setHost("");

        //sessionStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("host");
        sessionStorage.removeItem("userId");

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
