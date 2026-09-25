package com.miniblog.service;

import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.UserResponse;
import com.miniblog.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User normalUser;
    private User moderatorUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .email("admin@miniblog.local")
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build();

        normalUser = User.builder()
                .id(2L)
                .email("author@miniblog.local")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build();

        moderatorUser = User.builder()
                .id(3L)
                .email("mod@miniblog.local")
                .role(Role.ROLE_MODERATOR)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("L'administrateur peut lister tous les utilisateurs")
    void getAllUsers_AdminSuccess() {
        when(userRepository.findByEmail("admin@miniblog.local")).thenReturn(Optional.of(adminUser));
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of(adminUser, normalUser, moderatorUser));

        List<UserResponse> result = userService.getAllUsers("admin@miniblog.local");

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("Un utilisateur ordinaire ne peut pas lister les utilisateurs")
    void getAllUsers_UserForbidden() {
        when(userRepository.findByEmail("author@miniblog.local")).thenReturn(Optional.of(normalUser));

        assertThatThrownBy(() -> userService.getAllUsers("author@miniblog.local"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Accès réservé aux administrateurs");
    }

    @Test
    @DisplayName("Promotion d'un auteur en modérateur avec succès")
    void updateUserRole_PromoteToModerator_Success() {
        when(userRepository.findByEmail("admin@miniblog.local")).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateUserRole(2L, Role.ROLE_MODERATOR, "admin@miniblog.local");

        assertThat(response.getRole()).isEqualTo(Role.ROLE_MODERATOR);
        verify(userRepository).save(normalUser);
    }

    @Test
    @DisplayName("Rétrogradation d'un modérateur en auteur avec succès")
    void updateUserRole_DemoteToUser_Success() {
        when(userRepository.findByEmail("admin@miniblog.local")).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(moderatorUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateUserRole(3L, Role.ROLE_USER, "admin@miniblog.local");

        assertThat(response.getRole()).isEqualTo(Role.ROLE_USER);
        verify(userRepository).save(moderatorUser);
    }

    @Test
    @DisplayName("Interdiction stricte de promouvoir un compte en ROLE_ADMIN")
    void updateUserRole_PromoteToAdmin_ThrowsBadRequest() {
        when(userRepository.findByEmail("admin@miniblog.local")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> userService.updateUserRole(2L, Role.ROLE_ADMIN, "admin@miniblog.local"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Impossible d'attribuer le rôle administrateur");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Interdiction stricte de modifier le rôle du compte administrateur")
    void updateUserRole_ChangeAdminAccountRole_ThrowsBadRequest() {
        when(userRepository.findByEmail("admin@miniblog.local")).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> userService.updateUserRole(1L, Role.ROLE_USER, "admin@miniblog.local"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Impossible de modifier le rôle du compte administrateur");

        verify(userRepository, never()).save(any());
    }
}
