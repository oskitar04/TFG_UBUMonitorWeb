package es.ubu.lsi.moodleadapter.mapper.forum;


import es.ubu.lsi.moodleadapter.dto.DiscussionPostDto;
import es.ubu.lsi.moodleadapter.dto.PostDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getdiscussionposts.request.GetDiscussionPostsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getdiscussionposts.response.GetDiscussionPostsResponse;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getdiscussionposts.response.Post;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface PostMapper {


    @Mapping(target = "sortby", source = "sortyby")
    @Mapping(target = "wsfunction", ignore = true)
    GetDiscussionPostsRequest toRequest(Integer discussionid, String sortyby, String sortdirection, Boolean includeinlineattachments);


    @Mapping(target = "discussionid", source = "discussionid")
    @Mapping(target = "posts", source = "response.posts")
    @Mapping(target = "forumid", source = "response.forumid")
    @Mapping(target = "courseid", source = "response.courseid")
    @Mapping(target = "ratinginfo", source = "response.ratinginfo")
    @Mapping(target = "warnings", source = "response.warnings")
    DiscussionPostDto toResponse(Integer discussionid, GetDiscussionPostsResponse response);


    @Mapping(target = "messagetext", source = "post", qualifiedByName = "messagetext")
    @Mapping(target = "html.authorsubheadingtext", source = "html.authorsubheading", qualifiedByName = "parseHtml")
    @Mapping(target = "author.urls.privateprofileimage", source = "author.urls.profileimage", qualifiedByName = "profileUrl")
    PostDto toPost(Post post);


    @Named("messagetext")
    default String parseMessageText(Post post) {
        return MapperUtils.parseMoodleContent(post.getMessage(),
            Optional.ofNullable(post.getMessageformat())
                .map(Post.Messageformat::value)
                .orElse(null));
    }

}
