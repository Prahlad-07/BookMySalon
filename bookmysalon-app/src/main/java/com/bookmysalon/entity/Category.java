/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "categories",
        indexes = {
                @Index(name = "idx_categories_salon_id", columnList = "salon_id"),
                @Index(name = "idx_categories_salon_name", columnList = "salon_id, name")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String image;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", insertable = false, updatable = false)
    private Salon salon;
}
