// Cambio lo anterior por un gráfico más grande, fechas en el eje X en formato DD/MM/YY, se ve mejor así,
// y una línea con la media total para poder comparar un punto contra la media.
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const formatearFecha = (fechaIso) => {
  if (!fechaIso) return fechaIso;
  const [anio, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${anio.slice(2)}`;
};

export default function Graficos({ data }) {
  const media = data.length > 0
    ? data.reduce((suma, d) => suma + d.value, 0) / data.length
    : 0;

  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data}>
        <XAxis dataKey="name" tickFormatter={formatearFecha} />
        <YAxis />
        <Tooltip labelFormatter={formatearFecha} />
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