/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
package com.bookmysalon.repository;

import com.bookmysalon.entity.PaymentOrder;
import com.bookmysalon.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    List<PaymentOrder> findByUserId(Long userId);
    List<PaymentOrder> findByBookingId(Long bookingId);
    Optional<PaymentOrder> findByPaymentLinkId(String paymentLinkId);
    List<PaymentOrder> findByStatus(PaymentStatus status);
}
