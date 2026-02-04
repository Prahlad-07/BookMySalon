package com.example.payload.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data @NoArgsConstructor
public class KeycloakRoleDto {
    private String id;

    private String name;

    private String description;

    private boolean composite;

    private boolean clientRole;

    private String containerId;

    private Map<String, Object> attributes;
}
