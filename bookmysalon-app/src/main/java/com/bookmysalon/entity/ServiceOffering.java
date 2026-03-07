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

@Entity
@Table(
        name = "service_offerings",
        indexes = {
                @Index(name = "idx_service_offerings_salon_id", columnList = "salon_id"),
                @Index(name = "idx_service_offerings_category_id", columnList = "category_id"),
                @Index(name = "idx_service_offerings_salon_category", columnList = "salon_id, category_id")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServiceOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", insertable = false, updatable = false)
    private Salon salon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private Category category;
}
