import axios from "axios";

const API_URL = ""; // Mismo caso que en login.js
// // Vite proxy redirige /api/... -> localhost:8080/api/...



export const getCursos = async (token, host, userId) => { // userId para poder cogerlo una vez con el token obtenido
  const response = await axios.get(`${API_URL}/api/users/${userId}/courses`, {
    headers:{
      'X-Moodle-Token': token,
      'X-Moodle-Host': host
    }
  });
  return response.data; //Para coger los cursos
};

