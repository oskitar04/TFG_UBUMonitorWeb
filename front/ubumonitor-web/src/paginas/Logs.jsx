import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { procesarLogs } from "../api/logs";

export default function Logs() {
    const navigate = useNavigate();

    const token = sessionStorage.getItem("token");
    const fullname = sessionStorage.getItem("fullname");

    const [archivo, setArchivo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);

    //debug
    const addLog = (mensaje, tipo = "info") => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { hora, mensaje, tipo }]);
        console.log(`[${hora}] [${tipo.toUpperCase()}] ${mensaje}`);
    };

    const handleArchivo = (e) => {
        const f = e.target.files[0] ?? null;
        setArchivo(f);
        setError(null);
        if (f) addLog(`Archivo seleccionado: ${f.name}`);
    };

    const handleProcesar = async () => {
        if (!archivo) return;
        setCargando(true);
        setError(null);
        addLog("Enviando archivo al backend para limpiarlo...");

        try {
            const blob = await procesarLogs(archivo);

            // Igual que la forma de nombre que genera el backend
            const nombreBase = archivo.name.replace(/\.csv$/i, "");
            const nombreDescarga = `${nombreBase}_processed.csv`;

            const url = URL.createObjectURL(blob);
            const enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = nombreDescarga;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            URL.revokeObjectURL(url);

            addLog(`OK — descarga iniciada: ${nombreDescarga}`, "ok");
        } catch (e) {
            addLog(`Error: ${e.message}`, "error");
            setError("No se pudo procesar el archivo de logs.");
            console.error(e);
        } finally {
            setCargando(false);
        }
    };

    // Sin sesión se vuelve al login, igual que en el resto de páginas
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

            {/* Cabecera */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => navigate("/")}>Atrás</button>
                <h1 style={{ margin: 0, fontSize: "24px" }}>Procesar logs</h1>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#555" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
                </div>
            </div>

            {/* Cuerpo */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                <p style={{ color: "#555", fontSize: "14px" }}>
                    Selecciona el CSV de logs descargado de Moodle para limpiarlo.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px", marginTop: "20px" }}>
                    <input type="file" accept=".csv" onChange={handleArchivo} />
                    <button onClick={handleProcesar} disabled={!archivo || cargando}>
                        {cargando ? "Procesando..." : "Procesar y descargar"}
                    </button>

                    {error && <p style={{ color: "red" }}>{error}</p>}
                </div>

                {/* Panel de debug */}
                {logs.length > 0 && (
                    <div style={{
                        marginTop: "30px", padding: "15px", maxWidth: "600px",
                        backgroundColor: "#1e1e1e", borderRadius: "8px",
                        fontFamily: "monospace", fontSize: "13px"
                    }}>
                        <strong style={{ color: "#aaa" }}>Información de Logs</strong>
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
