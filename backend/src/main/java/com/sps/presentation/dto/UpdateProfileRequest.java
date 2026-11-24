package com.sps.presentation.dto;

import com.sps.persistence.domain.VehicleType;
import jakarta.validation.constraints.NotBlank;

public class UpdateProfileRequest {

    @NotBlank(message = "Name cannot be empty")
    private String name;

    private String vehicleNumber;
    private VehicleType preferredVehicleType;
    private String payoutAccountRef;
    private String newPassword;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String name, String vehicleNumber, VehicleType preferredVehicleType, String payoutAccountRef) {
        this.name = name;
        this.vehicleNumber = vehicleNumber;
        this.preferredVehicleType = preferredVehicleType;
        this.payoutAccountRef = payoutAccountRef;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public VehicleType getPreferredVehicleType() {
        return preferredVehicleType;
    }

    public void setPreferredVehicleType(VehicleType preferredVehicleType) {
        this.preferredVehicleType = preferredVehicleType;
    }

    public String getPayoutAccountRef() {
        return payoutAccountRef;
    }

    public void setPayoutAccountRef(String payoutAccountRef) {
        this.payoutAccountRef = payoutAccountRef;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
