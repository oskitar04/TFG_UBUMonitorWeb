import http from "node:http"; 
import fs from "node:fs";
import path from "node:path"; // Rutas, válido para / y \
import { fileURLToPath } from "node:url";

// Reconstrucción de __dirname a mano. No existe nativo en ES Modules.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Puerto de gateway y dirección del backend.
const PUERTO = process.env.GATEWAY_PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

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

// Crea el servidor. Enruta /api/ hacia el back.
const servidor = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
        reenviarApi(req, res);
        return;
    }
    servirEstatico(req, res);
});

servidor.listen(PUERTO, () => {
    console.log(`Gateway escuchando en http://localhost:${PUERTO} (backend: ${BACKEND_URL}, front: ${DIST_DIR})`);
});
