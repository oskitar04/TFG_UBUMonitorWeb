import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursos } from "../api/cursos";

export default function ListaCursos() {

    const [cursos, setCursos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);

    const navigate = useNavigate();

    const token  = sessionStorage.getItem("token");
    const host   = sessionStorage.getItem("host");
    const userId = sessionStorage.getItem("userId");

    //debug
    const log = (mensaje, tipo = "info") => ({ hora: new Date().toLocaleTimeString(), mensaje, tipo });  

    useEffect(() => {
        // Un solo setLogs con todos los logs iniciales evita renders en cascada
        setLogs([
            log(`token presente: ${!!token}`),
            log(`host: ${host}`),
            log(`userId: ${userId}`),
            log("Llamando a GET /api/users/{userId}/courses..."),
        ]);

        const cargarCursos = async () => {
            try {
                const data = await getCursos(token, host, userId);
                setCursos(data.courses);
                //debug
                // addLog(`OK — ${data.courses.length} cursos recibidos.`, "ok");
                setLogs(prev => [...prev, log(`OK — ${data.courses.length} cursos recibidos.`, "ok")]);  
            } catch (e) {
                // addLog(`Error: ${e.message}`, "error");
                setLogs(prev => [...prev, log(`Error: ${e.message}`, "error")]);  
                setError("No se pueden cargar los cursos. Comprueba que el servidor esté activo.");
                console.error(e);
            } finally {
                setCargando(false); // Siempre para el spinner, haya error o no
            }
        };

        cargarCursos();
    }, [token, host, userId]);

    // Sin sesión se vuelve al login
    if (!token) {
        return (
            <div style={{ padding: "40px" }}>
                <p>No hay sesión activa.</p>
                <button onClick={() => navigate("/")}>Volver al login</button>
            </div>
        );
    }

    return (

        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* Se pone en columna a la izquierda */}

            {/* Cabecera */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => navigate("/")}>Atrás</button>
                <h1 style={{ margin: 0, fontSize: "30px" }}>Lista de cursos</h1>
            </div>

            {/* Cuerpo: sidebar izquierdo + área derecha */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* Sidebar de cursos */}
                <div style={{
                    width: "300px", minWidth: "300px",
                    borderRight: "1px solid #ddd",
                    overflowY: "auto",
                    padding: "16px"
                }}>
                    {cargando && <p>Cargando cursos...</p>}
                    {!cargando && error && <p style={{ color: "red" }}>{error}</p>}
                    {!cargando && !error && (
                        cursos.length === 0
                            ? <p>No se encontraron cursos.</p>
                            : <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {cursos.map(c => (
                                    <li key={c.id} style={{
                                        padding: "10px 12px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        marginBottom: "4px"
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        {c.fullname}
                                    </li>
                                ))}
                              </ul>
                    )}
                </div>

                {/* Área principal derecha (para futuro detalle del curso) */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                    <p style={{ color: "#aaa" }}>Selecciona un curso para ver su detalle.</p>

                    {/* Panel de debug */}
                    {logs.length > 0 && (
                        <div style={{
                            marginTop: "20px", padding: "15px",
                            backgroundColor: "#1e1e1e", borderRadius: "8px",
                            fontFamily: "monospace", fontSize: "13px"
                        }}>
                            <strong style={{ color: "#aaa" }}>Información de Listado_cursos</strong>
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
                </div>
            </div>
        </div>
    );
}
