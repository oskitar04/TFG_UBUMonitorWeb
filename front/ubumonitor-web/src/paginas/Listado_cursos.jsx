import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursos } from "../api/cursos";
import { leerCache } from "../api/cache";
import PanelDebug from "../componentes/panelDebug";

// Añade el token a la url para poder obtener la foto.
const conToken = (url, token) => {
    if (!url) return url;
    return url.includes("?") ? `${url}&token=${token}` : `${url}?token=${token}`;
};

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
    const userPictureUrl = sessionStorage.getItem("userpictureurl");

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
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                <div style={{
                    display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "380px",
                    background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px",
                    padding: "32px", boxShadow: "var(--shadow)", boxSizing: "border-box", textAlign: "center"
                }}>
                    <p style={{ margin: 0, color: "var(--text)" }}>No hay sesión activa.</p>
                    <button onClick={() => navigate("/")} className="boton boton-primario">Volver al login</button>
                </div>
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
                    <button onClick={() => navigate("/")} className="boton boton-primario">Atrás</button>
                </div>
                <h1 style={{ margin: 0, fontSize: "40px", textAlign: "center" }}>Lista de cursos</h1>
                {/* Usuario al la derecha al lado del botón de "Cerrar sesión" */}
                <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: "12px" }}>
                    {userPictureUrl && (
                        <img
                            src={conToken(userPictureUrl, token)}
                            alt=""
                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", display: "block" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    )}
                    <span style={{ fontSize: "16px", color: "var(--text)" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }} className="boton boton-primario">
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
                    className="campo"
                    style={{ maxWidth: "400px", marginTop: "12px" }}
                />

                {/* Listado: altura adaptada para que no ocupe la pantalla entera. Así deja espacio al filtro y los logs de momento */}
                <div style={{maxWidth: "50%", maxHeight: "50vh", overflowY: "auto", marginTop: "12px" }}>
                    {cargando && <p>Cargando cursos...</p>}
                    {!cargando && error && <div className="alerta-error">{error}</div>}
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
                <PanelDebug logs={logs} titulo="Información de Listado_cursos" />
            </div>
        </div>
    );
}
