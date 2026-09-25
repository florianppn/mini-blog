package com.miniblog.controller;

import com.miniblog.domain.entity.ArticleStatus;
import com.miniblog.dto.ArticleCreateRequest;
import com.miniblog.dto.ArticleResponse;
import com.miniblog.dto.ArticleUpdateRequest;
import com.miniblog.service.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/articles")
@Tag(name = "Articles", description = "Endpoints de gestion, consultation et cycle de vie des articles (DRAFT / PENDING_REVIEW / PUBLISHED)")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    @Operation(summary = "Lister les articles avec pagination et filtrage dynamique selon l'utilisateur connecté")
    public ResponseEntity<Page<ArticleResponse>> getAllArticles(
            @RequestParam(required = false) ArticleStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        Page<ArticleResponse> response = articleService.getAllArticles(email, status, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-articles")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister les articles de l'auteur connecté (statuts DRAFT et PENDING_REVIEW)")
    public ResponseEntity<Page<ArticleResponse>> getMyArticles(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal
    ) {
        Page<ArticleResponse> response = articleService.getMyArticles(principal.getName(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter un article par son ID (les articles non publiés sont réservés à l'auteur et aux administrateurs)")
    public ResponseEntity<ArticleResponse> getArticleById(@PathVariable Long id, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        ArticleResponse response = articleService.getArticleById(id, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer un nouvel article (créé systématiquement au statut DRAFT)")
    public ResponseEntity<ArticleResponse> createArticle(
            @Valid @RequestBody ArticleCreateRequest request,
            Principal principal
    ) {
        ArticleResponse response = articleService.createArticle(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier un article (autorisé pour l'auteur tant qu'il est en DRAFT, ou pour l'administrateur)")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody ArticleUpdateRequest request,
            Principal principal
    ) {
        ArticleResponse response = articleService.updateArticle(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer un article (autorisé pour l'auteur tant qu'il est en DRAFT, ou pour l'administrateur)")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id, Principal principal) {
        articleService.deleteArticle(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/submit")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Soumettre un brouillon pour validation (DRAFT -> PENDING_REVIEW), action réservée à l'auteur")
    public ResponseEntity<ArticleResponse> submitArticle(@PathVariable Long id, Principal principal) {
        ArticleResponse response = articleService.submitArticle(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel-submission")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Annuler la soumission pour validation (PENDING_REVIEW -> DRAFT), action réservée à l'auteur")
    public ResponseEntity<ArticleResponse> cancelSubmission(@PathVariable Long id, Principal principal) {
        ArticleResponse response = articleService.cancelSubmission(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Rejeter un article soumis et le renvoyer en brouillon (PENDING_REVIEW -> DRAFT), réservé ADMIN")
    public ResponseEntity<ArticleResponse> rejectArticle(@PathVariable Long id) {
        ArticleResponse response = articleService.rejectArticle(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Valider et publier un article (PENDING_REVIEW -> PUBLISHED), réservé ADMIN")
    public ResponseEntity<ArticleResponse> publishArticle(@PathVariable Long id) {
        ArticleResponse response = articleService.publishArticle(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Dépublier un article (PUBLISHED -> DRAFT), réservé ADMIN")
    public ResponseEntity<ArticleResponse> unpublishArticle(@PathVariable Long id) {
        ArticleResponse response = articleService.unpublishArticle(id);
        return ResponseEntity.ok(response);
    }
}
