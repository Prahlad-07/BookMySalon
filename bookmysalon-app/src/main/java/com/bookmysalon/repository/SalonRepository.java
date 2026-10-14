/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalonRepository extends JpaRepository<Salon, Long>, JpaSpecificationExecutor<Salon> {
    List<Salon> findByOwnerId(Long ownerId);
    Optional<Salon> findFirstByOwnerId(Long ownerId);
    boolean existsByOwnerId(Long ownerId);
    List<Salon> findByCity(String city);
    List<Salon> findByLatitudeIsNotNullAndLongitudeIsNotNull();
    Optional<Salon> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    Optional<Salon> findByPhoneNumber(String phoneNumber);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    /** Bounding-box prefilter (uses idx_salons_lat_lng); exact distance is computed on the small result. */
    List<Salon> findByLatitudeBetweenAndLongitudeBetween(double minLat, double maxLat, double minLng, double maxLng);

    @Query("select s.city, count(s) from Salon s group by s.city order by count(s) desc")
    List<Object[]> countByCity();

    @Query("select count(distinct s.city) from Salon s")
    long countCities();

    @Query("select s.id from Salon s")
    List<Long> findAllIds();
}
