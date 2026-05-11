package es.ubu.lsi.moodleadapter.mapper.user;


import es.ubu.lsi.moodleadapter.dto.UserCourseDto;
import es.ubu.lsi.moodleadapter.dto.UserCoursesResponseDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getuserscourses.request.GetUsersCoursesRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getuserscourses.response.GetUsersCoursesResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface UserCoursesMapper {

    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "userid", source = "userId")
    @Mapping(target = "returnusercount", source = "returnusercount")
    GetUsersCoursesRequest toRequest(Integer userId, Boolean returnusercount);


    @Mapping(target = "downloadlogurl", source = "source", qualifiedByName = "downloadlogurl")
    @Mapping(target = "summarytext", source = "source", qualifiedByName = "summarytext")
    UserCourseDto toUserCourseDto(GetUsersCoursesResponse source);


    UserCoursesResponseDto toCoursesResponse(List<GetUsersCoursesResponse> courses, Object[] params);


    @Named("downloadlogurl")
    default URI downloadlogurl(GetUsersCoursesResponse source) {
        URI courseimage = source.getCourseimage();
        if (courseimage == null) {
            return null;
        }
        UriComponents uriComponents = UriComponentsBuilder.fromUri(courseimage).build();

        UriComponents newUri = UriComponentsBuilder.newInstance()
            .scheme(uriComponents.getScheme())
            .host(uriComponents.getHost())
            .path("/report/log/index.php")
            .queryParam("download", "csv")
            .queryParam("id", source.getId())
            .queryParam("modid", "")
            .queryParam("chooselog", 1)
            .queryParam("logreader", "logstore_standard")
            .build();
        return newUri.toUri();
    }

    @Named("summarytext")
    default String parseSummary(GetUsersCoursesResponse response) {
        return MapperUtils.parseMoodleContent(response.getSummary(),
            Optional.ofNullable(response.getSummaryformat())
                .map(GetUsersCoursesResponse.Summaryformat::value)
                .orElse(null));
    }

}
