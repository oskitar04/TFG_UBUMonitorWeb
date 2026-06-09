import { useState } from "react";

// import { getCursos } from "../api/cursos";
import { login, getSiteInfo } from "../api/login"

import { useNavigate } from "react-router-dom";

export default function Principal() {
    
    // Usado para crear los cursos de prueba
    //const [chartData, setChartData] = useState([]);
    
    
    /** Conseguir token */
    // const [host, setHost] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    // const [cursos, setCursos] = useState([]);

    //localStorage
    // const [host, setHost] = useState(() => localStorage.getItem("host")   || "");
    // const [token, setToken] = useState(() => localStorage.getItem("token")  || null);
    // const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
    // const [error, setError] = useState(null);   // Mensaje de error visible al usuario
    // const [cargando, setCargando] = useState(false);  // Feedback mientras se espera respuesta

    //sessionStorage
    const [host, setHost]   = useState(() => sessionStorage.getItem("host")   || "");                                                                                                      
    const [token, setToken] = useState(() => sessionStorage.getItem("token")  || null);                                                                                                    
    const [userId, setUserId] = useState(() => sessionStorage.getItem("userId") || null);                                                                                                  
    const [error, setError]     = useState(null);                                                                                                                                          
    const [cargando, setCargando] = useState(false);                                                                                                                                       
    const [logs, setLogs] = useState([]);          


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
            // const tokenObtenido = loginData.token;

            //debug
            addLog(`Paso 1 OK — token: ${loginData.token.substring(0, 10)}...`, "ok");   

            //debug
            addLog("Paso 2: obteniendo info del sitio (userId, username)...");  

            // Uso el token para obtener el userId y demás datos
            const siteData = await getSiteInfo(loginData.token, host);
            // const siteData = await getSiteInfo(tokenObtenido, host);
            const userIdObtenido = siteData.siteinfo.userid;
            //debug
            addLog(`Paso 2 OK — userId: ${userIdObtenido}, nombre: ${siteData.siteinfo.fullname}`, "ok");

            // Asigno valores
            // setToken(tokenObtenido);
            setToken(loginData.token);
            setUserId(userIdObtenido);

            // Uso localStorage para poder usar el token en otras páginas que use/haga
            // localStorage.setItem("token", tokenObtenido);
            // localStorage.setItem("host", host);
            // localStorage.setItem("userId", userIdObtenido);
            
            //sessionStorage
            sessionStorage.setItem("token",  loginData.token);                                                                                                                             
            sessionStorage.setItem("host",   host);                                                                                                                                        
            sessionStorage.setItem("userId", userIdObtenido);
            //debug                                                                                                                              
            addLog("Sesión guardada en sessionStorage.", "ok");  

            //debug
            addLog("Redirigiendo a /cursos..."); 
            // Redirigir automáticamente a la lista de cursos
            navigate("/cursos");
        } catch (e) {
            //debug
            addLog(`Error: ${e.message}`, "error"); 
            //setError("Error al iniciar sesión. Revisa el host, usuario y contraseña.");
            setError("Error al iniciar sesión. Revisa las credenciales.");
            console.error(e);
        } finally {
            setCargando(false);
        }
    };

    // const handleFetch = async () => {
    //     // El campo en la respuesta del backend es "courses", no "cursos"
    //     const data = await getCursos(token, host, userId);
    //     setCursos(data.courses);
    // }

    const handleLogout = () => {
        setToken(null);
        setUserId(null);
        setHost("");

        // localStorage.removeItem("token");
        // localStorage.removeItem("host");
        // localStorage.removeItem("userId");

        //sessionStorage
        sessionStorage.removeItem("token");                                                                                                                                                
        sessionStorage.removeItem("host");                                                                                                                                                 
        sessionStorage.removeItem("userId");                                                                                                                                               
        setLogs([]);
    };

    const sessionToken  = sessionStorage.getItem("token");                                                                                                                                 
    const sessionHost   = sessionStorage.getItem("host");                                                                                                                                  
    const sessionUserId = sessionStorage.getItem("userId"); 

    
    return (
        <div style={{ padding: "40px" }}>
            <h1>UBUMonitor Web</h1>

            {!token ? (
                // Pantalla del login
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px" }}> 
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
                    <p>Sesión activa — userId: <strong>{userId}</strong></p>                                                                                                               
                    <button onClick={() => navigate("/cursos")}>Ver cursos</button>

                    {/* sessionStorage
                    <p>Token obtenido correctamente</p>
                    <button onClick={handleFetch}>Cargar cursos</button>
                    {cursos.map(c => <div key={c.id}>{c.name}</div>)} */}
                </div>
            )}
        


            {/* Panel de debug: logs del login */}                                                                                                                                         
            {logs.length > 0 && (                                                                                                                                                          
                <div style={{                                                                                                                                                              
                    marginTop: "30px", padding: "15px", maxWidth: "600px",                                                                                                                 
                    backgroundColor: "#115f5f", borderRadius: "8px",                                                                                                                       
                    fontFamily: "monospace", fontSize: "13px"                                                                                                                              
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
                marginTop: "20px", padding: "12px", maxWidth: "600px",                                                                                                                     
                backgroundColor: "#f0f0f0", borderRadius: "8px",                                                                                                                           
                fontFamily: "monospace", fontSize: "12px"                                                                                                                                  
            }}>                                                                                                                                                                            
                <strong>sessionStorage actual</strong>                                                                                                                                     
                <div>token:  {sessionToken  ? `${sessionToken.substring(0, 10)}...` : "—"}</div>                                                                                           
                <div>host:   {sessionHost   || "—"}</div>                                                                                                                                  
                <div>userId: {sessionUserId || "—"}</div>                                                                                                                                  
            </div> 


            {/* Entrada */}
            {/* <input
            type="text"
            placeholder="Introduce datos"
            value={token}
            onChange={(e) => setToken(e.target.value)} /> */}
            {/*Input controlado. value = {token} lo vincula al estado, onChange
                actualiza el estado cada vez que el usuario escribe. Sin el onChange,
                el input sería de solo lectura*/}

            {/* Botones */}

            {/* <button onClick={handleFetch} style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "black",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px"
                }}>
                Cargar cursos (Opcion 2)
            </button> */}
            {/* Dos botones con la misma función (handleFetch), se diferencian 
                en los estilos. La opcion 2 tiene CSS inline (fondo negro, texto blanco, etc.)*/}

            <button onClick={handleLogout} style={{
                position:"absolute",
                top: "2px",
                right: "2px",
                width: "100px",
                height:"40px",

                // marginTop: "2px",
                // marginRight: "2px", // Estos datos son con respecto a otro elemente que tenga al lado

                fontSize: "16px",
                backgroundColor: "black",
                color: "white",

                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
            }}>
                Apagar
            </button>

            <button onClick={handleLogout} style={{                                                                                                                                        
                position: "absolute", top: "10px", right: "10px",                                                                                                                          
                padding: "8px 16px", fontSize: "14px",                                                                                                                                     
                backgroundColor: "black", color: "white",                                                                                                                                  
                border: "none", borderRadius: "5px", cursor: "pointer"                                                                                                                     
            }}> 
                Cerrar sesión                                                                                                                                                              
            </button> 


            {/* Botón para pasar a la página de cursos (sin recargar la app) */}
            {/* <button onClick={() => navigate("/cursos")}>
                Ver cursos
            </button> */}
            


            {/* Datos */}
            {/* Renderiza la lista de cursos. Por cada elemento de cursos, crea un <div>. El 
                key es obligatorio en React para identificar cada elemento de forma única*/}
            {/* <div>
            <h2>Cursos Actuales:</h2>
            {cursos.map((c) => (
                <div key={c.id}>{c.name}</div>
            ))}
            </div> */}

            {/* Gráfico */}
            {/* Muestra el gráfico pasándole chartData como prop. El componente Graficos se 
                encarga de renderizarlo.*/}
            {/*<Graficos data={chartData} /> */}
        </div>
);
}
