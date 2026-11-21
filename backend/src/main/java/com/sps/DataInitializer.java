package com.sps;

import com.sps.persistence.domain.*;
import com.sps.persistence.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ParkingFacilityRepository facilityRepository;
    private final ParkingSlotRepository slotRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ParkingFacilityRepository facilityRepository,
                           ParkingSlotRepository slotRepository,
                           PricingRuleRepository pricingRuleRepository,
                           BookingRepository bookingRepository,
                           PaymentRepository paymentRepository,
                           ReviewRepository reviewRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.slotRepository = slotRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // Data already initialized
        }

        System.out.println(">>> Initializing Smart Parking System Default Data...");

        // 1. Create System Admin
        User admin = new User("System Administrator", "admin@sps.com", passwordEncoder.encode("admin123"), Role.ROLE_ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);
        admin.setApprovalStatus(VerificationStatus.APPROVED);
        admin.setPrivilegeLevel(10);
        userRepository.save(admin);

        // 2. Create Parking Owner
        User owner = new User("Rajesh Sharma (Owner)", "owner@sps.com", passwordEncoder.encode("owner123"), Role.ROLE_OWNER);
        owner.setAccountStatus(AccountStatus.ACTIVE);
        owner.setApprovalStatus(VerificationStatus.APPROVED);
        owner.setPayoutAccountRef("HDFC-99281726");
        userRepository.save(owner);

        // 3. Create Traveler
        User traveler = new User("Amit Patil (Traveler)", "traveler@sps.com", passwordEncoder.encode("traveler123"), Role.ROLE_TRAVELER);
        traveler.setAccountStatus(AccountStatus.ACTIVE);
        traveler.setVehicleNumber("MH-12-AB-1234");
        traveler.setPreferredVehicleType(VehicleType.CAR);
        userRepository.save(traveler);

        // 4. Create Facilities
        // Facility 1: Central Grand Mall Parking
        ParkingFacility f1 = new ParkingFacility(owner, "Central Grand Mall Parking", "102 M.G. Road, Near Phoenix Marketcity", "Pune", 18.5204, 73.8567);
        f1.setVerificationStatus(VerificationStatus.APPROVED);
        f1 = facilityRepository.save(f1);

        // Pricing rules for F1
        pricingRuleRepository.save(new PricingRule(f1, VehicleType.CAR, BigDecimal.valueOf(40.0)));
        pricingRuleRepository.save(new PricingRule(f1, VehicleType.BIKE, BigDecimal.valueOf(15.0)));
        pricingRuleRepository.save(new PricingRule(f1, VehicleType.EV, BigDecimal.valueOf(50.0)));

        // Slots for F1
        ParkingSlot s1 = slotRepository.save(new ParkingSlot(f1, "C-01", VehicleType.CAR));
        ParkingSlot s2 = slotRepository.save(new ParkingSlot(f1, "C-02", VehicleType.CAR));
        ParkingSlot s3 = slotRepository.save(new ParkingSlot(f1, "B-01", VehicleType.BIKE));
        ParkingSlot s4 = slotRepository.save(new ParkingSlot(f1, "EV-01", VehicleType.EV));

        // Facility 2: Metro Express Station Smart Garage
        ParkingFacility f2 = new ParkingFacility(owner, "Metro Express Station Garage", "Shivajinagar Metro Interchange", "Pune", 18.5308, 73.8475);
        f2.setVerificationStatus(VerificationStatus.APPROVED);
        f2 = facilityRepository.save(f2);

        pricingRuleRepository.save(new PricingRule(f2, VehicleType.CAR, BigDecimal.valueOf(35.0)));
        pricingRuleRepository.save(new PricingRule(f2, VehicleType.BIKE, BigDecimal.valueOf(10.0)));
        pricingRuleRepository.save(new PricingRule(f2, VehicleType.EV, BigDecimal.valueOf(45.0)));

        ParkingSlot s5 = slotRepository.save(new ParkingSlot(f2, "M-101", VehicleType.CAR));
        ParkingSlot s6 = slotRepository.save(new ParkingSlot(f2, "M-102", VehicleType.CAR));
        ParkingSlot s7 = slotRepository.save(new ParkingSlot(f2, "MB-01", VehicleType.BIKE));

        // Facility 3: Cyber City IT Park Parking
        ParkingFacility f3 = new ParkingFacility(owner, "Cyber City IT Park Parking", "Hinjawadi Phase 1, InfoTech Zone", "Pune", 18.5913, 73.7389);
        f3.setVerificationStatus(VerificationStatus.APPROVED);
        f3 = facilityRepository.save(f3);

        pricingRuleRepository.save(new PricingRule(f3, VehicleType.CAR, BigDecimal.valueOf(50.0)));
        pricingRuleRepository.save(new PricingRule(f3, VehicleType.EV, BigDecimal.valueOf(60.0)));

        ParkingSlot s8 = slotRepository.save(new ParkingSlot(f3, "IT-A1", VehicleType.CAR));
        ParkingSlot s9 = slotRepository.save(new ParkingSlot(f3, "IT-EV1", VehicleType.EV));

        // 5. Seed a Sample Completed Booking and Review
        Booking booking = new Booking("SPS-SEED-001", traveler, s1, "MH-12-AB-1234",
                LocalDateTime.now().minusHours(3), LocalDateTime.now().minusHours(1), BigDecimal.valueOf(80.0));
        booking.setBookingState(BookingState.COMPLETED);
        booking = bookingRepository.save(booking);

        Payment payment = new Payment(booking, BigDecimal.valueOf(80.0), "CARD");
        payment.markSuccess("TXN-SEED-PAY-01");
        paymentRepository.save(payment);
        booking.setPayment(payment);

        Review review = new Review(booking, 5, "Smooth parking discovery and seamless payment. Clean slots!");
        reviewRepository.save(review);
        booking.setReview(review);
        bookingRepository.save(booking);

        System.out.println(">>> Smart Parking System Default Data Seeded Successfully!");
    }
}
