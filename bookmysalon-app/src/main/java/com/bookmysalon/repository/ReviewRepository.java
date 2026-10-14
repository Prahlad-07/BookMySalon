/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("select r from Review r left join fetch r.user where r.salonId = :salonId order by r.createdAt desc")
    List<Review> findBySalonIdWithAuthor(@Param("salonId") Long salonId);

    List<Review> findBySalonId(Long salonId);

    List<Review> findByUserId(Long userId);

    boolean existsByUserIdAndSalonId(Long userId, Long salonId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.salonId = :salonId")
    double averageRatingForSalon(@Param("salonId") Long salonId);

    @Query("select r.salonId, avg(r.rating), count(r) from Review r group by r.salonId")
    List<Object[]> ratingSummaryBySalon();

    long countBySalonId(Long salonId);

    @Query("select coalesce(avg(r.rating), 0), count(r) from Review r where r.salonId = :salonId")
    List<Object[]> statsForSalon(@Param("salonId") Long salonId);

    @Query("select coalesce(avg(r.rating), 0), count(r) from Review r")
    List<Object[]> platformStats();

    @Query("select r from Review r join fetch r.user join fetch r.salon where r.rating >= :minRating order by r.createdAt desc")
    List<Review> findRecent(@Param("minRating") double minRating, org.springframework.data.domain.Pageable pageable);
}
