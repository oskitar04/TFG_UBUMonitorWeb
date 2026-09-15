import axios from "axios";

const API_URL = "";

export const procesarLogs = async(archivo) => {
    const formData = new FormData();
    formData.append("file", archivo);

    const response = await axios.post(`${API_URL}/api/public/logs/process/file`, formData, {
       headers: {"Content-Type": "multipart/form-data"},
       responseType: "blob"
    });
    return response.data;
}

// Como el CSV que devuelve el backend trae varios valores entre comillas, se usa un separador 
// de fila que entienda ese formato.
const dividirFilaCsv = (fila) => {
    const valores = [];
    let actual = "";
    let dentroComillas = false;
    for (let i = 0; i < fila.length; i++) {
        const c = fila[i];
        if (dentroComillas) {
            if (c === '"') {
                if (fila[i + 1] === '"') { actual += '"'; i++; }
                else dentroComillas = false;
            } else {
                actual += c;
            }
        } else if (c === '"') {
            dentroComillas = true;
        } else if (c === ",") {
            valores.push(actual);
            actual = "";
        } else {
            actual += c;
        }
    }
    valores.push(actual);
    return valores;
};

// Parsea el CSV en filas sueltas (con usuario, componente, evento, id de módulo, fecha) para que 
// Curso.jsx pueda filtrar por usuario y por componente antes de agregar por día. Además, devuelve 
// los valores los valores para las pestañas de Tipo de componente y Tipo de eventos.
export const parsearLogsCsv = (csvText) => {
    const [cabecera, ...filas] = csvText.trim().split("\n");
    const columnas = dividirFilaCsv(cabecera);
    const idx = (nombre) => columnas.indexOf(nombre);

    const idxTime = idx("Time");
    const idxUserId = idx("User id");
    const idxComponente = idx("Component");
    const idxEvento = idx("Event name");
    const idxModuloId = idx("Course module id");

    // Columnas que necesita la tabla de logs (una fila por evento).
    const idxNombre = idx("User full name");
    const idxOrigen = idx("Origin");
    const idxIp = idx("IP address");

    const componentesSet = new Set();
    const eventosSet = new Set();
    const filasParseadas = [];

    for (const fila of filas) {
        if (!fila) continue;
        const valores = dividirFilaCsv(fila);

        const timeRaw = idxTime >= 0 ? valores[idxTime] : null;
        const componente = idxComponente >= 0 ? valores[idxComponente] : null;
        const evento = idxEvento >= 0 ? valores[idxEvento] : null;
        const moduloId = idxModuloId >= 0 ? valores[idxModuloId] : null;

        if (componente) componentesSet.add(componente);
        if (evento) eventosSet.add(evento);

        filasParseadas.push({
            fecha: timeRaw ? timeRaw.slice(0, 10) : null,
            // Fecha y hora completas (ISO) para la tabla de logs, 
            // así se ordena mejor y luego se formatea a DD/MM/YY HH:MM.
            fechaHora: timeRaw || null,
            userId: idxUserId >= 0 ? valores[idxUserId] : null,
            nombre: idxNombre >= 0 ? valores[idxNombre] : null,
            componente,
            evento,
            moduloId: moduloId || null, 
            origen: idxOrigen >= 0 ? valores[idxOrigen] : null,
            ip: idxIp >= 0 ? valores[idxIp] : null,
        });
    }

    return {
        filas: filasParseadas,
        componentes: [...componentesSet].sort(),
        eventos: [...eventosSet].sort(),
    };
}

// Agrega lista de filas filtradas por Curso.jsx en eventos por día,
// con el formato {name, value} que espera Graficos.
export const agregarPorDia = (filas) => {
    const porDiaMap = new Map();
    for (const fila of filas) {
        if (!fila.fecha) continue;
        porDiaMap.set(fila.fecha, (porDiaMap.get(fila.fecha) ?? 0) + 1);
    }
    return [...porDiaMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dia, value]) => ({ name: dia, value }));
}

// Para el gráfico Total.
// Compara los registros de los usuarios seleccionados con los totales de la categoría marcada en 
// la pestaña de componentes: componente, tipo de evento, sección o módulo.
export const compararPorCategoria = (filas, categorias, categoriaDeFila, idsUsuariosSeleccionados, idsUsuariosFiltrados) => {
    const totalPorCategoria = new Map();
    const seleccionPorCategoria = new Map();

    for (const fila of filas) {
        if (!idsUsuariosFiltrados.has(String(fila.userId))) continue;
        const categoria = categoriaDeFila(fila);
        if (categoria === null || categoria === undefined || !categorias.has(categoria)) continue;
        totalPorCategoria.set(categoria, (totalPorCategoria.get(categoria) ?? 0) + 1);
        if (idsUsuariosSeleccionados.has(String(fila.userId))) {
            seleccionPorCategoria.set(categoria, (seleccionPorCategoria.get(categoria) ?? 0) + 1);
        }
    }

    return [...categorias].map(categoria => ({
        categoria,
        seleccionados: seleccionPorCategoria.get(categoria) ?? 0,
        total: totalPorCategoria.get(categoria) ?? 0,
    }));
}

// Lunes de la semana ISO a la que pertenece una fecha (para agrupar el Heatmap por semana).
const inicioSemana = (fechaIso) => {
    const fecha = new Date(`${fechaIso}T12:00:00`); // El 12 es para evitar problemas de horarios.
    const diasHastaLunes = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    fecha.setDate(fecha.getDate() - diasHastaLunes);
    return fecha.toISOString().slice(0, 10);
};

// Registros de usuarios agregados por semanas para evitar tener el heatmap muy grande.
export const agregarPorUsuarioYSemana = (filas) => {
    const usuariosMap = new Map();
    const semanasSet = new Set();
    const conteo = new Map();

    for (const fila of filas) {
        if (!fila.userId || !fila.fecha) continue;
        const semana = inicioSemana(fila.fecha);
        usuariosMap.set(fila.userId, fila.nombre || fila.userId);
        semanasSet.add(semana);
        const clave = `${fila.userId}::${semana}`;
        conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }

    const usuarios = [...usuariosMap.entries()]
        .map(([userId, nombre]) => ({ userId, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const semanas = [...semanasSet].sort();
    const max = Math.max(0, ...conteo.values());

    return { usuarios, semanas, conteo, max };
}