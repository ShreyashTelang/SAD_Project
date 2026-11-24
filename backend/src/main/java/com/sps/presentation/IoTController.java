package com.sps.presentation;

import com.sps.integration.IoTSensorService;
import com.sps.persistence.domain.SlotStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/iot")
public class IoTController {

    private final IoTSensorService ioTSensorService;

    public IoTController(IoTSensorService ioTSensorService) {
        this.ioTSensorService = ioTSensorService;
    }

    public static class PlateScanRequest {
        public Long facilityId;
        public String licensePlate;

        public Long getFacilityId() { return facilityId; }
        public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }
        public String getLicensePlate() { return licensePlate; }
        public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    }

    public static class SensorUpdateRequest {
        public Long slotId;
        public SlotStatus status;

        public Long getSlotId() { return slotId; }
        public void setSlotId(Long slotId) { this.slotId = slotId; }
        public SlotStatus getStatus() { return status; }
        public void setStatus(SlotStatus status) { this.status = status; }
    }

    @PostMapping("/gate/validate-plate")
    public ResponseEntity<Map<String, Object>> validatePlate(@RequestBody PlateScanRequest request) {
        Map<String, Object> result = ioTSensorService.validateLicensePlate(request.getFacilityId(), request.getLicensePlate());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/gate/exit")
    public ResponseEntity<Map<String, Object>> processExit(@RequestBody PlateScanRequest request) {
        Map<String, Object> result = ioTSensorService.processVehicleExit(request.getFacilityId(), request.getLicensePlate());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sensor/update-spot")
    public ResponseEntity<Map<String, Object>> updateSpotStatus(@RequestBody SensorUpdateRequest request) {
        Map<String, Object> result = ioTSensorService.updateSpotStatus(request.getSlotId(), request.getStatus());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/facility/{facilityId}/live-status")
    public ResponseEntity<List<Map<String, Object>>> getLiveStatus(@PathVariable Long facilityId) {
        return ResponseEntity.ok(ioTSensorService.getFacilityLiveSensorState(facilityId));
    }
}
