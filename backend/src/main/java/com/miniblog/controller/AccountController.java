package com.miniblog.controller;

import com.miniblog.dto.AccountDeleteRequest;
import com.miniblog.dto.AuthResponse;
import com.miniblog.dto.EmailChangeRequest;
import com.miniblog.dto.PasswordChangeRequest;
import com.miniblog.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@Tag(name = "Gestion du Compte", description = "Endpoints de modification du profil, changement d'identifiants et suppression de compte")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PatchMapping("/email")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier l'adresse email (nécessite le mot de passe actuel)")
    public ResponseEntity<AuthResponse> changeEmail(
            Authentication authentication,
            @Valid @RequestBody EmailChangeRequest request
    ) {
        AuthResponse response = accountService.changeEmail(authentication.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier le mot de passe (nécessite l'ancien mot de passe)")
    public ResponseEntity<AuthResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        AuthResponse response = accountService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer définitivement son compte et ses données (articles, commentaires)")
    public ResponseEntity<Void> deleteAccount(
            Authentication authentication,
            @Valid @RequestBody AccountDeleteRequest request
    ) {
        accountService.deleteAccount(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
