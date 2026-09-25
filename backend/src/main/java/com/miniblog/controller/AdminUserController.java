package com.miniblog.controller;

import com.miniblog.dto.RoleUpdateRequest;
import com.miniblog.dto.UserResponse;
import com.miniblog.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Administration Utilisateurs", description = "Endpoints de gestion des utilisateurs et attribution des rôles")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Lister l'ensemble des utilisateurs enregistrés (réservé ADMIN)")
    public ResponseEntity<List<UserResponse>> getAllUsers(Principal principal) {
        List<UserResponse> users = userService.getAllUsers(principal.getName());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Modifier le rôle d'un utilisateur (Promotion/Rétrogradation ROLE_USER <-> ROLE_MODERATOR, réservé ADMIN)")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            Principal principal
    ) {
        UserResponse updated = userService.updateUserRole(id, request.getRole(), principal.getName());
        return ResponseEntity.ok(updated);
    }
}
