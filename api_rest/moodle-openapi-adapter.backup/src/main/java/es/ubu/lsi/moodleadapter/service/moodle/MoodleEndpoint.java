package es.ubu.lsi.moodleadapter.service.moodle;

import org.springframework.core.ParameterizedTypeReference;

/**
 * Strategy interface for implementing Moodle web service endpoints.
 * <p>
 * This interface defines a generic strategy pattern for wrapping Moodle web service function calls.
 * Each implementation handles the specific details of one Moodle web service function, including:
 * - Building the correct request for the Moodle API
 * - Specifying the expected response type
 * - Mapping the Moodle response to a standardized DTO
 * <p>
 * Type Parameters:
 * - {@code R}: The request type sent to the Moodle API (e.g., GetEnrolledUsersRequest)
 * - {@code S}: The source response type returned by Moodle API (e.g., List<GetEnrolledUsersResponse>)
 * - {@code T}: The target type returned to the client (e.g., CourseUsersResponseDto)
 * <p>
 * Architecture Pattern:
 * The flow is: Client Parameters → buildRequest() → Moodle API → mapResponse() → Client DTO
 * <p>
 * Example Implementation:
 * {@code
 *
 * @param <R> The request type for the Moodle API
 * @param <S> The response source type from Moodle API (what Moodle returns)
 * @param <T> The response target type for the client (what we return)
 * @author Yi Peng Ji
 * @version 1.0
 * @Component public class GetEnrolledUsersEndpoint
 * implements MoodleEndpoint<GetEnrolledUsersRequest, List<EnrolledUser>, CourseUsersResponseDto> {
 * <p>
 * private static final ParameterizedTypeReference<List<EnrolledUser>> RESPONSE_TYPE =
 * new ParameterizedTypeReference<>() {};
 * <p>
 * private final CourseUsersMapper mapper;
 * @Override public GetEnrolledUsersRequest buildRequest(Object... params) {
 * // params[0] = courseId, params[1] = options
 * return mapper.toMoodleRequest((Integer) params[0], (Options) params[1]);
 * }
 * @Override public ParameterizedTypeReference<List<EnrolledUser>> getResponseType() {
 * return RESPONSE_TYPE;
 * }
 * @Override public CourseUsersResponseDto mapResponse(List<EnrolledUser> response, Object... params) {
 * return mapper.toCourseUsersResponse(response);
 * }
 * }
 * }
 * <p>
 * How It Works:
 * 1. Service calls {@code MoodleService.callEndpoint(endpoint, params...)}
 * 2. MoodleService calls {@code endpoint.buildRequest(params)} to create the request
 * 3. Request is sent to Moodle API via {@code MoodleClient}
 * 4. Moodle returns a response of type {@code S}
 * 5. {@code endpoint.mapResponse(response, params)} transforms it to type {@code T}
 * 6. Transformed response is returned to the client
 * <p>
 * Benefits:
 * - Separation of concerns: Each endpoint is isolated
 * - Type safety: Compile-time checking with generics
 * - Reusability: Easy to add new endpoints following this pattern
 * - Testability: Each endpoint can be tested independently
 * @see es.ubu.lsi.moodleadapter.service.moodle.MoodleService
 * @see org.springframework.core.ParameterizedTypeReference
 * @since 1.0
 */
public interface MoodleEndpoint<R, S, T> {

    /**
     * Constructs the request object that will be sent to the Moodle API.
     *
     * This method transforms the input parameters (which come from the REST API client)
     * into the specific format required by the Moodle web service function.
     *
     * The parameters are passed as varargs and their types/order depend on the specific
     * endpoint implementation. It's the responsibility of the implementing class to
     * document what parameters it expects and their order.
     *
     * Example:
     * {@code
     * // For GetCourseUsersEndpoint, expects: courseId (Integer), options (Options)
     * @Override
     * public GetEnrolledUsersRequest buildRequest(Object... params) {
     *     Integer courseId = (Integer) params[0];
     *     Options options = (Options) params[1];
     *
     *     GetEnrolledUsersRequest request = new GetEnrolledUsersRequest();
     *     request.setWsFunction("core_enrol_get_enrolled_users");
     *     request.setCourseid(courseId);
     *     request.setOptions(options);
     *     return request;
     * }
     * }
     *
     * @param params Variable number of parameters needed to build the request.
     *               The implementation should clearly document what parameters it expects.
     * @return A request object formatted for the Moodle API
     *
     * @throws ClassCastException if a parameter cannot be cast to the expected type
     * @throws ArrayIndexOutOfBoundsException if required parameters are missing
     */
    R buildRequest(Object... params);

    /**
     * Returns the expected response type from the Moodle API.
     *
     * This method provides type information for Jackson during deserialization.
     * Spring WebClient uses this to properly deserialize the JSON response from Moodle
     * into the correct Java type.
     *
     * Why use ParameterizedTypeReference?
     * Java's generic type information is erased at runtime (type erasure). To preserve
     * generic information, we use ParameterizedTypeReference which captures the full type,
     * including generics, as an anonymous inner class.
     *
     * Examples:
     * {@code
     * // For a single object response
     * private static final ParameterizedTypeReference<GetUserResponse> RESPONSE_TYPE =
     *     new ParameterizedTypeReference<>() {};
     *
     * // For a list response
     * private static final ParameterizedTypeReference<List<GetUserResponse>> RESPONSE_TYPE =
     *     new ParameterizedTypeReference<>() {};
     *
     * // For a nested generic type
     * private static final ParameterizedTypeReference<Map<String, List<User>>> RESPONSE_TYPE =
     *     new ParameterizedTypeReference<>() {};
     * }
     *
     * This should typically be a static final constant defined in the implementation class
     * to avoid creating new instances on each call.
     *
     * @return A ParameterizedTypeReference representing the response type that Moodle will return
     */
    ParameterizedTypeReference<S> getResponseType();

    /**
     * Maps the Moodle API response to the Data Transfer Object (DTO) returned to the client.
     *
     * This method is responsible for transforming the raw response from Moodle into a
     * standardized, client-friendly DTO. This transformation might involve:
     * - Filtering or selecting specific fields
     * - Renaming fields for clarity
     * - Converting data types
     * - Combining multiple response objects
     * - Applying business logic transformations
     *
     * The original parameters are also passed so you can access context information
     * if needed for the mapping (e.g., courseId for filtering or enrichment).
     *
     * Example:
     * {@code
     * @Override
     * public CourseUsersResponseDto mapResponse(List<EnrolledUser> response, Object... params) {
     *     // response is what Moodle returned
     *     // params[0] is the courseId that was used in the request
     *
     *     CourseUsersResponseDto dto = new CourseUsersResponseDto();
     *     dto.setCourseId((Integer) params[0]);
     *     dto.setUsers(response.stream()
     *         .map(user -> new UserDto(user.getId(), user.getUsername()))
     *         .collect(Collectors.toList()));
     *     dto.setTotalCount(response.size());
     *     return dto;
     * }
     * }
     *
     * Note on Using MapStruct:
     * Usually, this method delegates to a MapStruct mapper:
     * {@code
     * @Override
     * public CourseUsersResponseDto mapResponse(List<EnrolledUser> response, Object... params) {
     *     return mapper.toCourseUsersResponse(response);
     * }
     * }
     *
     * MapStruct generates efficient mapping code at compile-time, avoiding reflection.
     *
     * @param response The response object returned by the Moodle API (of type S)
     * @param params The original parameters passed to buildRequest(), useful for context
     * @return The transformed response in the format expected by the client (of type T)
     *
     * @see org.mapstruct.Mapper
     */
    T mapResponse(S response, Object... params);
}
