package es.ubu.lsi.moodleadapter.csv.config;


import io.krakens.grok.api.Grok;
import io.krakens.grok.api.GrokCompiler;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class StringToGrokConverter implements Converter<String, Grok> {
    private final GrokCompiler grokInstance;

    public StringToGrokConverter() {
        grokInstance = GrokCompiler.newInstance();
        grokInstance.registerDefaultPatterns();
    }

    @Override
    public Grok convert(String source) {
        return grokInstance.compile(source);
    }
}
