package es.ubu.lsi.moodleadapter.service.user;

import es.ubu.lsi.moodleadapter.controller.UsersApiDelegate;
import es.ubu.lsi.moodleadapter.dto.UserCoursesResponseDto;
import es.ubu.lsi.moodleadapter.dto.UserResponseDto;
import es.ubu.lsi.moodleadapter.dto.UserSearchFieldDto;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleService;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.user.GetUserCoursesEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.user.GetUsersByFieldEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Service that handles user-related operations.
 * <p>
 * This service provides methods for retrieving user information from Moodle:
 * - User profile information
 * - Courses the user is enrolled in
 * <p>
 * All operations are non-blocking and reactive, using Project Reactor's Mono
 * for composable asynchronous operations.
 * <p>
 * Endpoints:
 * - GetUserCoursesEndpoint: Retrieves courses for a specific user
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see GetUserCoursesEndpoint
 * @see MoodleService
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
public class UsersService implements UsersApiDelegate {

    /**
     * Service for orchestrating Moodle endpoint calls.
     */
    private final MoodleService moodleService;

    /**
     * Endpoint for getting user's courses.
     */
    private final GetUserCoursesEndpoint getUserCoursesEndpoint;

    private final GetUsersByFieldEndpoint getUsersByFieldEndpoint;

    /**
     * Gets user information by user ID.
     *
     * @param exchange The HTTP exchange for context
     * @return Response containing user information
     */
    @Override
    public Mono<ResponseEntity<UserResponseDto>> getUser(UserSearchFieldDto field, List<String> values, ServerWebExchange exchange) {
        return moodleService.callEndpoint(getUsersByFieldEndpoint, field, values)
            .map(ResponseEntity::ok);
    }


    /**
     * Gets all courses a user is enrolled in.
     *
     * @param userid          The Moodle user ID
     * @param returnusercount Whether to return user count information
     * @param exchange        The HTTP exchange for context
     * @return Response containing list of courses
     */
    @Override
    public Mono<ResponseEntity<UserCoursesResponseDto>> getUserCourses(Integer userid, Boolean returnusercount, ServerWebExchange exchange) {
        return moodleService.callEndpoint(getUserCoursesEndpoint, userid, returnusercount)
            .map(ResponseEntity::ok);
    }
}
