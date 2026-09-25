package com.miniblog.service;

import com.miniblog.domain.entity.Article;
import com.miniblog.domain.entity.ArticleStatus;
import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.ArticleCreateRequest;
import com.miniblog.dto.ArticleResponse;
import com.miniblog.dto.ArticleUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArticleServiceTest {

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ArticleService articleService;

    private User author;
    private User otherUser;
    private User admin;
    private Article draftArticle;
    private Article pendingArticle;
    private Article publishedArticle;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).email("author@example.com").role(Role.ROLE_USER).build();
        otherUser = User.builder().id(2L).email("other@example.com").role(Role.ROLE_USER).build();
        admin = User.builder().id(3L).email("admin@example.com").role(Role.ROLE_ADMIN).build();

        draftArticle = Article.builder()
                .id(10L)
                .title("Brouillon initial")
                .content("Contenu brouillon")
                .status(ArticleStatus.DRAFT)
                .author(author)
                .build();

        pendingArticle = Article.builder()
                .id(15L)
                .title("Article en attente")
                .content("Contenu soumis")
                .status(ArticleStatus.PENDING_REVIEW)
                .author(author)
                .build();

        publishedArticle = Article.builder()
                .id(20L)
                .title("Article public")
                .content("Contenu public")
                .status(ArticleStatus.PUBLISHED)
                .author(author)
                .build();
    }

    @Test
    void createArticle_AlwaysCreatesDraft() {
        ArticleCreateRequest req = new ArticleCreateRequest("Mon Titre", "Mon Contenu");
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> {
            Article a = inv.getArgument(0);
            a.setId(100L);
            return a;
        });

        ArticleResponse res = articleService.createArticle(req, "author@example.com");

        assertNotNull(res);
        assertEquals(ArticleStatus.DRAFT, res.getStatus());
        assertEquals("Mon Titre", res.getTitle());
    }

    @Test
    void submitArticle_AuthorCanSubmitDraft_SetsStatusToPendingReview() {
        when(articleRepository.findById(10L)).thenReturn(Optional.of(draftArticle));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.submitArticle(10L, "author@example.com");

        assertNotNull(res);
        assertEquals(ArticleStatus.PENDING_REVIEW, res.getStatus());
    }

    @Test
    void submitArticle_OtherUserCannotSubmitDraft_ThrowsAccessDenied() {
        when(articleRepository.findById(10L)).thenReturn(Optional.of(draftArticle));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> articleService.submitArticle(10L, "other@example.com"));
        verify(articleRepository, never()).save(any());
    }

    @Test
    void cancelSubmission_AuthorCanCancelPendingArticle_ReturnsToDraft() {
        when(articleRepository.findById(15L)).thenReturn(Optional.of(pendingArticle));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.cancelSubmission(15L, "author@example.com");

        assertNotNull(res);
        assertEquals(ArticleStatus.DRAFT, res.getStatus());
    }

    @Test
    void rejectArticle_AdminRejectsPendingArticle_ReturnsToDraft() {
        when(articleRepository.findById(15L)).thenReturn(Optional.of(pendingArticle));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.rejectArticle(15L);

        assertNotNull(res);
        assertEquals(ArticleStatus.DRAFT, res.getStatus());
    }

    @Test
    void updateArticle_AuthorCannotUpdatePendingArticle_ThrowsAccessDenied() {
        ArticleUpdateRequest req = new ArticleUpdateRequest("Nouveau Titre", "Nouveau Contenu");
        when(articleRepository.findById(15L)).thenReturn(Optional.of(pendingArticle));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));

        assertThrows(AccessDeniedException.class, () -> articleService.updateArticle(15L, req, "author@example.com"));
        verify(articleRepository, never()).save(any());
    }

    @Test
    void updateArticle_AuthorCanUpdateDraft() {
        ArticleUpdateRequest req = new ArticleUpdateRequest("Titre Modifié", "Contenu Modifié");
        when(articleRepository.findById(10L)).thenReturn(Optional.of(draftArticle));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.updateArticle(10L, req, "author@example.com");

        assertNotNull(res);
        assertEquals("Titre Modifié", res.getTitle());
    }

    @Test
    void updateArticle_AuthorCannotUpdatePublishedArticle_ThrowsAccessDenied() {
        ArticleUpdateRequest req = new ArticleUpdateRequest("Nouveau Titre", "Nouveau Contenu");
        when(articleRepository.findById(20L)).thenReturn(Optional.of(publishedArticle));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));

        assertThrows(AccessDeniedException.class, () -> articleService.updateArticle(20L, req, "author@example.com"));
        verify(articleRepository, never()).save(any());
    }

    @Test
    void updateArticle_OtherUserCannotUpdateDraft_ThrowsAccessDenied() {
        ArticleUpdateRequest req = new ArticleUpdateRequest("Nouveau Titre", "Nouveau Contenu");
        when(articleRepository.findById(10L)).thenReturn(Optional.of(draftArticle));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> articleService.updateArticle(10L, req, "other@example.com"));
    }

    @Test
    void updateArticle_AdminCanUpdatePublishedArticle() {
        ArticleUpdateRequest req = new ArticleUpdateRequest("Admin Edit", "Admin Content");
        when(articleRepository.findById(20L)).thenReturn(Optional.of(publishedArticle));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.updateArticle(20L, req, "admin@example.com");

        assertNotNull(res);
        assertEquals("Admin Edit", res.getTitle());
    }

    @Test
    void publishArticle_SetsStatusToPublished() {
        when(articleRepository.findById(15L)).thenReturn(Optional.of(pendingArticle));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.publishArticle(15L);

        assertNotNull(res);
        assertEquals(ArticleStatus.PUBLISHED, res.getStatus());
    }

    @Test
    void unpublishArticle_SetsStatusToDraft() {
        when(articleRepository.findById(20L)).thenReturn(Optional.of(publishedArticle));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleResponse res = articleService.unpublishArticle(20L);

        assertNotNull(res);
        assertEquals(ArticleStatus.DRAFT, res.getStatus());
    }
}
