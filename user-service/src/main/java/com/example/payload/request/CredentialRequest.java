package com.example.payload.request;

import lombok.Data;

@Data
public class CredentialRequest {
    private String type;

    private String value;

    private boolean temporary;
}
