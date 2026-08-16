import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursos } from "../api/cursos";
import { leerCache } from "../api/cache";

export default function ListaCursos() {

    const [cursos, setCursos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [filtro, setFiltro] = useState("");
    
    const [actualizarDatos, setActualizarDatos] = useState(false);
    const [comprobandoId, setComprobandoId] = useState(null);

    const navigate = useNavigate();

    const token  = sessionStorage.getItem("token");
    const host   = sessionStorage.getItem("host");
    const userId = sessionStorage.getItem("userId");
    const fullname = sessionStorage.getItem("fullname");

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
                setLogs(prev => [...prev, log(`OK — ${data.courses.length} cursos recibidos.`, "ok")]);  
            } catch (e) {
                setLogs(prev => [...prev, log(`Error: ${e.message}`, "error")]);  
                setError("No se pueden cargar los cursos. Comprueba que el servidor esté activo.");
                console.error(e);
            } finally {
                setCargando(false); // Siempre para el spinner, haya error o no
            }
        };

        cargarCursos();
    }, [token, host, userId]);

    // Mira la cache y en base a si hay datos para ese curso o no, va directo a 
    // Curso.jsx o pasa por Logs.jsx
    const handleClickCurso = async (curso) => {
        setComprobandoId(curso.id);
        try {
            const cache = await leerCache(host, userId, curso.id, token);
            if (actualizarDatos || cache === null) {
                navigate("/logs", { state: { cursoId: curso.id, nombre: curso.fullname, primeraVez: cache === null } });
            } else {
                navigate(`/cursos/${curso.id}`, { state: { nombre: curso.fullname } });
            }
        } finally {
            setComprobandoId(null);
        }
    };

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

        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

            {/* Cabecera: título centrado y los botones de "Atrás" y "Cerrar sesión" a los laterales */}
            <div style={{
                padding: "16px 24px", borderBottom: "1px solid #ddd",
                display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center"
            }}>
                <div>
                    <button onClick={() => navigate("/")} style={{
                        padding: "6px 20px",
                        fontSize: "16px",
                        backgroundColor: "black",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}>Atrás</button>
                </div>
                <h1 style={{ margin: 0, fontSize: "40px", textAlign: "center" }}>Lista de cursos</h1>
                {/* Usuario al la derecha al lado del botón de "Cerrar sesión" */}
                <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px", color: "#1dbdaf" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }} style = {{
                        padding: "6px 20px",
                        fontSize: "16px",
                        backgroundColor: "black",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer" 
                    }}>
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* Cuerpo: una sola columna centrada, filtro, listado con su scroll y logs abajo. */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}>

                <p style={{ color: "#aaa", width: "100%", maxWidth: "400px" }}>
                    Selecciona un curso para ver su detalle.
                </p>

                <input
                    type="text"
                    placeholder="Buscar curso"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    style={{
                        width: "100%", 
                        maxWidth: "400px",
                        boxSizing: "border-box",
                        padding: "8px 10px",
                        marginTop: "12px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        fontSize: "14px"
                    }}
                />

                {/* Listado: altura adaptada para que no ocupe la pantalla entera. Así deja espacio al filtro y los logs de momento */}
                <div style={{maxWidth: "50%", maxHeight: "50vh", overflowY: "auto", marginTop: "12px" }}>
                    {cargando && <p>Cargando cursos...</p>}
                    {!cargando && error && <p style={{ color: "red" }}>{error}</p>}
                    {!cargando && !error && (() => {
                        const cursosFiltrados = cursos.filter(c => // Se crea la variable para que a la hora de borrar lo del filtro devuelva los cursos sin tener que volver a llamar a la api
                            c.fullname.toLowerCase().includes(filtro.toLowerCase()) // Para evitar problema con mayúsculas o minúsculas
                        );
                        return cursosFiltrados.length === 0
                            ? <p>No se encontraron cursos con ese nombre</p>
                            : <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {cursosFiltrados.map(c => (
                                    <li key={c.id} onClick={() => handleClickCurso(c)} style={{
                                        padding: "10px 12px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        marginBottom: "4px"
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        {comprobandoId === c.id ? "Comprobando datos..." : c.fullname}
                                    </li>
                                ))}
                              </ul>;
                    })()}
                </div>

                {/* Seleccionable de "Actualizar datos". */}
                <label style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", maxWidth: "400px", marginTop: "16px",
                    fontSize: "20px", cursor: "pointer"
                }}>
                    <input
                        type="checkbox"
                        checked={actualizarDatos}
                        onChange={e => setActualizarDatos(e.target.checked)}
                    />
                    Actualizar datos
                </label>

                {/* Panel de debug */}
                {logs.length > 0 && (
                    <div style={{
                        marginTop: "20px", padding: "15px", width: "100%", maxWidth: "600px",
                        backgroundColor: "#1e1e1e", borderRadius: "8px",
                        fontFamily: "monospace", fontSize: "13px", textAlign: "left"
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
    );
}
