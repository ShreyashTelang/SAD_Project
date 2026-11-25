package com.sps.availability;

import com.sps.persistence.domain.*;
import com.sps.persistence.repository.BookingRepository;
import com.sps.persistence.repository.ParkingSlotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AvailabilityBookingEngine {

    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;

    public AvailabilityBookingEngine(ParkingSlotRepository slotRepository, BookingRepository bookingRepository) {
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Checks if a slot is physically active and free of overlapping reservations.
     */
    @Transactional(readOnly = true)
    public boolean checkAvailability(Long slotId, LocalDateTime start, LocalDateTime end) {
        ParkingSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null || slot.getSlotStatus() == SlotStatus.MAINTENANCE) {
            return false;
        }

        // Check if there are any conflicting active bookings for this slot during the window
        List<Booking> conflicts = bookingRepository.findConflictingBookings(slot, start, end);
        return conflicts.isEmpty();
    }

    /**
     * Atomically locks a slot temporarily for payment processing (e.g. 10 minutes).
     */
    @Transactional
    public synchronized boolean lockSlot(Long slotId, int durationMinutes) {
        ParkingSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null || slot.getSlotStatus() == SlotStatus.MAINTENANCE) {
            return false;
        }

        // If slot is already locked but lock has expired, release it first
        if (slot.getSlotStatus() == SlotStatus.LOCKED && slot.getLockExpiresAt() != null &&
                slot.getLockExpiresAt().isBefore(LocalDateTime.now())) {
            slot.release();
        }

        if (slot.getSlotStatus() == SlotStatus.AVAILABLE) {
            slot.lock(durationMinutes);
            slotRepository.save(slot);
            return true;
        }

        return false;
    }

    /**
     * Releases a locked slot back to AVAILABLE status.
     */
    @Transactional
    public synchronized void releaseLock(Long slotId) {
        slotRepository.findById(slotId).ifPresent(slot -> {
            if (slot.getSlotStatus() == SlotStatus.LOCKED) {
                slot.release();
                slotRepository.save(slot);
            }
        });
    }

    /**
     * Confirms booking and marks slot as occupied.
     */
    @Transactional
    public synchronized void confirmBooking(Booking booking) {
        booking.setBookingState(BookingState.CONFIRMED);
        bookingRepository.save(booking);

        ParkingSlot slot = booking.getSlot();
        slot.markOccupied();
        slotRepository.save(slot);
    }

    /**
     * Periodic and on-demand cleanup of expired locks to maintain real-time inventory integrity.
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public synchronized void refreshAvailability() {
        LocalDateTime now = LocalDateTime.now();
        List<ParkingSlot> expiredSlots = slotRepository.findExpiredLockedSlots(now);
        for (ParkingSlot slot : expiredSlots) {
            slot.release();
            slotRepository.save(slot);
        }

        // Also update any pending bookings past 10 minutes to EXPIRED
        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(now.minusMinutes(10));
        for (Booking b : expiredBookings) {
            b.setBookingState(BookingState.EXPIRED);
            bookingRepository.save(b);
        }
    }

    /**
     * Force reset all slots back to AVAILABLE (excluding MAINTENANCE) and expire all stale locked bookings.
     */
    @Transactional
    public synchronized void resetAllSlotsToAvailable() {
        List<ParkingSlot> slots = slotRepository.findAll();
        for (ParkingSlot s : slots) {
            if (s.getSlotStatus() != SlotStatus.MAINTENANCE) {
                s.release();
                slotRepository.save(s);
            }
        }
        List<Booking> lockedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingState() == BookingState.SLOT_LOCKED)
                .toList();
        for (Booking b : lockedBookings) {
            b.setBookingState(BookingState.EXPIRED);
            bookingRepository.save(b);
        }
    }
}
