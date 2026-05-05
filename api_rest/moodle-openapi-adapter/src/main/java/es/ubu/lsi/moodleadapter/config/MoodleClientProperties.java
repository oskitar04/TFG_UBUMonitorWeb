package es.ubu.lsi.moodleadapter.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Moodle client communication.
 * Properties are mapped from moodle.client section in application.yml
 */
@Data
@Component
@ConfigurationProperties(prefix = "moodle.client")
public class MoodleClientProperties {

    /**
     * Connection timeout in milliseconds (default: 5000ms = 5 seconds)
     */
    private Integer connectionTimeoutMs = 5000;

    /**
     * Read timeout in milliseconds (default: 30000ms = 30 seconds)
     */
    private Integer readTimeoutMs = 30000;

    /**
     * Write timeout in milliseconds (default: 30000ms = 30 seconds)
     */
    private Integer writeTimeoutMs = 30000;

    /**
     * Maximum number of connections in the pool (default: 100)
     */
    private Integer maxConnections = 100;

    /**
     * Maximum idle time for connections in seconds (default: 30)
     */
    private Integer maxIdleTimeSeconds = 30;

    /**
     * Pending acquire timeout in seconds (default: 60)
     */
    private Integer pendingAcquireTimeoutSeconds = 60;

    /**
     * Maximum pending acquire count (default: 1000)
     */
    private Integer pendingAcquireMaxCount = 1000;

    /**
     * Number of retry attempts for transient failures (default: 1)
     */
    private Integer retryAttempts = 1;

    /**
     * Initial delay for retry in milliseconds (default: 100)
     */
    private Integer retryInitialDelayMs = 100;

    /**
     * Maximum delay for retry in seconds (default: 5)
     */
    private Integer retryMaxDelaySeconds = 5;
}
