package com.sps.presentation;

import com.sps.administration.AdminService;
import com.sps.persistence.domain.Booking;
import com.sps.persistence.domain.ParkingFacility;
import com.sps.persistence.domain.User;
import com.sps.persistence.domain.VerificationStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/approval")
    public ResponseEntity<User> updateOwnerApproval(@PathVariable Long id, @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(adminService.updateOwnerApproval(id, status));
    }

    @PatchMapping("/users/{id}/toggle-block")
    public ResponseEntity<User> toggleUserBlock(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserBlock(id));
    }

    @GetMapping("/facilities")
    public ResponseEntity<List<ParkingFacility>> getAllFacilities() {
        return ResponseEntity.ok(adminService.getAllFacilities());
    }

    @PatchMapping("/facilities/{id}/verification")
    public ResponseEntity<ParkingFacility> updateFacilityVerification(@PathVariable Long id, @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(adminService.updateFacilityVerification(id, status));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(adminService.getAllBookings());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(adminService.getSystemAnalytics());
    }
}
