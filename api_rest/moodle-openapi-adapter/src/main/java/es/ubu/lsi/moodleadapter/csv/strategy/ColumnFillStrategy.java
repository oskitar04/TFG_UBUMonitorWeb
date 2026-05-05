package es.ubu.lsi.moodleadapter.csv.strategy;


import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;

import java.util.Map;

public interface ColumnFillStrategy {


    LogHeaderDto getHeaderName();

    Object fill(String currentValue, Map<String, String> row, Map<String, Object> descriptionValues);

    default boolean shouldParseDescription() {
        return false;
    }

}
