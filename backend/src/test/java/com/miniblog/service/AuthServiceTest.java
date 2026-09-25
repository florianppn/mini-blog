package com.miniblog.service;

import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.AuthResponse;
import com.miniblog.dto.LoginRequest;
import com.miniblog.dto.RegisterRequest;
import com.miniblog.exception.BadRequestException;
import com.miniblog.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_pass")
                .role(Role.ROLE_USER)
                .build();
    }

    @Test
    void register_Success() {
        RegisterRequest req = new RegisterRequest("test@example.com", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt.token.mock");

        AuthResponse res = authService.register(req);

        assertNotNull(res);
        assertEquals("jwt.token.mock", res.getToken());
        assertEquals("test@example.com", res.getUser().getEmail());
        assertEquals(Role.ROLE_USER, res.getUser().getRole());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsBadRequestException() {
        RegisterRequest req = new RegisterRequest("test@example.com", "password123");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_Success() {
        LoginRequest req = new LoginRequest("test@example.com", "password123");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt.token.mock");

        AuthResponse res = authService.login(req);

        assertNotNull(res);
        assertEquals("jwt.token.mock", res.getToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
