import axios from "axios";

const API_URL = "http://localhost:8080";

export const procesarLogs = async(archivo) => {
    const formData = new FormData();
    formData.append("archivo", archivo);

    const response = await axios.post(`${API_URL}/api/public/logs/process/file`, formData, {
       headers: {"Content-Type": "multipart/form-data"}, 
       responseType: "blob"
    });
    return response.data;
}