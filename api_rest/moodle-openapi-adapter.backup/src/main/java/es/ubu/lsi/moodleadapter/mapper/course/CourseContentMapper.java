package es.ubu.lsi.moodleadapter.mapper.course;

import es.ubu.lsi.moodleadapter.dto.CourseContentDto;
import es.ubu.lsi.moodleadapter.dto.CourseContentsResponseDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseContentsOptionsParameterDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.course.getcontents.request.GetCourseContentsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.course.getcontents.request.Option;
import es.ubu.lsi.moodleadapter.moodle.model.core.course.getcontents.response.GetContentsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CourseContentMapper {

    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "courseid", source = "courseId")
    @Mapping(target = "options", source = "queryParams")
    GetCourseContentsRequest toRequest(Integer courseId, GetCourseContentsOptionsParameterDto queryParams);

    default List<Option> map(GetCourseContentsOptionsParameterDto dto) {
        return Stream.of(
                option(Option.Name.SECTIONID, dto.getSectionid()),
                option(Option.Name.SECTIONNUMBER, dto.getSectionnumber()),
                option(Option.Name.CMID, dto.getCmid()),
                option(Option.Name.MODID, dto.getModid()),
                option(Option.Name.MODNAME, dto.getModname()),
                option(Option.Name.EXCLUDEMODULES, dto.getExcludemodules()),
                option(Option.Name.EXCLUDECONTENTS, dto.getExcludecontents()),
                option(Option.Name.INCLUDESTEALTHMODULES, dto.getIncludestealthmodules())
            )
            .filter(Objects::nonNull)
            .toList();
    }

    default Option option(Option.Name name, Object value) {
        if (value == null) {
            return null;
        }
        Option option = new Option();
        option.setName(name);
        option.setValue(value.toString());
        return option;
    }


    // For response
    CourseContentsResponseDto toCourseContentsResponseDto(List<GetContentsResponse> contents, Object[] params);


    @Mapping(target = "summarytext", source = "response", qualifiedByName = "summarytext")
    CourseContentDto toCourseContentsResponseDto(GetContentsResponse response);


    @Named("summarytext")
    default String parseSummary(GetContentsResponse response) {
        return MapperUtils.parseMoodleContent(response.getSummary(),
            Optional.ofNullable(response.getSummaryformat())
                .map(GetContentsResponse.Summaryformat::value)
                .orElse(null));
    }
}
