package es.ubu.lsi.moodleadapter.service.moodle.endpoint.course;

import es.ubu.lsi.moodleadapter.dto.CourseContentsResponseDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseContentsOptionsParameterDto;
import es.ubu.lsi.moodleadapter.mapper.course.CourseContentMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.course.getcontents.request.GetCourseContentsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.course.getcontents.response.GetContentsResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Endpoint implementation for retrieving course contents and structure.
 * <p>
 * This endpoint fetches the course structure including sections, modules,
 * activities, and other course components.
 * <p>
 * Moodle Web Service: {@code core_course_get_contents}
 * <p>
 * Type Parameters:
 * - Request: GetCourseContentsRequest
 * - Source: List<GetContentsResponse>
 * - Target: CourseContentsResponseDto
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetCourseContentsEndpoint implements MoodleEndpoint<GetCourseContentsRequest, List<GetContentsResponse>, CourseContentsResponseDto> {

    /** Response type reference with generic information. */
    private static final ParameterizedTypeReference<List<GetContentsResponse>> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /** Mapper for transforming responses. */
    private final CourseContentMapper mapper;

    /**
     * Builds the request for the Moodle API.
     *
     * @param params [0] courseId, [1] options
     * @return Request for core_course_get_contents
     */
    @Override
    public GetCourseContentsRequest buildRequest(Object... params) {
        Integer courseId = (Integer) params[0];
        GetCourseContentsOptionsParameterDto queryParams = (GetCourseContentsOptionsParameterDto) params[1];

        return mapper.toRequest(courseId, queryParams);
    }


    @Override
    public ParameterizedTypeReference<List<GetContentsResponse>> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Maps Moodle response to client DTO.
     *
     * @param response List of content sections and modules
     * @param params Original parameters
     * @return Course contents DTO
     */
    @Override
    public CourseContentsResponseDto mapResponse(List<GetContentsResponse> response, Object... params) {
        return mapper.toCourseContentsResponseDto(response, params);
    }
}
