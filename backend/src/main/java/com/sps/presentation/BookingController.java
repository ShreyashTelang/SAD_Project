package com.sps.presentation;

import com.sps.booking.BookingService;
import com.sps.persistence.domain.Booking;
import com.sps.persistence.domain.Review;
import com.sps.persistence.domain.User;
import com.sps.persistence.repository.UserRepository;
import com.sps.presentation.dto.BookingRequest;
import com.sps.presentation.dto.PaymentConfirmRequest;
import com.sps.presentation.dto.ReviewRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));
    }

    @PostMapping("/initiate")
    public ResponseEntity<?> initiateBooking(@Valid @RequestBody BookingRequest request) {
        try {
            User traveler = getAuthenticatedUser();
            Booking booking = bookingService.initiateBooking(
                    traveler,
                    request.getSlotId(),
                    request.getVehicleNumber(),
                    request.getStartTime(),
                    request.getEndTime()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<?> confirmPayment(@Valid @RequestBody PaymentConfirmRequest request) {
        try {
            Booking booking = bookingService.confirmPayment(request);
            return ResponseEntity.ok(booking);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        User traveler = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.getTravelerBookings(traveler));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            User traveler = getAuthenticatedUser();
            Booking booking = bookingService.cancelBooking(id, traveler);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> addReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        try {
            User traveler = getAuthenticatedUser();
            Review review = bookingService.addReview(id, traveler, request.getRating(), request.getComment());
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
