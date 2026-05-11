package es.ubu.lsi.moodleadapter.config;

import es.ubu.lsi.moodleadapter.exception.BadRequestException;
import es.ubu.lsi.moodleadapter.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NullMarked;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.UUID;

/**
 * Web filter that extracts Moodle authentication headers and propagates them through the request context.
 * <p>
 * This filter runs at the highest precedence in the request chain and is responsible for:
 * 1. Extracting authentication headers (token and host) from incoming requests
 * 2. Validating that required headers are present
 * 3. Creating a MoodleContext with the authentication information
 * 4. Propagating the context through Project Reactor's context mechanism
 * 5. Generating and tracking trace IDs for logging and debugging
 * <p>
 * Execution Order:
 * This filter is marked with @Order(HIGHEST_PRECEDENCE), meaning it runs before all other filters.
 * This ensures authentication context is available to downstream components.
 * <p>
 * Header Requirements:
 * For API endpoints (paths starting with /api):
 * - X-Moodle-Token: The authentication token from Moodle (REQUIRED)
 * - X-Moodle-Host: The base URL of the Moodle instance (REQUIRED)
 * - X-Trace-Id: Unique identifier for request tracking (OPTIONAL - generated if missing)
 * <p>
 * Skipped Paths:
 * The filter skips processing for:
 * - Non-API paths (paths not starting with /api)
 * - Public API paths (paths starting with /api/public)
 * <p>
 * Context Propagation:
 * After validation, the filter uses Project Reactor's contextWrite to attach the MoodleContext
 * to the reactive chain. This makes it available to all downstream services via:
 * {@code
 * Mono.deferContextual(ctx -> {
 * MoodleContext context = ctx.get(MoodleContext.class);
 * // Use context
 * })
 * }
 * <p>
 * Error Handling:
 * - Missing X-Moodle-Token: UnauthorizedException (401)
 * - Missing X-Moodle-Host: BadRequestException (400)
 * - Invalid host URL format: BadRequestException (400)
 * <p>
 * Example Request:
 * {@code
 * GET /api/courses/5/users
 * Headers:
 * X-Moodle-Token: abc123def456xyz789...
 * X-Moodle-Host: https://moodle.example.com
 * X-Trace-Id: 550e8400-e29b-41d4-a716-446655440000
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see MoodleContext
 * @see org.springframework.web.server.WebFilter
 * @see reactor.core.publisher.Mono#deferContextual
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class HeaderWebFilter implements WebFilter {

    /** HTTP header for Moodle authentication token. */
    private static final String HEADER_TOKEN = "x-Moodle-Token";

    /** HTTP header for Moodle host URL. */
    private static final String HEADER_HOST = "X-Moodle-Host";

    /** HTTP header for request tracing. */
    public static final String HEADER_TRACE = "X-Trace-Id";

    /**
     * Filters incoming requests to extract and propagate authentication context.
     *
     * Process:
     * 1. Check if request is for an API endpoint
     * 2. Extract or generate trace ID
     * 3. Extract authentication headers (token and host)
     * 4. Validate headers
     * 5. Create MoodleContext with authentication info
     * 6. Propagate context through reactive chain
     * 7. Continue filter chain
     *
     * @param exchange The HTTP server exchange (request/response)
     * @param chain The remaining filter chain
     * @return A Mono that completes when request is processed
     *
     * @throws UnauthorizedException if X-Moodle-Token header is missing
     * @throws BadRequestException if X-Moodle-Host header is missing or invalid
     */
    @Override
    @NullMarked
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip processing for non-API and public endpoints
        if (!path.startsWith("/api") || path.startsWith("/api/public")) {
            return chain.filter(exchange);
        }

        // Extract or generate trace ID
        String traceId = exchange.getRequest().getHeaders().getFirst(HEADER_TRACE);
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
        }
        exchange.getResponse().getHeaders().add(HEADER_TRACE, traceId);

        // Create context object
        MoodleContext moodleContext = new MoodleContext();

        // Extract and validate token
        String token = getRequiredHeader(exchange, HEADER_TOKEN, true);
        moodleContext.setToken(token);

        // Extract, validate, and parse host
        String host = getRequiredHeader(exchange, HEADER_HOST, false);
        try {
            moodleContext.setHost(URI.create(host).toURL().toURI());
        } catch (Exception e) {
            return Mono.error(new BadRequestException("Invalid host URL : " + host + " " + e.getMessage()));
        }

        // Propagate context through reactive chain
        return chain.filter(exchange)
            .contextWrite(ctx -> ctx.put(MoodleContext.class, moodleContext));
    }

    /**
     * Extracts a required header from the HTTP request.
     *
     * @param exchange The HTTP server exchange
     * @param headerName The name of the header to extract
     * @param isAuthHeader Whether this is an authentication header
     *                     (affects error type: 401 for auth, 400 for others)
     * @return The header value
     *
     * @throws UnauthorizedException if header is missing and isAuthHeader is true
     * @throws BadRequestException if header is missing and isAuthHeader is false
     */
    private String getRequiredHeader(ServerWebExchange exchange, String headerName, boolean isAuthHeader) {
        String value = exchange.getRequest().getHeaders().getFirst(headerName);
        if (StringUtils.isBlank(value)) {
            if (isAuthHeader) {
                throw new UnauthorizedException("Missing required header: " + headerName);
            } else {
                throw new BadRequestException("Missing required header: " + headerName);
            }
        }
        return value;
    }
}
