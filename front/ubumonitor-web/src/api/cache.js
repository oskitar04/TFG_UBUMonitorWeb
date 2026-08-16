// Caché cifrada de logs ya procesados, en IndexedDB.
// Clave: host::userId::cursoId (dado que un usuario puede tener muchos 
// cursos, hace falta una entrada por curso, no solo por usuario). La 
// clave de cifrado (AES-GCM) sale del token de Moodle guardado en 
// sessionStorage. Si el token cambia (caduca o se regenera, que no 
// suele ser lo normal), simplemente no se puede descifrar lo antiguo y 
// se trata como "sin cache".

const DB_NAME = "cache_ubumonitorweb";
const STORE_NAME = "logs";
const DB_VERSION = 1;


// Para abrir la base de datos lo que hace falta es "new Promise" para pasar de indexed que 
// es antigua y basada en eventos a una nueva y basada en promesas (async/await).
const abrirDB = () => {
    return new Promise((resolve, reject) => { 
        const peticion = indexedDB.open(DB_NAME, DB_VERSION);
        peticion.onupgradeneeded = () => { // Solo se ejecuta una vez, la primera vez que se
                                            // abre la base de datos, o al subir de versión (DB_version).
            peticion.result.createObjectStore(STORE_NAME); // Solo se puede crear aquí el almacén.
        };
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
    });
};

const construirClave = (host, userId, cursoId) => `${host}::${userId}::${cursoId}`; // Etiqueta para localizar el registro en IndexedDB, uso :: para 
                                                                                    // evitar confundir los campos. Se puede usar cualquier separador, 
                                                                                    // pero no tiene que aparecer en ninguno de los tres campos de la 
                                                                                    // clave (como "|", "__", etc).

// El token no mide siempre 32 bytes, así que usa SHA-256 para conseguir una clave de longitud fija válida para AES-GCM.
const derivarClave = async (token) => {
    // Hay que pasar el token por TextEncoder antes de hashearlo dado que crypto.subtle solo usa bytes.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]); // Se construye la clave. False para que no se pueda sacar 
                                                                                            // la clave en bruto solo se puede usar para cifrar o 
                                                                                            // descifrar, para nada más.
};

export const guardarCache = async (host, userId, cursoId, token, datos) => {
    const claveCripto = await derivarClave(token);
    // vector de inicialización ("iv", en inglés mejor) aleatorio de 12 bytes, nuevo en cada cifrado para evitar que nunca se reutilice con la misma clave.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const datosCifrados = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        claveCripto,
        new TextEncoder().encode(JSON.stringify(datos))
    );

    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite"); // db.transaction sirve para abrir una transacción que es lo que usa 
                                                            // IndexedDB para que no se corrompan si hay varias operaciones a la vez.
        // El .put vale para escribir y reescribir si hay datos (Actualiza).
        tx.objectStore(STORE_NAME).put(
            { iv, datosCifrados, actualizado: Date.now() },
            construirClave(host, userId, cursoId)
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// Devuelve {datos, actualizado} si hay cache válida, o null si no hay nada guardado
// o si no se ha podido descifrar (se trata como "sin cache", para evitar el error).
export const leerCache = async (host, userId, cursoId, token) => {
    try {
        const db = await abrirDB();
        const registro = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const peticion = tx.objectStore(STORE_NAME).get(construirClave(host, userId, cursoId));
            peticion.onsuccess = () => resolve(peticion.result);
            peticion.onerror = () => reject(peticion.error);
        });
        if (!registro) return null;

        // Es importante usar el iv que se había guardado antes para poder descifrar. 
        // No uno nuevo en este caso.
        const claveCripto = await derivarClave(token);
        const descifrado = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: registro.iv },
            claveCripto,
            registro.datosCifrados
        );
        const datos = JSON.parse(new TextDecoder().decode(descifrado));
        return { datos, actualizado: registro.actualizado };
    } catch (e) {
        console.warn("No se pudo leer la cache de logs (se trata como si no existiera):", e);
        return null;
    }
};
