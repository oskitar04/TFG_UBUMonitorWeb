package es.ubu.lsi.moodleadapter.service.moodle.endpoint.site;

import es.ubu.lsi.moodleadapter.mapper.site.SiteInfoMapper;
import es.ubu.lsi.moodleadapter.moodle.model.core.webservice.getsiteinfo.request.GetSiteInfoRequest;
import es.ubu.lsi.moodleadapter.moodle.model.core.webservice.getsiteinfo.response.GetSiteInfoResponse;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

/**
 * Endpoint implementation for retrieving general site information.
 * <p>
 * This endpoint provides site-wide configuration and settings including:
 * - Site name and description
 * - Supported language packs
 * - Advanced features
 * - Version information
 * - Site-wide capabilities
 * <p>
 * Moodle Web Service: {@code core_webservice_get_site_info}
 * <p>
 * Type Parameters:
 * - Request: GetSiteInfoRequest (static, no parameters needed)
 * - Source: GetSiteInfoResponse
 * - Target: SiteInfoResponseDto
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @since 1.0
 */
@Component
@RequiredArgsConstructor
public class GetSiteInfoEndpoint implements MoodleEndpoint<GetSiteInfoRequest, GetSiteInfoResponse, GetSiteInfoResponse> {

    /** Response type reference. */
    private static final ParameterizedTypeReference<GetSiteInfoResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    /** Static request instance (site info requires no parameters). */
    private static final GetSiteInfoRequest GET_SITE_INFO_REQUEST = new GetSiteInfoRequest();

    /** Mapper for transforming responses. */
    private final SiteInfoMapper mapper;

    /**
     * Returns the static site info request (no parameters needed).
     *
     * @param params Ignored
     * @return Static GetSiteInfoRequest
     */
    @Override
    public GetSiteInfoRequest buildRequest(Object... params) {

        return GET_SITE_INFO_REQUEST;
    }

    @Override
    public ParameterizedTypeReference<GetSiteInfoResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    /**
     * Maps Moodle site info response to client DTO.
     *
     * @param response Site information from Moodle
     * @param params Original parameters (unused)
     * @return Site info DTO
     */
    @Override
    public GetSiteInfoResponse mapResponse(GetSiteInfoResponse response, Object... params) {
        return response;
    }
}
