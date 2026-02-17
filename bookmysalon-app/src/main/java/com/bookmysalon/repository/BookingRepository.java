/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.Booking;
import com.bookmysalon.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findBySalonId(Long salonId);
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByStartTimeAfterAndStartTimeBeforeAndSalonId(LocalDateTime start, LocalDateTime end, Long salonId);
    boolean existsBySalonIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long salonId,
            List<BookingStatus> statuses,
            LocalDateTime endTime,
            LocalDateTime startTime
    );
    boolean existsBySalonIdAndIdNotAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long salonId,
            Long id,
            List<BookingStatus> statuses,
            LocalDateTime endTime,
            LocalDateTime startTime
    );
}
