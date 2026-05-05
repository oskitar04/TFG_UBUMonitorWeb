package es.ubu.lsi.moodleadapter.csv.strategy;

import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class UserIdCollumFillStrategy implements ColumnFillStrategy {

    @Override
    public LogHeaderDto getHeaderName() {
        return LogHeaderDto.USER_ID;
    }

    @Override
    public Object fill(String currentValue, Map<String, String> row, Map<String, Object> descriptionValues) {

        return descriptionValues.get("user_id");
    }

    @Override
    public boolean shouldParseDescription() {
        return true;
    }
}
