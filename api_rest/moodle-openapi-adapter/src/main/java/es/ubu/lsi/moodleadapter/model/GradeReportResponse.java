package es.ubu.lsi.moodleadapter.model;


import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradeitems.response.UserGrade;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.Table;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GradeReportResponse {

    private final UserGrade userGrade;
    private final Table table;

}
