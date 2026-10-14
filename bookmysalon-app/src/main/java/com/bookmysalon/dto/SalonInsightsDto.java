package com.bookmysalon.dto;

import java.util.List;

/** Public marketplace numbers for the home page: real counts, not marketing copy. */
public record SalonInsightsDto(long salons, long cities, long reviews, double averageRating, List<CityCount> topCities) {
    public record CityCount(String city, long salons) {
    }
}
