package es.ubu.lsi.moodleadapter;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.common.Json;
import com.github.tomakehurst.wiremock.matching.MultiValuePattern;
import es.ubu.lsi.moodleadapter.model.Cases;
import es.ubu.lsi.moodleadapter.model.MoodleMockDefinition;
import es.ubu.lsi.moodleadapter.model.RequestDefinition;
import es.ubu.lsi.moodleadapter.model.ResponseDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@Slf4j
public class WireMockManager {

    private final WireMockServer wireMockServer;
    private final String token;

    public WireMockManager(String token) {
        this.token = token;
        this.wireMockServer = new WireMockServer(0);
        this.wireMockServer.addMockServiceRequestListener((request, response) ->
            log.info("Received request to WireMock: {} {} \nHeaders: {} \nBody: {} \nResponse: {}",
                request.getMethod(), request.getUrl(), request.getHeaders(),
                request.getBodyAsString(), response.getBodyAsString())
        );
    }

    public void start() {
        wireMockServer.start();
    }

    public void stop() {
        if (wireMockServer != null) {
            wireMockServer.stop();
        }
    }

    public String getBaseUrl() {
        return wireMockServer.baseUrl();
    }

    public void resetAndConfigure(Cases testCase) {
        wireMockServer.resetAll();
        registerMocks(testCase.getMoodleLoginMocks(), false);
        registerMocks(testCase.getMoodleApiMocks(), true);
        logRegisteredStubs();
    }

    private void registerMocks(List<MoodleMockDefinition> mocks, boolean includeAuthParams) {
        if (mocks == null) return;

        mocks.forEach(mock -> {
            RequestDefinition req = mock.getRequest();
            ResponseDefinition resp = mock.getResponse();

            String method = Objects.requireNonNullElse(req.getMethod(), "POST");
            String path = Objects.requireNonNullElse(req.getPath(), "/webservice/rest/server.php");
            int status = Objects.requireNonNullElse(resp.getStatus(), 200);

            wireMockServer.stubFor(
                request(method, urlEqualTo(path))
                    .withFormParams(buildFormData(req, includeAuthParams))
                    .willReturn(aResponse()
                        .withStatus(status)
                        .withHeader("Content-Type", "application/json")
                        .withJsonBody(Json.node(resp.getBody().toString()))
                    )
            );
        });
    }

    private Map<String, MultiValuePattern> buildFormData(RequestDefinition req, boolean includeAuthParams) {
        Map<String, MultiValuePattern> formData = new LinkedHashMap<>();

        if (includeAuthParams) {
            formData.put("wstoken", MultiValuePattern.of(equalTo(token)));
            formData.put("moodlewsrestformat", MultiValuePattern.of(equalTo("json")));
        }

        if (req.getFormData() != null) {
            req.getFormData().forEach(f ->
                formData.put(f.getName(), MultiValuePattern.of(equalTo(f.getValue())))
            );
        }

        return formData;
    }

    private void logRegisteredStubs() {
        wireMockServer.getStubMappings().forEach(stub -> {
            MultiValueMap<String, String> springParams = new LinkedMultiValueMap<>();
            stub.getRequest().getFormParameters().forEach((k, v) ->
                springParams.add(k, v.getExpected())
            );

            String formattedParams = UriComponentsBuilder.newInstance()
                .queryParams(springParams)
                .build()
                .getQuery();

            log.info("=== WireMock Stub Registered ===\nRequest Method: {}\nRequest URL: {}\nRequest form params: {}\nRequest Body Patterns: {}\nResponse Status: {}\n===============================",
                stub.getRequest().getMethod(),
                stub.getRequest().getUrl(),
                formattedParams,
                stub.getRequest().getBodyPatterns(),
                stub.getResponse().getStatus()
            );
        });
    }
}
