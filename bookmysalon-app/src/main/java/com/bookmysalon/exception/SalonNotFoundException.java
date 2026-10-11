/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.exception;

public class SalonNotFoundException extends ResourceNotFoundException {
    public SalonNotFoundException(String message) {
        super(message);
    }
}
