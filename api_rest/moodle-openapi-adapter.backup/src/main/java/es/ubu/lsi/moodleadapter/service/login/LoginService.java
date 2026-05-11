package es.ubu.lsi.moodleadapter.service.login;

import es.ubu.lsi.moodleadapter.client.MoodleClient;
import es.ubu.lsi.moodleadapter.controller.LoginApiDelegate;
import es.ubu.lsi.moodleadapter.dto.LoginTokenRequestDto;
import es.ubu.lsi.moodleadapter.dto.LoginTokenResponseDto;
import es.ubu.lsi.moodleadapter.mapper.LoginMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Service for user authentication with Moodle.
 *
 * Exchanges login credentials for Moodle authentication tokens.
 * Uses reactive streams (Project Reactor) for non-blocking I/O.
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see MoodleClient
 * @see LoginMapper
 */
@Service
@RequiredArgsConstructor
public class LoginService implements LoginApiDelegate {

    private final LoginMapper moodleMapper;
    private final MoodleClient moodleClient;

    /**
     * Authenticate user and return Moodle authentication token.
     *
     * Process: DTO → Moodle request → Login call → Response DTO
     *
     * @param loginTokenRequestDto Login credentials (username, password, host)
     * @param exchange HTTP exchange (not used, required by interface)
     * @return Mono with authentication token response
     */
    @Override
    public Mono<ResponseEntity<LoginTokenResponseDto>> loginToken(
        Mono<LoginTokenRequestDto> loginTokenRequestDto,
        ServerWebExchange exchange) {

        return loginTokenRequestDto
            .map(moodleMapper::toLoginTokenRequest)
            .flatMap(moodleClient::login)
            .map(moodleMapper::toLoginResponse)
            .map(ResponseEntity::ok);
    }
}
