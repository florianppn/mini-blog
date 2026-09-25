package com.miniblog.service;

import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.CommentRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.AccountDeleteRequest;
import com.miniblog.dto.AuthResponse;
import com.miniblog.dto.EmailChangeRequest;
import com.miniblog.dto.PasswordChangeRequest;
import com.miniblog.dto.UserResponse;
import com.miniblog.exception.BadRequestException;
import com.miniblog.exception.ResourceNotFoundException;
import com.miniblog.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AccountService(
            UserRepository userRepository,
            ArticleRepository articleRepository,
            CommentRepository commentRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
        this.commentRepository = commentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse changeEmail(String currentEmail, EmailChangeRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mot de passe actuel incorrect");
        }

        String targetEmail = request.getNewEmail().toLowerCase().trim();
        if (targetEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("La nouvelle adresse email est identique à l'adresse actuelle");
        }

        if (userRepository.existsByEmail(targetEmail)) {
            throw new BadRequestException("Cette adresse email est déjà utilisée par un autre compte");
        }

        user.setEmail(targetEmail);
        User savedUser = userRepository.save(user);

        String newToken = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(newToken)
                .type("Bearer")
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }

    @Transactional
    public AuthResponse changePassword(String email, PasswordChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Ancien mot de passe incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Le nouveau mot de passe et sa confirmation ne correspondent pas");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("Le nouveau mot de passe doit être différent de l'ancien mot de passe");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        User savedUser = userRepository.save(user);

        String newToken = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(newToken)
                .type("Bearer")
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }

    @Transactional
    public void deleteAccount(String email, AccountDeleteRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mot de passe actuel incorrect");
        }

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Le compte administrateur ne peut pas être supprimé");
        }

        // 1. Supprimer les commentaires rédigés par l'utilisateur
        commentRepository.deleteByAuthorId(user.getId());

        // 2. Supprimer les commentaires postés sur les articles de l'utilisateur
        commentRepository.deleteByArticleAuthorId(user.getId());

        // 3. Supprimer tous les articles de l'utilisateur
        articleRepository.deleteByAuthor(user);

        // 4. Supprimer le compte utilisateur
        userRepository.delete(user);
    }
}
