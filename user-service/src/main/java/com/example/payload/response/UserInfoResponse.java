package com.example.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor
public class UserInfoResponse {
    private String sub;

    @JsonProperty("given_name")
    private String firstName;

    @JsonProperty("family_name")
    private String lastName;

    @JsonProperty("preferred_username")
    private String username;

    private String email;
}
