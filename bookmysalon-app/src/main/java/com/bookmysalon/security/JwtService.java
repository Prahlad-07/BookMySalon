/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateAccessToken(CustomUserPrincipal principal) {
        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        String primaryRole = roles.stream()
                .filter(role -> role != null && role.startsWith("ROLE_"))
                .map(role -> role.substring("ROLE_".length()))
                .findFirst()
                .orElse("CUSTOMER");

        return buildToken(
                Map.of(
                        "userId", principal.getId(),
                        "email", principal.getEmail(),
                        "role", primaryRole,
                        "roles", roles
                ),
                principal,
                accessTokenExpirationMs
        );
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expirationMs) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = resolveSigningKeyBytes(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] resolveSigningKeyBytes(String configuredSecret) {
        String secret = configuredSecret == null ? "" : configuredSecret.trim();
        if (secret.isEmpty()) {
            throw new IllegalStateException("security.jwt.secret must not be empty");
        }

        byte[] decodedBase64 = tryDecode(secret, false);
        if (decodedBase64 != null) {
            return ensureMinimumKeyLength(decodedBase64, "Base64");
        }

        byte[] decodedBase64Url = tryDecode(secret, true);
        if (decodedBase64Url != null) {
            return ensureMinimumKeyLength(decodedBase64Url, "Base64URL");
        }

        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) {
            log.warn("JWT secret is not Base64/Base64URL; using raw bytes. Set SECURITY_JWT_SECRET to a Base64-encoded key for portability.");
            return raw;
        }

        log.warn("JWT secret is not Base64/Base64URL and shorter than 256 bits. Deriving a 256-bit key from configured value.");
        return sha256(raw);
    }

    private byte[] tryDecode(String value, boolean urlSafe) {
        try {
            return urlSafe ? Decoders.BASE64URL.decode(value) : Decoders.BASE64.decode(value);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private byte[] ensureMinimumKeyLength(byte[] decoded, String encodingName) {
        if (decoded.length >= 32) {
            return decoded;
        }

        log.warn("JWT secret is {} but shorter than 256 bits. Deriving a 256-bit key from configured value.", encodingName);
        return sha256(decoded);
    }

    private byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is unavailable", ex);
        }
    }
}
