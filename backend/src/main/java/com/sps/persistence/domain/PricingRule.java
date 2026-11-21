package com.sps.persistence.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "pricing_rules")
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facility_id", nullable = false)
    @JsonIgnoreProperties({"slots", "pricingRules", "owner"})
    private ParkingFacility facility;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerHour;

    @Column(nullable = false)
    private String currency = "INR";

    public PricingRule() {
    }

    public PricingRule(ParkingFacility facility, VehicleType vehicleType, BigDecimal ratePerHour) {
        this.facility = facility;
        this.vehicleType = vehicleType;
        this.ratePerHour = ratePerHour;
        this.currency = "INR";
    }

    public BigDecimal calculateAmount(LocalDateTime start, LocalDateTime end) {
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes <= 0) {
            minutes = 60; // minimum 1 hour charge
        }
        // Round up to nearest hour or hourly fraction
        double hours = Math.ceil(minutes / 60.0);
        return ratePerHour.multiply(BigDecimal.valueOf(hours)).setScale(2, RoundingMode.HALF_UP);
    }

    public Long getRuleId() {
        return ruleId;
    }

    public void setRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

    public ParkingFacility getFacility() {
        return facility;
    }

    public void setFacility(ParkingFacility facility) {
        this.facility = facility;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public BigDecimal getRatePerHour() {
        return ratePerHour;
    }

    public void setRatePerHour(BigDecimal ratePerHour) {
        this.ratePerHour = ratePerHour;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
