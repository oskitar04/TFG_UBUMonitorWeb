// Tabla de logs: una fila por evento individual, con los mismos datos que ya se filtran
// para el gráfico. Recibe las filas ya resueltas desde Curso.jsx y solo ordena y pinta.
import { useState, useMemo } from "react";

// La fecha llega en ISO y se muestra como DD/MM/YY HH:MM, igual que
// el resto de la app.
const formatearFechaHora = (iso) => {
    if (!iso) return "";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return iso;
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear()).slice(2);
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

const COLUMNAS = [
    { id: "fechaHora", titulo: "Fecha y hora" },
    { id: "nombre", titulo: "Nombre" },
    { id: "componente", titulo: "Componente" },
    { id: "evento", titulo: "Evento" },
    { id: "seccion", titulo: "Sección" },
    { id: "modulo", titulo: "Módulo del curso" },
    { id: "origen", titulo: "Origen" },
    { id: "ip", titulo: "Dirección IP" },
];

export default function TablaLogs({ filas }) {
    // Orden por defecto: fecha descendente, evento más reciente arriba.
    const [orden, setOrden] = useState({ campo: "fechaHora", asc: false });

    const cambiarOrden = (campo) => {
        setOrden((prev) =>
            prev.campo === campo ? { campo, asc: !prev.asc } : { campo, asc: true }
        );
    };

    const filasOrdenadas = useMemo(() => {
        const copia = [...filas];
        copia.sort((a, b) => {
            const va = a[orden.campo] ?? "";
            const vb = b[orden.campo] ?? "";
            const cmp = String(va).localeCompare(String(vb), "es", { numeric: true });
            return orden.asc ? cmp : -cmp;
        });
        return copia;
    }, [filas, orden]);

    return (
        // Ocupa todo el alto disponible: el contador se queda fijo arriba y solo hace scroll
        // la lista de filas; la cabecera de la tabla se queda fija al hacer scroll.
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 8px", flexShrink: 0 }}>
                {filas.length} evento{filas.length === 1 ? "" : "s"}
            </p>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ textAlign: "left" }}>
                            {COLUMNAS.map((col) => (
                                <th
                                    key={col.id}
                                    style={thStyle}
                                    onClick={() => cambiarOrden(col.id)}
                                    title="Ordenar por esta columna"
                                >
                                    {col.titulo}
                                    {orden.campo === col.id ? (orden.asc ? " ▲" : " ▼") : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filasOrdenadas.map((f, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={tdStyle}>{formatearFechaHora(f.fechaHora)}</td>
                                <td style={tdStyle}>{f.nombre}</td>
                                <td style={tdStyle}>{f.componente}</td>
                                <td style={tdStyle}>{f.evento}</td>
                                <td style={tdStyle}>{f.seccion}</td>
                                <td style={tdStyle}>{f.modulo}</td>
                                <td style={tdStyle}>{f.origen}</td>
                                <td style={tdStyle}>{f.ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const thStyle = {
    padding: "10px 12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap",
    position: "sticky", top: 0, zIndex: 1,
    backgroundColor: "var(--code-bg)",
    boxShadow: "inset 0 -2px 0 var(--border)",
    height: "36px",
};
const tdStyle = { padding: "8px 12px", verticalAlign: "top" };
