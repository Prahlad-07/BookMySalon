package com.example.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class PrefixGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();
        Collection<GrantedAuthority> authorities = new ArrayList<>(defaultConverter.convert(jwt));

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof List<?> rolesList) {
            for (Object role : rolesList) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toString().toUpperCase()));
            }
        }

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object entry : resourceAccess.values()) {
                if (entry instanceof Map<?, ?> clientAccess) {
                    Object roles = clientAccess.get("roles");
                    if (roles instanceof List<?> list) {
                        for (Object role : list) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toString().toUpperCase()));
                        }
                    }
                }
            }

        }
        return authorities;
    }
}
