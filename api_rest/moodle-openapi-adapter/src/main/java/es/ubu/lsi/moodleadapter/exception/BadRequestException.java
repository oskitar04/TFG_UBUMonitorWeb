package es.ubu.lsi.moodleadapter.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when the client request contains invalid or malformed data.
 * <p>
 * This exception represents HTTP 400 Bad Request errors and is thrown when:
 * - Required parameters are missing
 * - Parameter values are in an invalid format
 * - HTTP headers are malformed or invalid
 * - Request body cannot be parsed or validated
 * <p>
 * HTTP Status: 400 Bad Request
 * <p>
 * Example Usage:
 * {@code
 * if (!isValidEmail(email)) {
 * throw new BadRequestException("Invalid email format: " + email);
 * }
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
public class BadRequestException extends ResponseStatusException {

    /** HTTP status code for this exception. */
    private static final HttpStatus STATUS = HttpStatus.BAD_REQUEST;

    /**
     * Creates a BadRequestException with the default reason phrase.
     */
    public BadRequestException() {
        super(STATUS, STATUS.getReasonPhrase());
    }

    /**
     * Creates a BadRequestException with a custom reason message.
     *
     * @param reason Detailed error message describing what was wrong with the request
     */
    public BadRequestException(String reason) {
        super(STATUS, reason);
    }

    /**
     * Creates a BadRequestException with a custom reason and root cause.
     *
     * @param reason Detailed error message describing what was wrong with the request
     * @param cause The underlying exception that caused this bad request error
     */
    public BadRequestException(String reason, Throwable cause) {
        super(STATUS, reason, cause);
    }
}
