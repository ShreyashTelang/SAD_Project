package com.sps.persistence.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    // Traveler specific attributes
    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType preferredVehicleType;

    // Parking Owner specific attributes
    @Enumerated(EnumType.STRING)
    private VerificationStatus approvalStatus;

    private String payoutAccountRef;

    // System Administrator specific attributes
    private Integer privilegeLevel = 1;

    // Password reset fields
    private String resetToken;
    private LocalDateTime resetTokenExpiry;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {
    }

    public User(String name, String email, String passwordHash, Role role) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        if (role == Role.ROLE_OWNER) {
            this.approvalStatus = VerificationStatus.PENDING;
            this.accountStatus = AccountStatus.PENDING_APPROVAL;
        } else {
            this.approvalStatus = VerificationStatus.APPROVED;
            this.accountStatus = AccountStatus.ACTIVE;
        }
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
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

    public VerificationStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(VerificationStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getPayoutAccountRef() {
        return payoutAccountRef;
    }

    public void setPayoutAccountRef(String payoutAccountRef) {
        this.payoutAccountRef = payoutAccountRef;
    }

    public Integer getPrivilegeLevel() {
        return privilegeLevel;
    }

    public void setPrivilegeLevel(Integer privilegeLevel) {
        this.privilegeLevel = privilegeLevel;
    }

    public String getResetToken() {
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public LocalDateTime getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
