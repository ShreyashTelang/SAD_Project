package com.sps.discovery;

import com.sps.availability.AvailabilityBookingEngine;
import com.sps.integration.MapServiceAdapter;
import com.sps.persistence.domain.*;
import com.sps.persistence.repository.ParkingFacilityRepository;
import com.sps.persistence.repository.ParkingSlotRepository;
import com.sps.persistence.repository.PricingRuleRepository;
import com.sps.persistence.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DiscoveryService {

    private final ParkingFacilityRepository facilityRepository;
    private final ParkingSlotRepository slotRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final ReviewRepository reviewRepository;
    private final MapServiceAdapter mapServiceAdapter;
    private final AvailabilityBookingEngine availabilityEngine;

    public DiscoveryService(ParkingFacilityRepository facilityRepository,
                            ParkingSlotRepository slotRepository,
                            PricingRuleRepository pricingRuleRepository,
                            ReviewRepository reviewRepository,
                            MapServiceAdapter mapServiceAdapter,
                            AvailabilityBookingEngine availabilityEngine) {
        this.facilityRepository = facilityRepository;
        this.slotRepository = slotRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.reviewRepository = reviewRepository;
        this.mapServiceAdapter = mapServiceAdapter;
        this.availabilityEngine = availabilityEngine;
    }

    public static class FacilityDiscoveryCard {
        public Long facilityId;
        public String name;
        public String address;
        public String city;
        public Double latitude;
        public Double longitude;
        public Double distanceKm;
        public Integer travelTimeMinutes;
        public Double averageRating;
        public int totalReviews;
        public int availableSlots;
        public int totalSlots;
        public Map<VehicleType, BigDecimal> pricingByVehicle = new HashMap<>();
    }

    @Transactional
    public List<FacilityDiscoveryCard> searchAndFilter(String query,
                                                       Double userLat,
                                                       Double userLon,
                                                       Double radiusKm,
                                                       VehicleType vehicleType,
                                                       BigDecimal maxPrice,
                                                       Double minRating) {

        availabilityEngine.refreshAvailability();

        List<ParkingFacility> facilities;
        if (query != null && !query.trim().isEmpty()) {
            facilities = facilityRepository.searchApprovedFacilities(query.trim());
        } else {
            facilities = facilityRepository.findByVerificationStatus(VerificationStatus.APPROVED);
        }

        List<FacilityDiscoveryCard> result = new ArrayList<>();

        for (ParkingFacility facility : facilities) {
            FacilityDiscoveryCard card = new FacilityDiscoveryCard();
            card.facilityId = facility.getFacilityId();
            card.name = facility.getName();
            card.address = facility.getAddress();
            card.city = facility.getCity();
            card.latitude = facility.getLatitude();
            card.longitude = facility.getLongitude();

            // Distance calculation
            if (userLat != null && userLon != null && facility.getLatitude() != null && facility.getLongitude() != null) {
                card.distanceKm = mapServiceAdapter.calculateDistanceKm(userLat, userLon, facility.getLatitude(), facility.getLongitude());
                card.travelTimeMinutes = mapServiceAdapter.estimateTravelTimeMinutes(card.distanceKm);

                if (radiusKm != null && card.distanceKm > radiusKm) {
                    continue; // Skip if outside search radius
                }
            }

            // Ratings
            Double avgRating = reviewRepository.getAverageRatingForFacility(facility);
            card.averageRating = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 4.5;
            card.totalReviews = reviewRepository.findByFacility(facility).size();
            if (minRating != null && card.averageRating < minRating) {
                continue;
            }

            // Slots & Availability
            List<ParkingSlot> slots = slotRepository.findByFacility(facility);
            card.totalSlots = slots.size();
            card.availableSlots = (int) slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count();

            // Pricing rules
            List<PricingRule> rules = pricingRuleRepository.findByFacility(facility);
            for (PricingRule rule : rules) {
                card.pricingByVehicle.put(rule.getVehicleType(), rule.getRatePerHour());
            }

            // Filter by vehicle type
            if (vehicleType != null) {
                boolean hasVehicleSlot = slots.stream().anyMatch(s -> s.getVehicleType() == vehicleType);
                if (!hasVehicleSlot) {
                    continue;
                }
            }

            // Filter by max price
            if (maxPrice != null && vehicleType != null && card.pricingByVehicle.containsKey(vehicleType)) {
                if (card.pricingByVehicle.get(vehicleType).compareTo(maxPrice) > 0) {
                    continue;
                }
            }

            result.add(card);
        }

        // Sort by distance if user coordinates provided, otherwise by available slots
        if (userLat != null && userLon != null) {
            result.sort(Comparator.comparing(c -> c.distanceKm != null ? c.distanceKm : Double.MAX_VALUE));
        }

        return result;
    }

    @Transactional
    public Map<String, Object> getFacilityDetailsWithSlots(Long facilityId) {
        availabilityEngine.refreshAvailability();

        ParkingFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Parking facility not found"));

        List<ParkingSlot> slots = slotRepository.findByFacility(facility);
        List<PricingRule> rules = pricingRuleRepository.findByFacility(facility);
        List<Review> reviews = reviewRepository.findByFacility(facility);
        Double avgRating = reviewRepository.getAverageRatingForFacility(facility);

        Map<String, Object> response = new HashMap<>();
        response.put("facility", facility);
        response.put("slots", slots);
        response.put("pricingRules", rules);
        response.put("reviews", reviews);
        response.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 5.0);
        response.put("availableSlotsCount", slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count());
        response.put("totalSlotsCount", slots.size());

        return response;
    }

    @Transactional(readOnly = true)
    public List<FacilityDiscoveryCard> getAlternativeFacilities(Long currentFacilityId, VehicleType vehicleType) {
        ParkingFacility currentFacility = facilityRepository.findById(currentFacilityId)
                .orElse(null);

        Double currentLat = currentFacility != null ? currentFacility.getLatitude() : null;
        Double currentLon = currentFacility != null ? currentFacility.getLongitude() : null;

        List<ParkingFacility> approved = facilityRepository.findByVerificationStatus(VerificationStatus.APPROVED);
        List<FacilityDiscoveryCard> alternatives = new ArrayList<>();

        for (ParkingFacility f : approved) {
            if (f.getFacilityId().equals(currentFacilityId)) {
                continue;
            }

            List<ParkingSlot> slots = slotRepository.findByFacility(f);
            long availableCount = slots.stream().filter(s -> s.getSlotStatus() == SlotStatus.AVAILABLE).count();

            if (vehicleType != null) {
                long vehicleTypeAvailable = slots.stream()
                        .filter(s -> s.getVehicleType() == vehicleType && s.getSlotStatus() == SlotStatus.AVAILABLE)
                        .count();
                if (vehicleTypeAvailable == 0) {
                    continue; // Skip if no slots for requested vehicle type
                }
            } else if (availableCount == 0) {
                continue; // Skip full facilities
            }

            FacilityDiscoveryCard card = new FacilityDiscoveryCard();
            card.facilityId = f.getFacilityId();
            card.name = f.getName();
            card.address = f.getAddress();
            card.city = f.getCity();
            card.latitude = f.getLatitude();
            card.longitude = f.getLongitude();
            card.totalSlots = slots.size();
            card.availableSlots = (int) availableCount;

            if (currentLat != null && currentLon != null && f.getLatitude() != null && f.getLongitude() != null) {
                card.distanceKm = mapServiceAdapter.calculateDistanceKm(currentLat, currentLon, f.getLatitude(), f.getLongitude());
                card.travelTimeMinutes = mapServiceAdapter.estimateTravelTimeMinutes(card.distanceKm);
            }

            Double avgRating = reviewRepository.getAverageRatingForFacility(f);
            card.averageRating = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 4.5;
            card.totalReviews = reviewRepository.findByFacility(f).size();

            List<PricingRule> rules = pricingRuleRepository.findByFacility(f);
            for (PricingRule rule : rules) {
                card.pricingByVehicle.put(rule.getVehicleType(), rule.getRatePerHour());
            }

            alternatives.add(card);
        }

        alternatives.sort(Comparator.comparing(c -> c.distanceKm != null ? c.distanceKm : Double.MAX_VALUE));
        return alternatives.stream().limit(5).collect(Collectors.toList());
    }
}
