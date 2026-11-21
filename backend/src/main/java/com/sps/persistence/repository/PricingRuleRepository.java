package com.sps.persistence.repository;

import com.sps.persistence.domain.ParkingFacility;
import com.sps.persistence.domain.PricingRule;
import com.sps.persistence.domain.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    List<PricingRule> findByFacility(ParkingFacility facility);
    Optional<PricingRule> findByFacilityAndVehicleType(ParkingFacility facility, VehicleType vehicleType);
}
