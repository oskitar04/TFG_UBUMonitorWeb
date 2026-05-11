package es.ubu.lsi.moodleadapter.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.ubu.lsi.moodleadapter.config.MoodleContext;
import es.ubu.lsi.moodleadapter.exception.MoodleApiException;
import es.ubu.lsi.moodleadapter.exception.UnauthorizedException;
import es.ubu.lsi.moodleadapter.moodle.model.login.token.request.LoginTokenRequest;
import es.ubu.lsi.moodleadapter.moodle.model.login.token.response.LoginTokenResponse;
import es.ubu.lsi.moodleadapter.utils.PhpQueryParamBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.net.URI;

@Component
@RequiredArgsConstructor
@Slf4j
public class MoodleClient {

    private static final String ERROR = "error";
    private static final String ERRORCODE = "errorcode";
    public static final String UNKNOWN_ERROR = "unknown_error";

    private final WebClient moodleWebClient;
    private final ObjectMapper objectMapper;
    private static final ParameterizedTypeReference<LoginTokenResponse> LOGIN_TOKEN_RESPONSE_PARAMETERIZED_TYPE_REFERENCE = new ParameterizedTypeReference<>() {
    };

    /**
     * Authenticate user with Moodle using username and password.
     *
     * @param loginTokenRequest The login request containing username, password, and host
     * @return Mono containing the authentication token response
     */
    public Mono<LoginTokenResponse> login(LoginTokenRequest loginTokenRequest) {
        log.debug("Attempting login for user: {} at host: {}",
            loginTokenRequest.getUsername(), loginTokenRequest.getHost());

        URI uri = buildUri(loginTokenRequest.getHost(), "/login/token.php");

        return moodleWebClient.post()
            .uri(uri)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(BodyInserters
                .fromFormData("username", loginTokenRequest.getUsername())
                .with("password", loginTokenRequest.getPassword())
                .with("service", "moodle_mobile_app")
            )
            .exchangeToMono(response ->
                decodeResponse(response, LOGIN_TOKEN_RESPONSE_PARAMETERIZED_TYPE_REFERENCE)
            )
            .retry(2)  // Retry up to 2 times on transient failures
            .doOnSuccess(response -> log.debug("Login successful for user: {}",
                loginTokenRequest.getUsername()))
            .doOnError(error -> log.error("Login failed for user: {} - {}",
                loginTokenRequest.getUsername(), error.getMessage()));
    }

    /**
     * Generic call to any Moodle web service endpoint.
     *
     * Includes automatic retry with exponential backoff for transient failures.
     *
     * Retry strategy:
     * - Max retries: 3
     * - Initial delay: 100ms
     * - Backoff multiplier: 2
     * - Max delay: 5 seconds
     *
     * @param request The request object with parameters
     * @param typeRef The type reference for the response
     * @param <T> The response type
     * @return Mono with the result
     */
    public <T> Mono<T> callEndpoint(Object request, ParameterizedTypeReference<T> typeRef) {
        return Mono.deferContextual(ctx -> {
            MoodleContext moodleContext = ctx.get(MoodleContext.class);

            log.debug("Calling Moodle endpoint at host: {}", moodleContext.getHost());

            URI uri = buildUri(moodleContext.getHost(), "/webservice/rest/server.php");

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("wstoken", moodleContext.getToken());
            formData.add("moodlewsrestformat", "json");

            PhpQueryParamBuilder.toPhpQuery(request, formData);

            return moodleWebClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .exchangeToMono(response ->
                    decodeResponse(response, typeRef)
                )
                .retryWhen(Retry.backoff(3, java.time.Duration.ofMillis(100))
                    .maxBackoff(java.time.Duration.ofSeconds(5))
                    .doBeforeRetry(signal ->
                        log.warn("Retrying Moodle endpoint call (attempt {})", signal.totalRetries() + 1)
                    )
                    .filter(this::isRetryable)
                )
                .doOnError(error -> log.error("Moodle endpoint call failed after retries", error));
        });
    }

    /**
     * Determine if an exception is retryable (transient failure).
     *
     * Retryable errors (transient):
     * - Timeout exceptions
     * - Connection reset
     * - Temporary service unavailability
     *
     * Non-retryable errors (permanent):
     * - Authentication failures
     * - Not found errors
     * - Invalid requests
     *
     * @param throwable Exception to check
     * @return true if the error is retryable
     */
    private boolean isRetryable(Throwable throwable) {
        // Don't retry on authorization failures
        if (throwable instanceof UnauthorizedException) {
            return false;
        }

        // Don't retry on Moodle API errors (they're not transient)
        if (throwable instanceof MoodleApiException moodleEx) {
            // Only retry on server errors (5xx), not client errors (4xx)
            return moodleEx.getCode().startsWith("5");
        }

        // Retry on timeout and connection errors
        String message = throwable.getMessage();
        if (message != null) {
            return message.contains("timeout") ||
                message.contains("connection") ||
                message.contains("reset");
        }

        // Default: retry on unknown errors (could be transient)
        return true;
    }

    /**
     * Build URI from host and path.
     *
     * @param host The base URL of the Moodle instance
     * @param path The API endpoint path
     * @return The complete URI
     */
    private URI buildUri(URI host, String path) {
        return UriComponentsBuilder
            .fromUri(host)
            .path(path)
            .build()
            .toUri();
    }

    /**
     * Decode response from Moodle, handling errors and mapping to target type.
     * Single-pass parsing: JSON to JsonNode to DTO with error detection.
     */
    private <T> Mono<T> decodeResponse(ClientResponse response, ParameterizedTypeReference<T> typeRef) {
        return response.bodyToMono(byte[].class)
            .flatMap(bytes -> {
                try {
                    JsonNode node = objectMapper.readTree(bytes);

                    if (node.has(ERROR) || node.has(ERRORCODE)) {
                        return Mono.error(mapToException(node));
                    }

                    T result = objectMapper.convertValue(node,
                        objectMapper.getTypeFactory().constructType(typeRef.getType()));

                    return Mono.just(result);

                } catch (JsonProcessingException e) {
                    log.error("Failed to parse JSON response from Moodle", e);
                    return Mono.error(new MoodleApiException(
                        "parse_error",
                        "JsonProcessingException",
                        "Failed to parse Moodle API response: " + e.getMessage()
                    ));
                } catch (Exception e) {
                    log.error("Unknown error processing Moodle response", e);
                    return Mono.error(new MoodleApiException(
                        UNKNOWN_ERROR,
                        e.getClass().getSimpleName(),
                        "Unknown error while processing Moodle API response: " + e.getMessage()
                    ));
                }
            });
    }

    /**
     * Convert a Moodle error JSON node to a specific exception.
     */
    private RuntimeException mapToException(JsonNode node) {
        if (node.has(ERROR)) {
            String errorMsg = node.path(ERROR).asText("Unauthorized");
            log.warn("Moodle returned error: {}", errorMsg);
            return new UnauthorizedException(errorMsg);
        }

        String code = node.has(ERRORCODE) ? node.path(ERRORCODE).asText(UNKNOWN_ERROR) : UNKNOWN_ERROR;

        if ("invalidtoken".equals(code)) {
            log.warn("Invalid token error from Moodle");
            return new UnauthorizedException(node.path("message").asText("Unauthorized"));
        }

        log.warn("Moodle API error - code: {}, exception: {}", code, node.path("exception").asText("UnknownException"));
        return new MoodleApiException(
            code,
            node.path("exception").asText("UnknownException"),
            node.path("message").asText("No message provided")
        );
    }
}
