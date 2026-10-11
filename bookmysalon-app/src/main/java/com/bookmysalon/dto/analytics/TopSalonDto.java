/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.dto.analytics;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopSalonDto {
    private Long salonId;
    private String name;
    private String city;
    private long bookings;
    private double revenue;
}
