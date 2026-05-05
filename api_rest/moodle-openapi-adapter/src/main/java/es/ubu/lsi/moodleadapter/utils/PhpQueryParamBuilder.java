package es.ubu.lsi.moodleadapter.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.MultiValueMap;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Utility class to convert Java objects to PHP-style query parameters.
 * <p>
 * This builder transforms Java objects into multipart form data that Moodle's
 * PHP-based web services expect. For example:
 * <p>
 * Java object:
 * {@code
 * CourseRequest {
 * courseid: 123,
 * options: {
 * names: ["activity1", "activity2"]
 * }
 * }
 * }
 * <p>
 * Gets converted to PHP-style parameters:
 * {@code
 * courseid=123
 * options[names][0]=activity1
 * options[names][1]=activity2
 * }
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Slf4j
public class PhpQueryParamBuilder {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Convert a Java object to PHP-style query parameters.
     *
     * @param object   The object to convert (required, cannot be null)
     * @param formData The MultiValueMap to populate with parameters
     * @throws IllegalArgumentException if object or formData is null
     */
    public static void toPhpQuery(Object object, MultiValueMap<String, String> formData) {
        Objects.requireNonNull(object, "Object cannot be null");
        Objects.requireNonNull(formData, "FormData MultiValueMap cannot be null");

        try {
            Map<String, Object> map = mapper.convertValue(object, new TypeReference<>() {
            });

            log.debug("Converting object to PHP query parameters: {}", object.getClass().getSimpleName());
            buildQuery(null, map, formData);
            log.debug("Successfully converted {} parameters", formData.size());
        } catch (IllegalArgumentException e) {
            log.error("Failed to convert object to map: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Failed to convert object to PHP query parameters", e);
        }
    }

    /**
     * Recursively build query parameters from nested maps and lists.
     *
     * @param prefix   The current parameter prefix (null for root level)
     * @param value    The value to process (can be map, list, or scalar)
     * @param formData The MultiValueMap to populate
     */
    private static void buildQuery(String prefix, Object value, MultiValueMap<String, String> formData) {
        switch (value) {
            case null -> log.trace("Skipping null value at prefix: {}", prefix);
            case Map<?, ?> map -> {
                log.trace("Processing map with {} entries", map.size());
                map.forEach((k, v) -> {
                    String key = (prefix == null) ? k.toString() : prefix + "[" + k + "]";
                    buildQuery(key, v, formData);
                });
            }
            case List<?> list -> {
                log.trace("Processing list with {} items", list.size());
                for (int i = 0; i < list.size(); i++) {
                    buildQuery(prefix + "[" + i + "]", list.get(i), formData);
                }
            }
            default -> {
                String strValue = String.valueOf(value);
                formData.add(prefix, strValue);
                log.trace("Added parameter: {} = {}", prefix, strValue);
            }
        }
    }
}
