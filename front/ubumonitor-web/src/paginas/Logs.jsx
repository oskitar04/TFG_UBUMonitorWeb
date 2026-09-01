import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { procesarLogs, parsearLogsCsv } from "../api/logs";
import { guardarCache } from "../api/cache";
import { actualizarLogsAutomatico } from "../api/logsAuto";

const UMBRAL_AVISO_MS = 2 * 60 * 1000; // 2 minutos
const CUENTA_ATRAS_S = 30;

export default function Logs() {
    const navigate = useNavigate();
    const location = useLocation();

    const token = sessionStorage.getItem("token");
    const host = sessionStorage.getItem("host");
    const userId = sessionStorage.getItem("userId"); 
    const fullname = sessionStorage.getItem("fullname");
    const privatetoken = sessionStorage.getItem("privatetoken");

    const cursoId = location.state?.cursoId ?? null;
    const nombreCurso = location.state?.nombre ?? null;

    const primeraVez = location.state?.primeraVez ?? false;

    const [archivo, setArchivo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);

    // Si se llega con un curso, se empieza intentando la descarga
    // automática ("auto"). Solo si falla se cae al flujo manual ("inicio").
    const [paso, setPaso] = useState(cursoId ? "auto" : "inicio");
    const [avisando, setAvisando] = useState(false);
    const [cuentaAtras, setCuentaAtras] = useState(CUENTA_ATRAS_S);

    const [pasoAutoMsg, setPasoAutoMsg] = useState("");
    const [autoError, setAutoError] = useState(null);
    const autoLanzadoRef = useRef(false);

    const popupRef = useRef(null);
    const sondeoRef = useRef(null);
    const avisoTimeoutRef = useRef(null);
    const cuentaAtrasIntervalRef = useRef(null);
    const inputRef = useRef(null);

    //debug
    const addLog = (mensaje, tipo = "info") => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { hora, mensaje, tipo }]);
        console.log(`[${hora}] [${tipo.toUpperCase()}] ${mensaje}`);
    };

    const limpiarTemporizadores = () => {
        if (sondeoRef.current) clearInterval(sondeoRef.current);
        if (avisoTimeoutRef.current) clearTimeout(avisoTimeoutRef.current);
        if (cuentaAtrasIntervalRef.current) clearInterval(cuentaAtrasIntervalRef.current);
        sondeoRef.current = null;
        avisoTimeoutRef.current = null;
        cuentaAtrasIntervalRef.current = null;
    };

    useEffect(() => {
        return () => limpiarTemporizadores();
    }, []);

    // Al entrar con un curso, se intenta descargar y procesar los logs solo.
    useEffect(() => {
        if (!cursoId || autoLanzadoRef.current) return;
        autoLanzadoRef.current = true;

        let cancelado = false;
        (async () => {
            try {
                addLog("Intentando obtener los logs automáticamente...");
                const datos = await actualizarLogsAutomatico({
                    host, token, privatetoken, userId, cursoId,
                    onPaso: (m) => { if (!cancelado) { setPasoAutoMsg(m); addLog(m); } },
                });
                if (cancelado) return;
                addLog(`Logs obtenidos automáticamente: ${datos.filas.length} eventos, ${datos.componentes.length} componentes.`, "ok");
                navigate(`/cursos/${cursoId}`, { state: { nombre: nombreCurso } });
            } catch (err) {
                if (cancelado) return;
                addLog(`No se pudo obtener automáticamente: ${err.message}`, "error");
                setAutoError(err.message);
                setPaso("inicio");
            }
        })();

        return () => { cancelado = true; };
        // Solo al montar, las dependencias vienen de sessionStorage/location.state y no cambian.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const iniciarCuentaAtras = () => {
        setAvisando(true);
        setCuentaAtras(CUENTA_ATRAS_S);
        addLog("La ventana lleva 2 minutos abierta: mostrando aviso.");
        cuentaAtrasIntervalRef.current = setInterval(() => {
            setCuentaAtras(prev => {
                if (prev <= 1) {
                    clearInterval(cuentaAtrasIntervalRef.current);
                    if (popupRef.current && !popupRef.current.closed) {
                        addLog("Sin respuesta al aviso: cerrando la ventana automáticamente.", "error");
                        popupRef.current.close();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // El usuario pide más tiempo, cancela la cuenta atrás y vuelve el aviso de 2 min
    const handleNecesitoMasTiempo = () => {
        clearInterval(cuentaAtrasIntervalRef.current);
        setAvisando(false);
        addLog("Se ha pedido más tiempo, se reinicia el plazo de 2 minutos.");
        avisoTimeoutRef.current = setTimeout(iniciarCuentaAtras, UMBRAL_AVISO_MS);
    };

    // Al no tener permisos para mirar si se ha descargado solo espero a ver que la pestaña se cierre.
    const handleActualizar = () => {
        const url = `${host}/report/log/index.php?id=${cursoId}&chooselog=1&showusers=1&showactions=1&download=csv`;

        const ancho = 480, alto = 640;
        const left = 20;
        // Fijo la pestaña a la esquina superior izquierda.
        popupRef.current = window.open(
            url,
            "descargaLogs",
            `width=${ancho},height=${alto},top=20,left=${left}`
        );

        if (!popupRef.current) {
            addLog("El navegador ha bloqueado la ventana emergente. Permite las ventanas emergentes para este sitio.", "error");
            return;
        }

        addLog("Ventana de descarga abierta arriba a la izquierda.");
        setPaso("descargando");

        sondeoRef.current = setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
                limpiarTemporizadores();
                addLog("Ventana de descarga cerrada.", "ok");
                setAvisando(false);
                setPaso("seleccionArchivo");
            }
        }, 750);

        avisoTimeoutRef.current = setTimeout(iniciarCuentaAtras, UMBRAL_AVISO_MS);
    };

    // Click para poder abrir el selector de archivos.
    const handleElegirArchivo = () => {
        inputRef.current?.click();
    };

    const handleArchivoElegido = async (e) => {
        const f = e.target.files[0] ?? null;
        if (!f) return;
        setPaso("procesando");
        addLog(`Archivo elegido: ${f.name}. Procesando...`);

        try {
            const blob = await procesarLogs(f);
            const texto = await blob.text();
            const datos = parsearLogsCsv(texto);
            addLog(`CSV procesado: ${datos.filas.length} eventos, ${datos.componentes.length} componentes, ${datos.eventos.length} tipos de evento.`, "ok");

            await guardarCache(host, userId, cursoId, token, datos);
            addLog("Guardado en cache cifrada.", "ok");

            navigate(`/cursos/${cursoId}`, { state: { nombre: nombreCurso } });
        } catch (err) {
            addLog(`Error procesando el CSV: ${err.message}`, "error");
            setError("No se pudo procesar el archivo de logs.");
            console.error(err);
            setPaso("seleccionArchivo");
        }
    };

    // Seguir sin haber podido descargar/elegir el archivo (permisos de
    // Moodle).
    const handleContinuarSinArchivo = () => {
        addLog("Continuando sin archivo, el curso se abrirá sin datos de logs.");
        navigate(`/cursos/${cursoId}`, { state: { nombre: nombreCurso } });
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


    if (cursoId) {
        return (
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

                {/* Cabecera */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px" }}>
                    <button onClick={() => navigate("/cursos")}>Atrás</button>
                    <h1 style={{ margin: 0, fontSize: "24px" }}>Actualizar logs: {nombreCurso ?? `Curso ${cursoId}`}</h1>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", color: "var(--text)" }}>{fullname}</span>
                        <button onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                    {/* Descarga automática en curso */}
                    {paso === "auto" && (
                        <>
                            <p style={{ color: "var(--text)", textAlign: "center" }}>
                                Obteniendo los datos de logs del curso...
                            </p>
                            {pasoAutoMsg && (
                                <p style={{ color: "var(--text)", fontSize: "13px", opacity: 0.8 }}>{pasoAutoMsg}</p>
                            )}
                        </>
                    )}

                    {paso === "inicio" && (
                        <>
                            {autoError && (
                                <p style={{ color: "#e66", textAlign: "center", maxWidth: "440px" }}>
                                    No se han podido obtener los logs automáticamente ({autoError}). Puedes hacerlo manualmente si lo deseas:
                                </p>
                            )}
                            {/* Mensaje distinto si es la primera vez (sin cache, actualizar es obligatorio) */}
                            <p style={{ color: "var(--text)", textAlign: "center", maxWidth: "400px" }}>
                                {primeraVez
                                    ? "Primera vez que entras a este curso: hace falta actualizar para tener datos."
                                    : "Se abrirá una ventana de Moodle para descargar el CSV de logs de este curso."}
                            </p>
                            <button onClick={handleActualizar} style={{ padding: "12px 24px", fontSize: "16px" }}>
                                Actualizar ficheros
                            </button>
                        </>
                    )}

                    {paso === "descargando" && (
                        <p style={{ color: "var(--text)" }}>Esperando a que se cierre la ventana de descarga...</p>
                    )}

                    {(paso === "seleccionArchivo" || paso === "procesando") && (
                        <>
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleArchivoElegido}
                                style={{ display: "none" }}
                            />
                            <button
                                onClick={handleElegirArchivo}
                                disabled={paso === "procesando"}
                                style={{ padding: "16px 32px", fontSize: "18px" }}
                            >
                                {paso === "procesando" ? "Procesando..." : "Elegir el CSV descargado"}
                            </button>
                            <button
                                onClick={handleContinuarSinArchivo}
                                disabled={paso === "procesando"}
                                style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "13px" }}
                            >
                                Continuar sin elegir archivo
                            </button>
                            {error && <p style={{ color: "red" }}>{error}</p>}
                        </>
                    )}

                    {/* Panel de debug */}
                    {logs.length > 0 && (
                        <div style={{
                            marginTop: "20px", padding: "15px", width: "100%", maxWidth: "600px",
                            backgroundColor: "#1e1e1e", borderRadius: "8px",
                            fontFamily: "monospace", fontSize: "13px", textAlign: "left"
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

                {/* Mensaje que aparece en la pantalla mientras la ventana emergente siga abierta. */}
                {paso === "descargando" && (
                    <div style={{
                        position: "fixed", inset: 0,
                        backgroundColor: "var(--overlay-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "24px", zIndex: 10
                    }}>
                        <div style={{
                            backgroundColor: "var(--bg)", color: "var(--text-h)",
                            border: "1px solid var(--border)", borderRadius: "8px",
                            padding: "24px", maxWidth: "360px", textAlign: "center",
                            boxShadow: "var(--shadow)"
                        }}>
                            <p style={{ margin: 0 }}>
                                Hay una ventana de Moodle abierta, ciérrala al acabar la descarga para poder continuar.
                            </p>
                            {avisando && (
                                <div style={{ marginTop: "16px" }}>
                                    <p style={{ margin: 0, color: "var(--accent)" }}>
                                        ¿Sigues ahí? Esta ventana se cerrará en {cuentaAtras}s.
                                    </p>
                                    <button onClick={handleNecesitoMasTiempo} style={{ marginTop: "8px" }}>
                                        Necesito más tiempo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
