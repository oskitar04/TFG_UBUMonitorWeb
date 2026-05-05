package es.ubu.lsi.moodleadapter.service.moodle.endpoint.user;

import es.ubu.lsi.moodleadapter.dto.UserCoursesResponseDto;
import es.ubu.lsi.moodleadapter.mapper.user.UserCoursesMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getuserscourses.request.GetUsersCoursesRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getuserscourses.response.GetUsersCoursesResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Endpoint implementation for retrieving courses for a specific user.
 * <p>
 * This endpoint fetches all courses that a user is enrolled in,
 * including course metadata and enrollment status.
 * <p>
 * Moodle Web Service: {@code core_enrol_get_users_courses}
 * <p>
 * Type Parameters:
 * - Request: GetUsersCoursesRequest
 * - Source: List<GetUsersCoursesResponse>
 * - Target: UserCoursesResponseDto
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetUserCoursesEndpoint implements MoodleEndpoint<GetUsersCoursesRequest, List<GetUsersCoursesResponse>, UserCoursesResponseDto> {

    /** Response type reference with generic information. */
    private static final ParameterizedTypeReference<List<GetUsersCoursesResponse>> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /** Mapper for transforming responses. */
    private final UserCoursesMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] userId, [1] returnUserCount flag
     * @return Request for core_enrol_get_users_courses
     */
    @Override
    public GetUsersCoursesRequest buildRequest(Object... params) {
        Integer userId = (Integer) params[0];
        Boolean returnusercount = (Boolean) params[1];
        return mapper.toRequest(userId, returnusercount);
    }


    @Override
    public ParameterizedTypeReference<List<GetUsersCoursesResponse>> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Maps Moodle response to client DTO.
     *
     * @param response List of courses the user is enrolled in
     * @param params Original parameters
     * @return User courses DTO
     */
    @Override
    public UserCoursesResponseDto mapResponse(List<GetUsersCoursesResponse> response, Object... params) {
        return mapper.toCoursesResponse(response, params);
    }
}
