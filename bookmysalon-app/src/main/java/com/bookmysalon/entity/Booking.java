/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(
        name = "bookings",
        indexes = {
                @Index(name = "idx_bookings_salon_start", columnList = "salon_id, start_time"),
                @Index(name = "idx_bookings_customer_start", columnList = "customer_id, start_time"),
                @Index(name = "idx_bookings_status", columnList = "status")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @ElementCollection
    @CollectionTable(name = "booking_service_offerings", joinColumns = @JoinColumn(name = "booking_id"))
    @Column(name = "service_offering_id")
    private Set<Long> serviceOfferingIds;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(nullable = false)
    private Double totalPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", insertable = false, updatable = false)
    private Salon salon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private User customer;
}
