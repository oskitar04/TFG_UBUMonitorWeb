package es.ubu.lsi.moodleadapter.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when a request lacks valid authentication credentials.
 * <p>
 * This exception represents HTTP 401 Unauthorized errors and is thrown when:
 * - No authentication token is provided
 * - The provided token is invalid or expired
 * - The user lacks permissions for the requested resource
 * <p>
 * HTTP Status: 401 Unauthorized
 * <p>
 * Example Usage:
 * {@code
 * if (token == null || token.isEmpty()) {
 * throw new UnauthorizedException("Missing authentication token");
 * }
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see org.springframework.web.server.ResponseStatusException
 * @since 1.0
 */
public class UnauthorizedException extends ResponseStatusException {

    /** HTTP status code for this exception. */
    private static final HttpStatus STATUS = HttpStatus.UNAUTHORIZED;

    /**
     * Creates an UnauthorizedException with the default reason phrase.
     */
    public UnauthorizedException() {
        super(STATUS, STATUS.getReasonPhrase());
    }

    /**
     * Creates an UnauthorizedException with a custom reason message.
     *
     * @param reason Detailed error message describing why authorization failed
     */
    public UnauthorizedException(String reason) {
        super(STATUS, reason);
    }

    /**
     * Creates an UnauthorizedException with a custom reason and root cause.
     *
     * @param reason Detailed error message describing why authorization failed
     * @param cause The underlying exception that caused this authorization failure
     */
    public UnauthorizedException(String reason, Throwable cause) {
        super(STATUS, reason, cause);
    }
}
