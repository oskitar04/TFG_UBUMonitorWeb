package es.ubu.lsi.moodleadapter.service.moodle.endpoint.calendar;

import es.ubu.lsi.moodleadapter.dto.CalendarEventsResponseDto;
import es.ubu.lsi.moodleadapter.mapper.calendar.CalendarEventsMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.EventDetails;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.EventOptions;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.GetCalendarEventsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.response.GetCalendarEventsResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GetCalendarEventsEndpoint implements MoodleEndpoint<GetCalendarEventsRequest, GetCalendarEventsResponse, CalendarEventsResponseDto> {

    private final CalendarEventsMapper mapper;


    private static final ParameterizedTypeReference<GetCalendarEventsResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    @Override
    @SuppressWarnings("unchecked")
    public GetCalendarEventsRequest buildRequest(Object... params) {
        List<Integer> eventids = (List<Integer>) params[0];
        List<Integer> courseids = (List<Integer>) params[1];
        List<Integer> groupids = (List<Integer>) params[2];
        List<Integer> categoryids = (List<Integer>) params[3];
        Boolean userevents = (Boolean) params[4];
        Boolean siteevents = (Boolean) params[5];
        OffsetDateTime timestart = (OffsetDateTime) params[6];
        OffsetDateTime timeend = (OffsetDateTime) params[6];
        Boolean ignorehidden = (Boolean) params[7];

        EventDetails eventDetails = mapper.toEventDetailsRequest(eventids, courseids, groupids, categoryids);
        EventOptions eventOptions = mapper.toEventOptionsRequest(userevents, siteevents, timestart, timeend, ignorehidden);

        return mapper.toRequest(eventDetails, eventOptions);
    }

    @Override
    public ParameterizedTypeReference<GetCalendarEventsResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    @Override
    public CalendarEventsResponseDto mapResponse(GetCalendarEventsResponse response, Object... params) {
        return mapper.toResponse(response);
    }
}
