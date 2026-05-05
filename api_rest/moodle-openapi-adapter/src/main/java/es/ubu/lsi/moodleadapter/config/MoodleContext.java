package es.ubu.lsi.moodleadapter.config;

import lombok.Data;

import java.net.URI;

/**
 * Context holder for Moodle authentication information.
 * <p>
 * This class holds the authentication credentials (token and host URL) for the current request.
 * It is stored in the reactive context and propagated through the entire request chain,
 * ensuring that all layers have access to authentication information.
 * <p>
 * Usage:
 * The context is populated by HeaderWebFilter from incoming HTTP headers and is automatically
 * available to all services through Project Reactor's context propagation mechanism.
 * <p>
 * Example:
 * {@code
 * // In a service
 * Mono.deferContextual(ctx -> {
 * MoodleContext context = ctx.get(MoodleContext.class);
 * String token = context.getToken();
 * URI host = context.getHost();
 * // Use token and host for Moodle API calls
 * })
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see es.ubu.lsi.moodleadapter.config.HeaderWebFilter
 * @since 1.0
 */
@Data
public class MoodleContext {

    /**
     * The Moodle authentication token.
     * This token is obtained from Moodle during login and is required for all API calls.
     * Format: Usually a long alphanumeric string returned by Moodle's login endpoint.
     */
    private String token;

    /**
     * The Moodle instance base URL.
     * Example: https://moodle.example.com
     * This is used to construct API endpoints for Moodle web service calls.
     */
    private URI host;
}
