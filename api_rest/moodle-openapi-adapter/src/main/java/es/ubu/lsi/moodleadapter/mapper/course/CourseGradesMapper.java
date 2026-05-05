package es.ubu.lsi.moodleadapter.mapper.course;

import es.ubu.lsi.moodleadapter.dto.CourseGradesResponseDto;
import es.ubu.lsi.moodleadapter.dto.GradeItemDto;
import es.ubu.lsi.moodleadapter.dto.UserGradeDto;
import es.ubu.lsi.moodleadapter.mapper.MapperUtils;
import es.ubu.lsi.moodleadapter.model.GradeReportResponse;
import es.ubu.lsi.moodleadapter.model.UserGradeResponse;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradeitems.request.GetGradeItemsRequest;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradeitems.response.GradeItem;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradeitems.response.UserGrade;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.request.GetGradesTableRequest;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.Itemname;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.Table;
import es.ubu.lsi.moodleadapter.moodle.model.gradereport.user.getgradestable.response.TableDataItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CourseGradesMapper {


    @Mapping(target = "wsfunction", ignore = true)
    GetGradesTableRequest toRequest(Integer courseid, Integer userid, Integer groupid);

    @Mapping(target = "wsfunction", ignore = true)
    GetGradeItemsRequest toRequestGradeItemsResponse(Integer courseid, Integer userid, Integer groupid);


    @Mapping(target = "usergrades", source = "userGradeResponse", qualifiedByName = "toTableDtoList")
    @Mapping(target = "warnings", source = "getGradeItemsResponse.warnings")
    CourseGradesResponseDto toResponse(UserGradeResponse userGradeResponse);

    @Named("toTableDtoList")
    default List<UserGradeDto> toTableDtoList(UserGradeResponse userGradeResponse) {
        List<Table> tables = userGradeResponse.getGetGradesTableResponse().getTables();
        List<UserGrade> userGrades = userGradeResponse.getGetGradeItemsResponse().getUsergrades();

        if (tables == null || userGrades == null) {
            return List.of();
        }

        List<UserGradeDto> userGradeDtos = new ArrayList<>(userGrades.size());

        for (UserGrade userGrade : userGrades) {
            if (CollectionUtils.isEmpty(userGrade.getGradeitems())) {
                continue;
            }

            for (Table table : tables) {
                if (!CollectionUtils.isEmpty(table.getTabledata()) && Objects.equals(table.getUserid(), userGrade.getUserid())) {
                    userGradeDtos.add(toUserGradeDto(new GradeReportResponse(userGrade, table)));
                    break;
                }

            }
        }
        return userGradeDtos;
    }

    @Mapping(target = "userid", source = "userGrade.userid")
    @Mapping(target = "courseidnumber", source = "userGrade.courseidnumber")
    @Mapping(target = "courseid", source = "userGrade.courseid")
    @Mapping(target = "gradeitems", source = "gradeReportResponse", qualifiedByName = "toGradeItemDto")
    @Mapping(target = "userfullname", source = "userGrade.userfullname")
    @Mapping(target = "useridnumber", source = "userGrade.useridnumber")
    @Mapping(target = "maxdepth", source = "userGrade.maxdepth")
    UserGradeDto toUserGradeDto(GradeReportResponse gradeReportResponse);

    @Named("toGradeItemDto")
    default List<GradeItemDto> toGradeItemDto(GradeReportResponse response) {
        Table table = response.getTable();
        UserGrade userGrade = response.getUserGrade();

        List<GradeItemDto> result = new ArrayList<>();

        for (TableDataItem tableDataItem : table.getTabledata()) {

            parse(tableDataItem, userGrade, result);
        }

        return result;
    }

    default void parse(TableDataItem tableDataItem, UserGrade userGrade, List<GradeItemDto> result) {
        Long id = Optional.ofNullable(tableDataItem.getItemname())
            .map(Itemname::getId)
            .map(this::parseId)
            .orElse(null);

        if (id == null) {
            return;
        }

        GradeItem gradeItem = getUserGradeMatch(id, userGrade.getGradeitems());
        GradeItemDto dto = new GradeItemDto();

        if (gradeItem == null) {
            result.add(toGradeItemDto(tableDataItem));
            return;
        }

        if ("course".equals(gradeItem.getItemtype())) {
            GradeItemDto target = result.stream()
                .filter(e -> e.getCategoryid() == null)
                .findFirst()
                .orElse(dto);

            courseItemtoGradeItemDto(gradeItem, target);
            return;
        }

        result.add(toGradeItemDto(gradeItem, tableDataItem));
    }

    @Named("parseId")
    default Long parseId(String id) {
        try {
            // tiene el formato cat_82_13 , cat o item, 82 es el id y 13 es id user
            String[] split = id.split("_");
            return Long.valueOf(split[1]);
        } catch (Exception _) {
            return null;
        }
    }

    default GradeItem getUserGradeMatch(Long tableId, List<GradeItem> gradeItems) {
        return gradeItems.stream()
            .filter(item -> Objects.equals(tableId, item.getId()))
            .findAny()
            .orElse(null);
    }

    @Mapping(target = "weightformatted", source = "weight.content", qualifiedByName = "htmlPercentage")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "scaleid", ignore = true)
    @Mapping(target = "rangeformatted", source = "range.content", qualifiedByName = "parseHtml")
    @Mapping(target = "percentageraw", source = "percentage.content", qualifiedByName = "htmlPercentage")
    @Mapping(target = "percentageformatted", source = "percentage.content")
    @Mapping(target = "outcomeid", ignore = true)
    @Mapping(target = "numusers", ignore = true)
    @Mapping(target = "locked", ignore = true)
    @Mapping(target = "lettergradeformatted", source = "lettergrade.content", qualifiedByName = "parseHtml")
    @Mapping(target = "itemtype", constant = "category")
    @Mapping(target = "itemnumber", ignore = true)
    @Mapping(target = "itemmodule", ignore = true)
    @Mapping(target = "iteminstance", ignore = true)
    @Mapping(target = "idnumber", ignore = true)
    @Mapping(target = "gradeneedsupdate", ignore = true)
    @Mapping(target = "grademin", constant = "0")
    @Mapping(target = "grademax", constant = "1")
    @Mapping(target = "gradeisoverridden", ignore = true)
    @Mapping(target = "gradeislocked", ignore = true)
    @Mapping(target = "gradeishidden", constant = "true")
    @Mapping(target = "gradehiddenbydate", ignore = true)
    @Mapping(target = "gradeformatted", source = "grade.content", qualifiedByName = "parseNumber")
    @Mapping(target = "gradedatesubmitted", ignore = true)
    @Mapping(target = "gradedategraded", ignore = true)
    @Mapping(target = "feedbacktext", source = "feedback.content", qualifiedByName = "parseHtml")
    @Mapping(target = "feedbackformat", constant = "HTML")
    @Mapping(target = "cmid", ignore = true)
    @Mapping(target = "categoryid", source = "parentcategories", qualifiedByName = "categoryid")
    @Mapping(target = "averageformatted", source = "average.content")
    @Mapping(target = "id", source = "itemname.id", qualifiedByName = "parseId")
    @Mapping(target = "itemname", source = "itemname.content", qualifiedByName = "parseHtml")
    @Mapping(target = "weightraw", source = "weight.content", qualifiedByName = "htmlPercentage")
    @Mapping(target = "graderaw", source = "grade.content", qualifiedByName = "htmlPercentage")
    @Mapping(target = "feedback", source = "feedback.content", qualifiedByName = "parseHtml")
    @Mapping(target = "rank", source = "rank.content", qualifiedByName = "parseInteger")
    @Mapping(target = "contributiontocoursetotal", source = "contributiontocoursetotal.content", qualifiedByName = "parseHtml")
    @Mapping(target = "contributiontocoursetotalraw", source = "tableDataItem.contributiontocoursetotal.content", qualifiedByName = "htmlPercentage")
    GradeItemDto toGradeItemDto(TableDataItem tableDataItem);

    @Named("categoryid")
    default Integer categoryid(List<Long> parentCategories) {
        if (parentCategories == null || parentCategories.isEmpty()) {
            return null;
        }

        return MapperUtils.longToInteger(parentCategories.getLast());
    }


    // mapping for gradeitem response

    @Mapping(target = "percentageraw", source = "gradeItem.percentageformatted", qualifiedByName = "htmlPercentage")
    @Mapping(target = "feedbacktext", source = "gradeItem", qualifiedByName = "feedbacktext")
    @Mapping(target = "rangeformatted", source = "gradeItem.rangeformatted", qualifiedByName = "parseHtml")
    @Mapping(target = "itemname", source = "gradeItem.itemname")
    @Mapping(target = "rank", source = "gradeItem.rank")
    @Mapping(target = "feedback", source = "gradeItem.feedback")
    @Mapping(target = "contributiontocoursetotal", source = "tableDataItem.contributiontocoursetotal.content", qualifiedByName = "parseHtml")
    @Mapping(target = "contributiontocoursetotalraw", source = "tableDataItem.contributiontocoursetotal.content", qualifiedByName = "htmlPercentage")
    GradeItemDto toGradeItemDto(GradeItem gradeItem, TableDataItem tableDataItem);


    @Named("feedbacktext")
    default String feedbacktext(GradeItem gradeItem) {
        return MapperUtils.parseMoodleContent(gradeItem.getFeedback(),
            Optional.ofNullable(gradeItem.getFeedbackformat())
                .map(GradeItem.Feedbackformat::value)
                .orElse(null));
    }


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "itemname", ignore = true)
    @Mapping(target = "parentcategories", ignore = true)
    @Mapping(target = "categoryid", ignore = true)
    @Mapping(target = "rangeformatted", source = "rangeformatted", qualifiedByName = "parseHtml")
    @Mapping(target = "percentageraw", source = "percentageformatted", qualifiedByName = "htmlPercentage")
    @Mapping(target = "feedbacktext", source = "gradeItem", qualifiedByName = "feedbacktext")
    @Mapping(target = "contributiontocoursetotal", ignore = true)
    @Mapping(target = "contributiontocoursetotalraw", ignore = true)
    void courseItemtoGradeItemDto(GradeItem gradeItem, @MappingTarget GradeItemDto gradeItemDto);


}
