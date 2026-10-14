/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-14
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findBySalonId(Long salonId);

    /** Active bookings overlapping [from, to) — drives the public busy-slot view. */
    List<Booking> findBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThanOrderByStartTime(
            Long salonId, java.util.Collection<com.bookmysalon.entity.BookingStatus> statuses,
            LocalDateTime to, LocalDateTime from);
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByStatus(BookingStatus status);

    boolean existsBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long salonId, List<BookingStatus> statuses, LocalDateTime endTime, LocalDateTime startTime);

    boolean existsBySalonIdAndIdNotAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long salonId, Long id, List<BookingStatus> statuses, LocalDateTime endTime, LocalDateTime startTime);

    long countBySalonIdAndStatusInAndStartTimeGreaterThan(
            Long salonId, List<BookingStatus> statuses, LocalDateTime startTime);

    // ---- analytics ------------------------------------------------------

    List<Booking> findByCreatedAtAfter(LocalDateTime since);

    List<Booking> findBySalonIdAndCreatedAtAfter(Long salonId, LocalDateTime since);

    long countBySalonId(Long salonId);

    @Query("select b.status, count(b) from Booking b group by b.status")
    List<Object[]> countGroupByStatus();

    @Query("select b.status, count(b) from Booking b where b.salonId = :salonId group by b.status")
    List<Object[]> countGroupByStatusForSalon(@Param("salonId") Long salonId);

    @Query("select coalesce(sum(b.totalPrice), 0) from Booking b where b.status = :status")
    double sumTotalPriceByStatus(@Param("status") BookingStatus status);

    @Query("select coalesce(sum(b.totalPrice), 0) from Booking b where b.status <> com.bookmysalon.entity.BookingStatus.CANCELLED")
    double sumTotalPriceExcludingCancelled();

    @Query("select coalesce(sum(b.totalPrice), 0) from Booking b where b.salonId = :salonId and b.status = :status")
    double sumTotalPriceBySalonAndStatus(@Param("salonId") Long salonId, @Param("status") BookingStatus status);

    @Query("select coalesce(sum(b.totalPrice), 0) from Booking b where b.salonId = :salonId and b.status in :statuses")
    double sumTotalPriceBySalonAndStatuses(@Param("salonId") Long salonId, @Param("statuses") List<BookingStatus> statuses);

    @Query("select b.salonId, count(b), coalesce(sum(b.totalPrice), 0) from Booking b group by b.salonId order by count(b) desc")
    List<Object[]> aggregateBySalon(Pageable pageable);

    @Query("select b.customerId, count(b) from Booking b group by b.customerId")
    List<Object[]> countGroupByCustomer();

    @Query("select distinct sid from Booking b join b.serviceOfferingIds sid where b.customerId = :userId")
    List<Long> distinctServiceOfferingIdsForCustomer(@Param("userId") Long userId);

    @Query(value = """
            SELECT so.id AS service_id, so.name AS service_name, COUNT(*) AS cnt
            FROM booking_service_offerings bso
            JOIN bookings b ON b.id = bso.booking_id
            JOIN service_offerings so ON so.id = bso.service_offering_id
            WHERE b.status <> 'CANCELLED'
              AND (:salonId IS NULL OR b.salon_id = :salonId)
            GROUP BY so.id, so.name
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> popularServices(@Param("salonId") Long salonId, Pageable pageable);
}
