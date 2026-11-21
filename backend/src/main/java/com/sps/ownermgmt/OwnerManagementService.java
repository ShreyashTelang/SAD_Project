package com.sps.ownermgmt;

import com.sps.persistence.domain.*;
import com.sps.persistence.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OwnerManagementService {

    private final ParkingFacilityRepository facilityRepository;
    private final ParkingSlotRepository slotRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final BookingRepository bookingRepository;

    public OwnerManagementService(ParkingFacilityRepository facilityRepository,
                                  ParkingSlotRepository slotRepository,
                                  PricingRuleRepository pricingRuleRepository,
                                  BookingRepository bookingRepository) {
        this.facilityRepository = facilityRepository;
        this.slotRepository = slotRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<ParkingFacility> getOwnerFacilities(User owner) {
        return facilityRepository.findByOwner(owner);
    }

    @Transactional
    public ParkingFacility createFacility(User owner, String name, String address, String city,
                                          Double latitude, Double longitude) {
        ParkingFacility facility = new ParkingFacility(owner, name, address, city, latitude, longitude);
        // By default new facilities start as APPROVED or PENDING based on admin policy
        facility.setVerificationStatus(VerificationStatus.APPROVED);
        return facilityRepository.save(facility);
    }

    @Transactional
    public ParkingSlot addSlot(Long facilityId, User owner, String slotNumber, VehicleType vehicleType) {
        ParkingFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found"));

        if (!facility.getOwner().getUserId().equals(owner.getUserId())) {
            throw new SecurityException("Unauthorized: Not the facility owner.");
        }

        ParkingSlot slot = new ParkingSlot(facility, slotNumber, vehicleType);
        return slotRepository.save(slot);
    }

    @Transactional
    public PricingRule setPricingRule(Long facilityId, User owner, VehicleType vehicleType, BigDecimal ratePerHour) {
        ParkingFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found"));

        if (!facility.getOwner().getUserId().equals(owner.getUserId())) {
            throw new SecurityException("Unauthorized: Not the facility owner.");
        }

        PricingRule rule = pricingRuleRepository.findByFacilityAndVehicleType(facility, vehicleType)
                .orElse(new PricingRule(facility, vehicleType, ratePerHour));

        rule.setRatePerHour(ratePerHour);
        return pricingRuleRepository.save(rule);
    }

    @Transactional
    public ParkingSlot updateSlotStatus(Long slotId, User owner, SlotStatus newStatus) {
        ParkingSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        if (!slot.getFacility().getOwner().getUserId().equals(owner.getUserId())) {
            throw new SecurityException("Unauthorized: Not the facility owner.");
        }

        slot.setSlotStatus(newStatus);
        return slotRepository.save(slot);
    }

    public List<Booking> getOwnerReservations(User owner) {
        return bookingRepository.findByFacilityOwner(owner);
    }

    public Map<String, Object> getOwnerDashboardStats(User owner) {
        List<ParkingFacility> facilities = facilityRepository.findByOwner(owner);
        List<Booking> bookings = bookingRepository.findByFacilityOwner(owner);

        int totalSlots = 0;
        int activeSlots = 0;
        for (ParkingFacility f : facilities) {
            List<ParkingSlot> slots = slotRepository.findByFacility(f);
            totalSlots += slots.size();
            activeSlots += (int) slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count();
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int confirmedBookingsCount = 0;

        for (Booking b : bookings) {
            if (b.getBookingState() == BookingState.CONFIRMED || b.getBookingState() == BookingState.COMPLETED) {
                confirmedBookingsCount++;
                if (b.getTotalAmount() != null) {
                    totalRevenue = totalRevenue.add(b.getTotalAmount());
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFacilities", facilities.size());
        stats.put("totalSlots", totalSlots);
        stats.put("availableSlots", activeSlots);
        stats.put("totalBookings", bookings.size());
        stats.put("confirmedBookings", confirmedBookingsCount);
        stats.put("totalRevenue", totalRevenue);

        return stats;
    }
}
