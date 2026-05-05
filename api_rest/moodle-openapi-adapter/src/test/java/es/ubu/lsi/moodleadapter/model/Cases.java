package es.ubu.lsi.moodleadapter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cases {

    private String description;
    private RequestDefinition request;
    private List<MoodleMockDefinition> moodleLoginMocks = new ArrayList<>();
    private List<MoodleMockDefinition> moodleApiMocks = new ArrayList<>();
    private ResponseDefinition expectedResponse;
}
