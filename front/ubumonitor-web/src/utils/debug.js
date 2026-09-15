// Controla si se muestran los paneles de debug en toda la aplicación. 
// Usa sessionStorage para evitar quedarse activada.
export const CLAVE_DEBUG = "ubumonitor_debugPanel";
export const EVENTO_DEBUG_ACTIVADO = "ubumonitor-debug-toggle";

export const estaDebugActivado = () => sessionStorage.getItem(CLAVE_DEBUG) === "true";

// Avisa a los paneles montados de que el valor ha cambiado, para actualizarse sin recargar.
export const guardarDebugActivado = (activado) => {
    sessionStorage.setItem(CLAVE_DEBUG, activado ? "true" : "false");
    window.dispatchEvent(new CustomEvent(EVENTO_DEBUG_ACTIVADO, { detail: activado }));
};
