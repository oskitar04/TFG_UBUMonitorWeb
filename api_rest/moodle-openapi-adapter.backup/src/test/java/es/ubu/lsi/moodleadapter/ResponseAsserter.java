package es.ubu.lsi.moodleadapter;

import es.ubu.lsi.moodleadapter.model.Cases;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.jsonunit.core.Option;
import org.junit.jupiter.api.Assertions;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

import static net.javacrumbs.jsonunit.assertj.JsonAssertions.assertThatJson;

@Slf4j
public class ResponseAsserter {

    private final ResourcePatternResolver resolver;

    public ResponseAsserter(ResourcePatternResolver resolver) {
        this.resolver = resolver;
    }

    public void assertResponse(EntityExchangeResult<byte[]> response, Cases testCase) throws IOException {
        String body = extractBody(response);

        assertStatus(response, testCase, body);

        JsonNode expectedBody = testCase.getExpectedResponse().getBody();
        if (expectedBody == null) {
            return;
        }

        if (isCsvResponse(response)) {
            assertCsv(body, expectedBody);
            return;
        }

        assertJson(body, expectedBody);
    }

    private String extractBody(EntityExchangeResult<byte[]> response) {
        return new String(
            Objects.requireNonNull(response.getResponseBodyContent()),
            StandardCharsets.UTF_8
        );
    }

    private void assertStatus(EntityExchangeResult<byte[]> response, Cases testCase, String body) {
        Assertions.assertEquals(
            testCase.getExpectedResponse().getStatus(),
            response.getStatus().value(),
            "HTTP Status mismatch. Response body: " + body
        );
    }

    private boolean isCsvResponse(EntityExchangeResult<byte[]> response) {
        String contentType = response.getResponseHeaders()
            .getFirst(org.springframework.http.HttpHeaders.CONTENT_TYPE);

        return contentType != null &&
            (contentType.contains("text/csv") || contentType.contains("application/csv"));
    }

    private void assertCsv(String body, JsonNode expectedBody) throws IOException {
        String expectedCsv = normalize(loadExpectedContent(expectedBody));
        String actualCsv = normalize(body);

        Assertions.assertEquals(expectedCsv, actualCsv, "CSV content mismatch");
    }

    private String normalize(String csv) {
        return Arrays.stream(csv.trim().split("\\R")) // separa líneas
            .map(String::trim)                   // quita espacios
            .sorted()                            // ordena filas
            .collect(Collectors.joining("\n"));
    }

    private void assertJson(String body, JsonNode expectedBody) throws IOException {
        if (isFileReference(expectedBody)) {
            String expectedJson = loadExpectedContent(expectedBody);
            compareJson(body, expectedJson);
            return;
        }
        compareJson(body, expectedBody);
    }

    private boolean isFileReference(JsonNode node) {
        return node.isTextual() && node.asText().startsWith("file:");
    }

    private void compareJson(String actual, Object expected) {
        assertThatJson(actual)
                .withTolerance(0)
            .when(Option.IGNORING_ARRAY_ORDER, Option.IGNORING_EXTRA_FIELDS)
            .isEqualTo(expected);
    }

    private String loadExpectedContent(Object expectedBodyObj) throws IOException {
        String expectedText = expectedBodyObj instanceof JsonNode ?
            ((JsonNode) expectedBodyObj).asText() :
            expectedBodyObj.toString();

        if (expectedText.startsWith("file:")) {
            String path = expectedText.substring(5);
            if (!path.startsWith("/")) path = "/" + path;
            Resource fileResource = resolver.getResource("classpath:" + path);
            return new String(fileResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        }
        return expectedText;
    }
}



