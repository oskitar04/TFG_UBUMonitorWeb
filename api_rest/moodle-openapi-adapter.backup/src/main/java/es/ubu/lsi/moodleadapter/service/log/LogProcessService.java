package es.ubu.lsi.moodleadapter.service.log;

import com.fasterxml.jackson.databind.MappingIterator;
import com.fasterxml.jackson.databind.SequenceWriter;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;
import es.ubu.lsi.moodleadapter.controller.LogsApiDelegate;
import es.ubu.lsi.moodleadapter.csv.service.MoodleParserService;
import es.ubu.lsi.moodleadapter.csv.strategy.ColumnFillStrategy;
import es.ubu.lsi.moodleadapter.csv.strategy.DefaultCollumFillStrategy;
import es.ubu.lsi.moodleadapter.dto.LogHeaderDto;
import es.ubu.lsi.moodleadapter.dto.LogProcessResponseDto;
import es.ubu.lsi.moodleadapter.dto.OptionsDto;
import es.ubu.lsi.moodleadapter.dto.ProcessCSVPathRequestDto;
import es.ubu.lsi.moodleadapter.exception.BadGatewayException;
import es.ubu.lsi.moodleadapter.exception.BadRequestException;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LogProcessService implements LogsApiDelegate {
    private static final ColumnFillStrategy DEFAULT_STRATEGY = new DefaultCollumFillStrategy();
    public static final MediaType TEXT_CSV = new MediaType("text", "csv");
    private final Map<LogHeaderDto, ColumnFillStrategy> strategyRegistry;
    private final CsvMapper mapper;
    private final MoodleParserService moodleParserService;

    public LogProcessService(List<ColumnFillStrategy> strategies, MoodleParserService moodleParserService, CsvMapper mapper) {
        this.strategyRegistry = strategies.stream()
            .collect(Collectors.toMap(ColumnFillStrategy::getHeaderName, s -> s));
        this.moodleParserService = moodleParserService;
        this.mapper = mapper;

    }

    @Override
    public Mono<ResponseEntity<LogProcessResponseDto>> processCSVPath(Mono<ProcessCSVPathRequestDto> processCSVPathRequestDto, ServerWebExchange exchange) {
        return processCSVPathRequestDto.flatMap(request -> {

            Path inputFilePath;
            try {
                // Se asume que la URI enviada es de tipo file (ej. file:///ruta/al/archivo.csv)
                inputFilePath = Paths.get(request.getInput());
            } catch (Exception e) {
                return Mono.error(new BadRequestException("Invalid input path URI: " + e.getMessage()));
            }

            Path outputFilePath;
            if (request.getOutput() != null) {
                try {
                    outputFilePath = Paths.get(request.getOutput());
                } catch (Exception e) {
                    return Mono.error(new BadRequestException("Invalid output path URI: " + e.getMessage()));
                }
            } else {
                // Autogenerar ruta de salida si no se provee
                String fileName = inputFilePath.getFileName().toString();
                String newFileName = getResponseFilename(fileName);
                outputFilePath = inputFilePath.getParent() != null
                    ? inputFilePath.getParent().resolve(newFileName)
                    : Paths.get(newFileName);
            }

            // Ejecutar el proceso con streams locales
            return Mono.fromCallable(() -> {
                    InputStream is = Files.newInputStream(inputFilePath);
                    OutputStream os = Files.newOutputStream(outputFilePath);
                    return new AbstractMap.SimpleEntry<>(is, os);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(streams -> processAsync(streams.getKey(), streams.getValue(), request.getOptions())
                    .subscribeOn(Schedulers.boundedElastic())
                    .thenReturn(ResponseEntity.ok(new LogProcessResponseDto(outputFilePath.toUri())))
                )
                .onErrorResume(e -> {
                    log.error("Error procesando archivo local", e);
                    return Mono.error(new BadRequestException("Error processing files: " + e.getMessage()));
                });
        });
    }


    @Override
    public Mono<ResponseEntity<Resource>> processCSVFile(Flux<Part> file, OptionsDto optionsDto, ServerWebExchange exchange) {


        return file.ofType(FilePart.class).next().flatMap(filePart ->
            DataBufferUtils.join(filePart.content())
                .flatMap(joinedBuffer -> {
                    byte[] bytes = new byte[joinedBuffer.readableByteCount()];
                    joinedBuffer.read(bytes);
                    DataBufferUtils.release(joinedBuffer);

                    InputStream inputStream = new ByteArrayInputStream(bytes);

                    PipedOutputStream outResponse = new PipedOutputStream();
                    PipedInputStream inResponse = new PipedInputStream();

                    try {
                        inResponse.connect(outResponse);
                    } catch (IOException e) {
                        throw new BadGatewayException("Error connection", e);
                    }

                    processAsync(inputStream, outResponse, optionsDto)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe(null, err -> log.error("Error en processAsync", err));

                    String processedName = getResponseFilename(filePart.filename());

                    return Mono.just(ResponseEntity.ok()
                        .contentType(TEXT_CSV)
                        .header(HttpHeaders.CONTENT_DISPOSITION, String.format("attachment; filename=\"%s\"", processedName))
                        .body(new InputStreamResource(inResponse)));
                })
        );
    }


    // Fíjate cómo la firma ha cambiado a "OutputStream pos" genérico
    private Mono<Void> processAsync(InputStream is, OutputStream pos, OptionsDto optionsDto) {
        OptionsDto effectiveOptions = Optional.ofNullable(optionsDto).orElseGet(OptionsDto::new);
        Integer threads = effectiveOptions.getThreads();
        List<LogHeaderDto> headers = getEffectiveHeaders(effectiveOptions.getHeaders());

        return Mono.fromRunnable(() -> {
            CsvSchema.Builder schemaBuilder = CsvSchema.builder();
            List<ColumnFillStrategy> executionPlan = getExecutionPlan(headers, schemaBuilder);
            boolean shouldParseDescription = executionPlan.stream().anyMatch(ColumnFillStrategy::shouldParseDescription);
            CsvSchema schemaOut = schemaBuilder.setUseHeader(true).build();

            try (SequenceWriter writer = mapper.writer(schemaOut).writeValues(pos)) {
                MappingIterator<Map<String, String>> it = mapper.readerFor(Map.class)
                    .with(CsvSchema.emptySchema().withHeader())
                    .readValues(is);

                Flux.fromIterable(() -> it)
                    .window(1000)
                    .flatMapSequential(window -> window
                            .map(row -> getRowProcessed(headers, row, shouldParseDescription, executionPlan))
                            .subscribeOn(Schedulers.parallel()),
                        threads
                    )
                    .doOnNext(e -> {
                        try {
                            writer.write(e);
                        } catch (IOException ex) {
                            throw new BadRequestException("Has problems writing csv", ex);
                        }
                    })
                    .blockLast();

            } catch (Exception e) {
                log.error("Error parsing csv", e);
                throw new BadGatewayException("Has problems writing csv", e);

            } finally {
                try {
                    pos.close();
                    is.close();
                } catch (IOException e) {
                    log.error("Error closing stream", e);
                }
            }
        }).then();
    }

    private @NonNull List<Object> getRowProcessed(List<LogHeaderDto> headers, Map<String, String> row, boolean shouldParseDescription, List<ColumnFillStrategy> executionPlan) {
        List<Object> outputRow = new ArrayList<>();
        for (int i = 0; i < headers.size(); i++) {
            LogHeaderDto header = headers.get(i);
            String originalValue = row.get(header.getValue());
            Map<String, Object> descriptionValues = null;
            if (shouldParseDescription) {
                descriptionValues = moodleParserService.extractData(row);
            }
            ColumnFillStrategy strategy = executionPlan.get(i);
            Object value = strategy.fill(originalValue, row, descriptionValues);
            outputRow.add(value == null ? "" : value);
        }
        return outputRow;
    }


    private static @NonNull List<@Valid LogHeaderDto> getEffectiveHeaders(List<LogHeaderDto> headers) {
        return Optional.ofNullable(headers)
            .filter(h -> !CollectionUtils.isEmpty(h))
            .orElseGet(() -> Arrays.asList(LogHeaderDto.values()));
    }

    private List<ColumnFillStrategy> getExecutionPlan(List<LogHeaderDto> targetHeaders, CsvSchema.Builder schemaBuilder) {
        List<ColumnFillStrategy> executionPlan = new ArrayList<>();
        if (targetHeaders == null) return executionPlan;
        for (LogHeaderDto header : targetHeaders) {
            schemaBuilder.addColumn(header.getValue());
            executionPlan.add(strategyRegistry.getOrDefault(header, DEFAULT_STRATEGY));
        }
        return executionPlan;
    }

    private String getResponseFilename(String originalName) {

        return originalName.contains(".")
            ? originalName.replaceFirst("(\\.[^.]+)$", "_processed$1")
            : originalName + "_processed.csv";
    }
}
