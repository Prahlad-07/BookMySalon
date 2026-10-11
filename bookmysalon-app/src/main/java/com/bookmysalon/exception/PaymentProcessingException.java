/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.exception;

/**
 * Thrown when an upstream payment provider request fails. Maps to HTTP 502.
 */
public class PaymentProcessingException extends RuntimeException {
    public PaymentProcessingException(String message) {
        super(message);
    }

    public PaymentProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
