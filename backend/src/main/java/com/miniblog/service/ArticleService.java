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
import com.miniblog.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public ArticleService(ArticleRepository articleRepository, UserRepository userRepository) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<ArticleResponse> getAllArticles(String userEmail, ArticleStatus status, Pageable pageable) {
        User currentUser = getCurrentUserOrNull(userEmail);

        // Cas 1 : Visiteur anonyme -> uniquement les articles publiés
        if (currentUser == null) {
            if (status != null && status != ArticleStatus.PUBLISHED) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
            return articleRepository.findByStatus(ArticleStatus.PUBLISHED, pageable)
                    .map(ArticleResponse::fromEntity);
        }

        // Cas 2 : Administrateur -> peut filtrer par statut ; par défaut voit PENDING_REVIEW et PUBLISHED
        if (currentUser.getRole() == Role.ROLE_ADMIN) {
            if (status != null) {
                return articleRepository.findByStatus(status, pageable)
                        .map(ArticleResponse::fromEntity);
            }
            return articleRepository.findByStatusIn(List.of(ArticleStatus.PENDING_REVIEW, ArticleStatus.PUBLISHED), pageable)
                    .map(ArticleResponse::fromEntity);
        }

        // Cas 3 : Utilisateur régulier (USER)
        if (status == ArticleStatus.PUBLISHED) {
            return articleRepository.findByStatus(ArticleStatus.PUBLISHED, pageable)
                    .map(ArticleResponse::fromEntity);
        } else if (status == ArticleStatus.DRAFT) {
            return articleRepository.findByStatusAndAuthor(ArticleStatus.DRAFT, currentUser, pageable)
                    .map(ArticleResponse::fromEntity);
        } else if (status == ArticleStatus.PENDING_REVIEW) {
            return articleRepository.findByStatusAndAuthor(ArticleStatus.PENDING_REVIEW, currentUser, pageable)
                    .map(ArticleResponse::fromEntity);
        } else {
            // Par défaut sur le flux public, ne renvoie que les publiés
            return articleRepository.findByStatus(ArticleStatus.PUBLISHED, pageable)
                    .map(ArticleResponse::fromEntity);
        }
    }

    @Transactional(readOnly = true)
    public Page<ArticleResponse> getMyArticles(String userEmail, Pageable pageable) {
        User currentUser = findUserOrThrow(userEmail);
        return articleRepository.findByAuthorAndStatusIn(currentUser, List.of(ArticleStatus.DRAFT, ArticleStatus.PENDING_REVIEW), pageable)
                .map(ArticleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ArticleResponse getArticleById(Long id, String userEmail) {
        Article article = findArticleOrThrow(id);

        if (article.getStatus() == ArticleStatus.PUBLISHED) {
            return ArticleResponse.fromEntity(article);
        }

        User currentUser = getCurrentUserOrNull(userEmail);
        if (currentUser == null) {
            throw new AccessDeniedException("Cet article n'est pas accessible aux utilisateurs non connectés");
        }

        if (currentUser.getRole() == Role.ROLE_ADMIN || article.getAuthor().getId().equals(currentUser.getId())) {
            return ArticleResponse.fromEntity(article);
        }

        throw new AccessDeniedException("Vous n'êtes pas autorisé à consulter cet article");
    }

    @Transactional
    public ArticleResponse createArticle(ArticleCreateRequest request, String userEmail) {
        User currentUser = findUserOrThrow(userEmail);

        Article article = Article.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .status(ArticleStatus.DRAFT) // Toujours créé en DRAFT
                .author(currentUser)
                .build();

        Article savedArticle = articleRepository.save(article);
        return ArticleResponse.fromEntity(savedArticle);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleUpdateRequest request, String userEmail) {
        Article article = findArticleOrThrow(id);
        User currentUser = findUserOrThrow(userEmail);

        if (currentUser.getRole() != Role.ROLE_ADMIN) {
            if (!article.getAuthor().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Vous n'êtes pas l'auteur de cet article");
            }
            if (article.getStatus() == ArticleStatus.PENDING_REVIEW) {
                throw new AccessDeniedException("Cet article est en attente de validation. Veuillez annuler la soumission pour pouvoir le modifier.");
            }
            if (article.getStatus() != ArticleStatus.DRAFT) {
                throw new AccessDeniedException("Les articles publiés ne peuvent plus être modifiés par leur auteur (réservé à l'administrateur)");
            }
        }

        article.setTitle(request.getTitle().trim());
        article.setContent(request.getContent().trim());
        article.setUpdatedAt(Instant.now());

        Article updatedArticle = articleRepository.save(article);
        return ArticleResponse.fromEntity(updatedArticle);
    }

    @Transactional
    public void deleteArticle(Long id, String userEmail) {
        Article article = findArticleOrThrow(id);
        User currentUser = findUserOrThrow(userEmail);

        if (currentUser.getRole() != Role.ROLE_ADMIN) {
            if (!article.getAuthor().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Vous n'êtes pas l'auteur de cet article");
            }
            if (article.getStatus() != ArticleStatus.DRAFT) {
                throw new AccessDeniedException("Seuls les brouillons peuvent être supprimés par leur auteur");
            }
        }

        articleRepository.delete(article);
    }

    @Transactional
    public ArticleResponse submitArticle(Long id, String userEmail) {
        Article article = findArticleOrThrow(id);
        User currentUser = findUserOrThrow(userEmail);

        if (currentUser.getRole() != Role.ROLE_ADMIN && !article.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas l'auteur de cet article");
        }

        if (article.getStatus() != ArticleStatus.DRAFT) {
            throw new IllegalStateException("Seul un article au statut DRAFT peut être soumis pour validation.");
        }

        article.setStatus(ArticleStatus.PENDING_REVIEW);
        article.setUpdatedAt(Instant.now());
        Article saved = articleRepository.save(article);
        return ArticleResponse.fromEntity(saved);
    }

    @Transactional
    public ArticleResponse cancelSubmission(Long id, String userEmail) {
        Article article = findArticleOrThrow(id);
        User currentUser = findUserOrThrow(userEmail);

        if (currentUser.getRole() != Role.ROLE_ADMIN && !article.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas l'auteur de cet article");
        }

        if (article.getStatus() != ArticleStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Seul un article en attente de validation peut voir sa soumission annulée.");
        }

        article.setStatus(ArticleStatus.DRAFT);
        article.setUpdatedAt(Instant.now());
        Article saved = articleRepository.save(article);
        return ArticleResponse.fromEntity(saved);
    }

    @Transactional
    public ArticleResponse rejectArticle(Long id) {
        Article article = findArticleOrThrow(id);

        if (article.getStatus() != ArticleStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Seul un article en attente de validation peut être rejeté.");
        }

        article.setStatus(ArticleStatus.DRAFT);
        article.setUpdatedAt(Instant.now());
        Article saved = articleRepository.save(article);
        return ArticleResponse.fromEntity(saved);
    }

    @Transactional
    public ArticleResponse publishArticle(Long id) {
        Article article = findArticleOrThrow(id);
        article.setStatus(ArticleStatus.PUBLISHED);
        article.setUpdatedAt(Instant.now());
        Article saved = articleRepository.save(article);
        return ArticleResponse.fromEntity(saved);
    }

    @Transactional
    public ArticleResponse unpublishArticle(Long id) {
        Article article = findArticleOrThrow(id);
        article.setStatus(ArticleStatus.DRAFT);
        article.setUpdatedAt(Instant.now());
        Article saved = articleRepository.save(article);
        return ArticleResponse.fromEntity(saved);
    }

    private Article findArticleOrThrow(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable avec l'id : " + id));
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
        Optional<User> user = userRepository.findByEmail(userEmail);
        return user.orElse(null);
    }
}
