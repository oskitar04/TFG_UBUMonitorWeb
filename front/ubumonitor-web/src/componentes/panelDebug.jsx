import { useEffect, useState } from "react";
import { estaDebugActivado, EVENTO_DEBUG_ACTIVADO } from "../utils/debug";

// Panel de debug para todas las páginas. Si no está activado, no muestra nada.
export default function PanelDebug({ logs, titulo = "Debug", variante = "tarjeta" }) {
    const [activo, setActivo] = useState(estaDebugActivado);

    useEffect(() => {
        const handler = () => setActivo(estaDebugActivado());
        window.addEventListener(EVENTO_DEBUG_ACTIVADO, handler);
        return () => window.removeEventListener(EVENTO_DEBUG_ACTIVADO, handler);
    }, []);

    if (!activo || logs.length === 0) return null;

    if (variante === "lateral") {
        return (
            <div style={{ flex: "0 0 180px", overflowY: "auto", padding: "16px", borderTop: "1px solid var(--border)" }}>
                <strong style={{ fontSize: "12px", color: "var(--text)" }}>{titulo}</strong>
                <div style={{ marginTop: "8px" }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{
                            color: log.tipo === "error" ? "var(--log-error)" : log.tipo === "ok" ? "var(--log-ok)" : "var(--text)",
                            fontSize: "11px", padding: "2px 0", fontFamily: "var(--mono)"
                        }}>
                            <span style={{ opacity: 0.6 }}>[{log.hora}]</span> {log.mensaje}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            marginTop: "20px", padding: "15px", width: "100%", maxWidth: "600px",
            backgroundColor: "var(--log-bg)", borderRadius: "8px",
            fontFamily: "monospace", fontSize: "13px", textAlign: "left"
        }}>
            <strong style={{ color: "var(--log-title)" }}>{titulo}</strong>
            <div style={{ marginTop: "8px" }}>
                {logs.map((log, i) => (
                    <div key={i} style={{
                        color: log.tipo === "error" ? "var(--log-error)" : log.tipo === "ok" ? "var(--log-ok)" : "var(--log-info)",
                        padding: "2px 0"
                    }}>
                        <span style={{ color: "var(--log-time)" }}>[{log.hora}]</span> {log.mensaje}
                    </div>
                ))}
            </div>
        </div>
    );
}
