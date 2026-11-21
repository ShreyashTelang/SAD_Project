package com.sps.booking;

import com.sps.availability.AvailabilityBookingEngine;
import com.sps.integration.NotificationService;
import com.sps.integration.PaymentGatewayAdapter;
import com.sps.persistence.domain.*;
import com.sps.persistence.repository.*;
import com.sps.presentation.dto.PaymentConfirmRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingSlotRepository slotRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final AvailabilityBookingEngine availabilityEngine;
    private final PaymentGatewayAdapter paymentGatewayAdapter;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          ParkingSlotRepository slotRepository,
                          PricingRuleRepository pricingRuleRepository,
                          PaymentRepository paymentRepository,
                          ReviewRepository reviewRepository,
                          AvailabilityBookingEngine availabilityEngine,
                          PaymentGatewayAdapter paymentGatewayAdapter,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
        this.availabilityEngine = availabilityEngine;
        this.paymentGatewayAdapter = paymentGatewayAdapter;
        this.notificationService = notificationService;
    }

    /**
     * Step 1: Checks availability and atomically locks slot for 10 minutes.
     */
    @Transactional
    public Booking initiateBooking(User traveler, Long slotId, String vehicleNumber,
                                   LocalDateTime startTime, LocalDateTime endTime) {

        ParkingSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Parking slot not found."));

        // 1. Check availability
        boolean isAvailable = availabilityEngine.checkAvailability(slotId, startTime, endTime);
        if (!isAvailable) {
            throw new IllegalStateException("Selected slot is currently unavailable for the chosen time window.");
        }

        // 2. Lock slot atomically (10 min temporary lock)
        boolean locked = availabilityEngine.lockSlot(slotId, 10);
        if (!locked) {
            throw new IllegalStateException("Could not lock slot. It may have just been reserved by another traveler.");
        }

        // 3. Calculate price
        PricingRule rule = pricingRuleRepository.findByFacilityAndVehicleType(slot.getFacility(), slot.getVehicleType())
                .orElse(new PricingRule(slot.getFacility(), slot.getVehicleType(), BigDecimal.valueOf(50.0)));
        BigDecimal amount = rule.calculateAmount(startTime, endTime);

        // 4. Create booking in SLOT_LOCKED state
        String bookingRef = "SPS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Booking booking = new Booking(bookingRef, traveler, slot, vehicleNumber, startTime, endTime, amount);
        booking = bookingRepository.save(booking);

        // 5. Create initial payment record
        Payment payment = new Payment(booking, amount, "CARD");
        payment = paymentRepository.save(payment);
        booking.setPayment(payment);

        return booking;
    }

    /**
     * Step 2: Processes payment through gateway and confirms reservation atomically.
     */
    @Transactional
    public Booking confirmPayment(PaymentConfirmRequest request) {
        Long bookingId = request.getBookingId();
        String paymentMethod = request.getPaymentMethod();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        if (booking.getBookingState() != BookingState.SLOT_LOCKED && booking.getBookingState() != BookingState.PENDING) {
            throw new IllegalStateException("Booking is not in a payable state: " + booking.getBookingState());
        }

        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = new Payment(booking, booking.getTotalAmount(), paymentMethod);
        }
        payment.setPaymentMethod(paymentMethod);

        String details = paymentMethod;
        if ("CARD".equalsIgnoreCase(paymentMethod) && request.getCardNumberLast4() != null) {
            details = (request.getCardBrand() != null ? request.getCardBrand() : "Card") + " ending in •••• " + request.getCardNumberLast4();
        } else if ("UPI".equalsIgnoreCase(paymentMethod) && request.getUpiVpa() != null) {
            details = "UPI VPA: " + request.getUpiVpa();
        } else if ("NETBANKING".equalsIgnoreCase(paymentMethod) && request.getBankName() != null) {
            details = "NetBanking: " + request.getBankName();
        }
        payment.setPaymentDetails(details);
        payment.setPaymentStatus(PaymentStatus.PROCESSING);
        paymentRepository.save(payment);

        // Call payment gateway
        PaymentGatewayAdapter.PaymentGatewayResponse gatewayResp =
                paymentGatewayAdapter.requestPayment(booking, paymentMethod, request.isSimulateFailure());

        if (gatewayResp.isSuccess()) {
            payment.markSuccess(gatewayResp.getTransactionId());
            paymentRepository.save(payment);

            availabilityEngine.confirmBooking(booking);

            notificationService.sendNotification(
                    booking.getTraveler(),
                    "IN_APP",
                    "Reservation confirmed! Booking Ref: " + booking.getBookingRef() +
                            " at " + booking.getSlot().getFacility().getName() + " Slot: " + booking.getSlot().getSlotNumber()
            );

            return booking;
        } else {
            payment.markFailed(gatewayResp.getMessage());
            paymentRepository.save(payment);

            booking.setBookingState(BookingState.FAILED);
            bookingRepository.save(booking);

            availabilityEngine.releaseLock(booking.getSlot().getSlotId());

            notificationService.sendNotification(
                    booking.getTraveler(),
                    "IN_APP",
                    "Payment failed for booking ref: " + booking.getBookingRef() + ". Reason: " + gatewayResp.getMessage() + ". Slot lock released."
            );

            return booking;
        }
    }

    @Transactional
    public Booking confirmPayment(Long bookingId, String paymentMethod) {
        PaymentConfirmRequest req = new PaymentConfirmRequest();
        req.setBookingId(bookingId);
        req.setPaymentMethod(paymentMethod);
        return confirmPayment(req);
    }

    /**
     * Cancel confirmed booking and process refund.
     */
    @Transactional
    public Booking cancelBooking(Long bookingId, User traveler) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        if (!booking.getTraveler().getUserId().equals(traveler.getUserId()) && traveler.getRole() != Role.ROLE_ADMIN) {
            throw new SecurityException("Unauthorized to cancel this booking.");
        }

        if (booking.getBookingState() != BookingState.CONFIRMED && booking.getBookingState() != BookingState.SLOT_LOCKED) {
            throw new IllegalStateException("Cannot cancel booking with state: " + booking.getBookingState());
        }

        booking.setBookingState(BookingState.CANCELLED);
        bookingRepository.save(booking);

        // Free the slot
        booking.getSlot().release();
        slotRepository.save(booking.getSlot());

        // Process refund if payment was successful
        Payment payment = booking.getPayment();
        if (payment != null && payment.getPaymentStatus() == PaymentStatus.SUCCESSFUL) {
            PaymentGatewayAdapter.PaymentGatewayResponse refundResp = paymentGatewayAdapter.requestRefund(payment);
            if (refundResp.isSuccess()) {
                payment.setPaymentStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            }
        }

        notificationService.sendNotification(
                booking.getTraveler(),
                "IN_APP",
                "Booking " + booking.getBookingRef() + " has been cancelled. Refund initiated."
        );

        return booking;
    }

    public List<Booking> getTravelerBookings(User traveler) {
        return bookingRepository.findByTravelerOrderByCreatedAtDesc(traveler);
    }

    @Transactional
    public Review addReview(Long bookingId, User traveler, int rating, String comment) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        if (!booking.getTraveler().getUserId().equals(traveler.getUserId())) {
            throw new SecurityException("You can only review your own bookings.");
        }

        Review review = new Review(booking, rating, comment);
        review = reviewRepository.save(review);
        booking.setReview(review);
        bookingRepository.save(booking);

        return review;
    }
}
