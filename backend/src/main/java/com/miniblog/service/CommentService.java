package com.miniblog.service;

import com.miniblog.domain.entity.Article;
import com.miniblog.domain.entity.ArticleStatus;
import com.miniblog.domain.entity.Comment;
import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.CommentRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.CommentCreateRequest;
import com.miniblog.dto.CommentResponse;
import com.miniblog.dto.CommentUpdateRequest;
import com.miniblog.exception.BadRequestException;
import com.miniblog.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, ArticleRepository articleRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponse createComment(Long articleId, CommentCreateRequest request, String userEmail) {
        User currentUser = findUserOrThrow(userEmail);
        if (currentUser.getRole() == Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Les administrateurs ne peuvent pas poster de commentaires.");
        }
        Article article = findArticleOrThrow(articleId);

        // Règle : Seuls les articles PUBLISHED peuvent recevoir des commentaires
        if (article.getStatus() != ArticleStatus.PUBLISHED) {
            throw new BadRequestException("Impossible de commenter un article au statut DRAFT. L'article doit être publié.");
        }

        Comment comment = Comment.builder()
                .content(request.getContent().trim())
                .article(article)
                .author(currentUser)
                .build();

        Comment savedComment = commentRepository.save(comment);
        return CommentResponse.fromEntity(savedComment);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByArticle(Long articleId, String userEmail, Pageable pageable) {
        Article article = findArticleOrThrow(articleId);

        // Si l'article est DRAFT, vérification de visibilité
        if (article.getStatus() == ArticleStatus.DRAFT) {
            User currentUser = getCurrentUserOrNull(userEmail);
            if (currentUser == null || (currentUser.getRole() != Role.ROLE_ADMIN && !article.getAuthor().getId().equals(currentUser.getId()))) {
                throw new AccessDeniedException("Vous n'êtes pas autorisé à accéder aux commentaires d'un brouillon");
            }
        }

        return commentRepository.findByArticleIdOrderByCreatedAtDesc(articleId, pageable)
                .map(CommentResponse::fromEntity);
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, CommentUpdateRequest request, String userEmail) {
        Comment comment = findCommentOrThrow(commentId);
        User currentUser = findUserOrThrow(userEmail);

        // Seul l'auteur peut modifier son propre commentaire
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Seul l'auteur peut modifier son commentaire");
        }

        comment.setContent(request.getContent().trim());
        Comment updatedComment = commentRepository.save(comment);
        return CommentResponse.fromEntity(updatedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        Comment comment = findCommentOrThrow(commentId);
        User currentUser = findUserOrThrow(userEmail);

        // L'auteur du commentaire OU un administrateur peut supprimer le commentaire
        if (currentUser.getRole() != Role.ROLE_ADMIN && !comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer ce commentaire");
        }

        commentRepository.delete(comment);
    }

    private Article findArticleOrThrow(Long articleId) {
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable avec l'id : " + articleId));
    }

    private Comment findCommentOrThrow(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable avec l'id : " + commentId));
    }

    private User findUserOrThrow(String userEmail) {
        if (userEmail == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'email : " + userEmail));
    }

    private User getCurrentUserOrNull(String userEmail) {
        if (userEmail == null) {
            return null;
        }
        return userRepository.findByEmail(userEmail).orElse(null);
    }
}
