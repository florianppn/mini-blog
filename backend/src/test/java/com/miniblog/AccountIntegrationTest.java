package com.miniblog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniblog.domain.entity.Role;
import com.miniblog.domain.entity.User;
import com.miniblog.domain.repository.ArticleRepository;
import com.miniblog.domain.repository.CommentRepository;
import com.miniblog.domain.repository.UserRepository;
import com.miniblog.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AccountIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String tokenAuthor;
    private String tokenAdmin;

    @BeforeEach
    void setupData() throws Exception {
        commentRepository.deleteAll();
        articleRepository.deleteAll();
        userRepository.deleteAll();

        // Création auteur
        RegisterRequest reg = new RegisterRequest("author@example.com", "AuthorPass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        tokenAuthor = "Bearer " + json.get("token").asText();

        // Création admin
        User admin = User.builder()
                .email("admin@example.com")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build();
        userRepository.save(admin);

        LoginRequest loginAdmin = new LoginRequest("admin@example.com", "AdminPass123!");
        MvcResult resAdmin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAdmin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode jsonAdmin = objectMapper.readTree(resAdmin.getResponse().getContentAsString());
        tokenAdmin = "Bearer " + jsonAdmin.get("token").asText();
    }

    @Test
    @DisplayName("Intégration : Changement d'email avec mise à jour du profil et validation")
    void changeEmail_EndToEnd() throws Exception {
        EmailChangeRequest request = new EmailChangeRequest("newauthor@example.com", "AuthorPass123!");

        MvcResult patchRes = mockMvc.perform(patch("/api/account/email")
                        .header("Authorization", tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("newauthor@example.com"))
                .andReturn();

        JsonNode patchJson = objectMapper.readTree(patchRes.getResponse().getContentAsString());
        String newToken = "Bearer " + patchJson.get("token").asText();

        // Vérifier que GET /api/auth/me avec le nouveau token retourne bien la nouvelle adresse
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newauthor@example.com"));

        // Vérifier persistance en base
        assertThat(userRepository.existsByEmail("newauthor@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("author@example.com")).isFalse();
    }

    @Test
    @DisplayName("Intégration : Changement de mot de passe puis ré-authentification avec le nouveau")
    void changePassword_EndToEnd() throws Exception {
        PasswordChangeRequest request = new PasswordChangeRequest(
                "AuthorPass123!",
                "BrandNewSecret999!",
                "BrandNewSecret999!"
        );

        mockMvc.perform(patch("/api/account/password")
                        .header("Authorization", tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // L'ancien mot de passe ne doit plus fonctionner
        LoginRequest oldLogin = new LoginRequest("author@example.com", "AuthorPass123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // Le nouveau mot de passe doit fonctionner
        LoginRequest newLogin = new LoginRequest("author@example.com", "BrandNewSecret999!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Intégration : Suppression de compte avec suppression en cascade des articles et commentaires")
    void deleteAccount_EndToEnd_Cascade() throws Exception {
        // 1. L'auteur crée un article
        ArticleCreateRequest artReq = new ArticleCreateRequest("Article de l'auteur", "Contenu de test");
        MvcResult artRes = mockMvc.perform(post("/api/articles")
                        .header("Authorization", tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(artReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long articleId = objectMapper.readTree(artRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Publication de l'article par l'admin pour pouvoir commenter
        mockMvc.perform(patch("/api/articles/" + articleId + "/publish")
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk());

        // 3. L'auteur poste un commentaire
        CommentCreateRequest comReq = new CommentCreateRequest("Mon commentaire sur mon propre article");
        mockMvc.perform(post("/api/articles/" + articleId + "/comments")
                        .header("Authorization", tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(comReq)))
                .andExpect(status().isCreated());

        assertThat(articleRepository.count()).isEqualTo(1);
        assertThat(commentRepository.count()).isEqualTo(1);
        assertThat(userRepository.existsByEmail("author@example.com")).isTrue();

        // 4. L'auteur supprime son compte avec son mot de passe
        AccountDeleteRequest delReq = new AccountDeleteRequest("AuthorPass123!");
        mockMvc.perform(delete("/api/account")
                        .header("Authorization", tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(delReq)))
                .andExpect(status().isNoContent());

        // 5. Vérification de la cascade complète en base
        assertThat(userRepository.existsByEmail("author@example.com")).isFalse();
        assertThat(articleRepository.count()).isEqualTo(0);
        assertThat(commentRepository.count()).isEqualTo(0);
        // L'admin doit être préservé
        assertThat(userRepository.existsByEmail("admin@example.com")).isTrue();
    }

    @Test
    @DisplayName("Intégration : L'administrateur ne peut pas supprimer son compte via /api/account")
    void deleteAccount_AdminBlocked() throws Exception {
        AccountDeleteRequest delReq = new AccountDeleteRequest("AdminPass123!");

        mockMvc.perform(delete("/api/account")
                        .header("Authorization", tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(delReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le compte administrateur ne peut pas être supprimé"));

        assertThat(userRepository.existsByEmail("admin@example.com")).isTrue();
    }
}
