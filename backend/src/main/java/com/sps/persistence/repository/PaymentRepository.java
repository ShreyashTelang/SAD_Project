package com.sps.persistence.repository;

import com.sps.persistence.domain.Booking;
import com.sps.persistence.domain.Payment;
import com.sps.persistence.domain.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBooking(Booking booking);
    Optional<Payment> findByGatewayTxnId(String gatewayTxnId);
    List<Payment> findByPaymentStatus(PaymentStatus status);
}
