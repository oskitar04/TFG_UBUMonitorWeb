package es.ubu.lsi.moodleadapter.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.zalando.logbook.Logbook;
import org.zalando.logbook.spring.webflux.LogbookExchangeFilterFunction;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.concurrent.TimeUnit;


/**
 * Configuration for WebClient used to communicate with Moodle.
 * <p>
 * Configures:
 * - Connection pooling for efficient resource usage
 * - Read/write timeouts to prevent hanging requests
 * - Request/response size limits
 * - Logging via Logbook
 * <p>
 * These settings ensure resilience and prevent resource exhaustion
 * when communicating with Moodle servers.
 */
@Configuration
@Slf4j
@RequiredArgsConstructor
public class WebClientConfig {

    private final Jackson2JsonDecoder jackson2JsonDecoder;
    private final Jackson2JsonEncoder jackson2JsonEncoder;
    private final MoodleClientProperties moodleClientProperties;

    /**
     * Connection provider with pooling configuration.
     */
    @Bean
    public ConnectionProvider moodleConnectionProvider() {
        log.debug("Configuring connection provider with maxConnections={}", moodleClientProperties.getMaxConnections());
        return ConnectionProvider.builder("moodle-pool")
            .maxConnections(moodleClientProperties.getMaxConnections())
            .pendingAcquireTimeout(Duration.ofSeconds(moodleClientProperties.getPendingAcquireTimeoutSeconds()))
            .pendingAcquireMaxCount(moodleClientProperties.getPendingAcquireMaxCount())
            .maxIdleTime(Duration.ofSeconds(moodleClientProperties.getMaxIdleTimeSeconds()))
            .build();
    }

    /**
     * HttpClient with timeout and connection configuration.
     */
    @Bean
    public HttpClient moodleHttpClient(ConnectionProvider connectionProvider) {
        log.debug("Configuring HttpClient with timeouts - connection={}ms, read={}ms, write={}ms",
            moodleClientProperties.getConnectionTimeoutMs(), moodleClientProperties.getReadTimeoutMs(), moodleClientProperties.getWriteTimeoutMs());

        return HttpClient.create(connectionProvider)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, moodleClientProperties.getConnectionTimeoutMs())
            .option(ChannelOption.SO_KEEPALIVE, true)
            .responseTimeout(Duration.ofMillis(moodleClientProperties.getReadTimeoutMs()))
            .doOnConnected(conn ->
                conn.addHandlerLast(new ReadTimeoutHandler(moodleClientProperties.getReadTimeoutMs(), TimeUnit.MILLISECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(moodleClientProperties.getWriteTimeoutMs(), TimeUnit.MILLISECONDS))
            );
    }

    /**
     * WebClient bean configured for Moodle communication.
     */
    @Bean
    public WebClient moodleWebClient(Logbook logbook, HttpClient httpClient) {
        log.debug("Creating WebClient for Moodle with pooling and timeouts");

        ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
            .codecs(configurer -> {
                configurer.defaultCodecs().jackson2JsonDecoder(jackson2JsonDecoder);
                configurer.defaultCodecs().jackson2JsonEncoder(jackson2JsonEncoder);
                configurer.defaultCodecs().maxInMemorySize(-1);
            })
            .build();

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .exchangeStrategies(exchangeStrategies)
            .filter(new LogbookExchangeFilterFunction(logbook))
            .build();
    }
}
