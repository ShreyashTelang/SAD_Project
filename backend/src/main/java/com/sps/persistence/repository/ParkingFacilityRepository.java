package com.sps.persistence.repository;

import com.sps.persistence.domain.ParkingFacility;
import com.sps.persistence.domain.User;
import com.sps.persistence.domain.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingFacilityRepository extends JpaRepository<ParkingFacility, Long> {
    List<ParkingFacility> findByOwner(User owner);
    List<ParkingFacility> findByVerificationStatus(VerificationStatus status);

    @Query("SELECT f FROM ParkingFacility f WHERE f.verificationStatus = 'APPROVED' AND " +
           "(LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.address) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ParkingFacility> searchApprovedFacilities(@Param("query") String query);
}
