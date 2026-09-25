package com.miniblog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmailChangeRequest {

    @NotBlank(message = "La nouvelle adresse email est obligatoire")
    @Email(message = "L'adresse email n'est pas valide")
    @Size(max = 150, message = "L'adresse email ne peut pas dépasser 150 caractères")
    private String newEmail;

    @NotBlank(message = "Le mot de passe actuel est obligatoire pour confirmer")
    private String currentPassword;

    public EmailChangeRequest() {
    }

    public EmailChangeRequest(String newEmail, String currentPassword) {
        this.newEmail = newEmail;
        this.currentPassword = currentPassword;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
