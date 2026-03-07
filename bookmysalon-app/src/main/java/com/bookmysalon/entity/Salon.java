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

import java.time.LocalTime;
import java.util.List;

@Entity
@Table(
        name = "salons",
        indexes = {
                @Index(name = "idx_salons_owner_id", columnList = "owner_id"),
                @Index(name = "idx_salons_city", columnList = "city"),
                @Index(name = "idx_salons_lat_lng", columnList = "latitude, longitude")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Salon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "salon_images", joinColumns = @JoinColumn(name = "salon_id"))
    @Column(name = "image_url")
    private List<String> images;

    @Column(nullable = false)
    private String address;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String city;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false)
    private LocalTime openTime;

    @Column(nullable = false)
    private LocalTime closeTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    private User owner;
}
