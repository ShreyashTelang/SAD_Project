package com.sps.presentation;

import com.sps.ownermgmt.OwnerManagementService;
import com.sps.persistence.domain.*;
import com.sps.persistence.repository.UserRepository;
import com.sps.presentation.dto.FacilityRequest;
import com.sps.presentation.dto.PricingRuleRequest;
import com.sps.presentation.dto.SlotRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerManagementService ownerService;
    private final UserRepository userRepository;

    public OwnerController(OwnerManagementService ownerService, UserRepository userRepository) {
        this.ownerService = ownerService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedOwner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated owner not found."));
    }

    @GetMapping("/facilities")
    public ResponseEntity<List<ParkingFacility>> getMyFacilities() {
        User owner = getAuthenticatedOwner();
        return ResponseEntity.ok(ownerService.getOwnerFacilities(owner));
    }

    @PostMapping("/facilities")
    public ResponseEntity<ParkingFacility> createFacility(@Valid @RequestBody FacilityRequest request) {
        User owner = getAuthenticatedOwner();
        ParkingFacility facility = ownerService.createFacility(
                owner,
                request.getName(),
                request.getAddress(),
                request.getCity(),
                request.getLatitude(),
                request.getLongitude()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(facility);
    }

    @PostMapping("/facilities/{id}/slots")
    public ResponseEntity<ParkingSlot> addSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest request) {
        User owner = getAuthenticatedOwner();
        ParkingSlot slot = ownerService.addSlot(id, owner, request.getSlotNumber(), request.getVehicleType());
        return ResponseEntity.status(HttpStatus.CREATED).body(slot);
    }

    @PatchMapping("/slots/{slotId}/status")
    public ResponseEntity<ParkingSlot> updateSlotStatus(@PathVariable Long slotId, @RequestParam SlotStatus status) {
        User owner = getAuthenticatedOwner();
        ParkingSlot slot = ownerService.updateSlotStatus(slotId, owner, status);
        return ResponseEntity.ok(slot);
    }

    @PostMapping("/facilities/{id}/pricing")
    public ResponseEntity<PricingRule> setPricing(@PathVariable Long id, @Valid @RequestBody PricingRuleRequest request) {
        User owner = getAuthenticatedOwner();
        PricingRule rule = ownerService.setPricingRule(id, owner, request.getVehicleType(), request.getRatePerHour());
        return ResponseEntity.ok(rule);
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<Booking>> getReservations() {
        User owner = getAuthenticatedOwner();
        return ResponseEntity.ok(ownerService.getOwnerReservations(owner));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        User owner = getAuthenticatedOwner();
        return ResponseEntity.ok(ownerService.getOwnerDashboardStats(owner));
    }

    @GetMapping("/reports/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueReport() {
        User owner = getAuthenticatedOwner();
        return ResponseEntity.ok(ownerService.generateOwnerRevenueReport(owner));
    }
}
