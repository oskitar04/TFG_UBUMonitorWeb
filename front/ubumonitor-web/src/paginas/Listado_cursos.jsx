import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursos } from "../api/cursos";

export default function ListaCursos() {

    const [cursos,   setCursos]   = useState([]);
    const [cargando, setCargando] = useState(true);  // true hasta que la API responda
    const [error,    setError]    = useState(null);
    const navigate = useNavigate();

    // Lee los datos de sesión del localStorage (guardados al hacer login en Principal)
    const token  = localStorage.getItem("token");
    const host   = localStorage.getItem("host");
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        // Sin sesión no hay nada que cargar
        if (!token || !host || !userId) {
            setCargando(false);
            return;
        }

        const cargarCursos = async () => {
            try {
                const data = await getCursos(token, host, userId);
                setCursos(data.courses);
            } catch (e) {
                setError("No se pudieron cargar los cursos. Comprueba que el servidor esté activo.");
                console.error(e);
            } finally {
                setCargando(false); // Siempre para el spinner, haya error o no
            }
        };

        cargarCursos();
    }, []); // Solo al montar el componente

    // Sin sesión → volver al login
    if (!token) {
        return (
            <div style={{ padding: "40px" }}>
                <p>No hay sesión activa.</p>
                <button onClick={() => navigate("/")}>Volver al login</button>
            </div>
        );
    }

    return (
        <div style={{ padding: "40px" }}>
            <h1>Lista de cursos</h1>
            <button onClick={() => navigate("/")}>Volver/Atrás</button>

            {/* Mientras espera respuesta de la API */}
            {cargando && <p>Cargando cursos...</p>}

            {/* Si la API falló */}
            {!cargando && error && <p style={{ color: "red" }}>{error}</p>}

            {/* Cursos recibidos */}
            {!cargando && !error && (
                cursos.length === 0
                    ? <p>No se encontraron cursos para este usuario.</p>
                    : <ul>
                        {cursos.map(c => (
                            <li key={c.id}>{c.fullname}</li>
                        ))}
                      </ul>
            )}
        </div>
    );
}
