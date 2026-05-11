package es.ubu.lsi.moodleadapter.model;

import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradeitems.response.GetGradeItemsResponse;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.GetGradesTableResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserGradeResponse {

    private final GetGradeItemsResponse getGradeItemsResponse;
    private final GetGradesTableResponse getGradesTableResponse;
}
