package com.sps.integration;

import com.sps.persistence.domain.Booking;
import com.sps.persistence.domain.Payment;
import com.sps.persistence.domain.PaymentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class PaymentGatewayAdapter {

    public static class PaymentGatewayResponse {
        private final boolean success;
        private final String transactionId;
        private final String message;

        public PaymentGatewayResponse(boolean success, String transactionId, String message) {
            this.success = success;
            this.transactionId = transactionId;
            this.message = message;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public String getMessage() {
            return message;
        }
    }

    /**
     * Simulates payment gateway authorization and capture.
     * In production, this would call Stripe, Razorpay, or PayPal API.
     */
    public PaymentGatewayResponse requestPayment(Booking booking, String paymentMethod) {
        return requestPayment(booking, paymentMethod, false);
    }

    public PaymentGatewayResponse requestPayment(Booking booking, String paymentMethod, boolean simulateFailure) {
        if (simulateFailure) {
            return new PaymentGatewayResponse(false, null, "Payment declined by issuing bank (insufficient funds / security block).");
        }
        // Validation: Card number/data is never stored on SPS servers (PCI-DSS compliance)
        String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Simulates high availability payment confirmation
        return new PaymentGatewayResponse(true, txnId, "Payment successfully authorized and captured by gateway.");
    }

    /**
     * Simulates refund processing via gateway.
     */
    public PaymentGatewayResponse requestRefund(Payment payment) {
        String refundTxnId = "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new PaymentGatewayResponse(true, refundTxnId, "Refund processed successfully.");
    }
}
