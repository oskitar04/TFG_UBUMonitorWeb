import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCursoContenidos } from "../api/cursos";

export default function Curso() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Nombre completo del curso en la cabecera 
    const nombre = location.state?.nombre ?? `Curso ${id}`;

    const token = sessionStorage.getItem("token");
    const host = sessionStorage.getItem("host");
    const fullname = sessionStorage.getItem("fullname");

    const [secciones, setSecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await getCursoContenidos(token, host, id);
                setSecciones(data.contents ?? []);
            } catch (e) {
                setError("No se pudo cargar el contenido del curso.");
                console.error(e);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id, token, host]);  // Para cambiar de curso sin dar error

    if (!token) return (
        <div style={{ padding: "40px" }}>
            <p>No hay sesión activa.</p>
            <button onClick={() => navigate("/")}>Volver al login</button>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Cabecera */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => navigate("/cursos")}>Atrás</button>
                <h1 style={{ margin: 0, fontSize: "24px" }}>{nombre}</h1> {/* Nombre de la asigantura*/}
                <button onClick={() => navigate(`/cursos/${id}/participantes`, { state: { nombre } })}>Participantes</button>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#555" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
                </div>
            </div>

            {/* Cuerpo */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                {cargando && <p>Cargando contenido del curso...</p>}
                {error    && <p style={{ color: "red" }}>{error}</p>}
                {!cargando && !error && secciones.length === 0 && (
                    <p style={{ color: "#aaa" }}>Este curso no tiene contenido visible.</p>
                )}
                {!cargando && !error && secciones.map(seccion => (
                    <div key={seccion.id} style={{ marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "6px" }}>
                            {seccion.name || `Sección ${seccion.section}`}
                        </h2>
                        {seccion.summarytext && (
                            <p style={{ color: "#555", fontSize: "14px", marginBottom: "8px" }}>
                                {seccion.summarytext}
                            </p>
                        )}
                        {seccion.modules.length === 0
                            ? <p style={{ color: "#aaa", fontSize: "14px" }}>Sin actividades en esta sección.</p>
                            : <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {seccion.modules.map(mod => (
                                    <li key={mod.id} style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        padding: "8px 10px", borderRadius: "6px", marginBottom: "4px",
                                        backgroundColor: "#f9f9f9", border: "1px solid #eee"
                                    }}>
                                        {mod.modicon && (
                                            <img src={mod.modicon} alt={mod.modname} style={{ width: "20px", height: "20px" }} />
                                        )} {/* Icono de la izquierda del contenido */}
                                        <div>
                                            <span style={{ fontSize: "14px", fontWeight: "500" }}>{mod.name}</span> {/* Nombre módulo, el texto del contenido */}
                                            <span style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}>({mod.modname})</span> {/* Aparece a la derecha del contenido, es el nombre técino de Moodle, como quiz que es cuestionario.
                                                                                                                                                Una vez que se lo muestre en la reunión preguntar si quiere que esto se vea*/}
                                        </div>
                                    </li>
                                ))}
                              </ul>
                        }
                    </div>
                ))}
            </div>
        </div>
    );
}
