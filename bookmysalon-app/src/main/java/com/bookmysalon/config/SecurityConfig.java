/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Value("${app.oauth2.enabled:false}")
  private boolean oauth2Enabled;

  private final com.bookmysalon.security.JwtAuthenticationFilter jwtAuthenticationFilter;
  private final com.bookmysalon.security.JwtAuthenticationEntryPoint authenticationEntryPoint;
  private final com.bookmysalon.security.JwtAccessDeniedHandler accessDeniedHandler;
  private final com.bookmysalon.security.oauth2.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
  private final com.bookmysalon.security.oauth2.OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(authenticationEntryPoint)
            .accessDeniedHandler(accessDeniedHandler)
        )
        .authorizeHttpRequests(auth -> {
            auth
            .requestMatchers(HttpMethod.POST,
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/refresh-token",
                "/api/auth/oauth/exchange",
                "/api/auth/forgot-password",
                "/api/auth/reset-password",
                "/api/auth/signup/initiate",
                "/api/auth/signup/resend-otp",
                "/api/auth/signup/verify-otp"
            ).permitAll()
            .requestMatchers(HttpMethod.GET, "/api/auth/health", "/api/user/public/**").permitAll()
            .requestMatchers("/ws/**").permitAll()
            .requestMatchers("/actuator/**").permitAll();

            if (oauth2Enabled) {
              auth.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll();
            }

            auth.anyRequest().authenticated();
        })
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    if (oauth2Enabled) {
      http.oauth2Login(oauth2 -> oauth2
          .successHandler(oAuth2AuthenticationSuccessHandler)
          .failureHandler(oAuth2AuthenticationFailureHandler)
      );
    }

    return http.build();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
    return configuration.getAuthenticationManager();
  }

  private final CorsConfigurationSource corsConfigurationSource;

  public SecurityConfig(
      com.bookmysalon.security.JwtAuthenticationFilter jwtAuthenticationFilter,
      com.bookmysalon.security.JwtAuthenticationEntryPoint authenticationEntryPoint,
      com.bookmysalon.security.JwtAccessDeniedHandler accessDeniedHandler,
      com.bookmysalon.security.oauth2.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
      com.bookmysalon.security.oauth2.OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler,
      CorsConfigurationSource corsConfigurationSource) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.authenticationEntryPoint = authenticationEntryPoint;
    this.accessDeniedHandler = accessDeniedHandler;
    this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
    this.corsConfigurationSource = corsConfigurationSource;
  }
}
