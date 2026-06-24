import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getCursoUsuarios } from "../api/cursos";

export default function Participantes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const nombre = location.state?.nombre ?? `Curso ${id}`;

    const token = sessionStorage.getItem("token");
    const host = sessionStorage.getItem("host");
    const fullname = sessionStorage.getItem("fullname");

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [grupoFiltro, setGrupoFiltro] = useState("");
    const [rolFiltro, setRolFiltro] = useState("");

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await getCursoUsuarios(token, host, id);
                setUsuarios(data.users ?? []);
            } catch (e) {
                setError("No se pudo cargar la lista de participantes.");
                console.error(e);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id, token, host]);

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

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => {
            if (busqueda && !u.fullname.toLowerCase().includes(busqueda.toLowerCase())) return false;
            if (grupoFiltro && !u.groups?.some(g => g.id === Number(grupoFiltro))) return false;
            if (rolFiltro && !u.roles?.some(r => r.shortname === rolFiltro)) return false;
            return true;
        });
    }, [usuarios, busqueda, grupoFiltro, rolFiltro]); 

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
                <button onClick={() => navigate(`/cursos/${id}`, { state: { nombre } })}>Atrás</button>
                <h1 style={{ margin: 0, fontSize: "24px" }}>Participantes — {nombre}</h1>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#555" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
                </div>
            </div>

            {/* Cuerpo */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

                {/* Filtro */}
                <div style={{ marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Buscar participante"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" }}
                    />
                    <select value={grupoFiltro} onChange={e => setGrupoFiltro(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" }}>
                        <option value="">Todos los grupos</option>
                        {grupos.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" }}>
                        <option value="">Todos los roles</option>
                        {roles.map(r => <option key={r.shortname} value={r.shortname}>{r.name}</option>)}
                    </select>
                </div>
                {cargando && <p>Cargando participantes...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!cargando && !error && usuariosFiltrados.length === 0 && (
                    <p style={{ color: "#aaa" }}>No hay participantes que coincidan con los filtros.</p>
                )}
                {!cargando && !error && usuariosFiltrados.length > 0 && (
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
        </div>
    );
}

// Constantes de estilos de tabla
const thStyle = { padding: "10px 12px", borderBottom: "2px solid #ddd", fontWeight: "600" };
const tdStyle = { padding: "10px 12px" };
const chipStyle = {
    backgroundColor: "#e8f0fe", color: "#1a56db",
    padding: "2px 8px", borderRadius: "12px", fontSize: "12px"
};
