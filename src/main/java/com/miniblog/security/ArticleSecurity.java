package com.miniblog.security;

import com.miniblog.domain.entity.Article;
import com.miniblog.domain.entity.ArticleStatus;
import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("articleSecurity")
public class ArticleSecurity {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public ArticleSecurity(ArticleRepository articleRepository, UserRepository userRepository) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
    }

    public boolean canEdit(Long articleId, String userEmail) {
        Article article = getArticleOrThrow(articleId);
        User user = getUserOrNull(userEmail);
        if (user == null) {
            return false;
        }

        // L'administrateur peut tout modifier
        if (user.getRole() == Role.ROLE_ADMIN) {
            return true;
        }

        // L'auteur peut modifier uniquement si l'article est encore en DRAFT
        return article.getAuthor().getId().equals(user.getId()) && article.getStatus() == ArticleStatus.DRAFT;
    }

    public boolean canDelete(Long articleId, String userEmail) {
        return canEdit(articleId, userEmail);
    }

    public boolean canView(Long articleId, String userEmail) {
        Article article = getArticleOrThrow(articleId);

        // Si l'article est publié, tout le monde (même anonyme) peut le voir
        if (article.getStatus() == ArticleStatus.PUBLISHED) {
            return true;
        }

        User user = getUserOrNull(userEmail);
        if (user == null) {
            return false;
        }

        // L'admin peut voir tous les brouillons
        if (user.getRole() == Role.ROLE_ADMIN) {
            return true;
        }

        // L'auteur peut voir ses propres brouillons
        return article.getAuthor().getId().equals(user.getId());
    }

    private Article getArticleOrThrow(Long articleId) {
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable avec l'id : " + articleId));
    }

    private User getUserOrNull(String userEmail) {
        if (userEmail == null) {
            return null;
        }
        Optional<User> user = userRepository.findByEmail(userEmail);
        return user.orElse(null);
    }
}
