package es.ubu.lsi.moodleadapter.mapper.user;

import es.ubu.lsi.moodleadapter.dto.UserDto;
import es.ubu.lsi.moodleadapter.dto.UserResponseDto;
import es.ubu.lsi.moodleadapter.dto.UserSearchFieldDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.user.getusersbyfield.request.GetUsersByFieldRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.user.getusersbyfield.response.GetUsersByFieldResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface UsersByFieldMapper {

    @Mapping(target = "wsfunction", ignore = true)
    GetUsersByFieldRequest toRequest(UserSearchFieldDto field, List<String> values);

    UserResponseDto toResponse(List<GetUsersByFieldResponse> users, Object[] params);


    @Mapping(target = "privateprofileimageurlsmall", source = "profileimageurlsmall", qualifiedByName = "profileUrl")
    @Mapping(target = "privateprofileimageurl", source = "profileimageurl", qualifiedByName = "profileUrl")
    @Mapping(target = "descriptiontext", source = "source", qualifiedByName = "descriptionText")
    UserDto toUserDto(GetUsersByFieldResponse source);

    @Named("descriptionText")
    default String getDescriptionText(GetUsersByFieldResponse source) {
        return MapperUtils.parseMoodleContent(source.getDescription(), Optional.ofNullable(source.getDescriptionformat())
            .map(GetUsersByFieldResponse.Descriptionformat::value)
            .orElse(null)
        );
    }


}
