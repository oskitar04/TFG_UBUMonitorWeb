package es.ubu.lsi.moodleadapter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.zalando.logbook.Logbook;
import org.zalando.logbook.core.BodyFilters;
import org.zalando.logbook.core.HeaderFilters;
import org.zalando.logbook.json.JsonBodyFilters;

import java.util.Set;

@Configuration
@Profile("!test")

public class LogbookConfig {


    @Bean
    public Logbook logbook() {

        return Logbook.builder()
            .headerFilter(HeaderFilters.replaceHeaders("X-Moodle-Token", "<token>"))
            .bodyFilter(BodyFilters.replaceFormUrlEncodedProperty(
                Set.of("wstoken", "password"), "<secret>"))
            .bodyFilter(JsonBodyFilters.replaceJsonStringProperty(Set.of("userprivateaccesskey", "password", "token", "privatetoken"), "<secret>"))
            .build();
    }

}
