import axios from "axios";

// Para conseguir el token al ahcer login

const API_URL = "http://localhost:8080";

export const login = async (host, username, password) => {
    const response = await axios.post(`${API_URL}/api/public/login/token`, { host, username, password });
    return response.data; // De aquí es de donde cojo el token y el usuario (el usuario le paso a cursos)
};

