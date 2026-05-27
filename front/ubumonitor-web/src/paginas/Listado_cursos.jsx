import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursos } from "../api/cursos";

export default function ListaCursos() {

    const [cursos, setCursos] = useState([]);
    const navigate = useNavigate();

    // Lee los datos de sesión del localStorage (guardados al hacer login en Principal)
    const token  = localStorage.getItem("token");
    const host   = localStorage.getItem("host");
    const userId = localStorage.getItem("userId");

    // Carga los cursos automáticamente al entrar en la página
    useEffect(() => {
        if (!token || !host || !userId) return; // Guardia: si no hay sesión, no llamar

        const cargarCursos = async () => {
            const data = await getCursos(token, host, userId);
            setCursos(data.courses);
        };

        cargarCursos();
    }, []); // Sale warning porque solo se ejecuta una vez al montar el componente

    // Si no hay sesión activa, redirigir al login
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

            {cursos.length === 0 ? (
                <p>Cargando cursos...</p>
            ) : (
                <ul>
                    {cursos.map(c => (
                        <li key={c.id}>{c.fullname}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
