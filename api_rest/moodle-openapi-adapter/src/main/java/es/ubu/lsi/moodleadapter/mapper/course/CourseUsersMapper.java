package es.ubu.lsi.moodleadapter.mapper.course;

import es.ubu.lsi.moodleadapter.dto.CourseUsersResponseDto;
import es.ubu.lsi.moodleadapter.dto.EnrolledUserDto;
import es.ubu.lsi.moodleadapter.dto.GetCourseUsersOptionsParameterDto;
import es.ubu.lsi.moodleadapter.dto.GroupDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.request.GetEnrolledUsersRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.request.Option;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.response.GetEnrolledUsersResponse;
import es.ubu.lsi.moodleadapter.moodle.model.core.enrol.getenrolledusers.response.Group;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CourseUsersMapper {


    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "courseid", source = "courseId")
    @Mapping(target = "options", source = "options")
    GetEnrolledUsersRequest toMoodleRequest(Integer courseId, GetCourseUsersOptionsParameterDto options);

    default List<Option> map(GetCourseUsersOptionsParameterDto dto) {
        return Stream.of(
                option(Option.Name.WITHCAPABILITY, dto.getWithcapability()),
                option(Option.Name.GROUPID, dto.getGroupid()),
                option(Option.Name.ONLYACTIVE, MapperUtils.booleanToInteger(dto.getOnlyactive())),
                option(Option.Name.ONLYSUSPENDED, MapperUtils.booleanToInteger(dto.getOnlysuspended())),
                option(Option.Name.USERFIELDS, dto.getUserfields()),
                option(Option.Name.LIMITFROM, dto.getLimitfrom()),
                option(Option.Name.LIMITNUMBER, dto.getLimitnumber()),
                option(Option.Name.SORTBY, dto.getSortby()),
                option(Option.Name.SORTDIRECTION, dto.getSortdirection())

            )
            .filter(Objects::nonNull)
            .toList();
    }

    default Option option(Option.Name name, Object value) {
        if (value == null) {
            return null;
        }
        Option option = new Option();
        option.setName(name);
        option.setValue(value.toString());
        return option;
    }


    // For response


    CourseUsersResponseDto toCourseUsersResponse(List<GetEnrolledUsersResponse> users, Object[] params);


    @Mapping(target = "privateprofileimageurl", source = "profileimageurl", qualifiedByName = "profileUrl")
    @Mapping(target = "privateprofileimageurlsmall", source = "profileimageurlsmall", qualifiedByName = "profileUrl")
    @Mapping(target = "descriptiontext", source = "enrolledUser", qualifiedByName = "descriptiontext")
    EnrolledUserDto toEnrolledUserDto(GetEnrolledUsersResponse enrolledUser);

    @Mapping(target = "descriptiontext", source = "group", qualifiedByName = "groupdescriptiontext")
    GroupDto toGroup(Group group);

    @Named("descriptiontext")
    default String parseSummary(GetEnrolledUsersResponse enrolledUser) {
        return MapperUtils.parseMoodleContent(enrolledUser.getDescription(),
            Optional.ofNullable(enrolledUser.getDescriptionformat())
                .map(GetEnrolledUsersResponse.Descriptionformat::value)
                .orElse(null));
    }

    @Named("groupdescriptiontext")
    default String parseSummary(Group group) {
        return MapperUtils.parseMoodleContent(group.getDescription(),
            Optional.ofNullable(group.getDescriptionformat())
                .map(Group.Descriptionformat::value)
                .orElse(null));
    }
}
