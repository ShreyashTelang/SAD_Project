package com.sps.persistence.domain;

public enum PaymentStatus {
    INITIATED,
    PENDING,
    PROCESSING,
    SUCCESSFUL,
    FAILED,
    REFUND_PENDING,
    REFUNDED,
    REFUND_FAILED
}
