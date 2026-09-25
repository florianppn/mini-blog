package com.miniblog.service;

import com.miniblog.domain.entity.*;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.CommentRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.CommentCreateRequest;
import com.miniblog.dto.CommentResponse;
import com.miniblog.dto.CommentUpdateRequest;
import com.miniblog.exception.BadRequestException;
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
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    private User author;
    private User otherUser;
    private User admin;
    private Article publishedArticle;
    private Article draftArticle;
    private Comment comment;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).email("author@example.com").role(Role.ROLE_USER).build();
        otherUser = User.builder().id(2L).email("other@example.com").role(Role.ROLE_USER).build();
        admin = User.builder().id(3L).email("admin@example.com").role(Role.ROLE_ADMIN).build();

        publishedArticle = Article.builder()
                .id(10L)
                .title("Article public")
                .status(ArticleStatus.PUBLISHED)
                .author(author)
                .build();

        draftArticle = Article.builder()
                .id(20L)
                .title("Brouillon")
                .status(ArticleStatus.DRAFT)
                .author(author)
                .build();

        comment = Comment.builder()
                .id(100L)
                .content("Super article !")
                .article(publishedArticle)
                .author(author)
                .build();
    }

    @Test
    void createComment_OnPublishedArticle_Success() {
        CommentCreateRequest req = new CommentCreateRequest("Super article !");
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.findById(10L)).thenReturn(Optional.of(publishedArticle));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        CommentResponse res = commentService.createComment(10L, req, "author@example.com");

        assertNotNull(res);
        assertEquals("Super article !", res.getContent());
    }

    @Test
    void createComment_OnDraftArticle_ThrowsBadRequestException() {
        CommentCreateRequest req = new CommentCreateRequest("Commentaire interdit sur brouillon");
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(articleRepository.findById(20L)).thenReturn(Optional.of(draftArticle));

        assertThrows(BadRequestException.class, () -> commentService.createComment(20L, req, "author@example.com"));
        verify(commentRepository, never()).save(any());
    }

    @Test
    void updateComment_AuthorCanUpdate() {
        CommentUpdateRequest req = new CommentUpdateRequest("Commentaire corrigé");
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        CommentResponse res = commentService.updateComment(100L, req, "author@example.com");

        assertNotNull(res);
        assertEquals("Commentaire corrigé", res.getContent());
    }

    @Test
    void updateComment_OtherUserCannotUpdate_ThrowsAccessDenied() {
        CommentUpdateRequest req = new CommentUpdateRequest("Piratage de commentaire");
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> commentService.updateComment(100L, req, "other@example.com"));
    }

    @Test
    void deleteComment_AuthorCanDelete() {
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail("author@example.com")).thenReturn(Optional.of(author));

        assertDoesNotThrow(() -> commentService.deleteComment(100L, "author@example.com"));
        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteComment_AdminCanDeleteAnyComment() {
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        assertDoesNotThrow(() -> commentService.deleteComment(100L, "admin@example.com"));
        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteComment_OtherUserCannotDelete_ThrowsAccessDenied() {
        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> commentService.deleteComment(100L, "other@example.com"));
        verify(commentRepository, never()).delete(any());
    }
}
