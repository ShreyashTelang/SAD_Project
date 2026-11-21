package com.sps.persistence.repository;

import com.sps.persistence.domain.ParkingFacility;
import com.sps.persistence.domain.ParkingSlot;
import com.sps.persistence.domain.SlotStatus;
import com.sps.persistence.domain.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByFacility(ParkingFacility facility);
    List<ParkingSlot> findByFacilityAndSlotStatus(ParkingFacility facility, SlotStatus status);
    List<ParkingSlot> findByFacilityAndVehicleTypeAndSlotStatus(ParkingFacility facility, VehicleType vehicleType, SlotStatus status);
    
    @Query("SELECT s FROM ParkingSlot s WHERE s.slotStatus = 'LOCKED' AND s.lockExpiresAt < :now")
    List<ParkingSlot> findExpiredLockedSlots(@Param("now") LocalDateTime now);

    long countByFacilityAndSlotStatus(ParkingFacility facility, SlotStatus status);
}
