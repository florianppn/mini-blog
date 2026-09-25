package com.miniblog.controller;

import com.miniblog.dto.CommentCreateRequest;
import com.miniblog.dto.CommentResponse;
import com.miniblog.dto.CommentUpdateRequest;
import com.miniblog.service.CommentService;
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
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@Tag(name = "Commentaires", description = "Endpoints d'interaction et de modération des commentaires")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/api/articles/{articleId}/comments")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Ajouter un commentaire sur un article publié (réservé aux utilisateurs connectés)")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long articleId,
            @Valid @RequestBody CommentCreateRequest request,
            Principal principal
    ) {
        CommentResponse response = commentService.createComment(articleId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/articles/{articleId}/comments")
    @Operation(summary = "Consulter les commentaires d'un article")
    public ResponseEntity<Page<CommentResponse>> getCommentsByArticle(
            @PathVariable Long articleId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        Page<CommentResponse> response = commentService.getCommentsByArticle(articleId, email, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/comments/{commentId}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier un commentaire existant (réservé à l'auteur du commentaire)")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequest request,
            Principal principal
    ) {
        CommentResponse response = commentService.updateComment(commentId, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/comments/{commentId}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer un commentaire (réservé à l'auteur ou à un administrateur)")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId, Principal principal) {
        commentService.deleteComment(commentId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
