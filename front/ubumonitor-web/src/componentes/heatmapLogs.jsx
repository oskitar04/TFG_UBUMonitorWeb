// HeatMap de usuario por semana: una fila por usuario, una columna por semana. Recibe 
// los datos ya agregados desde Curso.jsx y solo pinta la cuadrícula y la leyenda del gráfico.
import { useMemo } from "react";

// Ancho en base al nombre más largo.
const ANCHO_USUARIO_MIN = 80;
const ANCHO_USUARIO_MAX = 260;
const PADDING_USUARIO = 20; // 10px a cada lado.
const FUENTE_USUARIO = "14px system-ui, 'Segoe UI', Roboto, sans-serif"; // --sans en index.css.

let canvasMedida = null;
const medirAnchoTexto = (texto, font) => {
    if (!canvasMedida) canvasMedida = document.createElement("canvas");
    const ctx = canvasMedida.getContext("2d");
    ctx.font = font;
    return ctx.measureText(texto).width;
};

// inicioIso es el lunes de la semana y se muestra como "DD/MM–DD/MM" (lunes a domingo).
const formatearSemana = (inicioIso) => {
    const inicio = new Date(`${inicioIso}T00:00:00`);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const fmt = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${fmt(inicio)}–${fmt(fin)}`;
};

// Escala de color fija (da igual si está o no en modo oscuro): 
// Rojo: sin datos.
// Amarillo: poca actividad.
// Verde: mucha actividad.
const ROJO_SIN_DATOS = "hsl(0, 75%, 65%)";
const TONO_MIN = 55;  // amarillo
const TONO_MAX = 130; // verde

const colorCelda = (valor, max) => {
    if (valor === 0) return ROJO_SIN_DATOS;
    const intensidad = max > 0 ? valor / max : 0;
    const tono = TONO_MIN + intensidad * (TONO_MAX - TONO_MIN);
    return `hsl(${tono}, 75%, 50%)`;
};

export default function HeatmapLogs({ usuarios, semanas, conteo, max }) {
    const anchoUsuario = useMemo(() => {
        const anchoMax = usuarios.reduce((m, u) => Math.max(m, medirAnchoTexto(u.nombre, FUENTE_USUARIO)), 0);
        return Math.min(ANCHO_USUARIO_MAX, Math.max(ANCHO_USUARIO_MIN, anchoMax + PADDING_USUARIO));
    }, [usuarios]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Leyenda de color */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", fontSize: "14px", color: "var(--text)", flexShrink: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: ROJO_SIN_DATOS, border: "1px solid var(--border)" }} />
                    Sin datos
                </span>
                <div style={{ width: "2px", height: "16px", backgroundColor: "var(--border)" }} />
                <span>1</span>
                <div style={{
                    width: "160px", height: "14px", borderRadius: "4px", border: "1px solid var(--border)",
                    background: `linear-gradient(to right, hsl(${TONO_MIN}, 75%, 50%), hsl(${TONO_MAX}, 75%, 50%))`,
                }} />
                <span>{max}</span>
                <span>eventos por semana</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <table style={{ borderCollapse: "collapse", fontSize: "14px", width: "100%", height: "100%", tableLayout: "fixed" }}>
                    <thead>
                        <tr>
                            <th style={{ ...thUsuarioStyle, width: `${anchoUsuario}px` }}></th>
                            {semanas.map(s => (
                                <th key={s} style={thSemanaStyle}>{formatearSemana(s)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.userId}>
                                <td style={tdUsuarioStyle}>{u.nombre}</td>
                                {semanas.map(s => {
                                    const valor = conteo.get(`${u.userId}::${s}`) ?? 0;
                                    return (
                                        <td
                                            key={s}
                                            title={`${u.nombre} - Semana ${formatearSemana(s)}: ${valor}`}
                                            style={{ ...tdCeldaStyle, backgroundColor: colorCelda(valor, max) }}
                                        >
                                            {valor > 0 ? valor : ""}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Cabecera y la primera columna fijas, igual que tablaLogs.jsx.
const thUsuarioStyle = {
    position: "sticky", left: 0, top: 0, zIndex: 2,
    backgroundColor: "var(--code-bg)", padding: "6px 10px", height: "28px",
};
const thSemanaStyle = {
    position: "sticky", top: 0, zIndex: 1,
    backgroundColor: "var(--code-bg)", padding: "6px 4px", fontWeight: "600",
    whiteSpace: "nowrap", textAlign: "center", height: "28px",
};
const tdUsuarioStyle = {
    position: "sticky", left: 0, zIndex: 1,
    backgroundColor: "var(--bg)", padding: "4px 10px", whiteSpace: "nowrap",
    borderRight: "1px solid var(--border)", color: "var(--text)", textAlign: "right",
};
// Color de texto fijo para las celdas, que usan colores fijos de fondo (rojo/amarillo/
// verde).
const tdCeldaStyle = {
    minHeight: "28px", textAlign: "center", color: "#000000",
    border: "1px solid var(--border)",
};
