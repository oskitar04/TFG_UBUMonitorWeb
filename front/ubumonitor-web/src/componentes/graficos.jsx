// Cambio lo anterior por un gráfico más grande, fechas en el eje X en formato DD/MM/YY, se ve mejor así,
// y una línea con la media total para poder comparar un punto contra la media.
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const formatearFecha = (fechaIso) => {
  if (!fechaIso) return fechaIso;
  const [anio, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${anio.slice(2)}`;
};

// Colores que usa la app, teniendo en cuenta el modo oscuro. Opacidad para que se vea mejor.
const tooltipContentStyle = {
  backgroundColor: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px",
};
const tooltipCursor = { fill: "var(--accent)", fillOpacity: 0.08 };

// tipo "linea": eventos por día.
// tipo "total": barras agrupadas por categoría (componente/evento/sección/módulo marcado),
// comparando los registros de los usuarios seleccionados con el total.
export default function Graficos({ data, tipo = "linea" }) {
  if (tipo === "total") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 60 }}>
          <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip cursor={tooltipCursor} contentStyle={tooltipContentStyle} />
          <Legend verticalAlign="top" />
          <Bar dataKey="seleccionados" name="Usuarios seleccionados" fill="var(--accent)" />
          <Bar dataKey="total" name="Total" fill="var(--text)" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const media = data.length > 0
    ? data.reduce((suma, d) => suma + d.value, 0) / data.length
    : 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="name" tickFormatter={formatearFecha} />
        <YAxis />
        <Tooltip labelFormatter={formatearFecha} contentStyle={tooltipContentStyle} />
        <ReferenceLine
          y={media}
          stroke="var(--accent)"
          strokeDasharray="4 4"
          label={{ value: `Media: ${media.toFixed(1)}`, position: "insideTopRight", fill: "var(--text)", fontSize: 11 }}
        />
        <Line type="monotone" dataKey="value" stroke="var(--accent)" />
      </LineChart>
    </ResponsiveContainer>
  );
}