package com.miniblog.dto;

import com.miniblog.domain.entity.Role;
import jakarta.validation.constraints.NotNull;

public class RoleUpdateRequest {

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    public RoleUpdateRequest() {
    }

    public RoleUpdateRequest(Role role) {
        this.role = role;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
