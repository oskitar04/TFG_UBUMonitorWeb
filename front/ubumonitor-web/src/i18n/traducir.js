import i18n from "./index";

// Paso el texto en inglés del CSV a una clave para usar en el diccionario 
// ("Course module viewed" > "course_module_viewed").
export const aClave = (texto) =>
    String(texto ?? "")
        .trim() // Fuera espacios sobrantes
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_") // Todo lo que no sea letra/número se pasa a "_".
        .replace(/^_+|_+$/g, ""); // Elimino "_" sobrantes del principio y final.

// Para evitar que de errores, cuando un texto se pasa por los diccionarios y no 
// tiene clave asociada se devuelve tal cual está.
export const traducirComponente = (texto) =>
    texto ? i18n.t(aClave(texto), { ns: "componentes", defaultValue: texto }) : texto;

export const traducirEvento = (texto) =>
    texto ? i18n.t(aClave(texto), { ns: "eventos", defaultValue: texto }) : texto;

// Se mira que llegue un rol, que además no esté personalizado (en ese caso se devuelve 
// tal cual), y se traduce en el idioma que esté elegido. En este caso español porque no 
// tengo más creados.
export const traducirRol = (shortname, nombreMoodle) => {
    if (nombreMoodle && nombreMoodle.trim() && nombreMoodle !== shortname) return nombreMoodle;
    return i18n.t(shortname, { ns: "roles", defaultValue: shortname });
};
