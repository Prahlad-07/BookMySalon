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
}
