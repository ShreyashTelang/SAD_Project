package com.sps.presentation.dto;

import com.sps.persistence.domain.VehicleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PricingRuleRequest {

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotNull(message = "Rate per hour is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate must be positive")
    private BigDecimal ratePerHour;

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
}
