import { useState } from "react";
//import { getCursos } from "../api/cursos";
import Graficos from "../componentes/graficos";
import { useNavigate } from "react-router-dom";

export default function Principal() {
    const [chartData, setChartData] = useState([]);
    /** Conseguir token */
    const [host, setHost] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState(null);
    const [cursos, setCursos] = useState("");



    const navigate = useNavigate();

    const handleFetch = async () => {
    try {
        const data = [
            { id: 1, name: "Curso 1" },
            { id: 2, name: "Curso 2" }
            ];
        //setCursos(data);
        //const data = await getCourses(token);
        
        setCursos(data);

        // Prueba de gráfico
        const formatted = data.map((c, i) => ({
        name: c.name,
        value: i + 1
        }));

        setChartData(formatted);
    } catch (error) {
        console.error(error);
    }
    };

    
    return (
    <div style={{ padding: "40px" }}>
        <h1>UBUMonitor Web</h1>

        {/* Entrada */}
        <input
        type="text"
        placeholder="Introduce datos"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        />

        {/* Botones */}
        <button onClick={handleFetch}>Cargar cursos (Opcion 1)</button>

        <button onClick={handleFetch} style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "black",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px"
            }}>
            Cargar cursos (Opcion 2)
        </button>

        <button onClick={() => navigate("/cursos")}>
            Ver cursos
        </button>

        {/* Datos */}
        <div>
        <h2>Cursos Actuales:</h2>
        {cursos.map((c) => (
            <div key={c.id}>{c.name}</div>
        ))}
        </div>

        {/* Gráfico */}
        <Graficos data={chartData} />
    </div>
);
}