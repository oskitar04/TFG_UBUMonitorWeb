package es.ubu.lsi.moodleadapter.model;

import com.fasterxml.jackson.databind.JsonNode;
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
public class RequestDefinition {

    private String method;
    private String path;
    private JsonNode body;
    private List<FieldValue> queryParams = new ArrayList<>();
    private List<FieldValue> formData = new ArrayList<>();
    private List<FieldValue> headers = new ArrayList<>();
    private String contentType;


}
