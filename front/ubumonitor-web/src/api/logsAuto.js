import { procesarLogs, parsearLogsCsv } from "./logs";
import { guardarCache } from "./cache";

const pedirMoodle = (host, path, opciones = {}) =>
    fetch(`/moodle${path}`, {
        ...opciones,
        headers: { "X-Moodle-Target": host, ...(opciones.headers || {}) },
    });

// Paso 1: pido la clave de autologin al webservice de Moodle.
const obtenerAutologinKey = async (host, token, privatetoken) => {
    const body = new URLSearchParams({
        wstoken: token,
        wsfunction: "tool_mobile_get_autologin_key",
        moodlewsrestformat: "json",
        privatetoken,
    });
    const res = await pedirMoodle(host, "/webservice/rest/server.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    const data = await res.json();
    if (data.exception) {
        throw new Error(`Moodle (${data.errorcode}): ${data.message}`);
    }
    if (!data.key || !data.autologinurl) {
        throw new Error("Moodle no devolvió la clave de autologin.");
    }
    return data; // { key, autologinurl, warnings }
};

// Paso 2: canjeo la key por una cookie de sesión web.
const canjearAutologinKey = async (host, autologinurl, key, userId) => {
    const ruta = new URL(autologinurl).pathname;
    const qs = new URLSearchParams({ key, userid: userId });
    const res = await pedirMoodle(host, `${ruta}?${qs}`, { method: "GET" });
    if (!res.ok) {
        throw new Error(`Fallo al iniciar sesión con la clave de autologin (HTTP ${res.status}).`);
    }
    await res.text().catch(() => {});
};

// Paso 3: descargo el CSV de logs del curso en el navegador.
const descargarCsvLogs = async (host, cursoId) => {
    const qs = new URLSearchParams({
        id: cursoId,
        chooselog: "1",
        showusers: "1",
        showactions: "1",
        download: "csv",
    });
    const res = await pedirMoodle(host, `/report/log/index.php?${qs}`, { method: "GET" });
    if (!res.ok) {
        throw new Error(`No se pudo descargar el CSV de logs (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    const muestra = (await blob.slice(0, 300).text()).toLowerCase();
    if (muestra.includes("<!doctype") || muestra.includes("<html")) {
        throw new Error(
            "Moodle devolvió HTML en vez del CSV (sin permiso para ver los logs del curso, sesión no válida, o 'Debug messages' activado en Moodle)."
        );
    }
    return blob;
};

export const actualizarLogsAutomatico = async ({ host, token, privatetoken, userId, cursoId, onPaso }) => {
    if (!privatetoken) {
        throw new Error(
            "No hay privatetoken. El Moodle debe ir por HTTPS y el usuario no puede ser administrador del sitio."
        );
    }

    onPaso?.("Pidiendo clave de autologin a Moodle...");
    const { key, autologinurl } = await obtenerAutologinKey(host, token, privatetoken);

    onPaso?.("Iniciando sesión web en Moodle...");
    await canjearAutologinKey(host, autologinurl, key, userId);

    onPaso?.("Descargando el CSV de logs...");
    const csvCrudo = await descargarCsvLogs(host, cursoId);

    onPaso?.("Procesando el CSV...");
    const blobProcesado = await procesarLogs(new File([csvCrudo], "logs.csv", { type: "text/csv" }));
    const datos = parsearLogsCsv(await blobProcesado.text());

    onPaso?.("Guardando en la caché cifrada...");
    await guardarCache(host, userId, cursoId, token, datos);

    return datos;
};
