package es.ubu.lsi.moodleadapter.mapper.site;

import es.ubu.lsi.moodleadapter.dto.SiteConfigDto;
import es.ubu.lsi.moodleadapter.dto.SiteInfoDto;
import es.ubu.lsi.moodleadapter.dto.SiteInfoResponseDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.moodle.model.core.webservice.getsiteinfo.response.GetSiteInfoResponse;
import es.ubu.lsi.moodleadapter.moodle.model.tool.mobile.getpublicconfig.response.GetPubicConfigResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface SiteInfoMapper {


    @Mapping(target = "siteinfo", source = "getSiteInfoResponse")
    @Mapping(target = "siteconfig", source = "getPubicConfigResponse")
    SiteInfoResponseDto siteInfoToSiteInfoResponseDto(GetSiteInfoResponse getSiteInfoResponse, GetPubicConfigResponse getPubicConfigResponse);

    @Mapping(target = "privateuserpictureurl", source = "userpictureurl", qualifiedByName = "profileUrl")
    @Mapping(target = "versionname", source = "release", qualifiedByName = "versionname")
    SiteInfoDto siteInfoDto(GetSiteInfoResponse getSiteInfoResponse);




    @Named("versionname")
    default String getVersioName(String versionString) {
        if (versionString == null || versionString.isEmpty()) {
            return versionString;
        }

        return versionString.split(" ")[0];
    }


    @Mapping(target = "authinstructionstext", source = "authinstructions", qualifiedByName = "parseHtml")
    SiteConfigDto siteConfigDto(GetPubicConfigResponse getPubicConfigResponse);
}
