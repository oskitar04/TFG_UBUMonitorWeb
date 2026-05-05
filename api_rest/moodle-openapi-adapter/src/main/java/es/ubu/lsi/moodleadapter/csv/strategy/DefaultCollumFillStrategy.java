package es.ubu.lsi.moodleadapter.csv.strategy;

import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;

import java.util.Map;

public class DefaultCollumFillStrategy implements ColumnFillStrategy {

    @Override
    public LogHeaderDto getHeaderName() {
        return null;
    }

    @Override
    public Object fill(String currentValue, Map<String, String> row, Map<String, Object> descriptionValues) {
        return currentValue;
    }
}
