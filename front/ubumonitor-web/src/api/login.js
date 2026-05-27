import axios from "axios";

// Para conseguir el token al ahcer login

const API_URL = "http://localhost:8080";

export const login = async (host, username, password) => {
    const response = await axios.post(`${API_URL}/api/public/login/token`, { host, username, password });
    return response.data; // Devuelve el token y el privatetoken
};

// Una vez con el token, obtiene info del sitio: userid, fullname, username...
// El userId es necesario para llamar a /api/users/{userId}/courses
export const getSiteInfo = async (token, host) => {
    const response = await axios.get(`${API_URL}/api/site/info`, {
        headers: {
            'X-Moodle-Token': token,
            'X-Moodle-Host': host
        }
    });
    return response.data; // Devuelve userId a demás de otros datos
};

