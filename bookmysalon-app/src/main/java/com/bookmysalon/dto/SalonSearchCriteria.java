package com.bookmysalon.dto;

/**
 * Filters for the public salon search. Every field is optional.
 *
 * @param q          free text matched against salon name, address, city and service names
 * @param city       exact city (case-insensitive)
 * @param minRating  minimum average rating, 0–5
 * @param maxPrice   salons whose cheapest service is at or under this amount
 * @param openNow    only salons open at the current local time
 * @param sort       rating | reviews | price | newest | name
 */
public record SalonSearchCriteria(String q, String city, Double minRating, Double maxPrice, boolean openNow, String sort) {
}
