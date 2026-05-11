package es.ubu.lsi.moodleadapter.service.moodle.endpoint.course;

import es.ubu.lsi.moodleadapter.dto.CourseUsersResponseDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseUsersOptionsParameterDto;
import es.ubu.lsi.moodleadapter.mapper.course.CourseUsersMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.request.GetEnrolledUsersRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.response.GetEnrolledUsersResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Endpoint implementation for retrieving enrolled users in a course.
 * <p>
 * This is a concrete implementation of the MoodleEndpoint strategy for the
 * Moodle web service function: {@code core_enrol_get_enrolled_users}
 * <p>
 * This endpoint retrieves all users enrolled in a specific course, with optional
 * filtering based on role, status, and other parameters.
 * <p>
 * Moodle Web Service Details:
 * - Function: {@code core_enrol_get_enrolled_users}
 * - Documentation: https://docs.moodle.org/latest/en/core_enrol_get_enrolled_users
 * - Parameters: courseid (required), options (optional)
 * - Returns: List of user objects with enrollment details
 * <p>
 * Type Parameters (from MoodleEndpoint<R, S, T>):
 * - R = GetEnrolledUsersRequest (request built from parameters)
 * - S = List<GetEnrolledUsersResponse> (raw response from Moodle)
 * - T = CourseUsersResponseDto (what is returned to the client)
 * <p>
 * Usage Example:
 * {@code
 * // When CourseService.getCourseUsers() is called:
 * moodleService.callEndpoint(getCourseUsersEndpoint, courseId, options)
 * <p>
 * // This endpoint implementation:
 * // 1. buildRequest(courseId, options)
 * //    → Creates GetEnrolledUsersRequest with courseid and options
 * // 2. getResponseType()
 * //    → Returns List<GetEnrolledUsersResponse> type info
 * // 3. Moodle API is called with the request
 * // 4. mapResponse(response, courseId, options)
 * //    → Transforms list to CourseUsersResponseDto for client
 * }
 * <p>
 * Responsibilities:
 * 1. Build the correct request format for Moodle
 * 2. Specify response type for deserialization
 * 3. Map Moodle response to client-friendly DTO
 * <p>
 * This implementation demonstrates the recommended pattern for adding new endpoints.
 * Follow this pattern when adding new Moodle web service integrations.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see MoodleEndpoint The strategy interface this implements
 * @see CourseUsersMapper Mapper for transforming responses
 * @see GetEnrolledUsersRequest Moodle API request model
 * @see GetEnrolledUsersResponse Moodle API response model
 * @see CourseUsersResponseDto Client response DTO
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetCourseUsersEndpoint implements MoodleEndpoint<GetEnrolledUsersRequest, List<GetEnrolledUsersResponse>, CourseUsersResponseDto> {

    /**
     * Static final ParameterizedTypeReference for the response type.
     *
     * Why static final?
     * - Static: Shared across all instances (memory efficient)
     * - Final: Cannot be reassigned (prevents mistakes)
     * - Single instance: Avoids creating new objects on each call
     *
     * Why ParameterizedTypeReference?
     * Java's type system erases generic type information at runtime. To preserve
     * the generic information (List<GetEnrolledUsersResponse>), we must capture it
     * as an anonymous inner class that extends ParameterizedTypeReference.
     *
     * This type information is used by Jackson/Spring to properly deserialize
     * JSON responses into a List of GetEnrolledUsersResponse objects.
     *
     * Without this, Spring would not know to deserialize the list items.
     */
    private static final ParameterizedTypeReference<List<GetEnrolledUsersResponse>> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /**
     * The mapper that transforms Moodle responses to DTOs.
     * Injected via constructor, implemented by MapStruct at compile-time.
     */
    private final CourseUsersMapper mapper;

    /**
     * Builds the request for the Moodle web service call.
     *
     * Input parameters:
     * - params[0]: Integer courseId
     * - params[1]: GetCourseUsersOptionsParameterDto options
     *
     * This method extracts the parameters and delegates to the mapper to build
     * the request in the exact format Moodle expects:
     * {@code
     * GetEnrolledUsersRequest {
     *     wsfunction: "core_enrol_get_enrolled_users",
     *     courseid: 5,
     *     options: [
     *         { name: "onlyactive", value: 1 },
     *         { name: "limitfrom", value: 0 },
     *         ...
     *     ]
     * }
     * }
     *
     * @param params Array containing:
     *               - [0]: courseId (Integer)
     *               - [1]: options (GetCourseUsersOptionsParameterDto)
     * @return A GetEnrolledUsersRequest ready to send to Moodle API
     */
    @Override
    public GetEnrolledUsersRequest buildRequest(Object... params) {
        Integer courseId = (Integer) params[0];
        GetCourseUsersOptionsParameterDto courseUsersOptionsParameterDto = (GetCourseUsersOptionsParameterDto) params[1];
        return mapper.toMoodleRequest(courseId, courseUsersOptionsParameterDto);
    }


    /**
     * Returns the type information for the Moodle API response.
     *
     * This method provides the generic type that Spring WebClient will use to
     * deserialize the JSON response from Moodle into Java objects.
     *
     * @return ParameterizedTypeReference representing List<GetEnrolledUsersResponse>
     */
    @Override
    public ParameterizedTypeReference<List<GetEnrolledUsersResponse>> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Maps the Moodle response to the client response DTO.
     *
     * This method transforms the raw response from Moodle (List of GetEnrolledUsersResponse)
     * into a client-friendly format (CourseUsersResponseDto).
     *
     * The mapper handles:
     * - Field mapping and renaming
     * - Type conversions if needed
     * - Data enrichment or filtering
     * - Null handling
     *
     * Input:
     * {@code
     * List<GetEnrolledUsersResponse> [
     *     { id: 123, username: "student1", email: "student1@example.com", ... },
     *     { id: 124, username: "student2", email: "student2@example.com", ... }
     * ]
     * }
     *
     * Output:
     * {@code
     * CourseUsersResponseDto {
     *     courseId: 5,
     *     users: [
     *         { id: 123, username: "student1", email: "student1@example.com" },
     *         { id: 124, username: "student2", email: "student2@example.com" }
     *     ],
     *     totalCount: 2
     * }
     * }
     *
     * @param response The list of users returned by Moodle
     * @param params The original parameters (params[0] = courseId, params[1] = options)
     *               Can be used for context or enrichment
     * @return A CourseUsersResponseDto formatted for the REST client
     *
     * @see CourseUsersMapper
     */
    @Override
    public CourseUsersResponseDto mapResponse(List<GetEnrolledUsersResponse> response, Object... params) {
        return mapper.toCourseUsersResponse(response, params);
    }
}
