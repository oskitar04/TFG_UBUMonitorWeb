package es.ubu.lsi.moodleadapter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodleMockDefinition {

    private RequestDefinition request;
    private ResponseDefinition response;
}
