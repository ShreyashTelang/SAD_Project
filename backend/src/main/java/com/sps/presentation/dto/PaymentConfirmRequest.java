package com.sps.presentation.dto;

import jakarta.validation.constraints.NotNull;

public class PaymentConfirmRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    private String paymentMethod = "CARD"; // CARD, UPI, NETBANKING

    private String cardNumberLast4;
    private String cardBrand; // VISA, MASTERCARD, RUPAY
    private String upiVpa;
    private String bankName;
    private boolean simulateFailure = false;

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getCardNumberLast4() {
        return cardNumberLast4;
    }

    public void setCardNumberLast4(String cardNumberLast4) {
        this.cardNumberLast4 = cardNumberLast4;
    }

    public String getCardBrand() {
        return cardBrand;
    }

    public void setCardBrand(String cardBrand) {
        this.cardBrand = cardBrand;
    }

    public String getUpiVpa() {
        return upiVpa;
    }

    public void setUpiVpa(String upiVpa) {
        this.upiVpa = upiVpa;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public boolean isSimulateFailure() {
        return simulateFailure;
    }

    public void setSimulateFailure(boolean simulateFailure) {
        this.simulateFailure = simulateFailure;
    }
}
