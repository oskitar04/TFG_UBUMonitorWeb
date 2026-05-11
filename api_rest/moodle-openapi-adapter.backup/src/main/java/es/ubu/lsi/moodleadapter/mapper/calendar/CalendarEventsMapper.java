package es.ubu.lsi.moodleadapter.mapper.calendar;

import es.ubu.lsi.moodleadapter.dto.CalendarEventsResponseDto;
import es.ubu.lsi.moodleadapter.dto.EventDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.EventDetails;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.EventOptions;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.request.GetCalendarEventsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.response.Event;
import es.ubu.lsi.moodleadapter.moodle.model.core.calendar.getcalendarevents.response.GetCalendarEventsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CalendarEventsMapper {

    EventDetails toEventDetailsRequest(List<Integer> eventids, List<Integer> courseids, List<Integer> groupids, List<Integer> categoryids);

    EventOptions toEventOptionsRequest(Boolean userevents, Boolean siteevents, OffsetDateTime timestart, OffsetDateTime timeend, Boolean ignorehidden);

    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "events", source = "eventDetails")
    @Mapping(target = "options", source = "eventOptions")
    GetCalendarEventsRequest toRequest(EventDetails eventDetails, EventOptions eventOptions);


    CalendarEventsResponseDto toResponse(GetCalendarEventsResponse response);


    @Mapping(target = "timeend", source = "source", qualifiedByName = "timeend")
    @Mapping(target = "descriptiontext", source = "source", qualifiedByName = "descriptiontext")
    EventDto toEventDto(Event source);

    @Named("timeend")
    default OffsetDateTime timeend(Event event) {
        OffsetDateTime timeStart = MapperUtils.unixToOffsetDateTime(event.getTimestart());
        if (event.getTimeduration() == null || timeStart == null) {
            return timeStart;
        }
        return timeStart.plusSeconds(event.getTimeduration());
    }

    @Named("descriptiontext")
    default String format(Event source) {
        return MapperUtils.parseMoodleContent(source.getDescription(),
            Optional.ofNullable(source.getFormat())
                .map(Event.Format::value)
                .orElse(null));
    }

}
