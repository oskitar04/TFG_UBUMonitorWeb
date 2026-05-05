package es.ubu.lsi.moodleadapter.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when an unexpected error occurs in the adapter server.
 * <p>
 * This exception represents HTTP 500 Internal Server Error and is thrown when:
 * - An unexpected exception occurs during request processing
 * - A configuration error is detected
 * - An unexpected null reference is encountered
 * - Any other unrecoverable error occurs
 * <p>
 * HTTP Status: 500 Internal Server Error
 * <p>
 * This is a generic error that indicates something went wrong on the server side,
 * not due to client input. The root cause should be logged for debugging.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
public class InternalServerErrorException extends ResponseStatusException {

    /** HTTP status code for this exception. */
    private static final HttpStatus STATUS = HttpStatus.INTERNAL_SERVER_ERROR;

    /**
     * Creates an InternalServerErrorException with the default reason phrase.
     */
    public InternalServerErrorException() {
        super(STATUS, STATUS.getReasonPhrase());
    }

    /**
     * Creates an InternalServerErrorException with a custom reason message.
     *
     * @param reason Detailed error message describing the internal error
     */
    public InternalServerErrorException(String reason) {
        super(STATUS, reason);
    }

    /**
     * Creates an InternalServerErrorException with a custom reason and root cause.
     *
     * @param reason Detailed error message describing the internal error
     * @param cause The underlying exception that caused this server error
     */
    public InternalServerErrorException(String reason, Throwable cause) {
        super(STATUS, reason, cause);
    }
}
