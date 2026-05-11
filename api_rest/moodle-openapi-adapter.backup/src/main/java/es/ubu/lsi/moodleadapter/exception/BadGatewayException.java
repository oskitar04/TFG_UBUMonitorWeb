package es.ubu.lsi.moodleadapter.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when the Moodle API or upstream service is unavailable or returns an error.
 * <p>
 * This exception represents HTTP 502 Bad Gateway and is thrown when:
 * - The Moodle API is unreachable or times out
 * - The Moodle API returns an unexpected error response
 * - An upstream service returns an error status
 * - Network communication with Moodle fails
 * <p>
 * HTTP Status: 502 Bad Gateway
 * <p>
 * This indicates a problem communicating with the upstream Moodle service,
 * not an issue with the adapter itself.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
public class BadGatewayException extends ResponseStatusException {

    /** HTTP status code for this exception. */
    private static final HttpStatus STATUS = HttpStatus.BAD_GATEWAY;

    /**
     * Creates a BadGatewayException with the default reason phrase.
     */
    public BadGatewayException() {
        super(STATUS, STATUS.getReasonPhrase());
    }

    /**
     * Creates a BadGatewayException with a custom reason message.
     *
     * @param reason Detailed error message describing the gateway error
     */
    public BadGatewayException(String reason) {
        super(STATUS, reason);
    }

    /**
     * Creates a BadGatewayException with a custom reason and root cause.
     *
     * @param reason Detailed error message describing the gateway error
     * @param cause The underlying exception that caused this gateway error
     */
    public BadGatewayException(String reason, Throwable cause) {
        super(STATUS, reason, cause);
    }
}
