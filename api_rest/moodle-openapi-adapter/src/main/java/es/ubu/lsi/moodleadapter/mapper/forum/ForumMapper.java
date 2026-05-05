package es.ubu.lsi.moodleadapter.mapper.forum;


import es.ubu.lsi.moodleadapter.dto.ForumDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumsbycourses.response.GetForumsByCoursesResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface ForumMapper {


    List<ForumDto> toResponse(List<GetForumsByCoursesResponse> source);

    @Mapping(target = "discussions", ignore = true)
    @Mapping(target = "introtext", source = "source", qualifiedByName = "introtext")
    ForumDto toForum(GetForumsByCoursesResponse source);

    @Named("introtext")
    default String parseSummary(GetForumsByCoursesResponse response) {
        return MapperUtils.parseMoodleContent(response.getIntro(),
            Optional.ofNullable(response.getIntroformat())
                .map(GetForumsByCoursesResponse.Introformat::value)
                .orElse(null));
    }

}
