package es.ubu.lsi.moodleadapter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.zalando.logbook.Logbook;
import org.zalando.logbook.spring.webflux.LogbookWebFilter;

@Primary
public class FullLogbookConfig {

    @Bean
    @Primary
    public Logbook logbook() {
        return Logbook.builder()
            // 1. Desactivamos la censura de parámetros en Query String y Headers
            .queryFilter(query -> query)
            .headerFilter(header -> header)

            // 2. Desactivamos la censura del Body (esto quita el "XXX" de las contraseñas)
            .bodyFilter((_, body) -> body)
            .build();
    }

    @Bean
    public LogbookWebFilter logbookWebFilter(Logbook logbook) {
        return new LogbookWebFilter(logbook);
    }
}
