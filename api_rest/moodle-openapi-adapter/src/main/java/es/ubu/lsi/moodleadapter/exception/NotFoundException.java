package es.ubu.lsi.moodleadapter.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when a requested resource cannot be found.
 * <p>
 * This exception represents HTTP 404 Not Found errors and is thrown when:
 * - A course with the specified ID does not exist
 * - A user with the specified ID does not exist
 * - An enrollment record cannot be found
 * - Any other requested resource is missing
 * <p>
 * HTTP Status: 404 Not Found
 * <p>
 * Example Usage:
 * {@code
 * if (course == null) {
 * throw new NotFoundException("Course with ID " + courseId + " not found");
 * }
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
public class NotFoundException extends ResponseStatusException {

    /** HTTP status code for this exception. */
    private static final HttpStatus STATUS = HttpStatus.NOT_FOUND;

    /**
     * Creates a NotFoundException with the default reason phrase.
     */
    public NotFoundException() {
        super(STATUS, STATUS.getReasonPhrase());
    }

    /**
     * Creates a NotFoundException with a custom reason message.
     *
     * @param reason Detailed error message describing what resource was not found
     */
    public NotFoundException(String reason) {
        super(STATUS, reason);
    }

    /**
     * Creates a NotFoundException with a custom reason and root cause.
     *
     * @param reason Detailed error message describing what resource was not found
     * @param cause The underlying exception that caused this not found error
     */
    public NotFoundException(String reason, Throwable cause) {
        super(STATUS, reason, cause);
    }
}
