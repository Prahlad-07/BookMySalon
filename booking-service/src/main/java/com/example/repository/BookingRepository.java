package com.example.repository;

import com.example.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Set<Booking> findByCustomerId(Long customerId);

    Set<Booking> findBySalonId(Long salonId);

}