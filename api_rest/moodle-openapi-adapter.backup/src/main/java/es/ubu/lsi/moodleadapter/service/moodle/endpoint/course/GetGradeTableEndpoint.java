package es.ubu.lsi.moodleadapter.service.moodle.endpoint.course;

import es.ubu.lsi.moodleadapter.mapper.course.CourseGradesMapper;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.request.GetGradesTableRequest;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.GetGradesTableResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;


/**
 * Endpoint implementation for retrieving grade table data.
 * <p>
 * This endpoint fetches the grade results for users in a course,
 * including individual grades for each assessment/item.
 * <p>
 * Moodle Web Service: {@code gradereport_user_get_grade_table}
 * <p>
 * Type Parameters:
 * - Request: GetGradesTableRequest
 * - Source: GetGradesTableResponse
 * - Target: GetGradesTableResponse (no transformation)
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetGradeTableEndpoint implements MoodleEndpoint<GetGradesTableRequest, GetGradesTableResponse, GetGradesTableResponse> {

    /** Response type reference. */
    private static final ParameterizedTypeReference<GetGradesTableResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /** Mapper for building requests. */
    private final CourseGradesMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseId, [1] userId, [2] groupId
     * @return Request for gradereport_user_get_grade_table
     */
    @Override
    public GetGradesTableRequest buildRequest(Object... params) {
        Integer courseid = (Integer) params[0];
        Integer userid = (Integer) params[1];
        Integer groupid = (Integer) params[2];

        return mapper.toRequest(courseid, userid, groupid);
    }


    @Override
    public ParameterizedTypeReference<GetGradesTableResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Returns the grade table response as-is.
     *
     * @param response Grade table from Moodle
     * @param params Original parameters
     * @return Grade table response
     */
    @Override
    public GetGradesTableResponse mapResponse(GetGradesTableResponse response, Object... params) {
        return response;
    }
}
