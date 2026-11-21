package com.sps.persistence.repository;

import com.sps.persistence.domain.ParkingFacility;
import com.sps.persistence.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    @Query("SELECT r FROM Review r WHERE r.booking.slot.facility = :facility ORDER BY r.createdAt DESC")
    List<Review> findByFacility(@Param("facility") ParkingFacility facility);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.slot.facility = :facility")
    Double getAverageRatingForFacility(@Param("facility") ParkingFacility facility);
}
