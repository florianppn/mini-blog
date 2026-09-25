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
import com.miniblog.exception.BadRequestException;
import com.miniblog.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AccountService accountService;

    private User sampleUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(10L)
                .email("user@example.com")
                .password("encoded_pass")
                .role(Role.ROLE_USER)
                .createdAt(Instant.now())
                .build();

        adminUser = User.builder()
                .id(1L)
                .email("admin@miniblog.com")
                .password("encoded_admin")
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Changement d'email réussi avec mot de passe correct")
    void changeEmail_Success() {
        EmailChangeRequest req = new EmailChangeRequest("newemail@example.com", "password123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt.token.new");

        AuthResponse res = accountService.changeEmail("user@example.com", req);

        assertThat(res).isNotNull();
        assertThat(res.getToken()).isEqualTo("jwt.token.new");
        assertThat(sampleUser.getEmail()).isEqualTo("newemail@example.com");
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Changement d'email échoue si mot de passe incorrect")
    void changeEmail_WrongPassword_ThrowsBadRequest() {
        EmailChangeRequest req = new EmailChangeRequest("newemail@example.com", "wrongpass");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", "encoded_pass")).thenReturn(false);

        assertThatThrownBy(() -> accountService.changeEmail("user@example.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mot de passe actuel incorrect");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Changement d'email échoue si l'email existe déjà")
    void changeEmail_EmailAlreadyExists_ThrowsBadRequest() {
        EmailChangeRequest req = new EmailChangeRequest("existing@example.com", "password123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> accountService.changeEmail("user@example.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà utilisée");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Changement de mot de passe réussi")
    void changePassword_Success() {
        PasswordChangeRequest req = new PasswordChangeRequest("oldpass", "newpass123", "newpass123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldpass", "encoded_pass")).thenReturn(true);
        when(passwordEncoder.matches("newpass123", "encoded_pass")).thenReturn(false);
        when(passwordEncoder.encode("newpass123")).thenReturn("encoded_newpass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt.token.newpass");

        AuthResponse res = accountService.changePassword("user@example.com", req);

        assertThat(res).isNotNull();
        assertThat(res.getToken()).isEqualTo("jwt.token.newpass");
        assertThat(sampleUser.getPassword()).isEqualTo("encoded_newpass");
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Changement de mot de passe échoue si confirmation non identique")
    void changePassword_MismatchConfirm_ThrowsBadRequest() {
        PasswordChangeRequest req = new PasswordChangeRequest("oldpass", "newpass123", "different123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldpass", "encoded_pass")).thenReturn(true);

        assertThatThrownBy(() -> accountService.changePassword("user@example.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ne correspondent pas");
    }

    @Test
    @DisplayName("Suppression de compte réussie avec suppression en cascade")
    void deleteAccount_Success() {
        AccountDeleteRequest req = new AccountDeleteRequest("password123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);

        accountService.deleteAccount("user@example.com", req);

        verify(commentRepository).deleteByAuthorId(10L);
        verify(commentRepository).deleteByArticleAuthorId(10L);
        verify(articleRepository).deleteByAuthor(sampleUser);
        verify(userRepository).delete(sampleUser);
    }

    @Test
    @DisplayName("Suppression du compte administrateur interdite")
    void deleteAccount_AdminAccount_ThrowsBadRequest() {
        AccountDeleteRequest req = new AccountDeleteRequest("adminpass");

        when(userRepository.findByEmail("admin@miniblog.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("adminpass", "encoded_admin")).thenReturn(true);

        assertThatThrownBy(() -> accountService.deleteAccount("admin@miniblog.com", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("administrateur ne peut pas être supprimé");

        verify(userRepository, never()).delete(any());
    }
}
