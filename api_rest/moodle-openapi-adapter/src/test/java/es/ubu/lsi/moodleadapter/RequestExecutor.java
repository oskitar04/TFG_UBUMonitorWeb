package es.ubu.lsi.moodleadapter;

import es.ubu.lsi.moodleadapter.model.RequestDefinition;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.net.URI;
import java.util.Map;

public class RequestExecutor {

    private final WebTestClient webTestClient;
    private final ResourcePatternResolver resolver;
    private final int port;

    public RequestExecutor(WebTestClient webTestClient, ResourcePatternResolver resolver, int port) {
        this.webTestClient = webTestClient;
        this.resolver = resolver;
        this.port = port;
    }

    public EntityExchangeResult<byte[]> sendRequest(RequestDefinition request) throws IOException {
        HttpMethod method = HttpMethod.valueOf(request.getMethod().toUpperCase());
        WebTestClient.RequestBodySpec spec = webTestClient.mutate()
            .responseTimeout(java.time.Duration.ofSeconds(30))
            .build()
            .method(method)
            .uri(buildUri(request));

        boolean isMultipart = "multipart/form-data".equals(request.getContentType());

        if (request.getHeaders() != null) {
            request.getHeaders().forEach(h -> spec.header(h.getName(), h.getValue()));
        }
        spec.header("Content-Type", request.getContentType());

        if (hasBody(method) && request.getBody() != null) {
            JsonNode bodyNode = request.getBody();

            if (isMultipart && bodyNode.isObject()) {
                MultipartBodyBuilder builder = new MultipartBodyBuilder();
                for (Map.Entry<String, JsonNode> entry : bodyNode.properties()) {
                    addMultipartPart(builder, entry.getKey(), entry.getValue());
                }
                spec.bodyValue(builder.build());
            } else {
                spec.bodyValue(bodyNode.toString());
            }
        }

        return spec.exchange().expectBody().returnResult();
    }

    private URI buildUri(RequestDefinition request) {
        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString("http://localhost:" + port + "/api")
            .path(request.getPath());

        if (request.getQueryParams() != null) {
            request.getQueryParams().forEach(param ->
                builder.queryParam(param.getName(), param.getValue())
            );
        }

        return builder.build().toUri();
    }

    private void addMultipartPart(MultipartBodyBuilder builder, String key, JsonNode valueNode) throws IOException {
        if (valueNode.isTextual() && valueNode.asText().startsWith("file:")) {
            addFilePart(builder, key, valueNode.asText());
            return;
        }

        if (valueNode.isArray() || valueNode.isObject()) {
            builder.part(key, valueNode.toString())
                .header("Content-Type", "application/json");
            return;
        }

        builder.part(key, valueNode.asText());
    }

    private void addFilePart(MultipartBodyBuilder builder, String key, String valueStr) throws IOException {
        String path = valueStr.substring(5);
        if (!path.startsWith("/")) path = "/" + path;

        Resource fileResource = resolver.getResource("classpath:" + path);
        byte[] content = fileResource.getInputStream().readAllBytes();

        builder.part(key, new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return fileResource.getFilename();
            }
        }).header("Content-Type", "text/csv"); // Ojo aquí: está hardcodeado a text/csv en el original
    }

    private boolean hasBody(HttpMethod method) {
        return method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.PATCH;
    }
}
