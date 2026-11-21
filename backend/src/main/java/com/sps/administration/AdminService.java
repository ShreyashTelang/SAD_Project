package com.sps.administration;

import com.sps.persistence.domain.*;
import com.sps.persistence.repository.BookingRepository;
import com.sps.persistence.repository.ParkingFacilityRepository;
import com.sps.persistence.repository.ParkingSlotRepository;
import com.sps.persistence.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ParkingFacilityRepository facilityRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;

    public AdminService(UserRepository userRepository,
                        ParkingFacilityRepository facilityRepository,
                        ParkingSlotRepository slotRepository,
                        BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<ParkingFacility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional
    public User updateOwnerApproval(Long userId, VerificationStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setApprovalStatus(status);
        if (status == VerificationStatus.APPROVED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        } else if (status == VerificationStatus.REJECTED) {
            user.setAccountStatus(AccountStatus.BLOCKED);
        }
        return userRepository.save(user);
    }

    @Transactional
    public User toggleUserBlock(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountStatus() == AccountStatus.BLOCKED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        } else {
            user.setAccountStatus(AccountStatus.BLOCKED);
        }
        return userRepository.save(user);
    }

    @Transactional
    public ParkingFacility updateFacilityVerification(Long facilityId, VerificationStatus status) {
        ParkingFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found"));

        facility.setVerificationStatus(status);
        return facilityRepository.save(facility);
    }

    public Map<String, Object> getSystemAnalytics() {
        long totalUsers = userRepository.count();
        long totalOwners = userRepository.findByRole(Role.ROLE_OWNER).size();
        long totalTravelers = userRepository.findByRole(Role.ROLE_TRAVELER).size();
        long totalFacilities = facilityRepository.count();
        long totalSlots = slotRepository.count();
        long availableSlots = slotRepository.findAll().stream()
                .filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count();

        List<Booking> bookings = bookingRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long confirmedCount = 0;
        long cancelledCount = 0;

        for (Booking b : bookings) {
            if (b.getBookingState() == BookingState.CONFIRMED || b.getBookingState() == BookingState.COMPLETED) {
                confirmedCount++;
                if (b.getTotalAmount() != null) {
                    totalRevenue = totalRevenue.add(b.getTotalAmount());
                }
            } else if (b.getBookingState() == BookingState.CANCELLED) {
                cancelledCount++;
            }
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalUsers", totalUsers);
        analytics.put("totalOwners", totalOwners);
        analytics.put("totalTravelers", totalTravelers);
        analytics.put("totalFacilities", totalFacilities);
        analytics.put("totalSlots", totalSlots);
        analytics.put("availableSlots", availableSlots);
        analytics.put("totalBookings", bookings.size());
        analytics.put("confirmedBookings", confirmedCount);
        analytics.put("cancelledBookings", cancelledCount);
        analytics.put("totalPlatformRevenue", totalRevenue);

        return analytics;
    }
}
