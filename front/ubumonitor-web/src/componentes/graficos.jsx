import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function Chart({ data }) {
  return (
    <LineChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" />
    </LineChart>
  );
}