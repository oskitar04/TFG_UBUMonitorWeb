import axios from "axios";

const API_URL = "http://localhost:8888"; // Cambiar por puerto de backend 



export const getCursos = async (token) => {
  const response = await axios.get(`${API_URL}/cursos`, {
    params: { token }
  });
  return response.data;
};

