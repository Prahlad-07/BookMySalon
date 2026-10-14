/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.ServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findBySalonId(Long salonId);
    List<ServiceOffering> findByCategoryId(Long categoryId);
    long countBySalonId(Long salonId);

    @Query("select s.salonId, count(s) from ServiceOffering s group by s.salonId")
    List<Object[]> countGroupBySalon();

    @Query("select min(s.price), count(s) from ServiceOffering s where s.salonId = :salonId")
    List<Object[]> statsForSalon(@org.springframework.data.repository.query.Param("salonId") Long salonId);

    @Query("select min(s.price) from ServiceOffering s where s.salonId = :salonId and s.price >= :floor")
    Double minPriceAtLeast(@org.springframework.data.repository.query.Param("salonId") Long salonId,
                           @org.springframework.data.repository.query.Param("floor") double floor);
}
