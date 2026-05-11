package es.ubu.lsi.moodleadapter.config;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class ExecutionTimeFilter implements WebFilter {

    private static final String EXECUTION_TIME_HEADER = "X-Execution-Time-ms";

    @Override
    @NullMarked
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        long startTime = System.nanoTime();

        exchange.getResponse().beforeCommit(() -> {
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;

            exchange.getResponse().getHeaders().add(EXECUTION_TIME_HEADER, String.valueOf(durationMs));

            return Mono.empty();
        });

        return chain.filter(exchange);
    }
}
