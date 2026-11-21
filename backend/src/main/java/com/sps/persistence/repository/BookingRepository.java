package com.sps.persistence.repository;

import com.sps.persistence.domain.Booking;
import com.sps.persistence.domain.BookingState;
import com.sps.persistence.domain.ParkingSlot;
import com.sps.persistence.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingRef(String bookingRef);
    List<Booking> findByTraveler(User traveler);
    List<Booking> findByTravelerOrderByCreatedAtDesc(User traveler);
    
    @Query("SELECT b FROM Booking b WHERE b.slot.facility.owner = :owner ORDER BY b.createdAt DESC")
    List<Booking> findByFacilityOwner(@Param("owner") User owner);

    @Query("SELECT b FROM Booking b WHERE b.slot = :slot AND b.bookingState IN ('SLOT_LOCKED', 'CONFIRMED') AND " +
           "((b.startTime < :end AND b.endTime > :start))")
    List<Booking> findConflictingBookings(@Param("slot") ParkingSlot slot, 
                                         @Param("start") LocalDateTime start, 
                                         @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.bookingState = 'SLOT_LOCKED' AND b.createdAt < :cutoff")
    List<Booking> findExpiredPendingBookings(@Param("cutoff") LocalDateTime cutoff);

    List<Booking> findByBookingState(BookingState state);
}
