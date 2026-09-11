import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import componentes from "./es/componentes.json";
import eventos from "./es/eventos.json";
import roles from "./es/roles.json";

// Traducir lo que llega del CSV en inglés: nombres de componente y de evento, 
// y el shortname de los roles.
// De momento solo en español, pero está preparado para añadir más idiomas como 
// inglés. Con crear en/ de la misma forma que es/ valdría, y añadir un selector 
// para elegir idioma.
i18n.use(initReactI18next).init({
    lng: "es",  // idioma activo.
    fallbackLng: "es", // idioma de respaldo.
    ns: ["componentes", "eventos", "roles"], // namespaces separados.
    resources: {
        es: { componentes, eventos, roles }, // se ponen como idioma es.
    },
    interpolation: { escapeValue: false }, // false para que se devuelva el texto 
                                            // tal cual, sin fallos como que en el 
                                            // texto ponga por ejemplo "&amp;".
});

export default i18n;
