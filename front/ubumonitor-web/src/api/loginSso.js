import axios from "axios";

// Pregunta a Moodle qué tipo de login tiene la cuenta, sin necesitar token todavía.
export const getSsoConfig = async (host) => {
    const response = await axios.post(
        "/moodle/lib/ajax/service-nologin.php?info=tool_mobile_get_public_config",
        [{ index: 0, methodname: "tool_mobile_get_public_config", args: {} }],
        { headers: { "X-Moodle-Target": host } }
    );
    const resultado = response.data[0];
    if (!resultado || resultado.error) {
        throw new Error("No se pudo consultar el tipo de login de este Moodle.");
    }
    return {
        typeoflogin: resultado.data.typeoflogin, // 1 para login normal, cualquier otro valor es SSO
        ssoLoginUrl: resultado.data.identityproviders?.[0]?.url || null,
    };
};

// Paso 1: manda usuario y contraseña, Moodle manda el código por email.
export const iniciarLoginSso = async (host, ssoLoginUrl, username, password) => {
    try {
        const response = await axios.post("/sso/iniciar", { moodleHost: host, ssoLoginUrl, username, password });
        return response.data; // { sessionId }
    } catch (e) {
        throw new Error(e.response?.data?.error || "Error al iniciar el login SSO.", { cause: e });
    }
};

// Paso 2: comprueba el código y saca el token de Moodle.
export const completarLoginSso = async (sessionId, codigo) => {
    try {
        const response = await axios.post("/sso/codigo", { sessionId, codigo: codigo.trim() });
        return response.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || "Error al comprobar el código.", { cause: e });
    }
};
