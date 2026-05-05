package es.ubu.lsi.moodleadapter.service.moodle.endpoint.user;


import es.ubu.lsi.moodleadapter.dto.UserResponseDto;
import es.ubu.lsi.moodleadapter.dto.UserSearchFieldDto;
import es.ubu.lsi.moodleadapter.mapper.user.UsersByFieldMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.user.getusersbyfield.request.GetUsersByFieldRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.user.getusersbyfield.response.GetUsersByFieldResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class GetUsersByFieldEndpoint implements MoodleEndpoint<GetUsersByFieldRequest, List<GetUsersByFieldResponse>, UserResponseDto> {


    private final UsersByFieldMapper mapper;

    private static final ParameterizedTypeReference<List<GetUsersByFieldResponse>> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    @Override
    @SuppressWarnings("unchecked")
    public GetUsersByFieldRequest buildRequest(Object... params) {
        UserSearchFieldDto field = (UserSearchFieldDto) params[0];
        List<String> values = (List<String>) params[1];
        return mapper.toRequest(field, values);
    }

    @Override
    public ParameterizedTypeReference<List<GetUsersByFieldResponse>> getResponseType() {
        return RESPONSE_TYPE;
    }

    @Override
    public UserResponseDto mapResponse(List<GetUsersByFieldResponse> response, Object... params) {
        return mapper.toResponse(response, params);
    }
}
