package es.ubu.lsi.moodleadapter.csv.service;

import es.ubu.lsi.moodleadapter.csv.config.MoodleRulesConfig;
import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;
import io.krakens.grok.api.Grok;
import io.krakens.grok.api.Match;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoodleParserService {


    private final MoodleRulesConfig moodleRulesConfig;


    public Map<String, Object> extractData(Map<String, String> row) {
        String component = row.get(LogHeaderDto.COMPONENT.getValue());
        String eventName = row.get(LogHeaderDto.EVENT_NAME.getValue());
        String description = row.get(LogHeaderDto.DESCRIPTION.getValue());
        return extractData(component, eventName, description);
    }

    public Map<String, Object> extractData(String component, String eventName, String description) {
        List<Grok> groks = Optional.ofNullable(moodleRulesConfig.getRules().get(component))
            .map(eventMap -> eventMap.get(eventName))
            .orElse(Collections.emptyList());


        for (Grok grok : groks) {
            if (CollectionUtils.isEmpty(grok.getNamedRegexCollection()) && grok.getOriginalGrokPattern().equals(description)) {
                // Si el patrón es exactamente igual a la descripción, no es necesario hacer match
                // Esto es útil para casos donde no se necesitan extraer variables, solo validar la existencia del evento
                return Collections.emptyMap();
            }
            Match match = grok.match(description);
            if (match == null) {
                continue;
            }
            Map<String, Object> capture = match.capture();
            if (!capture.isEmpty()) {
                return capture;
            }
        }

        log.warn("No Grok rule found for component='[{}]', eventName='[{}]', description='{}'", component, eventName, description);

        return Collections.emptyMap();
    }


}
