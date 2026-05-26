import axios from "axios";

// Para conseguir el token al ahcer login

const API_URL = "http://localhost:8888";

export const login = async (host, username, password) => {
    const response = await axios.post(`${API_URL}/login`, { host, username, password });
    return response.data;
};

