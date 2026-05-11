package es.ubu.lsi.moodleadapter.mapper;


import es.ubu.lsi.moodleadapter.dto.LoginTokenRequestDto;
import es.ubu.lsi.moodleadapter.dto.LoginTokenResponseDto;
import es.ubu.lsi.moodleadapter.moodle.model.login.token.request.LoginTokenRequest;
import es.ubu.lsi.moodleadapter.moodle.model.login.token.response.LoginTokenResponse;
import org.mapstruct.Mapper;

/**
 * MapStruct mapper for authentication-related transformations.
 * <p>
 * This mapper handles the conversion between:
 * - REST API DTOs (client-facing data models)
 * - Moodle API models (internal representations of Moodle responses)
 * <p>
 * The mapper is automatically implemented by MapStruct at compile-time,
 * providing efficient, type-safe transformations without reflection.
 * <p>
 * Mappings:
 * - LoginTokenRequestDto → LoginTokenRequest: REST login request → Moodle request format
 * - LoginTokenResponse → LoginTokenResponseDto: Moodle response → Clean REST response
 * <p>
 * Example:
 * {@code
 * // Client sends
 * POST /api/login
 * {
 * "username": "student1",
 * "password": "secret",
 * "host": "https://moodle.example.com"
 * }
 * <p>
 * // Mapper converts to Moodle request format
 * // Moodle responds with token and user info
 * // Mapper converts response to clean DTO for client
 * }
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Mapper(componentModel = "spring")
public interface LoginMapper {

    /**
     * Converts a REST API login request to Moodle request format.
     *
     * @param loginTokenRequest The login request from the REST client
     * @return The formatted request for Moodle's login endpoint
     */
    LoginTokenRequest toLoginTokenRequest(LoginTokenRequestDto loginTokenRequest);

    /**
     * Converts a Moodle login response to REST API response format.
     *
     * @param moodleLoginTokenResponse The response from Moodle's login endpoint
     * @return The login response for the REST client
     */
    LoginTokenResponseDto toLoginResponse(LoginTokenResponse moodleLoginTokenResponse);
}
