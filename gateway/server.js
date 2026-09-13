import http from "node:http"; 
import https from "node:https";
import fs from "node:fs";
import path from "node:path"; // Rutas, válido para / y \
import { fileURLToPath } from "node:url";

// Reconstrucción de __dirname a mano. No existe nativo en ES Modules.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Puerto de gateway y dirección del backend.
const PUERTO = process.env.GATEWAY_PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

// Igual que en vite-plugin-moodle-proxy.js.
const PREFIJO_MOODLE = "/moodle";
const USER_AGENT_MOODLE = "MoodleMobile 4.5.0 (45000)";

// Ruta al archivo index.html desde el directorio de gateway (../front/ubumonitor-web/dist/index.html).
const DIST_DIR = path.join(__dirname, "..", "front", "ubumonitor-web", "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");

// Cabeceras "hop-by-hop" de http, son para evitarlas en proxy.
const CABECERAS_SALTOS = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"];

// Tipos de formato de archivos que puede generar npm run build, si genera algo que no está habría que añadirlo. 
// Sobran algunas, pero estas son las típicas.
const TIPOS_MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
};

// Para después pasar el cuerpo de la petición tal cual viene al backend.
const leerCuerpoPeticion = (req) =>
    new Promise((resolve) => {
        const trozos = [];
        req.on("data", (c) => trozos.push(c));
        req.on("end", () => resolve(Buffer.concat(trozos)));
        req.on("error", () => resolve(Buffer.concat(trozos)));
    });

// Reenvío de servidor a servidor, va del gateway al backend. Como solo habla 
// el navegador con el gateway no hay problema de CORS en el back. Se quita host 
// también para evitar que al back le llegue puesto 4000 cuando es para el 8080.
const reenviarApi = (req, res) => {
    leerCuerpoPeticion(req).then((cuerpoPeticion) => {
        const destino = new URL(req.url, BACKEND_URL);

        const cabeceras = {};
        for (const [k, v] of Object.entries(req.headers)) {
            if (CABECERAS_SALTOS.includes(k) || k === "host") continue;
            cabeceras[k] = v;
        }
        cabeceras.host = destino.host;
        if (cuerpoPeticion.length) cabeceras["content-length"] = String(cuerpoPeticion.length);

        const proxyReq = http.request(
            destino,
            { method: req.method, headers: cabeceras },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
                proxyRes.pipe(res);
            }
        );

        proxyReq.on("error", (e) => {
            res.statusCode = 502; // Bad Gateway.
            res.end(`Error de proxy hacia el backend: ${e.message}`);
        });

        if (cuerpoPeticion.length) proxyReq.write(cuerpoPeticion);
        proxyReq.end();
    });
};

// Quita Domain/Secure/SameSite de las cookies que manda Moodle para evitar 
// que el navegador la rechace porque sus atributos no coinciden con el 
// origen real desde el que se sirve y pone Path=/moodle para que solo se 
// reenvíen de vuelta a este mismo proxy (que es el del gateway).
const reescribirSetCookieMoodle = (valores) => {
    const lista = Array.isArray(valores) ? valores : [valores];
    return lista.map((c) =>
        c
            .split(";")
            .map((p) => p.trim())
            .filter((p) => p && !/^domain=/i.test(p) && !/^secure$/i.test(p) && !/^samesite=/i.test(p) && !/^path=/i.test(p))
            .concat([`Path=${PREFIJO_MOODLE}`, "SameSite=Lax"]) // "Lax" evita el Secure obligado por "None", y es seguro/compatible por defecto.
            .join("; ")
    );
};

// Si Moodle redirige a una URL suya, la reescribe para que la redirección
// siga pasando por /moodle en vez de saltar directamente a Moodle.
const reescribirLocationMoodle = (location, origenMoodle) => {
    if (!location) return location;
    if (location.startsWith(origenMoodle)) return PREFIJO_MOODLE + location.slice(origenMoodle.length);
    if (/^https?:\/\//i.test(location)) {
        try {
            const u = new URL(location);
            return PREFIJO_MOODLE + u.pathname + u.search + u.hash;
        } catch {
            return location;
        }
    }
    if (location.startsWith("/")) return PREFIJO_MOODLE + location;
    return location;
};

// Reenvía /moodle/* al Moodle indicado en la cabecera X-Moodle-Target (para el flujo automático)
const manejarMoodle = (req, res) => {
    const urlMoodleDestino = req.headers["x-moodle-target"]; // req.headers está ya en minúsculas, por eso x-moodle-target.
    if (!urlMoodleDestino) {
        res.statusCode = 400;
        res.end("Falta la cabecera X-Moodle-Target");
        return;
    }

    let urlDestino;
    try {
        urlDestino = new URL(urlMoodleDestino);
    } catch {
        res.statusCode = 400;
        res.end("X-Moodle-Target no es una URL valida");
        return;
    }

    const origenMoodle = urlDestino.origin;
    const rutaMoodle = req.url.slice(PREFIJO_MOODLE.length);
    const cliente = urlDestino.protocol === "https:" ? https : http;

    leerCuerpoPeticion(req).then((cuerpoPeticion) => {
        const cabeceras = {};
        for (const [k, v] of Object.entries(req.headers)) {
            if (CABECERAS_SALTOS.includes(k) || k === "x-moodle-target" || k === "host" || k === "origin" || k === "referer" || k === "accept-encoding") continue;
            cabeceras[k] = v;
        }
        cabeceras.host = urlDestino.host;
        cabeceras["user-agent"] = USER_AGENT_MOODLE;
        cabeceras.referer = `${origenMoodle}/`;
        cabeceras["accept-encoding"] = "identity";
        if (cuerpoPeticion.length) cabeceras["content-length"] = String(cuerpoPeticion.length);

        const proxyReq = cliente.request(
            origenMoodle + rutaMoodle,
            { method: req.method, headers: cabeceras, rejectUnauthorized: false }, // Evita que se verifique el certificado del Moodle local (mkcert).
            (proxyRes) => {
                const salida = {};
                for (const [k, v] of Object.entries(proxyRes.headers)) {
                    if (CABECERAS_SALTOS.includes(k)) continue;
                    salida[k] = v;
                }
                if (salida["set-cookie"]) salida["set-cookie"] = reescribirSetCookieMoodle(salida["set-cookie"]);
                if (salida.location) salida.location = reescribirLocationMoodle(salida.location, origenMoodle);
                res.writeHead(proxyRes.statusCode || 502, salida);
                proxyRes.pipe(res);
            }
        );

        proxyReq.on("error", (e) => {
            res.statusCode = 502; // Bad Gateway.
            res.end(`Error de proxy hacia Moodle: ${e.message}`);
        });

        if (cuerpoPeticion.length) proxyReq.write(cuerpoPeticion);
        proxyReq.end();
    });
};

// Sirve el front ya construido (dist/) con npm run build.
const servirEstatico = (req, res) => {
    const rutaPedida = decodeURIComponent(req.url.split("?")[0]);
    const rutaAbsoluta = path.join(DIST_DIR, rutaPedida);

    const esArchivoValido = rutaAbsoluta.startsWith(DIST_DIR) && fs.existsSync(rutaAbsoluta) && fs.statSync(rutaAbsoluta).isFile();
    const rutaFinal = esArchivoValido ? rutaAbsoluta : INDEX_HTML;

    fs.readFile(rutaFinal, (err, contenido) => {
        if (err) {
            res.statusCode = 500; // Falta archivo o npm run build.
            res.end(`No se pudo servir ${rutaFinal}: ${err.message}`);
            return;
        }
        res.writeHead(200, { "Content-Type": TIPOS_MIME[path.extname(rutaFinal)] || "application/octet-stream" });
        res.end(contenido);
    });
};

// Crea el servidor. Enruta /api/ hacia el back y /moodle/ hacia Moodle.
const servidor = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
        reenviarApi(req, res);
        return;
    }
    if (req.url.startsWith(`${PREFIJO_MOODLE}/`)) { // El "/" necesario, porque el prefijo es /moodle solo.
        manejarMoodle(req, res);
        return;
    }
    servirEstatico(req, res);
});

servidor.listen(PUERTO, () => {
    console.log(`Gateway escuchando en http://localhost:${PUERTO} (backend: ${BACKEND_URL}, front: ${DIST_DIR})`);
});
