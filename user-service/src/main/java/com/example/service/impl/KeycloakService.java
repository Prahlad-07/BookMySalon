package com.example.service.impl;

import com.example.config.KeycloakProperties;
import com.example.domain.UserRole;
import com.example.mapper.UserMapper;
import com.example.payload.dto.KeycloakRoleDto;
import com.example.payload.dto.KeycloakUserDto;
import com.example.payload.dto.SignupDto;
import com.example.payload.request.CreateUserRequest;
import com.example.payload.request.CredentialRequest;
import com.example.payload.response.UserInfoResponse;
import com.example.payload.response.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakService {
    private final KeycloakProperties keycloakProperties;
    private final RestTemplate restTemplate;

    public void createUser(SignupDto signupDto) {
        final String ACCESS_TOKEN = getTokenResponse(
                keycloakProperties.getUsername(),
                keycloakProperties.getPassword(),
                keycloakProperties.getGrantType(),
                null
        ).getAccessToken();

        CredentialRequest credential = new CredentialRequest();
        credential.setTemporary(false);
        credential.setType("password");
        credential.setValue(signupDto.getPassword());

        CreateUserRequest createUserRequest = new CreateUserRequest();
        createUserRequest.setUsername(signupDto.getEmail());
        createUserRequest.setEmail(signupDto.getEmail());
        createUserRequest.setEnabled(true);
        createUserRequest.setFirstName(signupDto.getFirstName());
        createUserRequest.setLastName(signupDto.getLastName());
        createUserRequest.getCredentials().add(credential);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(ACCESS_TOKEN);

        RequestEntity<CreateUserRequest> requestHttpEntity = new RequestEntity<>(
                createUserRequest,
                headers,
                HttpMethod.POST,
                URI.create(keycloakProperties.getAdminApi()));

        ResponseEntity<String> response = restTemplate.exchange(requestHttpEntity, String.class);

        if (response.getStatusCode().equals(HttpStatus.CREATED)) {
            System.out.println("User created successfully!");

            KeycloakUserDto user = fetchFirstUserByUsername(
                    signupDto.getEmail(),
                    ACCESS_TOKEN);

            KeycloakRoleDto role = getRoleByName(keycloakProperties.getClientDbId(), ACCESS_TOKEN, signupDto.getRole());

            List<KeycloakRoleDto> roles = new ArrayList<>();
            roles.add(role);

            assignRoleToUser(user.getId(), keycloakProperties.getClientDbId(), roles, ACCESS_TOKEN);
        } else {
            System.out.println("User creation failed!");
            throw new RuntimeException(response.getBody());
        }
    }

    public TokenResponse getTokenResponse(String username,
                                          String password,
                                          String grantType,
                                          String refreshToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("grant_type", grantType);
        requestBody.add("username", username);
        requestBody.add("password", password);
        requestBody.add("refresh_token", refreshToken);
        requestBody.add("client_id", keycloakProperties.getClientId());
        requestBody.add("client_secret", keycloakProperties.getClientSecret());
        requestBody.add("scope", keycloakProperties.getScope());

        RequestEntity<MultiValueMap<String, String>> request = new RequestEntity<>(
                requestBody,
                headers,
                HttpMethod.POST,
                URI.create(keycloakProperties.getTokenUrl()));

        ResponseEntity<TokenResponse> response = restTemplate.exchange(
                request,
                TokenResponse.class
        );

        if (response.getStatusCode().equals(HttpStatus.OK) && response.getBody() != null) {
            return response.getBody();
        }
        throw new RuntimeException("Failed to obtain access token!");
    }

    public KeycloakRoleDto getRoleByName(String clientId,
                                         String token,
                                         UserRole role) {

        String url = keycloakProperties.getBaseUrl() + "/admin/realms/master/clients/"
                + clientId + "/roles/" + role;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        RequestEntity<KeycloakRoleDto> request = new RequestEntity<>(
                headers,
                HttpMethod.GET,
                URI.create(url)
        );
        ResponseEntity<KeycloakRoleDto> response = restTemplate.exchange(
                request,
                KeycloakRoleDto.class
        );
        return response.getBody();
    }

    public KeycloakUserDto fetchFirstUserByUsername(String username,
                                                    String token) {
        String url = keycloakProperties.getBaseUrl() + "/admin/realms/master/users?username=" + username;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        RequestEntity<Void> request = new RequestEntity<>(
                headers,
                HttpMethod.GET,
                URI.create(url)
        );
        ResponseEntity<KeycloakUserDto[]> response = restTemplate.exchange(
                request,
                KeycloakUserDto[].class
        );
        KeycloakUserDto[] users = response.getBody();

        if (users != null && users.length > 0) {
            return users[0];
        }
        throw new RuntimeException("User not found!");
    }

    public void assignRoleToUser(String userId,
                                 String clientId,
                                 List<KeycloakRoleDto> roles,
                                 String token) {
        String url = keycloakProperties.getBaseUrl() + "/admin/realms/master/users/" + userId +
                "/role-mappings/clients/" + clientId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        RequestEntity<List<KeycloakRoleDto>> request = new RequestEntity<>(
                roles,
                headers,
                HttpMethod.POST,
                URI.create(url)
        );
        ResponseEntity<String> response = restTemplate.exchange(
                request,
                String.class
        );
    }

    public KeycloakUserDto fetchUserByJwtToken(String jwtToken) {
        String url = keycloakProperties.getBaseUrl() + "/realms/master/protocol/openid-connect/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);

        RequestEntity<Void> request = new RequestEntity<>(
                headers,
                HttpMethod.GET,
                URI.create(url)
        );
        ResponseEntity<UserInfoResponse> response = restTemplate.exchange(
                request,
                UserInfoResponse.class
        );
        return UserMapper.mapToKeycloakUserDto(response.getBody());
    }
}
