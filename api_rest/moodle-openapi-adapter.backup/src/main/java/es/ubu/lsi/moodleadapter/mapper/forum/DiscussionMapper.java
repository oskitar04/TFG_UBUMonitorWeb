package es.ubu.lsi.moodleadapter.mapper.forum;


import es.ubu.lsi.moodleadapter.dto.DiscussionDto;
import es.ubu.lsi.moodleadapter.dto.ForumDiscussionDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumdiscussions.request.GetForumDiscussionsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumdiscussions.response.Discussion;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumdiscussions.response.GetForumDiscussionsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface DiscussionMapper {


    @Mapping(target = "wsfunction", ignore = true)
    GetForumDiscussionsRequest toRequest(Integer forumid, String sortorder, Integer page, Integer perpage, Integer groupid);


    @Mapping(target = "forumid", source = "forumid")
    @Mapping(target = "discussions", source = "response.discussions")
    @Mapping(target = "warnings", source = "response.warnings")
    ForumDiscussionDto toResponse(Integer forumid, GetForumDiscussionsResponse response);

    @Mapping(target = "posts", ignore = true)
    @Mapping(target = "privateuserpictureurl", source = "userpictureurl", qualifiedByName = "profileUrl")
    @Mapping(target = "privateusermodifiedpictureurl", source = "usermodifiedpictureurl", qualifiedByName = "profileUrl")
    @Mapping(target = "messagetext", source = "source", qualifiedByName = "messagetext")
    DiscussionDto toDiscussion(Discussion source);

    @Named("messagetext")
    default String parseMessageText(Discussion discussion) {
        return MapperUtils.parseMoodleContent(discussion.getMessage(),
            Optional.ofNullable(discussion.getMessageformat())
                .map(Discussion.Messageformat::value)
                .orElse(null));
    }
}
