package es.ubu.lsi.moodleadapter;

import es.ubu.lsi.moodleadapter.config.FullLogbookConfig;
import es.ubu.lsi.moodleadapter.model.Cases;
import es.ubu.lsi.moodleadapter.util.TestUtils;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static es.ubu.lsi.moodleadapter.util.TestUtils.extractFolderName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
@Import(FullLogbookConfig.class)
class AdapterIntegrationTest {

    public static final String TOKEN = "8138957179ff8771ec6fdceb7eee89d5";

    @LocalServerPort
    private int port;

    @Autowired
    private WebTestClient webTestClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
    private final Map<String, String> variables = new HashMap<>();

    private WireMockManager wireMockManager;
    private RequestExecutor requestExecutor;
    private ResponseAsserter responseAsserter;

    @BeforeAll
    void setUp() {
        wireMockManager = new WireMockManager(TOKEN);
        wireMockManager.start();

        variables.put("HOST", wireMockManager.getBaseUrl());
        variables.put("TOKEN", TOKEN);

        requestExecutor = new RequestExecutor(webTestClient, resolver, port);
        responseAsserter = new ResponseAsserter(resolver);
    }

    @AfterAll
    void tearDown() {
        wireMockManager.stop();
    }

    @TestFactory
    Stream<DynamicTest> runFileDrivenTests() throws IOException {
        return Arrays.stream(resolver.getResources("classpath:/adapter/**/test-case.json"))
            .map(resource -> DynamicTest.dynamicTest(
                extractFolderName(resource),
                () -> runTest(resource)
            ));
    }

    private void runTest(Resource resource) throws Exception {
        Cases testCase = loadTestCase(resource);

        wireMockManager.resetAndConfigure(testCase);

        var response = requestExecutor.sendRequest(testCase.getRequest());

        responseAsserter.assertResponse(response, testCase);
    }

    private Cases loadTestCase(Resource resource) throws IOException {
        String replaced = TestUtils.loadAndReplace(resource, variables);
        return objectMapper.readValue(replaced, Cases.class);
    }
}
