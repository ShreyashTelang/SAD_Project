package com.sps.persistence.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_slots")
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slotId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facility_id", nullable = false)
    @JsonIgnoreProperties({"slots", "pricingRules", "owner"})
    private ParkingFacility facility;

    @Column(nullable = false)
    private String slotNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotStatus slotStatus = SlotStatus.AVAILABLE;

    private LocalDateTime lockExpiresAt;

    public ParkingSlot() {
    }

    public ParkingSlot(ParkingFacility facility, String slotNumber, VehicleType vehicleType) {
        this.facility = facility;
        this.slotNumber = slotNumber;
        this.vehicleType = vehicleType;
        this.slotStatus = SlotStatus.AVAILABLE;
    }

    public boolean lock(int lockDurationMinutes) {
        if (this.slotStatus == SlotStatus.AVAILABLE) {
            this.slotStatus = SlotStatus.LOCKED;
            this.lockExpiresAt = LocalDateTime.now().plusMinutes(lockDurationMinutes);
            return true;
        }
        return false;
    }

    public void release() {
        this.slotStatus = SlotStatus.AVAILABLE;
        this.lockExpiresAt = null;
    }

    public void markOccupied() {
        this.slotStatus = SlotStatus.OCCUPIED;
        this.lockExpiresAt = null;
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }

    public ParkingFacility getFacility() {
        return facility;
    }

    public void setFacility(ParkingFacility facility) {
        this.facility = facility;
    }

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public SlotStatus getSlotStatus() {
        return slotStatus;
    }

    public void setSlotStatus(SlotStatus slotStatus) {
        this.slotStatus = slotStatus;
    }

    public LocalDateTime getLockExpiresAt() {
        return lockExpiresAt;
    }

    public void setLockExpiresAt(LocalDateTime lockExpiresAt) {
        this.lockExpiresAt = lockExpiresAt;
    }
}
