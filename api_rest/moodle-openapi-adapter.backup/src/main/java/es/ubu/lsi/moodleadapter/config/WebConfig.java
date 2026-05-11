package es.ubu.lsi.moodleadapter.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.ubu.lsi.moodleadapter.exception.GlobalExceptionHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;


@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebFluxConfigurer {

    private final Jackson2JsonDecoder jackson2JsonDecoder;
    private final Jackson2JsonEncoder jackson2JsonEncoder;
    private final ObjectMapper objectMapper;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**", "/webjars/**", "/swagger-ui/**", "/swagger-ui.html")
            .addResourceLocations("classpath:/static/", "classpath:/META-INF/resources/webjars/",
                "classpath:/META-INF/resources/swagger-ui/");
    }

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().jackson2JsonDecoder(jackson2JsonDecoder);
        configurer.defaultCodecs().jackson2JsonEncoder(jackson2JsonEncoder);
        configurer.defaultCodecs().maxInMemorySize(-1);
    }

    /**
     * Register the GlobalExceptionHandler as an ErrorWebExceptionHandler bean.
     * <p>
     * This ensures the handler is properly invoked for all exceptions in the WebFlux chain.
     * The order is set to -2 to ensure it has higher precedence than default error handlers.
     *
     * @return The configured GlobalExceptionHandler
     */
    @Bean
    @Order(-2)
    public ErrorWebExceptionHandler errorWebExceptionHandler() {
        return new GlobalExceptionHandler(objectMapper);
    }

}
