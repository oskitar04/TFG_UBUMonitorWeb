package es.ubu.lsi.moodleadapter.service.calendar;

import es.ubu.lsi.moodleadapter.controller.CalendarsApiDelegate;
import es.ubu.lsi.moodleadapter.dto.CalendarEventsResponseDto;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleService;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.calendar.GetCalendarEventsEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService implements CalendarsApiDelegate {

    private final MoodleService moodleService;
    private final GetCalendarEventsEndpoint getCalendarEventsEndpoint;

    @Override
    public Mono<ResponseEntity<CalendarEventsResponseDto>> getCalendarEvents(List<Integer> eventids, List<Integer> courseids, List<Integer> groupids, List<Integer> categoryids, Boolean userevents, Boolean siteevents, OffsetDateTime timestart, OffsetDateTime timeend, Boolean ignorehidden, ServerWebExchange exchange) {
        return moodleService.callEndpoint(getCalendarEventsEndpoint, eventids, courseids, groupids, categoryids, userevents, siteevents, timestart, timeend, ignorehidden)
            .map(ResponseEntity::ok);
    }


}
