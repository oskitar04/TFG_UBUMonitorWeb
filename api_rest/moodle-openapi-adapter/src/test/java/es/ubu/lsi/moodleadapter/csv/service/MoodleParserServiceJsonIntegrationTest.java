package es.ubu.lsi.moodleadapter.csv.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.ubu.lsi.moodleadapter.csv.config.MoodleRulesConfig;
import io.krakens.grok.api.Grok;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
@ActiveProfiles("test")
class MoodleParserServiceDynamicTest {

    @Autowired
    private MoodleParserService parserService;

    @Autowired
    private MoodleRulesConfig moodleRulesConfig;

    @Autowired
    private ResourceLoader resourceLoader;

    static class TestCase {
        public String component;
        public String eventName;
        public String description;
        public Map<String, Object> expected;
    }

    @TestFactory
    Stream<DynamicTest> dynamicTestsFromJson() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();

        // Cargar recurso JSON al mismo nivel que la clase
        Resource resource = resourceLoader.getResource(
            "classpath:es/ubu/lsi/moodleadapter/csv/service/moodle_event_test_cases.json");

        JsonNode root = objectMapper.readTree(resource.getInputStream());
        JsonNode casesNode = root.get("cases");

        List<TestCase> testCases = objectMapper.convertValue(casesNode, new TypeReference<List<TestCase>>() {
        });

        // Generar DynamicTests
        return testCases.stream()
            .map(tc -> DynamicTest.dynamicTest(
                tc.component + "/" + tc.eventName + " -> " + tc.description,
                () -> procesTestCase(tc)

            ));
    }

    private void procesTestCase(TestCase tc) {

        assertFalse(moodleRulesConfig.getRules().isEmpty(), "No se cargaron reglas para");
        // Verificar que existan groks para el componente/evento
        List<Grok> groks = moodleRulesConfig.getRules()
            .getOrDefault(tc.component, Map.of())
            .getOrDefault(tc.eventName, List.of());

        assertFalse(groks.isEmpty(),
            "No se cargaron groks para " + tc.component + "/" + tc.eventName);

        // Ejecutar parser
        Map<String, Object> result = parserService.extractData(
            tc.component, tc.eventName, tc.description);

        // Comparar con el resultado esperado
        assertThat(result).containsExactlyInAnyOrderEntriesOf(tc.expected);

    }
}
