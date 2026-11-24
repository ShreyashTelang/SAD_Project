package com.sps.presentation;

import com.sps.persistence.domain.AccountStatus;
import com.sps.persistence.domain.User;
import com.sps.persistence.repository.UserRepository;
import com.sps.presentation.dto.*;
import com.sps.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered."));
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );

        user.setVehicleNumber(request.getVehicleNumber());
        user.setPreferredVehicleType(request.getPreferredVehicleType());
        user.setPayoutAccountRef(request.getPayoutAccountRef());

        user = userRepository.save(user);

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getUserId(),
                user.getName()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new AuthResponse(
                        token,
                        user.getUserId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getAccountStatus().name()
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        if (user.getAccountStatus() == AccountStatus.BLOCKED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account has been blocked by system administrator."));
        }

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getUserId(),
                user.getName()
        );

        return ResponseEntity.ok(
                new AuthResponse(
                        token,
                        user.getUserId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getAccountStatus().name()
                )
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No user found with the provided email address."));
        }

        // Generate a 6-digit OTP code for password reset
        String code = String.valueOf((int) (Math.random() * 900000) + 100000);
        user.setResetToken(code);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "A 6-digit password reset verification code has been dispatched.",
                "email", user.getEmail(),
                "demoVerificationCode", code // Included for seamless testing/demonstration
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }

        if (user.getResetToken() == null || !user.getResetToken().equals(request.getResetCode().trim())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid verification code. Please check and retry."));
        }

        if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Verification code has expired. Please request a new one."));
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password has been updated successfully! You can now sign in."));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        user.setName(request.getName().trim());
        if (request.getVehicleNumber() != null) {
            user.setVehicleNumber(request.getVehicleNumber().trim());
        }
        if (request.getPreferredVehicleType() != null) {
            user.setPreferredVehicleType(request.getPreferredVehicleType());
        }
        if (request.getPayoutAccountRef() != null) {
            user.setPayoutAccountRef(request.getPayoutAccountRef().trim());
        }
        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully.",
                "user", updatedUser
        ));
    }
}
