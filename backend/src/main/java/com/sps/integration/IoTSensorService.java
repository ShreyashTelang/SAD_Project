package com.sps.integration;

import com.sps.persistence.domain.*;
import com.sps.persistence.repository.BookingRepository;
import com.sps.persistence.repository.ParkingFacilityRepository;
import com.sps.persistence.repository.ParkingSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class IoTSensorService {

    private final ParkingFacilityRepository facilityRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;

    public IoTSensorService(ParkingFacilityRepository facilityRepository,
                            ParkingSlotRepository slotRepository,
                            BookingRepository bookingRepository) {
        this.facilityRepository = facilityRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Use Case: Validate License Plate <<extend>> Update Spot Status
     * ANPR Gate camera scans license plate upon arrival.
     */
    @Transactional
    public Map<String, Object> validateLicensePlate(Long facilityId, String licensePlate) {
        Map<String, Object> response = new HashMap<>();
        response.put("scannedPlate", licensePlate);
        response.put("timestamp", LocalDateTime.now().toString());

        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            response.put("accessGranted", false);
            response.put("barrierOpened", false);
            response.put("message", "Error: License plate could not be detected or is blank.");
            return response;
        }

        String cleanPlate = licensePlate.trim().toUpperCase().replaceAll("\\s+", "");

        ParkingFacility facility = facilityRepository.findById(facilityId).orElse(null);
        if (facility == null) {
            response.put("accessGranted", false);
            response.put("barrierOpened", false);
            response.put("message", "Error: Invalid facility ID " + facilityId);
            return response;
        }

        List<Booking> bookings = bookingRepository.findActiveBookingForPlateAtFacility(facilityId, cleanPlate);

        // Also check if any booking has plain normalized string matching
        if (bookings.isEmpty()) {
            List<Booking> allConfirmed = bookingRepository.findByBookingState(BookingState.CONFIRMED);
            bookings = allConfirmed.stream()
                    .filter(b -> b.getSlot().getFacility().getFacilityId().equals(facilityId))
                    .filter(b -> {
                        String bPlate = b.getVehicleNumber() != null ? b.getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", "") : "";
                        String uPlate = b.getTraveler() != null && b.getTraveler().getVehicleNumber() != null ?
                                b.getTraveler().getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", "") : "";
                        return bPlate.equals(cleanPlate) || uPlate.equals(cleanPlate);
                    })
                    .toList();
        }

        if (bookings.isEmpty()) {
            response.put("accessGranted", false);
            response.put("barrierOpened", false);
            response.put("facilityName", facility.getName());
            response.put("message", "Access DENIED: No active confirmed reservation found for license plate [" + cleanPlate + "] at " + facility.getName());
            return response;
        }

        // Match found! Select the earliest active booking
        Booking matchedBooking = bookings.get(0);
        ParkingSlot slot = matchedBooking.getSlot();

        // Update spot status via IoT trigger
        slot.setSlotStatus(SlotStatus.OCCUPIED);
        slotRepository.save(slot);

        response.put("accessGranted", true);
        response.put("barrierOpened", true);
        response.put("bookingRef", matchedBooking.getBookingRef());
        response.put("slotNumber", slot.getSlotNumber());
        response.put("slotId", slot.getSlotId());
        response.put("vehicleType", slot.getVehicleType().name());
        response.put("travelerName", matchedBooking.getTraveler().getName());
        response.put("facilityName", facility.getName());
        response.put("validUntil", matchedBooking.getEndTime().toString());
        response.put("message", "Access GRANTED: Gate barrier lifted. Welcome " + matchedBooking.getTraveler().getName() + "! Proceed to Slot " + slot.getSlotNumber() + ".");

        return response;
    }

    /**
     * ANPR Exit barrier scan - checks out vehicle and marks slot AVAILABLE.
     */
    @Transactional
    public Map<String, Object> processVehicleExit(Long facilityId, String licensePlate) {
        Map<String, Object> response = new HashMap<>();
        response.put("scannedPlate", licensePlate);
        response.put("timestamp", LocalDateTime.now().toString());

        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            response.put("exitGranted", false);
            response.put("barrierOpened", false);
            response.put("message", "Error: License plate blank.");
            return response;
        }

        String cleanPlate = licensePlate.trim().toUpperCase().replaceAll("\\s+", "");

        List<Booking> bookings = bookingRepository.findOccupiedBookingForPlateAtFacility(facilityId, cleanPlate);
        if (bookings.isEmpty()) {
            List<Booking> allBookings = bookingRepository.findAll();
            bookings = allBookings.stream()
                    .filter(b -> b.getSlot().getFacility().getFacilityId().equals(facilityId))
                    .filter(b -> b.getBookingState() == BookingState.CONFIRMED || b.getSlot().getSlotStatus() == SlotStatus.OCCUPIED)
                    .filter(b -> {
                        String bPlate = b.getVehicleNumber() != null ? b.getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", "") : "";
                        String uPlate = b.getTraveler() != null && b.getTraveler().getVehicleNumber() != null ?
                                b.getTraveler().getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", "") : "";
                        return bPlate.equals(cleanPlate) || uPlate.equals(cleanPlate);
                    })
                    .toList();
        }

        if (bookings.isEmpty()) {
            response.put("exitGranted", true);
            response.put("barrierOpened", true);
            response.put("message", "Exit barrier opened. Safe journey!");
            return response;
        }

        Booking booking = bookings.get(0);
        ParkingSlot slot = booking.getSlot();
        slot.setSlotStatus(SlotStatus.AVAILABLE);
        slotRepository.save(slot);

        booking.setBookingState(BookingState.COMPLETED);
        bookingRepository.save(booking);

        response.put("exitGranted", true);
        response.put("barrierOpened", true);
        response.put("bookingRef", booking.getBookingRef());
        response.put("slotNumber", slot.getSlotNumber());
        response.put("message", "Exit GRANTED: Parking session completed. Slot " + slot.getSlotNumber() + " is now free. Thank you!");

        return response;
    }

    /**
     * Ground Ultrasonic IoT Sensor status update.
     */
    @Transactional
    public Map<String, Object> updateSpotStatus(Long slotId, SlotStatus status) {
        ParkingSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found with id: " + slotId));

        slot.setSlotStatus(status);
        ParkingSlot updated = slotRepository.save(slot);

        // If status changed to AVAILABLE, check if any active booking on this slot needs completion
        if (status == SlotStatus.AVAILABLE) {
            List<Booking> active = bookingRepository.findAll().stream()
                    .filter(b -> b.getSlot().getSlotId().equals(slotId) && b.getBookingState() == BookingState.CONFIRMED)
                    .toList();
            for (Booking b : active) {
                b.setBookingState(BookingState.COMPLETED);
                bookingRepository.save(b);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("slotId", updated.getSlotId());
        response.put("slotNumber", updated.getSlotNumber());
        response.put("newStatus", updated.getSlotStatus().name());
        response.put("facilityId", updated.getFacility().getFacilityId());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", "IoT Sensor successfully updated slot " + updated.getSlotNumber() + " to " + updated.getSlotStatus().name());

        return response;
    }

    /**
     * Live IoT status of all slots in a facility.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFacilityLiveSensorState(Long facilityId) {
        ParkingFacility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found: " + facilityId));

        List<ParkingSlot> slots = slotRepository.findByFacility(facility);
        List<Map<String, Object>> list = new ArrayList<>();

        for (ParkingSlot slot : slots) {
            Map<String, Object> map = new HashMap<>();
            map.put("slotId", slot.getSlotId());
            map.put("slotNumber", slot.getSlotNumber());
            map.put("vehicleType", slot.getVehicleType().name());
            map.put("status", slot.getSlotStatus().name());
            map.put("facilityName", facility.getName());
            list.add(map);
        }

        return list;
    }
}
