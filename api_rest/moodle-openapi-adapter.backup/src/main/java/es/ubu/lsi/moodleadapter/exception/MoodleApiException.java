package es.ubu.lsi.moodleadapter.exception;

import lombok.Getter;

/**
 * Exception thrown when the Moodle API returns an error response.
 * <p>
 * This exception wraps error responses from Moodle's web services and provides
 * structured access to the error information. It extends BadGatewayException
 * to indicate that the error originated from the upstream Moodle service.
 * <p>
 * The exception captures:
 * - code: Moodle error code (e.g., "moodle_api_error")
 * - exceptionType: Moodle exception type for categorizing the error
 * - message: Human-readable error description
 * <p>
 * Example:
 * {@code
 * Moodle returns:
 * {
 * "exception": "invalid_parameter_exception",
 * "errorcode": "invalidparameter",
 * "message": "Invalid course ID"
 * }
 * <p>
 * Throws:
 * throw new MoodleApiException("invalidparameter", "invalid_parameter_exception",
 * "Invalid course ID");
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see BadGatewayException
 * @since 1.0
 */
@Getter
public class MoodleApiException extends BadGatewayException {

    /** The Moodle error code identifying the specific error type. */
    private final String code;

    /** The Moodle exception type for categorizing the error. */
    private final String exceptionType;

    /**
     * Creates a MoodleApiException with error information from Moodle.
     *
     * @param code The Moodle error code
     * @param exceptionType The Moodle exception type
     * @param message Human-readable error message
     */
    public MoodleApiException(String code, String exceptionType, String message) {
        super(message);
        this.code = code;
        this.exceptionType = exceptionType;
    }
}
