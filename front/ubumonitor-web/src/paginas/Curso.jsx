import { useParams, useNavigate, useLocation } from "react-router-dom";

// import { useEffect, useState } from "react";
// import { getCursoContenidos } from "../api/cursos";

import { useEffect, useState, useMemo, useRef } from "react"; //useMemo y useRef nuevos, para evitar que se recargue todo el rato y se sature
import { getCursoContenidos, getCursoUsuarios } from "../api/cursos"; // Pongo también Usuarios para hacer el filtro directamente en el curso

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

    // Constantes para participantes y filtro, revisar para modificar en caso de ser necesario
    const [usuarios, setUsuarios] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
    const [errorUsuarios, setErrorUsuarios] = useState(null);

    const [gruposSeleccionados, setGruposSeleccionados] = useState(new Set());
    const [rolesSeleccionados, setRolesSeleccionados] = useState(new Set());
    const [rolDropdownAbierto, setRolDropdownAbierto] = useState(false);
    const [grupoDropdownAbierto, setGrupoDropdownAbierto] = useState(false);
    const rolDropdownRef = useRef(null);
    const grupoDropdownRef = useRef(null);

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

    // cargarUsuarios para ver participantes en pantalla
    useEffect(() => {
        const cargarUsuarios = async () => {
            try {
                const data = await getCursoUsuarios(token, host, id);
                setUsuarios(data.users ?? []);
            } catch (e) {
                setErrorUsuarios("No se puede cargar la lista de participantes.");
                console.error(e);
            } finally {
                setCargandoUsuarios(false);
            }
        };
        cargarUsuarios();
    }, [id, token, host]);

    // Detecta el click para ver si das o no en el desplegable
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (rolDropdownRef.current && !rolDropdownRef.current.contains(e.target)) setRolDropdownAbierto(false);
            if (grupoDropdownRef.current && !grupoDropdownRef.current.contains(e.target)) setGrupoDropdownAbierto(false);
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    // Lista de grupos y lista de usuarios para los desplegables. Como hacía en Participantes.jsx detectando los posibles roles o cursos.
    const grupos = useMemo(() => {
        const mapa = new Map();
        usuarios.forEach(u => u.groups?.forEach(g => mapa.set(g.id, g.name)));
        return [...mapa.entries()].map(([id, name]) => ({ id, name }));
    }, [usuarios]);

    const roles = useMemo(() => {
        const mapa = new Map();
        usuarios.forEach(u => u.roles?.forEach(r => mapa.set(r.shortname, r.name)));
        return [...mapa.entries()].map(([shortname, name]) => ({ shortname, name }));
    }, [usuarios]);

    // Marcar y quitar casillas de roles y grupos
    const toggleRol = (shortname) => {
        setRolesSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(shortname)) next.delete(shortname);
            else next.add(shortname);
            return next;
        });
    };

    const toggleGrupo = (id) => {
        setGruposSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Mostrar según los filtros seleccionados. useMemo para evitar recalcular todo el rato.
    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => {
            if (gruposSeleccionados.size > 0 && !u.groups?.some(g => gruposSeleccionados.has(g.id))) return false;
            if (rolesSeleccionados.size > 0 && !u.roles?.some(r => rolesSeleccionados.has(r.shortname))) return false;
            return true;
        });
    }, [usuarios, gruposSeleccionados, rolesSeleccionados]);

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
                <button onClick={() => navigate("/logs")}>Logs</button>
                {/* Descarga el CSV de logs directamente desde el propio host que ponga, lo malo es que necesita iniciar sesión y permisos en el host, solo se puede ver por el momento en mount orange */}
                <a
                    href={`${host}/report/log/index.php?download=csv&id=${id}&modid=&chooselog=1&logreader=logstore_standard`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Descargar logs (CSV)
                </a>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#555" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
                </div>
            </div>

            {/* Cuerpo */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

                {/* Participantes integrados en la página */}
                <div style={{ marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "18px", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "6px" }}>Participantes</h2>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <div ref={rolDropdownRef} style={{ position: "relative" }}>
                            <button onClick={() => setRolDropdownAbierto(o => !o)} style={dropdownButtonStyle}>
                                Rol{rolesSeleccionados.size > 0 ? ` (${rolesSeleccionados.size})` : ""} ▾
                            </button>
                            {rolDropdownAbierto && (
                                <div style={dropdownPanelStyle}>
                                    {roles.length === 0
                                        ? <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Sin roles.</p>
                                        : roles.map(r => (
                                            <label key={r.shortname} style={checkboxLabelStyle}>
                                                <input type="checkbox" checked={rolesSeleccionados.has(r.shortname)} onChange={() => toggleRol(r.shortname)} />
                                                {r.name}
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                        <div ref={grupoDropdownRef} style={{ position: "relative" }}>
                            <button onClick={() => setGrupoDropdownAbierto(o => !o)} style={dropdownButtonStyle}>
                                Grupo{gruposSeleccionados.size > 0 ? ` (${gruposSeleccionados.size})` : ""} ▾
                            </button>
                            {grupoDropdownAbierto && (
                                <div style={dropdownPanelStyle}>
                                    {grupos.length === 0
                                        ? <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Este curso no tiene grupos.</p>
                                        : grupos.map(g => (
                                            <label key={g.id} style={checkboxLabelStyle}>
                                                <input type="checkbox" checked={gruposSeleccionados.has(g.id)} onChange={() => toggleGrupo(g.id)} />
                                                {g.name}
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {cargandoUsuarios && <p>Cargando participantes...</p>}
                    {errorUsuarios && <p style={{ color: "red" }}>{errorUsuarios}</p>}
                    {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length === 0 && (
                        <p style={{ color: "#aaa" }}>No hay participantes para esoss filtros.</p>
                    )}
                    {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length > 0 && (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f5f5f5", textAlign: "left" }}>
                                    <th style={thStyle}>Nombre</th>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Rol</th>
                                    <th style={thStyle}>Grupo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                {u.profileimageurl && (
                                                    <img src={u.profileimageurl} alt={u.fullname}
                                                        style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                                                )}
                                                {u.fullname}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{u.email}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {u.roles?.map(r => (
                                                    <span key={r.shortname} style={chipStyle}>{r.name}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {u.groups?.map(g => (
                                                    <span key={g.id} style={chipStyle}>{g.name}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Encabezado que va después de los participantes */}
                <h2 style={{ fontSize: "18px", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "6px" }}>Contenido del curso</h2>

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

// Constantes para estilo de tabla y desplegables
const thStyle = { padding: "10px 12px", borderBottom: "2px solid #ddd", fontWeight: "600" };
const tdStyle = { padding: "10px 12px" };
const chipStyle = {
    backgroundColor: "#e8f0fe", color: "#1a56db",
    padding: "2px 8px", borderRadius: "12px", fontSize: "12px"
};
const dropdownButtonStyle = { padding: "6px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px", backgroundColor: "#fff", cursor: "pointer" };
const dropdownPanelStyle = {
    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 10,
    backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "6px",
    padding: "10px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px"
};
const checkboxLabelStyle = { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" };
