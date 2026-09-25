package com.miniblog.service;

import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.UserResponse;
import com.miniblog.exception.BadRequestException;
import com.miniblog.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String currentAdminEmail) {
        User currentAdmin = findUserOrThrow(currentAdminEmail);
        if (currentAdmin.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Accès réservé aux administrateurs");
        }
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional
    public UserResponse updateUserRole(Long targetUserId, Role newRole, String currentAdminEmail) {
        User currentAdmin = findUserOrThrow(currentAdminEmail);
        if (currentAdmin.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Accès réservé aux administrateurs");
        }

        if (newRole == Role.ROLE_ADMIN) {
            throw new BadRequestException("Impossible d'attribuer le rôle administrateur.");
        }

        if (newRole != Role.ROLE_USER && newRole != Role.ROLE_MODERATOR) {
            throw new BadRequestException("Rôle cible non autorisé. Seuls ROLE_USER et ROLE_MODERATOR sont acceptés.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'id : " + targetUserId));

        if (targetUser.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Impossible de modifier le rôle du compte administrateur.");
        }

        targetUser.setRole(newRole);
        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    private User findUserOrThrow(String email) {
        if (email == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'email : " + email));
    }
}
