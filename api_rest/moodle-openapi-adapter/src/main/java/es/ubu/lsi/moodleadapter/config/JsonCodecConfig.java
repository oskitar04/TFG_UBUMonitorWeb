package es.ubu.lsi.moodleadapter.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;

/**
 * Centralized configuration for JSON encoding/decoding beans across the application.
 * <p>
 * This configuration creates and configures Jackson2JsonDecoder and Jackson2JsonEncoder beans
 * with unlimited in-memory buffer size (-1) to handle large Moodle API responses.
 * <p>
 * The beans created here are used by WebConfig to configure the WebFlux message codecs
 * via the WebFluxConfigurer interface.
 * <p>
 * Benefits:
 * - Single source of truth for JSON codec bean creation
 * - Easier to adjust ObjectMapper configuration
 * - Improved maintainability and separation of concerns
 * - Consistent behavior for handling large Moodle API responses
 * <p>
 * Note: The actual application of these codecs to the WebFlux framework happens
 * in WebConfig.configureHttpMessageCodecs()
 */
@Configuration
@RequiredArgsConstructor
public class JsonCodecConfig {

    private final ObjectMapper objectMapper;

    /**
     * Configures Jackson2 JSON decoder with unlimited in-memory buffer.
     *
     * @return Jackson2JsonDecoder configured for large payloads
     */
    @Bean
    public Jackson2JsonDecoder jackson2JsonDecoder() {
        Jackson2JsonDecoder decoder = new Jackson2JsonDecoder(objectMapper);
        decoder.setMaxInMemorySize(-1);
        return decoder;
    }

    /**
     * Configures Jackson2 JSON encoder with unlimited in-memory buffer.
     *
     * @return Jackson2JsonEncoder configured for large payloads
     */
    @Bean
    public Jackson2JsonEncoder jackson2JsonEncoder() {
        return new Jackson2JsonEncoder(objectMapper);
    }


}

