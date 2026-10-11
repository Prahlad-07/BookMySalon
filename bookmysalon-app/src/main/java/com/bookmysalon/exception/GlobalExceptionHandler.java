/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.exception;

import com.bookmysalon.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static ResponseEntity<ApiResponse<Object>> build(HttpStatus status, String message, String error) {
        return ResponseEntity.status(status).body(ApiResponse.failure(message, error));
    }

    // ---- 400 Bad Request -------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String error = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .distinct()
                .collect(Collectors.joining(", "));
        return build(HttpStatus.BAD_REQUEST, "Validation failed",
                error.isBlank() ? "One or more fields are invalid" : error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex) {
        String error = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .collect(Collectors.joining(", "));
        return build(HttpStatus.BAD_REQUEST, "Validation failed",
                error.isBlank() ? "One or more parameters are invalid" : error);
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            InvalidRequestException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(Exception ex) {
        String error = ex instanceof MethodArgumentTypeMismatchException mismatch
                ? "Parameter '" + mismatch.getName() + "' has an invalid value"
                : ex.getMessage();
        return build(HttpStatus.BAD_REQUEST, "Invalid request", error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, "Invalid request",
                "Request body is missing or malformed");
    }

    // ---- 401 / 403 -----------------------------------------------------

    @ExceptionHandler({AuthException.class, BadCredentialsException.class})
    public ResponseEntity<ApiResponse<Object>> handleAuth(RuntimeException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication failed", ex.getMessage());
    }

    @ExceptionHandler({InvalidTokenException.class})
    public ResponseEntity<ApiResponse<Object>> handleToken(InvalidTokenException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid token", ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthentication(AuthenticationException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication required", "Authentication is required to access this resource");
    }

    @ExceptionHandler({UnauthorizedException.class, AccessDeniedException.class})
    public ResponseEntity<ApiResponse<Object>> handleForbidden(RuntimeException ex) {
        return build(HttpStatus.FORBIDDEN, "Access denied", ex.getMessage());
    }

    // ---- 404 ---------------------------------------------------------

    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiResponse<Object>> handleNotFound(Exception ex) {
        String error = ex instanceof NoResourceFoundException ? "The requested endpoint does not exist" : ex.getMessage();
        return build(HttpStatus.NOT_FOUND, "Resource not found", error);
    }

    // ---- 405 -------------------------------------------------------

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed",
                "HTTP method " + ex.getMethod() + " is not supported for this endpoint");
    }

    // ---- 409 -----------------------------------------------------

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflict(ConflictException ex) {
        return build(HttpStatus.CONFLICT, "Request conflict", ex.getMessage());
    }

    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrity(Exception ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return build(HttpStatus.CONFLICT, "Request conflict",
                "This operation conflicts with existing data. Please review your input and try again.");
    }

    // ---- 502 / 503 ---------------------------------------------------

    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<ApiResponse<Object>> handlePayment(PaymentProcessingException ex) {
        log.error("Payment processing failure", ex);
        return build(HttpStatus.BAD_GATEWAY, "Payment provider error",
                "We could not reach the payment provider. Please try again shortly.");
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnavailable(ServiceUnavailableException ex) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, "Feature unavailable", ex.getMessage());
    }

    // ---- passthrough + catch-all ----------------------------------

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return build(status, status.getReasonPhrase(), ex.getReason());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception at API boundary", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error",
                "Something went wrong on our side. Please try again later.");
    }
}
