package com.miniblog.security;

import com.miniblog.domain.entity.Comment;
import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.CommentRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("commentSecurity")
public class CommentSecurity {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public CommentSecurity(CommentRepository commentRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    public boolean canEdit(Long commentId, String userEmail) {
        Comment comment = getCommentOrThrow(commentId);
        User user = getUserOrNull(userEmail);
        if (user == null) {
            return false;
        }

        // Seul l'auteur peut modifier son commentaire
        return comment.getAuthor().getId().equals(user.getId());
    }

    public boolean canDelete(Long commentId, String userEmail) {
        Comment comment = getCommentOrThrow(commentId);
        User user = getUserOrNull(userEmail);
        if (user == null) {
            return false;
        }

        // L'admin peut modérer (supprimer) n'importe quel commentaire
        if (user.getRole() == Role.ROLE_ADMIN) {
            return true;
        }

        // L'auteur peut supprimer son propre commentaire
        return comment.getAuthor().getId().equals(user.getId());
    }

    private Comment getCommentOrThrow(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable avec l'id : " + commentId));
    }

    private User getUserOrNull(String userEmail) {
        if (userEmail == null) {
            return null;
        }
        Optional<User> user = userRepository.findByEmail(userEmail);
        return user.orElse(null);
    }
}
