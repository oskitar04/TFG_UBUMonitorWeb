package es.ubu.lsi.moodleadapter.util;


import org.springframework.core.io.Resource;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class TestUtils {

    public static String loadAndReplace(Resource resource, Map<String, String> variables) throws IOException {
        String content = fileReadString(resource);
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return content;
    }

    public static String fileReadString(Resource resource) throws IOException {
        return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    }

    public static String extractFolderName(Resource resource) {
        try {
            return resource.getFile().getParentFile().getName();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
