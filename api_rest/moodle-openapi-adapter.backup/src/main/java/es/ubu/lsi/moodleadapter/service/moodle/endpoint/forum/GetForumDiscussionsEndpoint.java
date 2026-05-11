package es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum;

import es.ubu.lsi.moodleadapter.dto.ForumDiscussionDto;
import es.ubu.lsi.moodleadapter.mapper.forum.DiscussionMapper;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumdiscussions.request.GetForumDiscussionsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumdiscussions.response.GetForumDiscussionsResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

/*
 * GetCourseForumsEndpoint is responsible for fetching the forums and related content of a course from Moodle.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetForumDiscussionsEndpoint implements MoodleEndpoint<GetForumDiscussionsRequest, GetForumDiscussionsResponse, ForumDiscussionDto> {

    /**
     * Response type reference with generic information.
     */
    private static final ParameterizedTypeReference<GetForumDiscussionsResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /**
     * Mapper for transforming responses.
     */
    private final DiscussionMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseIds, [1] sortorder, [2] page, [3] perpage, [4] groupid
     * @return Request  for mod_forum_get_forum_discussions
     */
    @Override
    public GetForumDiscussionsRequest buildRequest(Object... params) {

        Integer forumid = (Integer) params[0];
        String sortorder = (String) params[1];
        Integer page = (Integer) params[2];
        Integer perpage = (Integer) params[3];
        Integer groupid = (Integer) params[4];

        return mapper.toRequest(forumid, sortorder, page, perpage, groupid);
    }


    @Override
    public ParameterizedTypeReference<GetForumDiscussionsResponse> getResponseType() {
        return RESPONSE_TYPE;
    }


    @Override
    public ForumDiscussionDto mapResponse(GetForumDiscussionsResponse response, Object... params) {
        Integer forumid = (Integer) params[0];
        return mapper.toResponse(forumid, response);
    }
}
