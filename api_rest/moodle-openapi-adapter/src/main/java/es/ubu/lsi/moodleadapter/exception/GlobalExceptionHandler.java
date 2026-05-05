package es.ubu.lsi.moodleadapter.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.ubu.lsi.moodleadapter.config.HeaderWebFilter;
import es.ubu.lsi.moodleadapter.dto.ErrorDetailDto;
import es.ubu.lsi.moodleadapter.dto.ErrorResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Objects;

/**
 * Global exception handler for WebFlux REST API.
 * <p>
 * Implements ErrorWebExceptionHandler for proper WebFlux error handling.
 * <p>
 * Centralized error handling that:
 * - Converts all exceptions to consistent HTTP responses
 * - Provides meaningful error messages to clients
 * - Logs errors appropriately based on severity
 * - Works correctly with reactive streams (WebFlux)
 * <p>
 * This handler catches exceptions from:
 * - Controller methods
 * - Filters
 * - Reactive chain operators (flatMap, map, etc.)
 * <p>
 * Note: This class is registered as a bean in WebConfig with appropriate order
 * to ensure it takes precedence over default error handlers.
 */
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    /**
     * Handle all exceptions in the reactive chain.
     * <p>
     * This method intercepts all exceptions and converts them to
     * proper HTTP error responses with consistent JSON format
     * following the OpenAPI contract.
     */
    @Override
    public @NonNull Mono<Void> handle(@NonNull ServerWebExchange exchange, @NonNull Throwable ex) {
        log.error("Exception occurred", ex);

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String errorCode = "INTERNAL_SERVER_ERROR";
        String message = "An unexpected error occurred. Please try again later.";

        // Determine status and message based on exception type
        switch (ex) {
            case MoodleApiException moodleEx -> {
                status = HttpStatus.BAD_REQUEST;
                errorCode = moodleEx.getCode();
                message = moodleEx.getExceptionType() + ": " + moodleEx.getMessage();
                log.warn("Moodle API error - {}", message);
            }
            case WebExchangeBindException webExchangeBindException -> {
                status = HttpStatus.BAD_REQUEST;
                errorCode = "VALIDATION_ERROR";
                message = webExchangeBindException.getMessage();
                log.warn("Validation error - {}", message);
            }
            case ResponseStatusException responseStatusEx -> {
                HttpStatusCode statusCode = responseStatusEx.getStatusCode();
                status = HttpStatus.resolve(statusCode.value());
                if (status == null) {
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                }
                errorCode = status.name();
                message = responseStatusEx.getReason() != null ? responseStatusEx.getReason() : responseStatusEx.getMessage();
                log.warn("ResponseStatusException - {}: {}", status, message);
            }
            default -> log.error("Unexpected error occurred", ex);
        }

        return writeErrorResponse(exchange, status, errorCode, message, ex);
    }

    /**
     * Write error response to the client.
     * <p>
     * Builds an ErrorResponseDto with the OpenAPI contract format and writes it
     * to the response body with proper HTTP status and content type.
     */
    private Mono<Void> writeErrorResponse(
        ServerWebExchange exchange,
        HttpStatus status,
        String errorCode,
        String message,
        Throwable ex) {

        // Set HTTP status
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // Build error response body following OpenAPI contract
        ErrorResponseDto errorResponse = buildErrorResponse(
            errorCode,
            message,
            exchange,
            ex
        );

        try {
            // Serialize to JSON
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);

            // Write to response body
            DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();
            return exchange.getResponse()
                .writeWith(Mono.fromCallable(() -> bufferFactory.wrap(bytes)));

        } catch (Exception serializationEx) {
            log.error("Failed to serialize error response", serializationEx);
            return exchange.getResponse().setComplete();
        }
    }

    /**
     * Build error response following the OpenAPI contract.
     * <p>
     * Fields according to OpenAPI schemas:
     * - code: Error code/type (e.g., "Unauthorized", "VALIDATION_ERROR")
     * - message: Human-readable error message
     * - timestamp: When the error occurred
     * - traceId: Unique trace ID for request tracking
     * - errors: Optional list of validation errors
     *
     * @param errorCode Error code matching OpenAPI contract
     * @param message   Error message
     * @param exchange  HTTP exchange for extracting traceId
     * @param ex        The thrown exception (for additional error handling)
     * @return ErrorResponseDto matching OpenAPI contract
     */
    private ErrorResponseDto buildErrorResponse(
        String errorCode,
        String message,
        ServerWebExchange exchange,
        Throwable ex) {

        ErrorResponseDto response = new ErrorResponseDto()
            .code(errorCode)
            .message(message)
            .timestamp(OffsetDateTime.now())
            .traceId(getTraceId(exchange));

        // Agregar errores de la cadena de excepciones
        Throwable current = ex;
        while (current != null) {
            String currentMessage = current.getMessage();
            if (currentMessage != null && !currentMessage.isEmpty()) {
                response.addErrorsItem(
                    new ErrorDetailDto()
                        .field("exception")
                        .message(currentMessage)
                );
            }
            current = current.getCause();
        }

        // Agregar errores de validación si es WebExchangeBindException
        if (ex instanceof WebExchangeBindException webEx) {
            webEx.getFieldErrors().forEach(fe ->
                response.addErrorsItem(
                    new ErrorDetailDto()
                        .field(fe.getField())
                        .message(Objects.requireNonNullElse(fe.getDefaultMessage(), "Invalid value"))
                )
            );
        }

        return response;
    }
    /**
     * Extract or generate trace ID from the HTTP exchange.
     * <p>
     * The trace ID is either:
     * 1. Extracted from the response header (set by HeaderWebFilter)
     * 2. Generated as a new UUID if not present
     *
     * @param exchange The HTTP server exchange
     * @return The trace ID string
     */
    private String getTraceId(ServerWebExchange exchange) {
        return Objects.requireNonNullElse(
            exchange.getResponse().getHeaders().getFirst(HeaderWebFilter.HEADER_TRACE),
            "N/A"
        );
    }
}


