# Smart Parking System (SPS) — Full-Stack Project

An end-to-end full-stack software application built for the **Software Architecture & Design (SAD)** project curriculum. The system adheres directly to the UML structural, behavioral, and architectural blueprints documented in the SAD practical specifications.

---

## 🏛️ System Architecture & SAD Design Alignment

The implementation maps 1:1 to the 6 SAD architecture documents:

| SAD Assignment / Document | Implementation Realization |
| :--- | :--- |
| **Assignment 1: SRS & Process Model** | Spring Boot backend + React frontend engineered according to the **Incremental Model** across 5 functional sprint increments. |
| **Assignment 2: Use Case Model** | Implements all 22 use cases across 3 primary actors (**Traveler**, **Parking Owner**, and **System Administrator**). |
| **Assignment 3: Structural Design** | 15 design classes mapped into entities (`User`, `ParkingFacility`, `ParkingSlot`, `PricingRule`, `Booking`, `Payment`, `Review`, `Notification`) and services (`AvailabilityBookingEngine`, `AuthenticationService`). |
| **Assignment 4: Architecture & Packages** | 9 acyclic packages: `sps.presentation`, `sps.discovery`, `sps.booking`, `sps.ownermgmt`, `sps.administration`, `sps.availability`, `sps.integration`, `sps.security`, `sps.persistence`. |
| **Practical 05: Workflow & State Models** | Concurrency-controlled slot locking (`SLOT_LOCKED`), booking confirmation, and `Payment` state machine (`INITIATED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SUCCESSFUL` / `FAILED` / `REFUNDED`). |
| **Practical 06: Sequence & Communication** | Atomic slot locking via `AvailabilityBookingEngine` with expiry timeouts to prevent double bookings during payments. |

---

## 💻 Technology Stack

* **Backend**: Java 21 / Spring Boot 3.4.3
  * **Security**: Spring Security 6 with stateless JWT Bearer token authentication & role authorization.
  * **Persistence**: Spring Data JPA & Hibernate 6 with MySQL dialect.
  * **Core Engine**: Custom atomic concurrency locking in `AvailabilityBookingEngine`.
* **Database**: MySQL Server 8.0
  * **Schema**: `sps_db`
  * **Auto-generated tables**: `users`, `parking_facilities`, `parking_slots`, `pricing_rules`, `bookings`, `payments`, `reviews`, `notifications`.
* **Frontend**: React 19 + Vite 6
  * **Icons**: `lucide-react`
  * **Proxy**: Configured to seamlessly proxy `/api/*` to `http://localhost:8080`.
  * **Portals**: Traveler ParkFinder, Owner Management Portal, System Admin Console.

---

## 🔑 Pre-Seeded Demo Accounts

The application automatically seeds initial data on first startup:

| Role | Email | Password | Pre-configured Data |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@sps.com` | `admin123` | Full governance, user approvals, facility approvals, analytics |
| **Parking Owner** | `owner@sps.com` | `owner123` | 3 registered facilities (Grand Mall, Metro Station, Cyber City) |
| **Traveler (Driver)** | `traveler@sps.com` | `traveler123` | Plate `MH-12-AB-1234`, sample completed reservation & review |

> **Tip:** You can also use the 1-click **Demo Switcher** at the top of the frontend header to switch between roles instantly!

---

## 🚀 Running the Project

### 1. Backend (Spring Boot)
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
* **API Base URL**: `http://localhost:8080`
* **MySQL Database**: `jdbc:mysql://localhost:3306/sps_db`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
* **Frontend Web App**: `http://localhost:5173`

---

## 📸 Key Features & Capabilities

1. **Integrated Payment Gateway**:
   * Multi-method payment checkout: Credit/Debit Card (auto-formatting, CVV, expiry), UPI (QR scan simulator or VPA ID), and Net Banking (major banks).
   * 256-Bit SSL encrypted simulation compliant with the SAD Payment Service State Machine.
   * Test switch for simulating bank decline, demonstrating how atomic slot locks are automatically released upon failure.

2. **Parking Cancellation & Automated Refund**:
   * Direct cancellation available right from the digital receipt upon booking or anytime from the "My Bookings" dashboard.
   * Dedicated cancellation confirmation modal showing the 100% full refund breakdown and destination method.
   * Automatically frees the locked/occupied slot back to `AVAILABLE` in real time and transitions payment to `REFUNDED`.

3. **Forgot Password & Account Recovery**:
   * "Forgot Password?" workflow on the Sign In dialog.
   * Step 1: Generates a secure 6-digit verification code with a 15-minute validity window.
   * Step 2: Verification of code and secure updating of BCrypt-hashed password.

4. **ParkFinder (Traveler)**:
   * Real-time search by location, landmark, or city.
   * Filters by Vehicle Type (`CAR`, `BIKE`, `EV`, `TRUCK`) and Max Hourly Price.
   * Live slot occupancy badge (e.g. `3/4 Free`).
   * Interactive slot selection and reservation with 10-minute atomic lock.
   * Multi-method payment simulation (`CARD`, `UPI`, `NETBANKING`).
   * Instant digital receipt with booking reference (`SPS-XXXXXXXX`).
   * Navigation link and post-visit 5-star review submission.
   * Reservation cancellation with automated refund trigger.

2. **Owner Portal**:
   * Add new parking facilities with address, city, and GPS coordinates.
   * Add slots with designated vehicle types.
   * Configure dynamic hourly tariffs per vehicle category.
   * Toggle slot maintenance mode.
   * Real-time incoming reservations view and revenue KPIs.

3. **Admin Console**:
   * Platform analytics: total platform revenue, active users, occupancy rates.
   * Owner approval/rejection workflow.
   * Facility listing verification.
   * User blocking/unblocking controls.
   * Global reservation monitoring.
