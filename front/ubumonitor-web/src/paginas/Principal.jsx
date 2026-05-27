import { useState } from "react";


//import { getCursos } from "../api/cursos";

import { getCursos } from "../api/cursos";
import { login, getSiteInfo } from "../api/login"



//import Graficos from "../componentes/graficos";
import { useNavigate } from "react-router-dom";

export default function Principal() {
    
    // Usado para crear los cursos de prueba
    //const [chartData, setChartData] = useState([]);
    
    
    /** Conseguir token */
    // const [host, setHost] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // const [token, setToken] = useState(null);
    const [cursos, setCursos] = useState([]);

    const [host, setHost] = useState(() => localStorage.getItem("host")   || "");
    const [token, setToken] = useState(() => localStorage.getItem("token")  || null);
    const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
    const [error, setError] = useState(null);   // Mensaje de error visible al usuario
    const [cargando, setCargando] = useState(false);  // Feedback mientras se espera respuesta

    // Para cambiar de páginas sin necesidad de recargar. "Ver cursos" para ir a /cursos
    const navigate = useNavigate();

    // Para guardar el token y el userId
    const handleLogin = async () => {
        setError(null);
        setCargando(true);
        try {
            // Saco el token
            const loginData = await login(host, username, password);
            const tokenObtenido = loginData.token;

            // Uso el token para obtener el userId y demás datos
            const siteData = await getSiteInfo(tokenObtenido, host);
            const userIdObtenido = siteData.siteinfo.userid;

            // Asigno valores
            setToken(tokenObtenido);
            setUserId(userIdObtenido);

            // Uso localStorage para poder usar el token en otras páginas que use/haga
            localStorage.setItem("token", tokenObtenido);
            localStorage.setItem("host", host);
            localStorage.setItem("userId", userIdObtenido);

            // Redirigir automáticamente a la lista de cursos
            navigate("/cursos");
        } catch (e) {
            setError("Error al iniciar sesión. Revisa el host, usuario y contraseña.");
            console.error(e);
        } finally {
            setCargando(false);
        }
    }

    // Al pulsar los botones de cargar se se hace lo siguiente.
    // Para los cursos, de momento les creo para probar. Se usan 
    // estos datos para el gráfico
    // const handleFetch = async () => {
    // try {
    //     const data = [
    //         { id: 1, name: "Curso 1" },
    //         { id: 2, name: "Curso 2" }
    //         ];
    //     //setCursos(data);
    //     //const data = await getCourses(token);
        
    //     setCursos(data);

    //     // Prueba de gráfico
    //     const formatted = data.map((c, i) => ({
    //     name: c.name,
    //     value: i + 1
    //     }));

    //     setChartData(formatted);
    // } catch (error) {
    //     console.error(error);
    // }
    // };

    const handleFetch = async () => {
        // El campo en la respuesta del backend es "courses", no "cursos"
        const data = await getCursos(token, host, userId);
        setCursos(data.courses);
    }

    const handleLogout = () => {
        setToken(null);
        setUserId(null);
        setHost("");

        localStorage.removeItem("token");
        localStorage.removeItem("host");
        localStorage.removeItem("userId");
    }

    
    return (
    <div style={{ padding: "40px" }}>
        <h1>UBUMonitor Web</h1>

        {!token ? (
            // Pantalla del login
            <div>
                <input placeholder="Host (ej: https://ubuvirtual.ubu.es)" value={host} onChange={e => setHost(e.target.value)} />
                <input placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={handleLogin} disabled={cargando}>
                    {cargando ? "Iniciando sesión..." : "Login"}
                </button>
                {/* Mensaje de error si el login falla */}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        ) : (
            // Inicio de sesión correcto
            <div>
                <p>Token obtenido correctamente</p>
                <button onClick={handleFetch}>Cargar cursos</button>
                {cursos.map(c => <div key={c.id}>{c.name}</div>)}
            </div>
        )}
    
        

        {/* Entrada */}
        {/* <input
        type="text"
        placeholder="Introduce datos"
        value={token}
        onChange={(e) => setToken(e.target.value)} /> */}
        {/*Input controlado. value = {token} lo vincula al estado, onChange
            actualiza el estado cada vez que el usuario escribe. Sin el onChange,
            el input sería de solo lectura*/}

        {/* Botones */}

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
        {/* Dos botones con la misma función (handleFetch), se diferencian 
            en los estilos. La opcion 2 tiene CSS inline (fondo negro, texto blanco, etc.)*/}

        <button onClick={handleLogout} style={{
            position:"absolute",
            top: "2px",
            right: "2px",
            width: "100px",
            height:"40px",

            // marginTop: "2px",
            // marginRight: "2px", // Estos datos son con respecto a otro elemente que tenga al lado

            fontSize: "16px",
            backgroundColor: "black",
            color: "white",

            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
        }}>
            Apagar
        </button>

        {/* Botón para pasar a la página de cursos (sin recargar la app) */}
        <button onClick={() => navigate("/cursos")}>
            Ver cursos
        </button>
        


        {/* Datos */}
        {/* Renderiza la lista de cursos. Por cada elemento de cursos, crea un <div>. El 
            key es obligatorio en React para identificar cada elemento de forma única*/}
        <div>
        <h2>Cursos Actuales:</h2>
        {cursos.map((c) => (
            <div key={c.id}>{c.name}</div>
        ))}
        </div>

        {/* Gráfico */}
        {/* Muestra el gráfico pasándole chartData como prop. El componente Graficos se 
            encarga de renderizarlo.*/}
        {/*<Graficos data={chartData} /> */}
    </div>
);
}
