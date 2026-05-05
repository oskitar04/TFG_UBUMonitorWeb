package es.ubu.lsi.moodleadapter.csv.strategy;

import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AffecredUserCollumFillStrategy implements ColumnFillStrategy {

    @Override
    public LogHeaderDto getHeaderName() {
        return LogHeaderDto.AFFECTED_USER;
    }

    @Override
    public Object fill(String currentValue, Map<String, String> row, Map<String, Object> descriptionValues) {
        if ("-".equals(currentValue)) {
            return null;
        }
        return currentValue;
    }
}
