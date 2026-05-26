import axios from "axios";

const API_URL = "http://localhost:8888"; // Cambiar por puerto de backend 



export const getCursos = async (token, host) => {
  const response = await axios.get(`${API_URL}/cursos`, {
    headers:{
      'X-Moodle-Token': token,
      'X-Moodle-Host': host
    }
    
    //params: { token }
  });
  return response.data;
};

