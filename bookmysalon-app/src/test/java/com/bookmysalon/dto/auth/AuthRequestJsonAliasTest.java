package com.bookmysalon.dto.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthRequestJsonAliasTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void registerRequestMapsUserTypeAliasToRoleField() throws Exception {
        String payload = "{\"name\":\"Owner User\",\"email\":\"owner@example.com\",\"password\":\"Test@12345\",\"userType\":\"SALON_OWNER\"}";

        RegisterRequest request = objectMapper.readValue(payload, RegisterRequest.class);

        assertEquals("SALON_OWNER", request.getRole());
    }

    @Test
    void signupInitiateRequestMapsSnakeCaseAliasToRoleField() throws Exception {
        String payload = "{\"name\":\"Owner User\",\"email\":\"owner@example.com\",\"password\":\"Test@12345\",\"user_type\":\"salon-owner\"}";

        SignupInitiateRequest request = objectMapper.readValue(payload, SignupInitiateRequest.class);

        assertEquals("salon-owner", request.getRole());
    }
}
