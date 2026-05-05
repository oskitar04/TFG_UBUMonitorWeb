package es.ubu.lsi.moodleadapter.service.moodle.endpoint.mobile;

import es.ubu.lsi.moodleadapter.moodle.model.tool.mobile.getpublicconfig.request.GetPublicConfigRequest;
import es.ubu.lsi.moodleadapter.moodle.model.tool.mobile.getpublicconfig.response.GetPubicConfigResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class GetPublicConfigEndpoint implements MoodleEndpoint<GetPublicConfigRequest, GetPubicConfigResponse, GetPubicConfigResponse> {

    private static final ParameterizedTypeReference<GetPubicConfigResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    private static final GetPublicConfigRequest GET_PUBLIC_CONFIG_REQUEST = new GetPublicConfigRequest();


    @Override
    public GetPublicConfigRequest buildRequest(Object... params) {

        return GET_PUBLIC_CONFIG_REQUEST;
    }

    @Override
    public ParameterizedTypeReference<GetPubicConfigResponse> getResponseType() {
        return RESPONSE_TYPE;
    }


    @Override
    public GetPubicConfigResponse mapResponse(GetPubicConfigResponse response, Object... params) {
        return response;
    }
}
