package es.ubu.lsi.moodleadapter.service.moodle;

import es.ubu.lsi.moodleadapter.client.MoodleClient;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Orchestrates calls to Moodle web service endpoints.
 *
 * Uses Strategy Pattern (MoodleEndpoint) to handle different endpoints generically.
 * Acts as bridge between high-level services (CourseService, UserService) and MoodleClient.
 *
 * Reactive Flow:
 * - Non-blocking I/O with Project Reactor Mono
 * - Automatic context propagation (token, host) via HeaderWebFilter
 * - Scalable to thousands of concurrent requests
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see MoodleEndpoint
 * @see MoodleClient
 */
@Service
@RequiredArgsConstructor
public class MoodleService {

    private final MoodleClient moodleClient;

    /**
     * Call a Moodle web service endpoint.
     *
     * Flow: endpoint.buildRequest(params) → MoodleClient.callEndpoint() → endpoint.mapResponse()
     *
     * @param <R> Request type
     * @param <S> Response type from Moodle API
     * @param <T> Response type for client (DTO)
     * @param endpoint Strategy for building requests and mapping responses
     * @param params Parameters passed to endpoint.buildRequest() and mapResponse()
     * @return Mono with mapped response
     */
    public <R, S, T> Mono<T> callEndpoint(
        MoodleEndpoint<R, S, T> endpoint,
        Object... params) {

        R request = endpoint.buildRequest(params);
        ParameterizedTypeReference<S> responseType = endpoint.getResponseType();

        return moodleClient.callEndpoint(request, responseType)
            .map(s -> endpoint.mapResponse(s, params));
    }
}
