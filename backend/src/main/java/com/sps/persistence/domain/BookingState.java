package com.sps.persistence.domain;

public enum BookingState {
    PENDING,
    SLOT_LOCKED,
    CONFIRMED,
    COMPLETED,
    CANCELLED,
    EXPIRED,
    FAILED
}
