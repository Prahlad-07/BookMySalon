package com.example.payload.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data @NoArgsConstructor
public class CreateUserRequest {
    private String username;

    private boolean enabled;

    private String firstName;

    private String lastName;

    private String email;

    private final List<CredentialRequest> credentials = new ArrayList<>();
}
