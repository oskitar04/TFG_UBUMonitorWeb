package es.ubu.lsi.moodleadapter.service.site;

import es.ubu.lsi.moodleadapter.controller.SiteApiDelegate;
import es.ubu.lsi.moodleadapter.dto.SiteInfoResponseDto;
import es.ubu.lsi.moodleadapter.mapper.site.SiteInfoMapper;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleService;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.mobile.GetPublicConfigEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.site.GetSiteInfoEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Service that handles site-level operations.
 * <p>
 * This service provides methods for retrieving Moodle site information:
 * - Site name and configuration
 * - Supported language packs
 * - Advanced features
 * - Site-wide settings and capabilities
 * <p>
 * All operations are non-blocking and reactive, using Project Reactor's Mono
 * for composable asynchronous operations.
 * <p>
 * Endpoints:
 * - GetSiteInfoEndpoint: Retrieves general site information
 *
 * @author Yi Peng Ji
 * @version 1.0
 * @see GetSiteInfoEndpoint
 * @see MoodleService
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
public class SiteService implements SiteApiDelegate {

    /** Service for orchestrating Moodle endpoint calls. */
    private final MoodleService moodleService;

    private final SiteInfoMapper siteInfoMapper;

    /** Endpoint for getting site information. */
    private final GetSiteInfoEndpoint getSiteInfoEndpoint;

    private final GetPublicConfigEndpoint getPublicConfigEndpoint;



    /**
     * Gets general information about the Moodle site.
     *
     * Returns site-wide configuration including name, language,
     * supported features, and other site settings.
     *
     * @param exchange The HTTP exchange for context
     * @return Response containing site information
     */
    @Override
    public Mono<ResponseEntity<SiteInfoResponseDto>> siteInfo(ServerWebExchange exchange) {
        return Mono.zip(
            moodleService.callEndpoint(getSiteInfoEndpoint),
            moodleService.callEndpoint(getPublicConfigEndpoint),
            siteInfoMapper::siteInfoToSiteInfoResponseDto
        ).map(ResponseEntity::ok);
    }
}
