import http from "node:http";
import https from "node:https";
import { Buffer } from "node:buffer";

const PREFIJO = "/moodle";
const USER_AGENT = "MoodleMobile 4.5.0 (45000)";

const CABECERAS_SALTOS = ["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailer"];

const leerCuerpoPeticion = (req) =>
    new Promise((resolve) => {
        const trozos = [];
        req.on("data", (c) => trozos.push(c));
        req.on("end", () => resolve(Buffer.concat(trozos)));
        req.on("error", () => resolve(Buffer.concat(trozos)));
    });

const reescribirLocation = (location, origenMoodle) => {
    if (!location) return location;
    if (location.startsWith(origenMoodle)) return PREFIJO + location.slice(origenMoodle.length);
    if (/^https?:\/\//i.test(location)) {
        try {
            const u = new URL(location);
            return PREFIJO + u.pathname + u.search + u.hash;
        } catch {
            return location;
        }
    }
    if (location.startsWith("/")) return PREFIJO + location;
    return location;
};

// Moodle manda la cookie con Domain y, si viene por https, Secure y SameSite=None,
// que el navegador la rechazaría en http. Se quitan y se fija
// Path=/moodle para que solo se reenvíe al propio proxy.
const reescribirSetCookie = (valores) => {
    const lista = Array.isArray(valores) ? valores : [valores];
    return lista.map((c) =>
        c
            .split(";")
            .map((p) => p.trim())
            .filter((p) => p && !/^domain=/i.test(p) && !/^secure$/i.test(p) && !/^samesite=/i.test(p) && !/^path=/i.test(p))
            .concat([`Path=${PREFIJO}`, "SameSite=Lax"])
            .join("; ")
    );
};

export default function moodleProxyPlugin() {
    return {
        name: "moodle-proxy",
        apply: "serve",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!req.url.startsWith(`${PREFIJO}/`)) return next();

                const urlMoodleDestino = req.headers["x-moodle-target"];
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
                const rutaMoodle = req.url.slice(PREFIJO.length);
                const cliente = urlDestino.protocol === "https:" ? https : http;

                leerCuerpoPeticion(req).then((cuerpoPeticion) => {
                    const cabeceras = {};
                    for (const [k, v] of Object.entries(req.headers)) {
                        if (CABECERAS_SALTOS.includes(k) || k === "x-moodle-target" || k === "host" || k === "origin" || k === "referer" || k === "accept-encoding") continue;
                        cabeceras[k] = v;
                    }
                    cabeceras.host = urlDestino.host;
                    cabeceras["user-agent"] = USER_AGENT;
                    cabeceras.referer = `${origenMoodle}/`;
                    cabeceras["accept-encoding"] = "identity";
                    if (cuerpoPeticion.length) cabeceras["content-length"] = String(cuerpoPeticion.length);

                    const proxyReq = cliente.request(
                        origenMoodle + rutaMoodle,
                        { method: req.method, headers: cabeceras, rejectUnauthorized: false },
                        (proxyRes) => {
                            const salida = {};
                            for (const [k, v] of Object.entries(proxyRes.headers)) {
                                if (CABECERAS_SALTOS.includes(k)) continue;
                                salida[k] = v;
                            }
                            if (salida["set-cookie"]) salida["set-cookie"] = reescribirSetCookie(salida["set-cookie"]);
                            if (salida.location) salida.location = reescribirLocation(salida.location, origenMoodle);
                            res.writeHead(proxyRes.statusCode || 502, salida);
                            proxyRes.pipe(res);
                        }
                    );

                    proxyReq.on("error", (e) => {
                        res.statusCode = 502;
                        res.end(`Error de proxy hacia Moodle: ${e.message}`);
                    });

                    if (cuerpoPeticion.length) proxyReq.write(cuerpoPeticion);
                    proxyReq.end();
                });
            });
        },
    };
}
