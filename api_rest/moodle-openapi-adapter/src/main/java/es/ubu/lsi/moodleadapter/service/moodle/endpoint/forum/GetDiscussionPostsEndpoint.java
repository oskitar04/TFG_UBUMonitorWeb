package es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum;

import es.ubu.lsi.moodleadapter.dto.DiscussionPostDto;
import es.ubu.lsi.moodleadapter.mapper.forum.PostMapper;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getdiscussionposts.request.GetDiscussionPostsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getdiscussionposts.response.GetDiscussionPostsResponse;
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
public class GetDiscussionPostsEndpoint implements MoodleEndpoint<GetDiscussionPostsRequest, GetDiscussionPostsResponse, DiscussionPostDto> {

    /**
     * Response type reference with generic information.
     */
    private static final ParameterizedTypeReference<GetDiscussionPostsResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /**
     * Mapper for transforming responses.
     */
    private final PostMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseIds, [1] sortorder, [2] page, [3] perpage, [4] groupid
     * @return Request  for mod_forum_get_forum_discussions
     */
    @Override
    public GetDiscussionPostsRequest buildRequest(Object... params) {

        Integer discussionid = (Integer) params[0];
        String sortyby = (String) params[1];
        String sortdirection = (String) params[2];
        Boolean includeinlineattachments = (Boolean) params[3];

        return mapper.toRequest(discussionid, sortyby, sortdirection, includeinlineattachments);
    }


    @Override
    public ParameterizedTypeReference<GetDiscussionPostsResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Maps Moodle response to client DTO.
     *
     * @param response List of content sections and modules
     * @param params   Original parameters
     * @return Course contents DTO
     */
    @Override
    public DiscussionPostDto mapResponse(GetDiscussionPostsResponse response, Object... params) {
        Integer discussionid = (Integer) params[0];
        return mapper.toResponse(discussionid, response);
    }
}
