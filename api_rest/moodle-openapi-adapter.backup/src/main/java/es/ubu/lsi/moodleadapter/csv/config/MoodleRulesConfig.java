package es.ubu.lsi.moodleadapter.csv.config;

import io.krakens.grok.api.Grok;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "moodle")
@Data
public class MoodleRulesConfig {
    private Map<String, Map<String, List<Grok>>> rules;
}
