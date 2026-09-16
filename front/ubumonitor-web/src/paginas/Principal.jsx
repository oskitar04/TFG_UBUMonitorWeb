import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, getSiteInfo } from "../api/login"
import { getSsoConfig, iniciarLoginSso, completarLoginSso } from "../api/loginSso"
import { estaDebugActivado, guardarDebugActivado } from "../utils/debug";
import PanelDebug from "../componentes/panelDebug";

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

    // Activar/desactivar paneles de debug en la app (desactivado por defecto).
    const [debugActivo, setDebugActivo] = useState(estaDebugActivado);
    const handleToggleDebug = (checked) => {
        guardarDebugActivado(checked);
        setDebugActivo(checked);
    };

    // Para cambiar de páginas sin necesidad de recargar. "Ver cursos" para ir a /cursos
    const navigate = useNavigate();

    // Logs para el panel de debug.
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
        // Foto de perfil, tanto si es necesario la sesión como si no.
        sessionStorage.setItem("userpictureurl", siteData.siteinfo.privateuserpictureurl ?? siteData.siteinfo.userpictureurl ?? "");
        // debug
        addLog("Sesión guardada en sessionStorage.", "ok");
        addLog("Redirigiendo a /cursos...");
        navigate("/cursos");
    };

    // Para guardar el token y el userId
    const handleLogin = async () => {
        setError(null);
        setCargando(true);

        // Reinicia los logs del intento anterior
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

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("host");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("privatetoken");
        sessionStorage.removeItem("fullname");
        sessionStorage.removeItem("userpictureurl");
        setFullname(null);
        setLogs([]);
    };

    const sessionToken = sessionStorage.getItem("token");
    const sessionHost = sessionStorage.getItem("host");
    const sessionUserId = sessionStorage.getItem("userId");
    const sessionFullname = sessionStorage.getItem("fullname");

    return (
        <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1>UBUMonitor Web</h1>

            {!token ? (
                modoSso ? (
                    // Login SSO: pedir el código que ha llegado por email
                    <form
                        onSubmit={e => { e.preventDefault(); handleConfirmarCodigoSso(); }}
                        style={{
                            display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "380px",
                            background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px",
                            padding: "32px", boxShadow: "var(--shadow)", boxSizing: "border-box"
                        }}
                    >
                        <h2 style={{ margin: 0 }}>Verificación</h2>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
                            Se ha enviado un código por email. Introdúcelo para continuar.
                        </p>
                        <input
                            className="campo"
                            name="codigoSso"
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="Código"
                            value={codigoSso}
                            onChange={e => setCodigoSso(e.target.value)}
                        />
                        {error && <div className="alerta-error">{error}</div>}
                        <button type="submit" className="boton boton-primario" disabled={cargando}>
                            {cargando ? "Comprobando..." : "Confirmar código"}
                        </button>
                        <button type="button" className="boton boton-secundario" onClick={handleVolverDeSso}>
                            Volver
                        </button>
                    </form>
                ) : (
                    // Pantalla del login
                    <form
                        onSubmit={e => { e.preventDefault(); handleLogin(); }}
                        autoComplete="on"
                        style={{
                            display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "380px",
                            background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px",
                            padding: "32px", boxShadow: "var(--shadow)", boxSizing: "border-box"
                        }}
                    >
                        <h2 style={{ margin: 0 }}>Iniciar sesión</h2>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text)", textAlign: "left" }}>
                            Host
                            <input
                                className="campo"
                                name="host"
                                placeholder="https://ubuvirtual.ubu.es"
                                value={host}
                                onChange={e => setHost(e.target.value)}
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text)", textAlign: "left" }}>
                            Usuario
                            <input
                                className="campo"
                                name="username"
                                autoComplete="username"
                                placeholder="Usuario"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text)", textAlign: "left" }}>
                            Contraseña
                            <input
                                className="campo"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </label>
                        {/* Mensaje de error si el login falla */}
                        {error && <div className="alerta-error">{error}</div>}
                        <button type="submit" className="boton boton-primario" disabled={cargando}>
                            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
                        </button>
                    </form>
                )
            ) : (
                // Inicio de sesión correcto (aparece cuando das a "Atrás" en los cursos)
                <div style={{
                    display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "380px",
                    background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px",
                    padding: "32px", boxShadow: "var(--shadow)", boxSizing: "border-box"
                }}>
                    <p style={{ color: "var(--text)", fontSize: "14px", margin: 0 }}>
                        Ubicación actual: <strong>Página Principal</strong>
                    </p>

                    {/* Nombre del usuario completo junto con el userId para ver quien está con la sesión activa en caso de volver a la pagina principal */}
                    <p style={{ margin: 0 }}>Sesión activa: <strong>{fullname} ({userId})</strong></p>
                    <button onClick={() => navigate("/cursos")} className="boton boton-primario">Ver cursos</button>
                </div>
            )}

            {/* Activa/desactiva los paneles de debug en todas las páginas de la app */}
            <label style={{
                marginTop: "24px", display: "flex", alignItems: "center", gap: "8px",
                fontSize: "13px", color: "var(--text)", cursor: "pointer"
            }}>
                <input type="checkbox" checked={debugActivo} onChange={e => handleToggleDebug(e.target.checked)} />
                Modo desarrollador (panel de debug en todas las pantallas)
            </label>

            {/* Panel de debug: logs del login */}
            <PanelDebug logs={logs} titulo="Debug — flujo de login" />

            {/* Panel de debug: estado de sessionStorage */}
            {debugActivo && (
                <div style={{
                    marginTop: "20px", padding: "12px", width: "100%", maxWidth: "600px",
                    backgroundColor: "var(--log-bg)", color: "var(--log-info)", borderRadius: "8px",
                    fontFamily: "monospace", fontSize: "12px", textAlign: "left"
                }}>
                    <strong style={{ color: "var(--log-title)" }}>sessionStorage actual</strong>
                    <div>token: {sessionToken ? `${sessionToken.substring(0, 10)}...` : "—"}</div>
                    <div>privatetoken: {sessionStorage.getItem("privatetoken") ? "sí" : "—"}</div>
                    <div>host: {sessionHost || "—"}</div>
                    <div>userId: {sessionUserId || "—"}</div>
                    <div>fullname: {sessionFullname || "—"}</div>
                </div>
            )}

            {/* Solo tiene sentido cerrar sesión si ya hay una sesión activa */}
            {token && (
                <button onClick={handleLogout} className="boton boton-primario" style={{ position: "absolute", top: "10px", right: "5px" }}>
                    Cerrar sesión
                </button>
            )}
        </div>
);
}
