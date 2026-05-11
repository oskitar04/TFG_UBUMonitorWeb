package es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum;

import es.ubu.lsi.moodleadapter.dto.ForumDto;
import es.ubu.lsi.moodleadapter.mapper.forum.ForumMapper;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumsbycourses.request.GetForumsByCoursesRequest;
import es.ubu.lsi.moodleadapter.moodle.model.mod.forum.getforumsbycourses.response.GetForumsByCoursesResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.List;

/*
 * GetCourseForumsEndpoint is responsible for fetching the forums and related content of a course from Moodle.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetCourseForumsEndpoint implements MoodleEndpoint<GetForumsByCoursesRequest, List<GetForumsByCoursesResponse>, List<ForumDto>> {

    /**
     * Response type reference with generic information.
     */
    private static final ParameterizedTypeReference<List<GetForumsByCoursesResponse>> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /**
     * Mapper for transforming responses.
     */
    private final ForumMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseIds
     * @return Request for mod_forum_get_forums_by_courses
     */
    @Override
    @SuppressWarnings("unchecked")
    public GetForumsByCoursesRequest buildRequest(Object... params) {

        List<Integer> courseIds = (List<Integer>) params[0];
        List<Long> longList = courseIds.stream()
            .map(Integer::longValue)
            .toList();

        GetForumsByCoursesRequest getForumsByCoursesRequest = new GetForumsByCoursesRequest();
        if (!CollectionUtils.isEmpty(courseIds)) {
            getForumsByCoursesRequest.setCourseids(longList);

        }
        return getForumsByCoursesRequest;
    }


    @Override
    public ParameterizedTypeReference<List<GetForumsByCoursesResponse>> getResponseType() {
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
    public List<ForumDto> mapResponse(List<GetForumsByCoursesResponse> response, Object... params) {
        return mapper.toResponse(response);
    }
}
