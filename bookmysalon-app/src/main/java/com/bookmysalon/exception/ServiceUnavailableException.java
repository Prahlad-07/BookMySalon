/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.exception;

/**
 * Thrown when an optional capability is requested but not configured on this
 * deployment (for example payments without Stripe keys). Maps to HTTP 503.
 */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
