package es.ubu.lsi.moodleadapter.service.moodle.endpoint.course;

import es.ubu.lsi.moodleadapter.dto.ActivitiesCompletionDto;
import es.ubu.lsi.moodleadapter.mapper.course.CourseActivitiesCompletionMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.completion.getactivitiescompletionstatus.request.GetActivitiesCompletionStatusRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.completion.getactivitiescompletionstatus.response.GetActivitiesCompletionStatusResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;


/**
 * Endpoint implementation for retrieving grade item data.
 * <p>
 * This endpoint fetches information about gradable items/assessments in a course,
 * including their names, scales, and grade settings.
 * <p>
 * Moodle Web Service: {@code gradereport_user_get_grade_items}
 * <p>
 * Type Parameters:
 * - Request: GetGradeItemsRequest
 * - Source: GetGradeItemsResponse
 * - Target: GetGradeItemsResponse (no transformation)
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetActivitiesCompletionStatusEndpoint implements MoodleEndpoint<GetActivitiesCompletionStatusRequest, GetActivitiesCompletionStatusResponse, ActivitiesCompletionDto> {

    /**
     * Response type reference.
     */
    private static final ParameterizedTypeReference<GetActivitiesCompletionStatusResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /**
     * Mapper for building requests.
     */
    private final CourseActivitiesCompletionMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseId, [1] userId, [2] groupId
     * @return Request for gradereport_user_get_grade_items
     */
    @Override
    public GetActivitiesCompletionStatusRequest buildRequest(Object... params) {
        Integer courseid = (Integer) params[0];
        Integer userid = (Integer) params[1];

        return mapper.toRequest(courseid, userid);
    }


    @Override
    public ParameterizedTypeReference<GetActivitiesCompletionStatusResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Returns the grade items response as-is.
     *
     * @param response Grade items from Moodle
     * @param params   Original parameters
     * @return Grade items response
     */
    @Override
    public ActivitiesCompletionDto mapResponse(GetActivitiesCompletionStatusResponse response, Object... params) {
        Integer courseid = (Integer) params[0];
        Integer userid = (Integer) params[1];
        return mapper.toResponse(courseid, userid, response);
    }
}
