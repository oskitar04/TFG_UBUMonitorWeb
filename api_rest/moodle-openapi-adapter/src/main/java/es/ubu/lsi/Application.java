package es.ubu.lsi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Moodle OpenAPI Adapter application.
 * <p>
 * This Spring Boot application serves as a REST adapter that exposes Moodle Learning Management System
 * (LMS) web services through a standardized OpenAPI 3.0 specification. It acts as a middleware layer
 * between external clients and Moodle's native web service API.
 * <p>
 * Key responsibilities:
 * - Provides RESTful endpoints that wrap Moodle web service functions
 * - Handles token-based authentication with context propagation
 * - Converts between standard REST JSON and Moodle's PHP-based API
 * - Generates OpenAPI 3.0 documentation for automated SDK generation
 * <p>
 * Configuration:
 * - The application loads configuration from {@code application.yml} or {@code application.properties}
 * - Different profiles can be used for development, testing, and production (dev, test, prod)
 * - Properties can be overridden via environment variables or command-line arguments
 * <p>
 * Technologies:
 * - Spring Boot 3.5.12
 * - Spring WebFlux (reactive framework)
 * - Project Reactor for async operations
 * - MapStruct for DTO mapping
 * - Logbook for HTTP logging
 *
 * @author Yi Peng Ji
 * @version 0.0.1
 * @see <a href="https://docs.moodle.org/latest/en/Web_services">Moodle Web Services Documentation</a>
 * @see <a href="https://spring.io/projects/spring-boot">Spring Boot</a>
 * @see <a href="https://spec.openapis.org/oas/v3.0.3">OpenAPI 3.0 Specification</a>
 * @since 1.0
 */
@SpringBootApplication
public class Application {

    /**
     * Application entry point.
     *
     * This method is automatically called by the JVM when the application starts.
     * It initializes the Spring Boot application context and starts the embedded Tomcat server.
     *
     * Usage example:
     * {@code
     * java -jar target/moodle-openapi-adapter-0.0.1-SNAPSHOT.jar
     * }
     *
     * @param args Command-line arguments that can override configuration properties.
     *             Examples:
     *             - {@code --spring.profiles.active=dev} to activate development profile
     *             - {@code --server.port=9090} to change server port
     *             - {@code --logging.level.root=DEBUG} to enable debug logging
     */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

