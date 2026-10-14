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
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(
        name = "salons",
        indexes = {
                @Index(name = "idx_salons_owner_id", columnList = "owner_id"),
                @Index(name = "idx_salons_city", columnList = "city"),
                @Index(name = "idx_salons_lat_lng", columnList = "latitude, longitude"),
                @Index(name = "idx_salons_rating", columnList = "rating_avg, review_count"),
                @Index(name = "idx_salons_rank", columnList = "rank_score"),
                @Index(name = "idx_salons_min_price", columnList = "min_price"),
                @Index(name = "idx_salons_created_at", columnList = "created_at")
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
    @BatchSize(size = 100)
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

    @Column(length = 1000)
    private String description;

    /*
     * Denormalised listing stats, maintained by SalonStatsService whenever reviews or
     * services change. Search sorts and filters on these columns directly so listing
     * pages never aggregate the reviews / services tables at read time.
     */
    @Column(name = "rating_avg")
    private Double ratingAvg;

    @Column(name = "review_count")
    private Integer reviewCount;

    /** Bayesian-weighted rating used for "top rated" ordering (see SalonStatsService). */
    @Column(name = "rank_score")
    private Double rankScore;

    @Column(name = "min_price")
    private Double minPrice;

    @Column(name = "service_count")
    private Integer serviceCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    private User owner;
}
