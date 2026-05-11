package es.ubu.lsi.moodleadapter.csv.strategy;

import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
public class TimeColumFillStrategy implements ColumnFillStrategy {
    private static final DateTimeFormatter MOODLE_TIME_FORMATTER = DateTimeFormatter.ofPattern("d/MM/yy, HH:mm:ss");

    @Override
    public LogHeaderDto getHeaderName() {
        return LogHeaderDto.TIME;
    }

    @Override
    public Object fill(String currentValue, Map<String, String> row, Map<String, Object> descriptionValues) {
        return LocalDateTime.parse(currentValue, MOODLE_TIME_FORMATTER);
    }
}
