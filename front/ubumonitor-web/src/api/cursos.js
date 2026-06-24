import axios from "axios";

const API_URL = "";



export const getCursos = async (token, host, userId) => { // userId para poder cogerlo una vez con el token obtenido
  const response = await axios.get(`${API_URL}/api/users/${userId}/courses`, {
    headers: {
      'X-Moodle-Token': token,
      'X-Moodle-Host': host
    }
  });
  return response.data; // Para coger los cursos
};

export const getCursoContenidos = async (token, host, courseId) => {
  const response = await axios.get(`${API_URL}/api/courses/${courseId}/contents`, {
    headers: {
      'X-Moodle-Token': token,
      'X-Moodle-Host': host
    }
  });
  return response.data; // Para coger contenido del curso
};

export const getCursoUsuarios = async (token, host, courseId) => {
  const response = await axios.get(`${API_URL}/api/courses/${courseId}/users`, {
    headers: {
      'X-Moodle-Token': token,
      'X-Moodle-Host': host
    }
  });
  return response.data; // Para coger los participantes del curso
};

