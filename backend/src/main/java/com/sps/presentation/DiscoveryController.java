package com.sps.presentation;

import com.sps.discovery.DiscoveryService;
import com.sps.persistence.domain.VehicleType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<DiscoveryService.FacilityDiscoveryCard>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "25.0") Double radiusKm,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating) {

        List<DiscoveryService.FacilityDiscoveryCard> results =
                discoveryService.searchAndFilter(query, lat, lon, radiusKm, vehicleType, maxPrice, minRating);

        return ResponseEntity.ok(results);
    }

    @GetMapping("/facilities/{id}")
    public ResponseEntity<Map<String, Object>> getFacilityDetails(@PathVariable Long id) {
        return ResponseEntity.ok(discoveryService.getFacilityDetailsWithSlots(id));
    }
}
