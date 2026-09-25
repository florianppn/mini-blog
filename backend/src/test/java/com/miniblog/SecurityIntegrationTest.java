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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String tokenUserA;
    private String tokenUserB;
    private String tokenAdmin;

    @BeforeEach
    void setupData() throws Exception {
        commentRepository.deleteAll();
        articleRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Inscription User A
        RegisterRequest regA = new RegisterRequest("usera@example.com", "password123");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode jsonA = objectMapper.readTree(resA.getResponse().getContentAsString());
        tokenUserA = "Bearer " + jsonA.get("token").asText();

        // 2. Inscription User B
        RegisterRequest regB = new RegisterRequest("userb@example.com", "password123");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode jsonB = objectMapper.readTree(resB.getResponse().getContentAsString());
        tokenUserB = "Bearer " + jsonB.get("token").asText();

        // 3. Création manuelle d'un ADMIN
        User admin = User.builder()
                .email("admin@example.com")
                .password(passwordEncoder.encode("adminPass123!"))
                .role(Role.ROLE_ADMIN)
                .createdAt(Instant.now())
                .build();
        userRepository.save(admin);

        LoginRequest loginAdmin = new LoginRequest("admin@example.com", "adminPass123!");
        MvcResult resAdmin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAdmin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode jsonAdmin = objectMapper.readTree(resAdmin.getResponse().getContentAsString());
        tokenAdmin = "Bearer " + jsonAdmin.get("token").asText();
    }

    @Test
    void fullSecurityLifecycleTest() throws Exception {
        // --- ÉTAPE 1 : User A crée un article (forcé à DRAFT) ---
        ArticleCreateRequest createReq = new ArticleCreateRequest("Mon premier brouillon", "Contenu secret");
        MvcResult createRes = mockMvc.perform(post("/api/articles")
                        .header("Authorization", tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.title").value("Mon premier brouillon"))
                .andReturn();

        JsonNode articleJson = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long articleId = articleJson.get("id").asLong();

        // --- ÉTAPE 2 : Visiteur anonyme GET /api/articles ne voit pas le draft ---
        mockMvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // --- ÉTAPE 3 : Visiteur anonyme GET /api/articles/{id} -> 403 Forbidden ---
        mockMvc.perform(get("/api/articles/" + articleId))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 4 : User B essaie de voir le draft de User A -> 403 Forbidden ---
        mockMvc.perform(get("/api/articles/" + articleId)
                        .header("Authorization", tokenUserB))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 5 : User A peut voir et modifier son propre draft ---
        mockMvc.perform(get("/api/articles/" + articleId)
                        .header("Authorization", tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Mon premier brouillon"));

        ArticleUpdateRequest updateReq = new ArticleUpdateRequest("Titre modifié par A", "Nouveau contenu");
        mockMvc.perform(put("/api/articles/" + articleId)
                        .header("Authorization", tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Titre modifié par A"));

        // --- ÉTAPE 6 : User B tente de modifier le draft de A -> 403 Forbidden ---
        mockMvc.perform(put("/api/articles/" + articleId)
                        .header("Authorization", tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 7 : User A tente de publier son article -> 403 Forbidden (seul l'admin peut) ---
        mockMvc.perform(patch("/api/articles/" + articleId + "/publish")
                        .header("Authorization", tokenUserA))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 8 : L'administrateur publie l'article ---
        mockMvc.perform(patch("/api/articles/" + articleId + "/publish")
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        // --- ÉTAPE 9 : Visiteur anonyme peut désormais lire l'article publié ---
        mockMvc.perform(get("/api/articles/" + articleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.title").value("Titre modifié par A"));

        mockMvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

        // --- ÉTAPE 10 : Règle stricte : User A ne peut PLUS modifier son article une fois PUBLISHED ---
        ArticleUpdateRequest tryEditPublished = new ArticleUpdateRequest("Tentative de modification", "Interdit");
        mockMvc.perform(put("/api/articles/" + articleId)
                        .header("Authorization", tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tryEditPublished)))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 11 : Règle stricte : User A ne peut PLUS supprimer son article une fois PUBLISHED ---
        mockMvc.perform(delete("/api/articles/" + articleId)
                        .header("Authorization", tokenUserA))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 12 : User B commente l'article publié ---
        CommentCreateRequest commentReq = new CommentCreateRequest("Excellent article rédigé par A !");
        MvcResult commentRes = mockMvc.perform(post("/api/articles/" + articleId + "/comments")
                        .header("Authorization", tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Excellent article rédigé par A !"))
                .andReturn();

        JsonNode commentJson = objectMapper.readTree(commentRes.getResponse().getContentAsString());
        long commentId = commentJson.get("id").asLong();

        // --- ÉTAPE 13 : User A tente de supprimer le commentaire de B -> 403 Forbidden ---
        mockMvc.perform(delete("/api/comments/" + commentId)
                        .header("Authorization", tokenUserA))
                .andExpect(status().isForbidden());

        // --- ÉTAPE 14 : L'administrateur peut modérer (supprimer) le commentaire de B ---
        mockMvc.perform(delete("/api/comments/" + commentId)
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isNoContent());

        // Vérification que le commentaire a bien été supprimé
        mockMvc.perform(get("/api/articles/" + articleId + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // --- ÉTAPE 15 : L'administrateur peut repasser l'article en DRAFT (dépublier) ---
        mockMvc.perform(patch("/api/articles/" + articleId + "/unpublish")
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        // L'article redevient invisible pour l'anonyme
        mockMvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }
}
