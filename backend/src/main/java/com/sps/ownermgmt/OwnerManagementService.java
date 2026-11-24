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

    public Map<String, Object> generateOwnerRevenueReport(User owner) {
        List<ParkingFacility> facilities = facilityRepository.findByOwner(owner);
        List<Booking> bookings = bookingRepository.findByFacilityOwner(owner);

        BigDecimal totalGross = BigDecimal.ZERO;
        long confirmedCount = 0;
        long completedCount = 0;
        long cancelledCount = 0;

        Map<String, BigDecimal> revenueByVehicle = new HashMap<>();

        for (Booking b : bookings) {
            if (b.getBookingState() == BookingState.CONFIRMED || b.getBookingState() == BookingState.COMPLETED) {
                if (b.getBookingState() == BookingState.CONFIRMED) confirmedCount++;
                if (b.getBookingState() == BookingState.COMPLETED) completedCount++;

                if (b.getTotalAmount() != null) {
                    totalGross = totalGross.add(b.getTotalAmount());
                    String vType = b.getSlot().getVehicleType().name();
                    revenueByVehicle.put(vType, revenueByVehicle.getOrDefault(vType, BigDecimal.ZERO).add(b.getTotalAmount()));
                }
            } else if (b.getBookingState() == BookingState.CANCELLED) {
                cancelledCount++;
            }
        }

        BigDecimal platformFee = totalGross.multiply(new BigDecimal("0.10"));
        BigDecimal netPayout = totalGross.subtract(platformFee);

        List<Map<String, Object>> facilityDetails = new ArrayList<>();
        int allSlots = 0;
        for (ParkingFacility f : facilities) {
            List<ParkingSlot> slots = slotRepository.findByFacility(f);
            allSlots += slots.size();
            long occ = slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.OCCUPIED).count();
            long avail = slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count();

            List<Booking> fBookings = bookings.stream()
                    .filter(b -> b.getSlot().getFacility().getFacilityId().equals(f.getFacilityId()))
                    .toList();

            BigDecimal fRevenue = fBookings.stream()
                    .filter(b -> (b.getBookingState() == BookingState.CONFIRMED || b.getBookingState() == BookingState.COMPLETED) && b.getTotalAmount() != null)
                    .map(Booking::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> fMap = new HashMap<>();
            fMap.put("facilityId", f.getFacilityId());
            fMap.put("name", f.getName());
            fMap.put("address", f.getAddress() + ", " + f.getCity());
            fMap.put("status", f.getVerificationStatus().name());
            fMap.put("totalSlots", slots.size());
            fMap.put("availableSlots", avail);
            fMap.put("occupiedSlots", occ);
            fMap.put("occupancyPercentage", slots.isEmpty() ? 0.0 : Math.round(((double) occ / slots.size() * 100.0) * 10.0) / 10.0);
            fMap.put("bookingsCount", fBookings.size());
            fMap.put("revenue", fRevenue);
            facilityDetails.add(fMap);
        }

        Map<String, Object> report = new HashMap<>();
        report.put("ownerName", owner.getName());
        report.put("ownerEmail", owner.getEmail());
        report.put("payoutAccountRef", owner.getPayoutAccountRef() != null ? owner.getPayoutAccountRef() : "Not Linked");
        report.put("generatedAt", java.time.LocalDateTime.now().toString());
        report.put("totalFacilities", facilities.size());
        report.put("totalSlots", allSlots);
        report.put("totalBookings", bookings.size());
        report.put("confirmedBookings", confirmedCount);
        report.put("completedBookings", completedCount);
        report.put("cancelledBookings", cancelledCount);
        report.put("grossRevenue", totalGross);
        report.put("platformFee", platformFee);
        report.put("netPayout", netPayout);
        report.put("facilityBreakdown", facilityDetails);
        report.put("revenueByVehicleType", revenueByVehicle);

        return report;
    }
}
