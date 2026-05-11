package es.ubu.lsi.moodleadapter.mapper.course;

import es.ubu.lsi.moodleadapter.dto.ActivitiesCompletionDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.completion.getactivitiescompletionstatus.request.GetActivitiesCompletionStatusRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.completion.getactivitiescompletionstatus.response.GetActivitiesCompletionStatusResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CourseActivitiesCompletionMapper {


    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "courseid", source = "courseid")
    @Mapping(target = "userid", source = "userid")
    GetActivitiesCompletionStatusRequest toRequest(Integer courseid, Integer userid);


    @Mapping(target = "courseid", source = "courseid")
    @Mapping(target = "userid", source = "userid")
    @Mapping(target = "statuses", source = "response.statuses")
    @Mapping(target = "warnings", source = "response.warnings")
    ActivitiesCompletionDto toResponse(Integer courseid, Integer userid, GetActivitiesCompletionStatusResponse response);
}
