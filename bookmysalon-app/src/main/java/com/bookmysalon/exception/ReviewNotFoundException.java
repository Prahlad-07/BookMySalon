/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.exception;

public class ReviewNotFoundException extends ResourceNotFoundException {
    public ReviewNotFoundException(String message) {
        super(message);
    }
}
