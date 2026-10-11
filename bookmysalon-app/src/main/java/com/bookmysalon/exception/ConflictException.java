/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.exception;

/**
 * Thrown when a request conflicts with the current state of a resource
 * (duplicate, illegal state transition, concurrent modification). Maps to HTTP 409.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
