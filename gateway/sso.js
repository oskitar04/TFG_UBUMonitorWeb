const https = require("node:https");
const crypto = require("node:crypto");
const { URL, URLSearchParams } = require("node:url"); // URL para leer/trocear y Params para construir formato.

const TTL_SESION_MS = 10 * 60 * 1000; // 10 min, de sobra para que dure el código.
const sesiones = new Map(); // Almacén de datos, sessionId como clave.

const generarId = () => crypto.randomBytes(16).toString("hex");

// Guarda cada parte de la cookie por separado.
const guardarCookies = (jar, host, cabecerasSetCookie) => {
    if (!cabecerasSetCookie) return;
    const lista = Array.isArray(cabecerasSetCookie) ? cabecerasSetCookie : [cabecerasSetCookie];
    for (const c of lista) {
        const [parNombreValor, ...atributos] = c.split(";").map((p) => p.trim());
        const igual = parNombreValor.indexOf("=");
        if (igual === -1) continue;
        const nombre = parNombreValor.slice(0, igual);
        const valor = parNombreValor.slice(igual + 1);
        let dominio = host;
        for (const attr of atributos) {
            if (/^domain=/i.test(attr)) dominio = attr.slice(7).replace(/^\./, "");
        }
        if (!jar.has(dominio)) jar.set(dominio, new Map());
        jar.get(dominio).set(nombre, valor);
    }
};

// Junta las partes de la cookie correspondientes a la URL destino.
const cabeceraCookie = (jar, host) => {
    const partes = [];
    for (const [dominio, cookies] of jar.entries()) {
        if (host === dominio || host.endsWith("." + dominio)) {
            for (const [nombre, valor] of cookies.entries()) partes.push(`${nombre}=${valor}`);
        }
    }
    return partes.join("; ");
};

// Hace la petición HTTPS a partir de las cookies guardadas para la URL especificada
// y guarda las nuevas que llegan.
const peticion = (url, { method = "GET", body = null, cookieJar } = {}) =>
    new Promise((resolve, reject) => {
        const u = new URL(url);
        const cabeceras = { "user-agent": "Mozilla/5.0 (UBUMonitorWeb-SSO)" }; // Vale para casi todos los navegadores.
        const cookieStr = cookieJar ? cabeceraCookie(cookieJar, u.hostname) : "";
        if (cookieStr) cabeceras.cookie = cookieStr;
        if (body) {
            cabeceras["content-type"] = "application/x-www-form-urlencoded";
            cabeceras["content-length"] = Buffer.byteLength(body);
        }
        const req = https.request(u, { method, headers: cabeceras }, (res) => {
            if (cookieJar) guardarCookies(cookieJar, u.hostname, res.headers["set-cookie"]);
            const trozos = [];
            res.on("data", (c) => trozos.push(c));
            res.on("end", () =>
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(trozos).toString("utf8"),
                    url: u.toString(),
                })
            );
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });

// Quita los caracteres "disfrazados" de HTML para dejarlo limpio para JS. 5 casos obligatorios para este caso.
const decodificarEntidadesHtml = (s) =>
    s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// Solo se considera "de autoenvío" si TODOS sus campos son ocultos, si hay algún 
// campo visible (texto, password...) es un formulario real que espera que el usuario 
// escriba algo (como el código del email), y ahí se para, evitando autoenviarlo vacío.
const extraerFormularioAutoenvio = (html) => {
    const formMatch = /<form\b[^>]*action="([^"]*)"[^>]*>/i.exec(html);
    if (!formMatch) return null;
    const inputs = html.match(/<input\b[^>]*>/gi) || [];
    const campos = {};
    for (const elementoInput of inputs) {
        const tipoM = /type="([^"]*)"/i.exec(elementoInput);
        const tipo = tipoM ? tipoM[1].toLowerCase() : "text";
        if (tipo === "submit" || tipo === "button") continue;
        if (tipo !== "hidden") return null; // Si no es hidden, es un campo visible que espera que un humano escriba algo y se para aquí.
        const nombreM = /name="([^"]*)"/i.exec(elementoInput);
        if (!nombreM) continue;
        const valorM = /value="([^"]*)"/i.exec(elementoInput);
        campos[nombreM[1]] = valorM ? decodificarEntidadesHtml(valorM[1]) : "";
    }
    return { action: decodificarEntidadesHtml(formMatch[1]), campos };
};

// Avanza por sí sola por toda la parte del proceso que no necesita a un humano, hasta llegar 
// a una página final de verdad (como la de escribir el código). 10 saltos como límite, 
// para evitar un bucle infinito.
const seguirCadena = async (respuestaInicial, cookieJar, etiqueta, maxSaltos = 10) => {
    let actual = respuestaInicial;
    for (let i = 0; i < maxSaltos; i++) {
        if (actual.statusCode >= 300 && actual.statusCode < 400 && actual.headers.location) {
            const siguienteUrl = new URL(actual.headers.location, actual.url).toString();
            console.log(`[SSO:${etiqueta}] redirección -> ${siguienteUrl}`);
            actual = await peticion(siguienteUrl, { cookieJar });
            continue;
        }
        if (actual.statusCode === 200 && /<form\b[^>]*method="post"[^>]*>/i.test(actual.body)) {
            const formulario = extraerFormularioAutoenvio(actual.body);
            if (!formulario) break;
            const accionUrl = new URL(formulario.action, actual.url).toString();
            console.log(`[SSO:${etiqueta}] formulario autoenvío -> ${accionUrl}`);
            const cuerpo = new URLSearchParams(formulario.campos).toString();
            actual = await peticion(accionUrl, { method: "POST", body: cuerpo, cookieJar });
            continue;
        }
        break;
    }
    return actual;
};

// Para evitar mirar HTML se busca el AuthState y extrae lo de después del "=".
const extraerAuthState = (url) => {
    const m = /[?&]AuthState=([^&]+)/.exec(url);
    return m ? m[1] : null;
};

// Paso 1 (sin gastar el código del email): sigue la cadena hasta el
// formulario de usuario/contraseña, lo envía, y pide el código por email.
// Devuelve un sessionId para el siguiente paso.
const iniciarLoginSso = async ({ moodleHost, ssoLoginUrl, username, password }) => {
    const cookieJar = new Map();

    let resp = await peticion(ssoLoginUrl, { cookieJar });
    resp = await seguirCadena(resp, cookieJar, "inicio");
    console.log(`[SSO:inicio] aterrizado en ${resp.url} (status ${resp.statusCode})`);

    const authState = extraerAuthState(resp.url);
    if (!authState) {
        throw new Error(`No se ha encontrado el AuthState en la página de login (URL: ${resp.url}).`);
    }

    const origenSso = new URL(resp.url).origin;
    const rutaBase = new URL(resp.url).pathname.replace(/\/[^/]*$/, "");

    const cuerpoLogin = new URLSearchParams({ username, password }).toString();
    let respLogin = await peticion(resp.url, { method: "POST", body: cuerpoLogin, cookieJar });
    respLogin = await seguirCadena(respLogin, cookieJar, "login");
    console.log(`[SSO:login] respuesta status ${respLogin.statusCode}, contiene mfastartauth: ${/mfastartauth/.test(respLogin.body)}`);

    if (!/mfastartauth/.test(respLogin.body)) {
        throw new Error("Usuario o contraseña incorrectos (no ha llegado a la pantalla de elegir método 2FA).");
    }

    const urlEnviarCodigo = `${origenSso}${rutaBase}/mfastartauth?AuthState=${authState}&mfam=auth_mail`;
    let respCodigo = await peticion(urlEnviarCodigo, { cookieJar });
    respCodigo = await seguirCadena(respCodigo, cookieJar, "envio-codigo");
    console.log(`[SSO:envio-codigo] respuesta status ${respCodigo.statusCode}, contiene auth_mail_code: ${/auth_mail_code/.test(respCodigo.body)}`);

    if (!/auth_mail_code/.test(respCodigo.body)) {
        throw new Error("No ha llegado a la pantalla de introducir el código tras pedirlo por email.");
    }

    const sessionId = generarId();
    sesiones.set(sessionId, { cookieJar, authState, origenSso, rutaBase, moodleHost, creado: Date.now() });
    return { sessionId };
};

// Paso 2 (gasta el código del email): comprueba el código, termina el
// login y canjea la sesión resultante por un wstoken.
const completarLoginSso = async ({ sessionId, codigo }) => {
    const sesion = sesiones.get(sessionId);
    if (!sesion) throw new Error("Sesión de login SSO no encontrada o ya usada. Vuelve a empezar.");

    if (Date.now() - sesion.creado > TTL_SESION_MS) {
        sesiones.delete(sessionId);
        throw new Error("Sesión de login SSO caducada (más de 10 min). Vuelve a empezar.");
    }

    // La sesión solo se borra al final por si hay un fallo que se pueda reintentar.
    const { cookieJar, authState, origenSso, rutaBase, moodleHost } = sesion;

    const urlComprobar = `${origenSso}${rutaBase}/mfacheck?AuthState=${authState}`;
    const cuerpoCodigo = new URLSearchParams({ auth_mail_code: codigo, mfam: "auth_mail" }).toString();
    let resp = await peticion(urlComprobar, { method: "POST", body: cuerpoCodigo, cookieJar });
    resp = await seguirCadena(resp, cookieJar, "comprobar-codigo");
    console.log(`[SSO:comprobar-codigo] respuesta status ${resp.statusCode}, contiene endlogin: ${/endlogin/.test(resp.body)}`);

    if (!/endlogin/.test(resp.body)) {
        throw new Error("Código incorrecto o caducado.");
    }

    const urlFinLogin = `${origenSso}${rutaBase}/endlogin?AuthState=${authState}`;
    let respFin = await peticion(urlFinLogin, { cookieJar });
    respFin = await seguirCadena(respFin, cookieJar, "fin-login");
    console.log(`[SSO:fin-login] aterrizado en ${respFin.url} (status ${respFin.statusCode})`);

    const passport = crypto.randomInt(100000, 999999);
    const urlLaunch = `${moodleHost}/admin/tool/mobile/launch.php?service=moodle_mobile_app&urlscheme=moodlemobile&passport=${passport}`;
    const respLaunch = await peticion(urlLaunch, { cookieJar });
    console.log(`[SSO:launch] status ${respLaunch.statusCode}, Location: ${respLaunch.headers.location || "(ninguna)"}`);

    const location = respLaunch.headers.location || "";
    if (!location.startsWith("moodlemobile://token=")) {
        throw new Error(
            `No se ha completado el login en Moodle tras el SSO (se esperaba moodlemobile://, se recibió status ${respLaunch.statusCode}${location ? ", Location: " + location : ""}).`
        );
    }

    const base64 = location.slice("moodlemobile://token=".length);
    const decodificado = Buffer.from(base64, "base64").toString("utf8");
    const partes = decodificado.split(":::");
    if (partes.length < 2) throw new Error("Formato de passport de Moodle inesperado.");
    const [hashRecibido, wstoken, privatetoken] = partes;

    const hashEsperado = crypto.createHash("md5").update(moodleHost + passport).digest("hex");
    if (hashRecibido !== hashEsperado) {
        throw new Error("Verificación del passport fallida (el hash no coincide, posible token manipulado).");
    }

    sesiones.delete(sessionId); // Todo bien: ahora sí se marca como usada.
    return { token: wstoken, privatetoken: privatetoken || null };
};

// Solo estas dos funciones se pueden usar desde fuera de este fichero (server.js).
module.exports = { iniciarLoginSso, completarLoginSso };
