package es.ubu.lsi.moodleadapter.service.course;


import es.ubu.lsi.moodleadapter.controller.CoursesApiDelegate;
import es.ubu.lsi.moodleadapter.dto.CourseActivitiesCompletionResponseDto;
import es.ubu.lsi.moodleadapter.dto.CourseContentsResponseDto;
import es.ubu.lsi.moodleadapter.dto.CourseGradesResponseDto;
import es.ubu.lsi.moodleadapter.dto.CourseUsersResponseDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseContentsOptionsParameterDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseUsersOptionsParameterDto;
import es.ubu.lsi.moodleadapter.mapper.course.CourseGradesMapper;
import es.ubu.lsi.moodleadapter.model.UserGradeResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleService;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.course.GetActivitiesCompletionStatusEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.course.GetCourseContentsEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.course.GetCourseUsersEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.course.GetGradeItemEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.course.GetGradeTableEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Service that handles course-related operations and data retrieval.
 * <p>
 * This service provides methods for retrieving course information from Moodle:
 * - Course users/participants
 * - Course contents/structure (modules, sections)
 * - Course grades for students
 * <p>
 * Architecture:
 * This service follows the service layer pattern and delegates to:
 * 1. MoodleService: For orchestrating endpoint calls
 * 2. Specific endpoint implementations: For Moodle API integration
 * 3. Mappers: For transforming responses to DTOs
 * <p>
 * Dependency Injection:
 * All endpoints and mappers are injected via constructor (Lombok @RequiredArgsConstructor).
 * This makes dependencies explicit and testable via constructor injection.
 * <p>
 * Usage Pattern:
 * {@code
 * // Service delegates to MoodleService which uses endpoints
 * moodleService.callEndpoint(getCourseUsersEndpoint, courseId, options)
 * .map(ResponseEntity::ok)
 * <p>
 * // Flow:
 * // 1. MoodleService calls endpoint.buildRequest(courseId, options)
 * // 2. getCourseUsersEndpoint converts to Moodle API request
 * // 3. MoodleClient sends to Moodle
 * // 4. endpoint.mapResponse() converts to DTO
 * // 5. ResponseEntity wraps for HTTP response
 * }
 * <p>
 * Reactive Operations:
 * All methods return Mono for non-blocking, asynchronous operations.
 * Multiple course queries can be executed in parallel without blocking threads.
 * <p>
 * Example Usage:
 * {@code
 * // Get all users in a course
 * courseService.getCourseUsers(courseId, options, exchange)
 * .subscribe(
 * response -> logger.info("Users: {}", response.getBody().getUsers()),
 * error -> logger.error("Failed: {}", error)
 * );
 * }
 * <p>
 * Endpoints Used:
 * - GetCourseUsersEndpoint: Retrieves enrolled users in a course
 * - GetCourseContentsEndpoint: Retrieves course structure (sections, modules)
 * - GetGradeItemEndpoint: Retrieves individual grade items/assessments
 * - GetGradeTableEndpoint: Retrieves grade results for users
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see GetCourseUsersEndpoint
 * @see GetCourseContentsEndpoint
 * @see GetGradeTableEndpoint
 * @see GetGradeItemEndpoint
 * @see MoodleService
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class CourseService implements CoursesApiDelegate {

    /**
     * The main service that orchestrates Moodle endpoint calls.
     * This service handles the generic pattern of building requests,
     * calling the API, and mapping responses.
     */
    private final MoodleService moodleService;

    /**
     * Mapper for converting grade responses to DTOs.
     * Handles transformation of grade data from Moodle format to client format.
     */
    private final CourseGradesMapper courseGradesMapper;

    /**
     * Endpoint for getting course contents/structure.
     * Implements the strategy for calling core_course_get_contents in Moodle.
     */
    private final GetCourseContentsEndpoint getCourseContentsEndpoint;

    /**
     * Endpoint for getting enrolled users in a course.
     * Implements the strategy for calling core_enrol_get_enrolled_users in Moodle.
     */
    private final GetCourseUsersEndpoint getCourseUsersEndpoint;

    /**
     * Endpoint for getting grade table data.
     * Implements the strategy for calling gradereport_user_get_grade_table in Moodle.
     */
    private final GetGradeTableEndpoint getGradeTableEndpoint;

    /**
     * Endpoint for getting grade item data.
     * Implements the strategy for calling gradereport_user_get_grade_items in Moodle.
     */
    private final GetGradeItemEndpoint getGradeItemEndpoint;

    private final GetActivitiesCompletionStatusEndpoint getActivitiesCompletionStatusEndpoint;


    /**
     * Retrieves all enrolled users in a course.
     * This method fetches the list of users (students, teachers, etc.) who are enrolled
     * in the specified course. It uses the Moodle web service function:
     * {@code core_enrol_get_enrolled_users}
     *
     * Options:
     * The options parameter can control what data is returned:
     * - Active enrollment status
     * - Group filtering
     * - Role filtering
     * - Pagination (limit and offset)
     * Example:
     * {@code
     * // Get all active students in course 5
     * GetCourseUsersOptionsParameterDto options = new GetCourseUsersOptionsParameterDto();
     * options.setOnlyActive(true);
     * courseService.getCourseUsers(5, options, exchange)
     *     .subscribe(response -> {
     *         List<UserDto> users = response.getBody().getUsers();
     *         logger.info("Found {} users", users.size());
     *     });
     * }
     *
     * Response:
     * {@code
     * CourseUsersResponseDto {
     *   users: [
     *     { id: 123, username: "student1", ... },
     *     { id: 124, username: "student2", ... }
     *   ]
     * }
     * }
     *
     * @param courseid The Moodle course ID
     * @param options Options for filtering and controlling the response
     *                (can be null for default options)
     * @param exchange The HTTP ServerWebExchange for context
     *
     * @return A Mono that emits a ResponseEntity containing CourseUsersResponseDto
     *         The response includes a list of enrolled users with their details
     *
     * @see GetCourseUsersEndpoint
     */
    @Override
    public Mono<ResponseEntity<CourseUsersResponseDto>> getCourseUsers(
        Integer courseid,
        GetCourseUsersOptionsParameterDto options,
        ServerWebExchange exchange) {
        return moodleService.callEndpoint(getCourseUsersEndpoint, courseid, options)
            .map(ResponseEntity::ok);
    }

    /**
     * Retrieves the contents/structure of a course.
     * This method fetches the course structure including:
     * - Sections (topics or weeks)
     * - Modules/Activities within sections (lessons, assignments, quizzes, etc.)
     * - Resource details (files, URLs, etc.)
     * Uses Moodle web service function: {@code core_course_get_contents}
     *
     * Structure Example:
     * {@code
     * Course
     * ├── Section 1 (Introduction)
     * │   ├── Lesson: Welcome
     * │   └── Forum: Class Discussion
     * ├── Section 2 (Chapter 1)
     * │   ├── Page: Reading Material
     * │   ├── Quiz: Self-Check
     * │   └── Assignment: Essay
     * └── Section 3 (Chapter 2)
     *     └── ...
     * }
     *
     * Options:
     * Can filter by:
     * - Specific section IDs
     * - Module types
     * - Include/exclude fields
     * Example Usage:
     * {@code
     * courseService.getCourseContents(5, options, exchange)
     *     .subscribe(response -> {
     *         CourseContentsResponseDto dto = response.getBody();
     *         dto.getSections().forEach(section ->
     *             logger.info("Section: {}, Modules: {}",
     *                 section.getName(),
     *                 section.getModules().size())
     *         );
     *     });
     * }
     *
     * @param courseid The Moodle course ID
     * @param options Options for filtering content
     * @param exchange The HTTP ServerWebExchange for context
     *
     * @return A Mono that emits a ResponseEntity containing CourseContentsResponseDto
     *         The response includes course structure with sections and modules
     *
     * @see GetCourseContentsEndpoint
     */
    @Override
    public Mono<ResponseEntity<CourseContentsResponseDto>> getCourseContents(
        Integer courseid,
        GetCourseContentsOptionsParameterDto options,
        ServerWebExchange exchange) {
        return moodleService.callEndpoint(getCourseContentsEndpoint, courseid, options)
            .map(ResponseEntity::ok);
    }

    /**
     * Retrieves course grades for a specific user or group.
     * This method provides comprehensive grade information including:
     * - Grade items (assessments, assignments, tests)
     * - Individual grade results
     * - Grade aggregation and totals
     * - Grade scales and category information
     * Implementation Detail:
     * This method combines data from two separate Moodle calls for a complete picture:
     * 1. getGradeTableEndpoint: Returns grade results (what students got)
     * 2. getGradeItemEndpoint: Returns grade items (what can be graded)
     * These are combined using Mono.zip to make parallel calls and combine results.
     * Example:
     * {@code
     * // Get all grades for user 123 in course 5
     * courseService.getCourseGrades(5, 123, null, exchange)
     *     .subscribe(response -> {
     *         CourseGradesResponseDto grades = response.getBody();
     *         grades.getItems().forEach(item ->
     *             logger.info("Assessment: {}, Grade: {}",
     *                 item.getName(),
     *                 item.getGrade())
     *         );
     *     });
     * // Get grades for a group
     * courseService.getCourseGrades(5, null, groupId, exchange)
     *     .subscribe(response -> { ... });
     * }
     *
     * Performance:
     * Uses Mono.zip to make both API calls in parallel, improving response time.
     * Results are combined using UserGradeResponse constructor before mapping.
     * Workflow:
     * {@code
     * Mono.zip(
     *     moodleService.callEndpoint(getGradeItemEndpoint, ...),
     *     moodleService.callEndpoint(getGradeTableEndpoint, ...),
     *     UserGradeResponse::new  // Combine results
     * ).map(courseGradesMapper::toResponse)  // Transform to DTO
     * }
     *
     * @param courseid The Moodle course ID
     * @param userid The specific user ID for grades (can be null)
     * @param groupid The group ID for group grades (can be null)
     * @param exchange The HTTP ServerWebExchange for context
     *
     * @return A Mono that emits a ResponseEntity containing CourseGradesResponseDto
     *         The response includes:
     *         - Grade items (assessments)
     *         - Grade results
     *         - Aggregated grades
     *         - Grade scales
     *
     * @see GetGradeTableEndpoint
     * @see GetGradeItemEndpoint
     * @see reactor.core.publisher.Mono#zip
     */
    @Override
    public Mono<ResponseEntity<CourseGradesResponseDto>> getCourseGrades(
        Integer courseid,
        Integer userid,
        Integer groupid,
        ServerWebExchange exchange) {

        // Make both API calls in parallel and combine results
        return Mono.zip(
                moodleService.callEndpoint(getGradeItemEndpoint, courseid, userid, groupid),
                moodleService.callEndpoint(getGradeTableEndpoint, courseid, userid, groupid),
                UserGradeResponse::new)  // Combine into a single object
            .map(courseGradesMapper::toResponse)  // Transform to response DTO
            .map(ResponseEntity::ok);
    }

    @Override
    public Mono<ResponseEntity<CourseActivitiesCompletionResponseDto>> getCourseActivitiesCompletion(
        Integer courseid,
        List<Integer> userids,
        ServerWebExchange exchange) {

        return Flux.fromIterable(userids)
            .flatMapSequential(userid -> moodleService.callEndpoint(
                getActivitiesCompletionStatusEndpoint, courseid, userid))
            .collectList()
            .map(list -> new CourseActivitiesCompletionResponseDto()
                .activitiescompletion(list))
            .map(ResponseEntity::ok);
    }
}
