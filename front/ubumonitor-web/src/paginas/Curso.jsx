import { useParams, useNavigate, useLocation } from "react-router-dom";

import { useEffect, useState, useMemo, useRef } from "react"; //useMemo y useRef, para evitar que se recargue todo el rato y se sature
import { getCursoContenidos, getCursoUsuarios } from "../api/cursos"; // Usuarios para evitar unificar aquí participantes.
import Graficos from "../componentes/graficos"; // para los gráficos
import TablaLogs from "../componentes/tablaLogs"; // tabla de logs
import HeatmapLogs from "../componentes/heatmapLogs"; // heatmap
import { agregarPorDia, compararPorCategoria, agregarPorUsuarioYSemana } from "../api/logs"; // para el uso de logs
import { leerCache } from "../api/cache"; // para leer cache guardada por Logs.jsx
import { traducirComponente, traducirEvento, traducirRol, aClave } from "../i18n/traducir"; // para la internacionalización
import PanelDebug from "../componentes/panelDebug";
import { IconoComponente, IconoSeccion } from "../componentes/iconosComponentes";

// Formato DD/MM/YY, como en los gráficos, pero con horas y minutos 
// por si hay varias descargas en el día
const formatearFechaHora = (timestamp) => {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear()).slice(2);
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

// Añade el token a la url para poder obtener la foto.
const conToken = (url, token) => {
    if (!url) return url;
    return url.includes("?") ? `${url}&token=${token}` : `${url}?token=${token}`;
};

export default function Curso() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Nombre completo del curso en la cabecera 
    const nombre = location.state?.nombre ?? `Curso ${id}`;

    const token = sessionStorage.getItem("token");
    const host = sessionStorage.getItem("host");
    const fullname = sessionStorage.getItem("fullname");
    const userPictureUrl = sessionStorage.getItem("userpictureurl");
    
    // Para la etiqueta de la clave de la caché (host::userId::cursoId)
    const userId = sessionStorage.getItem("userId");

    const [secciones, setSecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Constantes para participantes y filtro, revisar para modificar en caso de ser necesario
    const [usuarios, setUsuarios] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
    const [errorUsuarios, setErrorUsuarios] = useState(null);

    const [gruposSeleccionados, setGruposSeleccionados] = useState(new Set());
    // Empieza con "student" marcado para que la lista de Participantes no esté vacía al entrar.
    const [rolesSeleccionados, setRolesSeleccionados] = useState(new Set(["student"]));
    const [rolDropdownAbierto, setRolDropdownAbierto] = useState(false);
    const [grupoDropdownAbierto, setGrupoDropdownAbierto] = useState(false);
    const rolDropdownRef = useRef(null);
    const grupoDropdownRef = useRef(null);

    const [anchoSidebar, setAnchoSidebar] = useState(400);
    const arrastrandoRef = useRef(false);

    const [altoParticipantes, setAltoParticipantes] = useState(300);
    const arrastrandoAltoRef = useRef(false);
    const inicioYRef = useRef(0);
    const inicioAltoRef = useRef(0);

    useEffect(() => {
        const mover = (e) => {
            if (arrastrandoRef.current) {
                setAnchoSidebar(Math.min(600, Math.max(10, e.clientX)));
            }
            if (arrastrandoAltoRef.current) {
                // Por desplazamiento, no posición absoluta: a diferencia del sidebar, este
                // panel no empieza en y=0 de la pantalla (hay cabecera encima).
                const desplazamiento = e.clientY - inicioYRef.current;
                setAltoParticipantes(Math.min(700, Math.max(10, inicioAltoRef.current + desplazamiento)));
            }
        };
        const soltar = () => {
            arrastrandoRef.current = false;
            arrastrandoAltoRef.current = false;
            document.body.style.cursor = "";
        };
        document.addEventListener("mousemove", mover);
        document.addEventListener("mouseup", soltar);
        return () => {
            document.removeEventListener("mousemove", mover);
            document.removeEventListener("mouseup", soltar);
        };
    }, []);

    const iniciarArrastreSidebar = () => {
        arrastrandoRef.current = true;
        document.body.style.cursor = "col-resize";
    };

    const iniciarArrastreAlto = (e) => {
        arrastrandoAltoRef.current = true;
        inicioYRef.current = e.clientY;
        inicioAltoRef.current = altoParticipantes;
        document.body.style.cursor = "row-resize";
    };

    // Para las pestañas de Componentes y el gráfico activo actual
    const [tabComponenteActiva, setTabComponenteActiva] = useState("componente");
    const [tipoGraficoActivo, setTipoGraficoActivo] = useState("linea");

    // Usuarios seleccionados para meter en el gráfico (en base al userid)
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(new Set());

    // Para seleccionar el componente usado en el gráfico, una lista por pestaña
    const [seleccionComponentes, setSeleccionComponentes] = useState({
        componente: new Set(), eventos: new Set(), secciones: new Set(), modulos: new Set(),
    });

    // Datos de logs (rellenados desde la caché de Logs.jsx).
    const [datosLogs, setDatosLogs] = useState({ filas: [], componentes: [], eventos: [] });

    // Cargando mientras se hace el descifrado. Actualizado cuando hay caché.
    const [cargandoLogs, setCargandoLogs] = useState(true);
    const [actualizadoLogs, setActualizadoLogs] = useState(null);

    // Rango de fechas para acotar el gráfico/tabla.
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    // Debug, lo pongo en una esquina para poder meter los gráficos en el medio de la pantalla
    const [logs, setLogs] = useState([]);
    const addLog = (mensaje, tipo = "info") => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { hora, mensaje, tipo }]);
        console.log(`[${hora}] [${tipo.toUpperCase()}] ${mensaje}`);
    };

    useEffect(() => {
        const cargar = async () => {
            // Mismo try/catch, pero con addLog para el panel de debug
            try {
                const data = await getCursoContenidos(token, host, id);
                // Quita qbank, que no se tiene en cuenta.
                const contenidos = (data.contents ?? []).map(s => ({
                    ...s,
                    modules: (s.modules ?? []).filter(m => m.modname !== "qbank"),
                }));
                setSecciones(contenidos);
                addLog(`Contenido del curso cargado (${contenidos.length} secciones).`, "ok");
            } catch (e) {
                setError("No se pudo cargar el contenido del curso.");
                addLog(`Error cargando contenido del curso: ${e.message}`, "error");
                console.error(e);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id, token, host]);  // Para cambiar de curso sin dar error

    // cargarUsuarios para ver participantes en pantalla
    useEffect(() => {
        const cargarUsuarios = async () => {
            // Mismo try/catch, pero con addLog para el panel de debug
            try {
                const data = await getCursoUsuarios(token, host, id);
                setUsuarios(data.users ?? []);
                addLog(`Participantes cargados (${data.users?.length ?? 0}).`, "ok");
            } catch (e) {
                setErrorUsuarios("No se puede cargar la lista de participantes.");
                addLog(`Error cargando participantes: ${e.message}`, "error");
                console.error(e);
            } finally {
                setCargandoUsuarios(false);
            }
        };
        cargarUsuarios();
    }, [id, token, host]);

    // Cargar al entrar al curso. leerCache no lanza error, por eso sin try/catch. Sin 
    // caché se usan los mensajes que ya existen en la interfaz.
    useEffect(() => {
        const cargarCache = async () => {
            const cache = await leerCache(host, userId, id, token);
            if (cache) {
                setDatosLogs(cache.datos);
                setActualizadoLogs(cache.actualizado);
                addLog(`Cache de logs cargada: ${cache.datos.filas.length} eventos, ${cache.datos.componentes.length} componentes.`, "ok");
            } else {
                addLog("No hay cache de logs guardada para este curso.");
            }
            setCargandoLogs(false);
        };
        cargarCache();
    }, [id, token, host, userId]);

    // Detecta el click para ver si das o no en el desplegable
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (rolDropdownRef.current && !rolDropdownRef.current.contains(e.target)) setRolDropdownAbierto(false);
            if (grupoDropdownRef.current && !grupoDropdownRef.current.contains(e.target)) setGrupoDropdownAbierto(false);
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    // Lista de grupos y de roles para los desplegables.
    const grupos = useMemo(() => {
        const mapa = new Map();
        usuarios.forEach(u => u.groups?.forEach(g => mapa.set(g.id, g.name)));
        return [...mapa.entries()].map(([id, name]) => ({ id, name }));
    }, [usuarios]);

    // Uso traducirRol para que se rellene el nombre traducido en el tipo de rol.
    const roles = useMemo(() => {
        const mapa = new Map();
        usuarios.forEach(u => u.roles?.forEach(r => mapa.set(r.shortname, traducirRol(r.shortname, r.name))));
        return [...mapa.entries()].map(([shortname, nombre]) => ({ shortname, nombre }));
    }, [usuarios]);

    // Marcar y quitar casillas de roles y grupos
    const toggleRol = (shortname) => {
        setRolesSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(shortname)) next.delete(shortname);
            else next.add(shortname);
            return next;
        });
        setUsuariosSeleccionados(new Set()); // Desmarcar todos los participantes, evito que se queden marcados al cambiar el filtro.
    };

    const toggleGrupo = (id) => {
        setGruposSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setUsuariosSeleccionados(new Set()); // Igual que en toggleRol.
    };

    // Filtro de participantes: el Rol manda sobre el de Grupo:
    //  - Si el curso tiene roles y no hay ninguno marcado: no se muestra nadie
    //    (aunque haya grupos marcados).
    //  - Con algún rol marcado y ningún grupo: se filtra solo por rol (los grupos se ignoran).
    //  - Con algún rol marcado y algún grupo marcado: rol Y grupo.
    // Antes era necesario marcar algo en los dos a la vez, y el profesor no aparecía, 
    // porque no está en ningún grupo.
    const usuariosFiltrados = useMemo(() => {
        
        if (roles.length > 0 && rolesSeleccionados.size === 0) return [];

        return usuarios.filter(u => {
            if (roles.length > 0 && !u.roles?.some(r => rolesSeleccionados.has(r.shortname))) {
                return false;
            }
            
            if (gruposSeleccionados.size > 0 && !u.groups?.some(g => gruposSeleccionados.has(g.id))) {
                return false;
            }
            return true;
        }).sort((a, b) => (a.fullname ?? "").localeCompare(b.fullname ?? "", "es", { sensitivity: "base" }));
    }, [usuarios, roles, gruposSeleccionados, rolesSeleccionados]);

    // Selección de participantes: se puede hacer individual, unos cuantos o todos.
    const toggleUsuario = (id) => {
        setUsuariosSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const todosFiltradosSeleccionados = usuariosFiltrados.length > 0
        && usuariosFiltrados.every(u => usuariosSeleccionados.has(u.id));

    const toggleTodosUsuarios = () => {
        setUsuariosSeleccionados(prev => {
            const next = new Set(prev);
            if (todosFiltradosSeleccionados) {
                usuariosFiltrados.forEach(u => next.delete(u.id));
            } else {
                usuariosFiltrados.forEach(u => next.add(u.id));
            }
            return next;
        });
    };

    // Para la selección dentro de Componentes: se puede hacer individual,
    // unos cuantos e incluso seleccionar todos, pero no seleccionar desde 
    // dos pestañas diferentes.
    const toggleItemComponente = (tab, item) => {
        setSeleccionComponentes(prev => {
            const next = { ...prev, [tab]: new Set(prev[tab]) };
            if (next[tab].has(item)) next[tab].delete(item);
            else next[tab].add(item);
            return next;
        });
    };

    const toggleTodosComponente = (tab, items) => {
        setSeleccionComponentes(prev => {
            const actual = prev[tab];
            const todosMarcados = items.length > 0 && items.every(it => actual.has(it));
            const next = new Set(todosMarcados ? [] : items);
            return { ...prev, [tab]: next };
        });
    };

    const todosLosModulos = useMemo(() => {
        return secciones.flatMap(s => s.modules ?? []);
    }, [secciones]);

    // Alias para que coincida lo del CSV con el modname y muestre el icono bien. Solo estos dan problemas.
    const ALIAS_MODNAME = { assignment: "assign", file_submissions: "assign" };

    // Icono de Moodle (modicon), asocia cada componente con su icono.
    const iconoRealPorComponente = useMemo(() => {
        const mapa = new Map();
        for (const m of todosLosModulos) {
            if (m.modicon && !mapa.has(m.modname)) mapa.set(m.modname, m.modicon);
        }
        return mapa;
    }, [todosLosModulos]);

    // Pone el icono asociado, si no viene de Moodle usa los personalizados.
    const renderIconoComponente = (textoComponente) => {
        const modname = ALIAS_MODNAME[aClave(textoComponente)] ?? aClave(textoComponente);
        const real = iconoRealPorComponente.get(modname);
        return (
            <span style={iconoCajaStyle}>
                {real ? <img src={real} alt="" style={iconoImgStyle} /> : <IconoComponente texto={textoComponente} />}
            </span>
        );
    };

    // Coge los usuarios que hay y compara con los datos del CSV.
    const filasValidas = useMemo(() => {
        const idsMatriculados = new Set(usuarios.map(u => String(u.id)));
        return datosLogs.filas.filter(f => idsMatriculados.has(String(f.userId)));
    }, [datosLogs.filas, usuarios]);

    // Ordenados alfabéticamente.
    const componentesOrdenados = useMemo(() => {
        const set = new Set();
        for (const f of filasValidas) {
            if (f.componente) set.add(f.componente);
        }
        return [...set].sort((a, b) =>
            traducirComponente(a).localeCompare(traducirComponente(b), "es", { sensitivity: "base" }));
    }, [filasValidas]);

    // Asocia el tipo de componente al evento.
    const claveEvento = (f) => `${f.componente ?? ""}||${f.evento}`;

    // Une y ordena los tipos de evento.
    const eventosAgrupados = useMemo(() => {
        const mapa = new Map();
        for (const f of filasValidas) {
            if (!f.evento) continue;
            const clave = claveEvento(f);
            if (!mapa.has(clave)) mapa.set(clave, { componente: f.componente, evento: f.evento });
        }
        return [...mapa.values()].sort((a, b) => {
            const cmpComponente = traducirComponente(a.componente).localeCompare(traducirComponente(b.componente), "es", { sensitivity: "base" });
            if (cmpComponente !== 0) return cmpComponente;
            return traducirEvento(a.evento).localeCompare(traducirEvento(b.evento), "es", { sensitivity: "base" });
        });
    }, [filasValidas]);

    // Desmarcar las 4 pestañas al cambiar entre ellas, evito dejar cosas marcadas.
    const cambiarTabComponente = (tab) => {
        setTabComponenteActiva(tab);
        setSeleccionComponentes({ componente: new Set(), eventos: new Set(), secciones: new Set(), modulos: new Set() });
    };

    // Ejemplos de tipos de gráficos. Por el momento linea, tabla, total y heatmap implementados.
    const TIPOS_GRAFICO = [
        { id: "linea", nombre: "Gráfico de línea" },
        { id: "tabla", nombre: "Tabla" },
        { id: "total", nombre: "Total" },
        { id: "heatmap", nombre: "HeatMap" },
    ];

    // Los que están implementados, los demás muestran el aviso.
    const TIPOS_IMPLEMENTADOS = ["linea", "tabla", "total", "heatmap"];

    // Para las pestañas de los componentes
    const TABS_COMPONENTES = [
        { id: "componente", nombre: "Tipo de componente" },
        { id: "eventos", nombre: "Tipo de eventos" },
        { id: "secciones", nombre: "Secciones" },
        { id: "modulos", nombre: "Módulos" },
    ];

    // Fecha más antigua y más reciente que hay en el CSV, para acotar los selectores de fecha.
    const rangoFechas = useMemo(() => {
        const fechas = filasValidas.map(f => f.fecha).filter(Boolean);
        if (fechas.length === 0) return { min: "", max: "" };
        return {
            min: fechas.reduce((a, b) => (a < b ? a : b)),
            max: fechas.reduce((a, b) => (a > b ? a : b)),
        };
    }, [filasValidas]);

    // Rango efectivo. Si el usuario no ha elegido ninguna fecha, se usa la de los datos,
    // así se muestra una fecha en vez de el formato a secas (dd/mm/yyyy).
    const desdeEfectiva = fechaDesde || rangoFechas.min;
    const hastaEfectiva = fechaHasta || rangoFechas.max;

    // Bloquea todas las teclas menos el tabulador, así la fecha solo se puede cambiar 
    // con el desplegable y se puede seguir navegando por la página con el Tab.
    const bloquearTecladoFecha = (e) => {
        if (e.key !== "Tab") e.preventDefault();
    };

    // Filas del CSV filtradas por lo elegido en Participantes y en Componentes (aquí solo 
    // cuenta lo marcado en ese momento, lo de las otras pestañas de Componentes no cuenta). 
    // En caso de no haber cosas marcadas se vería un gráfico vacío.
    const filasFiltradas = useMemo(() => {
        if (usuariosSeleccionados.size === 0) return null;
        const idsUsuarios = new Set([...usuariosSeleccionados].map(String));

        const seleccionActiva = seleccionComponentes[tabComponenteActiva];
        if (seleccionActiva.size === 0) return null;

        let moduloIdsValidos = null;
        if (tabComponenteActiva === "secciones") {
            moduloIdsValidos = new Set(
                secciones
                    .filter(s => seleccionActiva.has(s.id))
                    .flatMap(s => (s.modules ?? []).map(m => Number(m.id)))
            );
        }

        return filasValidas.filter(f => {
            if (!idsUsuarios.has(String(f.userId))) return false;
            // Rango de fechas. f.fecha es YYYY-MM-DD.
            if (desdeEfectiva && (!f.fecha || f.fecha < desdeEfectiva)) return false;
            if (hastaEfectiva && (!f.fecha || f.fecha > hastaEfectiva)) return false;
            switch (tabComponenteActiva) {
                case "componente": return seleccionActiva.has(f.componente);
                case "eventos": return seleccionActiva.has(claveEvento(f));
                case "modulos": return seleccionActiva.has(Number(f.moduloId));
                case "secciones": return moduloIdsValidos.has(Number(f.moduloId));
                default: return false;
            }
        });
    }, [filasValidas, usuariosSeleccionados, seleccionComponentes, tabComponenteActiva, secciones, desdeEfectiva, hastaEfectiva]);

    // Eventos ya filtrados por día para pasarlo a los gráficos
    const datosGrafico = useMemo(() => {
        return filasFiltradas ? agregarPorDia(filasFiltradas) : [];
    }, [filasFiltradas]);

    // Matriz usuario por semana para el Heatmap.
    const datosHeatmap = useMemo(() => {
        return filasFiltradas ? agregarPorUsuarioYSemana(filasFiltradas) : null;
    }, [filasFiltradas]);

    // Comparativa entre usuarios seleccionados y el total de registros para el gráfico.
    const datosTotalComparativa = useMemo(() => {
        const seleccionActiva = seleccionComponentes[tabComponenteActiva];
        if (usuariosSeleccionados.size === 0 || seleccionActiva.size === 0) return [];

        const idsUsuarios = new Set([...usuariosSeleccionados].map(String));
        const idsFiltrados = new Set(usuariosFiltrados.map(u => String(u.id)));

        // Para ver la sección del módulo.
        const moduloASeccion = tabComponenteActiva === "secciones"
            ? new Map(secciones.flatMap(s => (s.modules ?? []).map(m => [Number(m.id), s.id])))
            : null;

        const categoriaDeFila = (f) => {
            switch (tabComponenteActiva) {
                case "componente": return f.componente;
                case "eventos": return f.evento ? claveEvento(f) : null;
                case "modulos": return f.moduloId ? Number(f.moduloId) : null;
                case "secciones": return f.moduloId ? (moduloASeccion.get(Number(f.moduloId)) ?? null) : null;
                default: return null;
            }
        };

        const nombreDeCategoria = (categoria) => {
            if (tabComponenteActiva === "secciones") {
                const s = secciones.find(sec => sec.id === categoria);
                return s ? (s.name || `Sección ${s.section}`) : String(categoria);
            }
            if (tabComponenteActiva === "modulos") {
                const m = todosLosModulos.find(mod => Number(mod.id) === categoria);
                return m ? `${m.name} (${m.modname})` : String(categoria);
            }
            if (tabComponenteActiva === "eventos") {
                const [componente, evento] = categoria.split("||");
                return `${traducirComponente(componente)} – ${traducirEvento(evento)}`;
            }
            return traducirComponente(categoria);
        };

        // Para el rango de fechas.
        const filasEnRango = filasValidas.filter(f =>
            (!desdeEfectiva || (f.fecha && f.fecha >= desdeEfectiva)) &&
            (!hastaEfectiva || (f.fecha && f.fecha <= hastaEfectiva))
        );

        return compararPorCategoria(filasEnRango, seleccionActiva, categoriaDeFila, idsUsuarios, idsFiltrados)
            .map(({ categoria, seleccionados, total }) => ({ name: nombreDeCategoria(categoria), seleccionados, total }));
    }, [filasValidas, usuariosSeleccionados, usuariosFiltrados, seleccionComponentes, tabComponenteActiva, secciones, todosLosModulos, desdeEfectiva, hastaEfectiva]);

    // Filas para la tabla de logs que se muestra, con el mismo filtro que el gráfico, 
    // pero sin agrupar por día. El CSV solo trae el id del módulo (Course module id), 
    // aquí lo paso a nombre y sección para que no aparezca un simple número.
    const filasTabla = useMemo(() => {
        if (!filasFiltradas) return [];
        return filasFiltradas.map(f => {
            const modulo = todosLosModulos.find(m => Number(m.id) === Number(f.moduloId));
            const seccion = f.moduloId
                ? secciones.find(s => (s.modules ?? []).some(m => Number(m.id) === Number(f.moduloId)))
                : null;
            return {
                fechaHora: f.fechaHora,
                nombre: f.nombre,
                componente: traducirComponente(f.componente),
                evento: traducirEvento(f.evento),
                seccion: seccion ? (seccion.name || `Sección ${seccion.section}`) : "",
                modulo: modulo ? modulo.name : "",
                origen: f.origen,
                ip: f.ip,
            };
        });
    }, [filasFiltradas, todosLosModulos, secciones]);

    if (!token) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <div style={{
                display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "380px",
                background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px",
                padding: "32px", boxShadow: "var(--shadow)", boxSizing: "border-box", textAlign: "center"
            }}>
                <p style={{ margin: 0, color: "var(--text)" }}>No hay sesión activa.</p>
                <button onClick={() => navigate("/")} className="boton boton-primario">Volver al login</button>
            </div>
        </div>
    );

    // Mensaje en el gráfico para saber que falla. Ver TIPOS_IMPLEMENTADOS para lo que hay hecho.
    // Estado cargandoLogs: evito mostrar "Carga el CSV..." antes de que lleguen los datos.
    const mensajeVacioGrafico = !TIPOS_IMPLEMENTADOS.includes(tipoGraficoActivo)
        ? `Gráfico "${tipoGraficoActivo}" pendiente de implementar`
        : cargandoLogs
            ? "Cargando datos de logs..."
            : datosLogs.filas.length === 0
                ? "Carga el CSV de los logs para poder ver el gráfico"
                : usuariosSeleccionados.size === 0
                    ? "Selecciona al menos un participante para ver el gráfico"
                    : seleccionComponentes[tabComponenteActiva].size === 0
                        ? `Selecciona al menos un elemento en la pestaña "${TABS_COMPONENTES.find(t => t.id === tabComponenteActiva)?.nombre}" para ver el gráfico`
                        : (filasFiltradas && filasFiltradas.length === 0 && (fechaDesde || fechaHasta))
                            ? "No hay eventos en el rango de fechas seleccionado"
                            : "No existe un gráfico para esa combinación de datos seleccionados"

    // Función para evitar repetir código, se usa para las pestañas de Componentes, tienen todas la misma estructura.
    const renderListaSeleccionable = (tab, items, render) => {
        const seleccion = seleccionComponentes[tab];
        const todosMarcados = items.length > 0 && items.every(it => seleccion.has(it));
        return (
            <>
                {items.length > 0 && (
                    <button onClick={() => toggleTodosComponente(tab, items)} style={botonPequenoStyle}>
                        {todosMarcados ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                )}
                <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", fontSize: "13px" }}>
                    {items.map(item => (
                        <li key={item} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                            <label style={checkboxLabelStyle}>
                                <input
                                    type="checkbox"
                                    checked={seleccion.has(item)}
                                    onChange={() => toggleItemComponente(tab, item)}
                                />
                                {render(item)}
                            </label>
                        </li>
                    ))}
                </ul>
            </>
        );
    };

    return (
        // Los minWidth: 0 y overflowX: hidden hacen que al disminuir la ventana del navegador 
        // lo suficiente, los botones de la cabecera desaparezcan, para evitar dejar una barra 
        // de scroll horizontal del navegador.
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", minWidth: 0, overflowX: "hidden" }}>

            {/* Cabecera */}
            {/* Adaptado también a modo oscuro*/}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => navigate("/cursos")} className="boton boton-primario">Atrás</button>
                <h1 style={{ margin: 0, fontSize: "24px" }}>{nombre}</h1> {/* Nombre de la asigantura*/}

                {/* Fecha de última actualización con el formato DD/MM/YY, igual que en los gráficos*/}
                {actualizadoLogs && (
                    <span style={{ fontSize: "13px", color: "var(--text)" }}>
                        Última actualización de datos: {formatearFechaHora(actualizadoLogs)}
                    </span>
                )}

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    {userPictureUrl && (
                        <img
                            src={conToken(userPictureUrl, token)}
                            alt=""
                            style={avatarCabeceraStyle}
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    )}
                    <span style={{ fontSize: "16px", color: "var(--text)" }}>{fullname}</span>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }} className="boton boton-primario">Cerrar sesión</button>
                </div>
            </div>

            {/* Interfaz en dos partes (izquierda: participantes, componentes y debug, centro/derecha: gráficos) */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ width: `${anchoSidebar}px`, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Panel de Participantes, con scroll para la lista sin cabeceras */}
                {/* minHeight a 100 para evitar que se solape con Componentes al subirlo. */}
                <div style={{ flex: `0 0 ${altoParticipantes}px`, minHeight: "100px", display: "flex", flexDirection: "column", padding: "16px" }}>
                    <h2 style={{ fontSize: "18px", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", flexShrink: 0 }}>Participantes</h2>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexShrink: 0 }}>
                        <div ref={rolDropdownRef} style={{ position: "relative" }}>
                            <button onClick={() => setRolDropdownAbierto(o => !o)} style={dropdownButtonStyle}>
                                Rol{rolesSeleccionados.size > 0 ? ` (${rolesSeleccionados.size})` : ""} ▾
                            </button>
                            {/* Adaptado a colores de modo oscuro */}
                            {rolDropdownAbierto && (
                                <div style={dropdownPanelStyle}>
                                    {roles.length === 0
                                        ? <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>Sin roles.</p>
                                        : roles.map(r => (
                                            <label key={r.shortname} style={checkboxLabelStyle}>
                                                <input type="checkbox" checked={rolesSeleccionados.has(r.shortname)} onChange={() => toggleRol(r.shortname)} />
                                                {r.nombre}
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                        <div ref={grupoDropdownRef} style={{ position: "relative" }}>
                            <button onClick={() => setGrupoDropdownAbierto(o => !o)} style={dropdownButtonStyle}>
                                Grupo{gruposSeleccionados.size > 0 ? ` (${gruposSeleccionados.size})` : ""} ▾
                            </button>
                            {/* Color adaptado a modo oscuro */}
                            {grupoDropdownAbierto && (
                                <div style={dropdownPanelStyle}>
                                    {grupos.length === 0
                                        ? <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>Este curso no tiene grupos.</p>
                                        : grupos.map(g => (
                                            <label key={g.id} style={checkboxLabelStyle}>
                                                <input type="checkbox" checked={gruposSeleccionados.has(g.id)} onChange={() => toggleGrupo(g.id)} />
                                                {g.name}
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conteo para participantes del filtro. */}
                    {!cargandoUsuarios && !errorUsuarios && (
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 8px", flexShrink: 0 }}>
                            {usuariosFiltrados.length} participante{usuariosFiltrados.length === 1 ? "" : "s"}
                        </p>
                    )}

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                    {cargandoUsuarios && <p>Cargando participantes...</p>}
                    {errorUsuarios && <p style={{ color: "var(--error)" }}>{errorUsuarios}</p>}
                    {/* Mensajes por si falta marcar casillas en los filtros o por si no hay coincidencias con esos filtros */}
                    {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length === 0 && (
                        <p style={{ color: "var(--text)" }}>
                            {roles.length > 0 && rolesSeleccionados.size === 0
                                ? "Marca al menos un Rol para ver participantes."
                                : "No hay participantes para esos filtros."}
                        </p>
                    )}
                    
                    {/* Filtro de usuarios con checkbox y opción de seleccionar todos. Colores adaptados a modo oscuro */}
                    {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length > 0 && (
                        <>
                            <button onClick={toggleTodosUsuarios} style={botonPequenoStyle}>
                                {todosFiltradosSeleccionados ? "Deseleccionar todos" : "Seleccionar todos"}
                            </button>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginTop: "8px" }}>
                                <thead>
                                    <tr style={{ textAlign: "left" }}>
                                        <th style={thStyle}></th>
                                        <th style={thStyle}></th>
                                        <th style={thStyle}>Nombre</th>
                                        <th style={thStyle}>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosFiltrados.map(u => (
                                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td style={tdStyle}>
                                                <input
                                                    type="checkbox"
                                                    checked={usuariosSeleccionados.has(u.id)}
                                                    onChange={() => toggleUsuario(u.id)}
                                                />
                                            </td>
                                            <td style={tdStyle}>
                                                <img
                                                    src={conToken(u.privateprofileimageurl ?? u.profileimageurl, token)}
                                                    alt=""
                                                    style={avatarStyle}
                                                    onError={(e) => { e.target.style.display = "none"; }}
                                                />
                                            </td>
                                            <td style={{ ...tdStyle, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }} title={u.fullname}>
                                                {u.fullname}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    {u.roles?.map(r => (
                                                        <span key={r.shortname} style={chipStyle}>{traducirRol(r.shortname, r.name)}</span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                    </div>
                </div>

                <div
                    onMouseDown={iniciarArrastreAlto}
                    style={{ height: "6px", flexShrink: 0, cursor: "row-resize", backgroundColor: "var(--border)" }}
                />

                {/* Panel de Componentes, con scroll para la lista sin cabeceras. Ocupa lo que sobra. */}
                {/* minHeight a 100 para evitar que se solape con Debug al bajarlo. */}
                <div style={{ flex: 1, minHeight: "100px", display: "flex", flexDirection: "column", padding: "16px" }}>
                    <h2 style={{ fontSize: "18px", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", flexShrink: 0 }}>
                        Componentes
                    </h2>

                    <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap", flexShrink: 0 }}>
                        {TABS_COMPONENTES.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => cambiarTabComponente(tab.id)}
                                style={tab.id === tabComponenteActiva ? tabButtonActiveStyle : tabButtonStyle}
                            >
                                {tab.nombre}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                    {tabComponenteActiva === "componente" && (
                        componentesOrdenados.length === 0
                            ? <p style={{ color: "var(--text)", fontSize: "13px" }}>Carga un CSV de logs para ver los componentes.</p>
                            : renderListaSeleccionable("componente", componentesOrdenados, item => (
                                <>
                                    {renderIconoComponente(item)}
                                    {traducirComponente(item)}
                                </>
                            ))
                    )}

                    {tabComponenteActiva === "eventos" && (
                        eventosAgrupados.length === 0
                            ? <p style={{ color: "var(--text)", fontSize: "13px" }}>Carga un CSV de logs para ver los tipos de evento.</p>
                            : renderListaSeleccionable("eventos", eventosAgrupados.map(claveEvento), item => {
                                const [componente, evento] = item.split("||");
                                return (
                                    <>
                                        {renderIconoComponente(componente)}
                                        {traducirComponente(componente)} – {traducirEvento(evento)}
                                    </>
                                );
                            })
                    )}

                    {tabComponenteActiva === "secciones" && (
                        <>
                            {cargando && <p style={{ fontSize: "13px" }}>Cargando...</p>}
                            {error && <p style={{ color: "var(--error)", fontSize: "13px" }}>{error}</p>}
                            {!cargando && !error && secciones.length === 0 && (
                                <p style={{ color: "var(--text)", fontSize: "13px" }}>Este curso no tiene secciones visibles.</p>
                            )}
                            {!cargando && !error && secciones.length > 0 &&
                                renderListaSeleccionable("secciones", secciones.map(s => s.id), (id) => {
                                    const s = secciones.find(sec => sec.id === id);
                                    return (
                                        <>
                                            <span style={iconoCajaStyle}><IconoSeccion /></span>
                                            {s.name || `Sección ${s.section}`}
                                        </>
                                    );
                                })
                            }
                        </>
                    )}

                    {tabComponenteActiva === "modulos" && (
                        <>
                            {cargando && <p style={{ fontSize: "13px" }}>Cargando...</p>}
                            {error && <p style={{ color: "var(--error)", fontSize: "13px" }}>{error}</p>}
                            {!cargando && !error && todosLosModulos.length === 0 && (
                                <p style={{ color: "var(--text)", fontSize: "13px" }}>Este curso no tiene módulos visibles.</p>
                            )}
                            {!cargando && !error && todosLosModulos.length > 0 &&
                                renderListaSeleccionable("modulos", todosLosModulos.map(m => m.id), (id) => {
                                    const m = todosLosModulos.find(mod => mod.id === id);
                                    return (
                                        <>
                                            {m.modicon && (
                                                <span style={iconoCajaStyle}>
                                                    <img src={m.modicon} alt="" style={iconoImgStyle} />
                                                </span>
                                            )}
                                            {m.name} ({m.modname})
                                        </>
                                    );
                                })
                            }
                        </>
                    )}
                    </div>
                </div>

                {/* Panel del debug, debajo a la izquierda en pequeño. */}
                <PanelDebug logs={logs} titulo="Debug" variante="lateral" />
                </div>

                <div
                    onMouseDown={iniciarArrastreSidebar}
                    style={{ width: "6px", flexShrink: 0, cursor: "col-resize", backgroundColor: "var(--border)" }}
                />

                {/* Panel central. Con scroll solo para el gráfico/tabla, lo demás se queda fijo. */}
                <div style={{ flex: 1, minWidth: 0, padding: "24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* A la izquierda el título del gráfico y el desplegable, a la derecha el rango de fechas. */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", flexShrink: 0, marginBottom: "16px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", margin: "0 0 12px" }}>
                                {TIPOS_GRAFICO.find(t => t.id === tipoGraficoActivo)?.nombre}
                            </h2>
                            <select
                                value={tipoGraficoActivo}
                                onChange={(e) => setTipoGraficoActivo(e.target.value)}
                                style={{ padding: "6px 10px", fontSize: "14px" }}
                            >
                                <option value="" disabled>Selecciona un gráfico</option>
                                {TIPOS_GRAFICO.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rango de fechas */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                Desde
                                <input
                                    type="date"
                                    value={desdeEfectiva}
                                    min={rangoFechas.min}
                                    max={rangoFechas.max}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    onKeyDown={bloquearTecladoFecha} // Evitar cambiar fecha con teclado.
                                    onPaste={(e) => e.preventDefault()} // Evitar que se peguen valores
                                    style={inputFechaStyle}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                Hasta
                                <input
                                    type="date"
                                    value={hastaEfectiva}
                                    min={rangoFechas.min}
                                    max={rangoFechas.max}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    onKeyDown={bloquearTecladoFecha} // Evitar cambiar fecha con teclado.
                                    onPaste={(e) => e.preventDefault()} // Evitar que se peguen valores
                                    style={inputFechaStyle}
                                />
                            </label>
                            {(fechaDesde || fechaHasta) && (
                                <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }} style={botonPequenoStyle}>
                                    Restablecer fechas
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scroll para el gráfico/tabla */}
                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                        {tipoGraficoActivo === "linea" && datosGrafico.length > 0 ? (
                            <Graficos data={datosGrafico} />
                        ) : tipoGraficoActivo === "tabla" && filasTabla.length > 0 ? (
                            <TablaLogs filas={filasTabla} />
                        ) : tipoGraficoActivo === "total" && datosTotalComparativa.length > 0 ? (
                            <Graficos data={datosTotalComparativa} tipo="total" />
                        ) : tipoGraficoActivo === "heatmap" && datosHeatmap && datosHeatmap.usuarios.length > 0 ? (
                            <HeatmapLogs usuarios={datosHeatmap.usuarios} semanas={datosHeatmap.semanas} conteo={datosHeatmap.conteo} max={datosHeatmap.max} />
                        ) : (
                            <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "40px", textAlign: "center", color: "var(--text)" }}>
                                {mensajeVacioGrafico}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mismos estilos pero adaptados al modo oscuro
const thStyle = {
    padding: "10px 12px", fontWeight: "600",
    position: "sticky", top: 0, zIndex: 1,
    backgroundColor: "var(--code-bg)",
    boxShadow: "inset 0 -2px 0 var(--border)",
};
const tdStyle = { padding: "10px 12px" };
const avatarStyle = { width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", display: "block" };
const avatarCabeceraStyle = { width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", display: "block" };
// Estilo de la caja del icono.
const iconoCajaStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "#fff",
    border: "1px solid var(--border)", flexShrink: 0, padding: "3px", boxSizing: "border-box",
    color: "#1a1a1a",
};
const iconoImgStyle = { width: "100%", height: "100%", objectFit: "contain" };
const chipStyle = {
    backgroundColor: "var(--accent-bg)", color: "var(--accent)",
    padding: "2px 8px", borderRadius: "12px", fontSize: "12px"
};
const dropdownButtonStyle = {
    padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border)",
    fontSize: "14px", backgroundColor: "var(--bg)", color: "var(--text)", cursor: "pointer"
};
const dropdownPanelStyle = {
    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 10,
    backgroundColor: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "6px",
    padding: "10px 12px", boxShadow: "var(--shadow)",
    display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px"
};
const checkboxLabelStyle = { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer", color: "var(--text)" };

// Selectores de fecha del rango
const inputFechaStyle = {
    padding: "4px 6px", borderRadius: "6px", border: "1px solid var(--border)",
    fontSize: "14px", backgroundColor: "var(--bg)", color: "var(--text)",
};

// Estilo de pestañas para "Componentes"
const tabButtonStyle = {
    padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border)",
    fontSize: "12px", backgroundColor: "var(--bg)", cursor: "pointer", color: "var(--text)"
};
const tabButtonActiveStyle = {
    ...tabButtonStyle,
    backgroundColor: "var(--accent)", color: "#fff", borderColor: "var(--accent)"
};

// Botón pequeño ("adaptado") utilizado para "Seleccionar todos" / "Deseleccionar todos"
const botonPequenoStyle = {
    padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--border)",
    fontSize: "11px", backgroundColor: "var(--bg)", color: "var(--text)", cursor: "pointer"
};
