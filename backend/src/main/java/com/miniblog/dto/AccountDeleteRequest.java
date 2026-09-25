package com.miniblog.dto;

import jakarta.validation.constraints.NotBlank;

public class AccountDeleteRequest {

    @NotBlank(message = "Le mot de passe actuel est obligatoire pour confirmer la suppression")
    private String currentPassword;

    public AccountDeleteRequest() {
    }

    public AccountDeleteRequest(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
