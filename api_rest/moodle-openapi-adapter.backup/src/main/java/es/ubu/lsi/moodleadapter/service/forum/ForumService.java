package es.ubu.lsi.moodleadapter.service.forum;

import es.ubu.lsi.moodleadapter.controller.ForumsApiDelegate;
import es.ubu.lsi.moodleadapter.dto.DiscussionDto;
import es.ubu.lsi.moodleadapter.dto.DiscussionsResponseDto;
import es.ubu.lsi.moodleadapter.dto.ForumDiscussionDto;
import es.ubu.lsi.moodleadapter.dto.ForumDto;
import es.ubu.lsi.moodleadapter.dto.ForumsResponseDto;
import es.ubu.lsi.moodleadapter.dto.PostsResponseDto;
import es.ubu.lsi.moodleadapter.service.moodle.MoodleService;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum.GetCourseForumsEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum.GetDiscussionPostsEndpoint;
import es.ubu.lsi.moodleadapter.service.moodle.endpoint.forum.GetForumDiscussionsEndpoint;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ForumService implements ForumsApiDelegate {

    /**
     * Service for orchestrating Moodle endpoint calls.
     */
    private final MoodleService moodleService;

    private final GetCourseForumsEndpoint getCourseForumsEndpoint;
    private final GetForumDiscussionsEndpoint getForumDiscussionsEndpoint;
    private final GetDiscussionPostsEndpoint getDiscussionPostsEndpoint;


    @Override
    public Mono<ResponseEntity<ForumsResponseDto>> getForums(List<Integer> courseids, List<String> include, ServerWebExchange exchange) {
        List<String> effectiveInclude = Optional.ofNullable(include).orElseGet(List::of);
        boolean includePosts = effectiveInclude.contains("posts");
        boolean includDiscussions = effectiveInclude.contains("discussions") || includePosts;

        return moodleService.callEndpoint(getCourseForumsEndpoint, courseids)
            .flatMapMany(Flux::fromIterable)
            .flatMapSequential(forum -> enrichForumOptional(
                    forum,
                    includDiscussions,
                    includePosts
                )
            )
            .collectList()
            .map(forums -> {
                ForumsResponseDto dto = new ForumsResponseDto();
                return dto.forums(forums);
            })
            .map(ResponseEntity::ok);
    }


    private Mono<ForumDto> enrichForumOptional(
        ForumDto forum,
        boolean includeDiscussions,
        boolean includePosts) {

        if (!includeDiscussions) {
            return Mono.just(forum);
        }

        return moodleService.callEndpoint(getForumDiscussionsEndpoint, forum.getId(), null, null, null, null)
            .map(ForumDiscussionDto::getDiscussions)
            .flatMapMany(Flux::fromIterable)
            .flatMap(discussion ->
                enrichDiscussionOptional(discussion, includePosts)
            )
            .collectList()
            .map(discussions -> {
                forum.setDiscussions(discussions);
                return forum;
            });
    }

    private Mono<DiscussionDto> enrichDiscussionOptional(
        DiscussionDto discussion,
        boolean includePosts) {

        if (!includePosts) {
            return Mono.just(discussion);
        }

        return moodleService.callEndpoint(getDiscussionPostsEndpoint, discussion.getDiscussion(), null, null, null)
            .map(resp -> {
                discussion.setPosts(resp.getPosts());
                return discussion;
            });
    }

    @Override
    public Mono<ResponseEntity<DiscussionsResponseDto>> getDiscussions(List<Integer> forumids, List<String> include, String sortorder, Integer page, Integer perpage, Integer groupid, ServerWebExchange exchange) {
        List<String> effectiveInclude = Optional.ofNullable(include).orElseGet(List::of);
        boolean includePosts = effectiveInclude.contains("posts");
        return Flux.fromIterable(forumids)
            .flatMapSequential(forumid -> moodleService.callEndpoint(getForumDiscussionsEndpoint, forumid, sortorder, page, perpage, groupid))
            .flatMap(forumDto -> Flux.fromIterable(forumDto.getDiscussions())
                .flatMap(discussion -> enrichDiscussionOptional(discussion, includePosts))
                .collectList()
                .map(enrichedDiscussions -> {
                    forumDto.setDiscussions(enrichedDiscussions);
                    return forumDto;
                })
            )
            .collectList()
            .map(dtos -> new DiscussionsResponseDto().forumdiscussions(dtos))
            .map(ResponseEntity::ok);
    }


    @Override
    public Mono<ResponseEntity<PostsResponseDto>> getPostsByDiscussionId(List<Integer> discussionids, String sortby, String sortdirection, Boolean includeinlineattachments, ServerWebExchange exchange) {
        return Flux.fromIterable(discussionids)
            .flatMapSequential(discussionid -> moodleService.callEndpoint(getDiscussionPostsEndpoint, discussionid, sortby, sortdirection, includeinlineattachments))
            .collectList()
            .map(posts -> {
                PostsResponseDto dto = new PostsResponseDto();
                return dto.discussionposts(posts);
            })
            .map(ResponseEntity::ok);
    }


}
