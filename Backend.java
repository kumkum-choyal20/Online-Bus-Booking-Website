// ============================================================
// BusGo — Java Spring Boot Backend Reference
// Full Stack Architecture for Online Bus Booking System
// ============================================================
// Tech Stack:
//   Frontend  : HTML5, CSS3, Bootstrap 5, JavaScript (ES6+)
//   Backend   : Java 17, Spring Boot 3.x, Spring MVC, Spring Security
//   ORM       : Spring Data JPA (Hibernate)
//   Database  : MySQL 8 / PostgreSQL 15
//   Build     : Maven / Gradle
// ============================================================

// ============ PACKAGE STRUCTURE ============
// com.busgo
// ├── controller/
// │   ├── BusController.java
// │   ├── BookingController.java
// │   └── UserController.java
// ├── service/
// │   ├── BusService.java
// │   ├── BookingService.java
// │   └── UserService.java
// ├── repository/
// │   ├── BusRepository.java
// │   ├── BookingRepository.java
// │   └── UserRepository.java
// ├── model/
// │   ├── Bus.java
// │   ├── Booking.java
// │   └── User.java
// ├── dto/
// │   ├── BookingRequest.java
// │   └── SearchRequest.java
// └── BusGoApplication.java

// ============================================================
// 1. ENTITY: Bus.java (JPA Entity → SQL buses table)
// ============================================================
package com.busgo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "buses")
public class Bus {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String operator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusType type;  // AC, SLEEPER, VOLVO, ORDINARY

    @Column(name = "from_city", nullable = false)
    private String fromCity;

    @Column(name = "to_city", nullable = false)
    private String toCity;

    private String departure;   // "20:00"
    private String arrival;     // "08:00"
    private String duration;    // "12h"

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "total_seats")
    private Integer totalSeats;

    private Double rating;
    private String amenities;
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum BusType { ac, sleeper, volvo, ordinary }

    // Getters & Setters (use Lombok @Data in real project)
    public Long getId()             { return id; }
    public String getOperator()     { return operator; }
    public BusType getType()        { return type; }
    public String getFromCity()     { return fromCity; }
    public String getToCity()       { return toCity; }
    public String getDeparture()    { return departure; }
    public String getArrival()      { return arrival; }
    public String getDuration()     { return duration; }
    public BigDecimal getPrice()    { return price; }
    public Integer getTotalSeats()  { return totalSeats; }
    public Double getRating()       { return rating; }
    public String getAmenities()    { return amenities; }
    public Boolean getActive()      { return active; }
}

// ============================================================
// 2. ENTITY: Booking.java
// ============================================================
package com.busgo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String pnr;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @Column(name = "passenger_name") private String passengerName;
    private String phone;
    private String email;

    @Column(name = "travel_date")   private LocalDate travelDate;
    @Column(name = "seats_booked")  private String seatsBooked;
    @Column(name = "total_amount")  private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum BookingStatus { CONFIRMED, CANCELLED, PENDING }
}

// ============================================================
// 3. REPOSITORY: BusRepository.java (Spring Data JPA)
// ============================================================
package com.busgo.repository;

import com.busgo.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BusRepository extends JpaRepository<Bus, Long> {

    // SELECT * FROM buses WHERE from_city=? AND to_city=? AND active=true
    List<Bus> findByFromCityIgnoreCaseAndToCityIgnoreCaseAndActiveTrue(
        String fromCity, String toCity);

    // SELECT * FROM buses WHERE type=? AND active=true ORDER BY price ASC
    List<Bus> findByTypeAndActiveTrueOrderByPriceAsc(Bus.BusType type);

    // Custom JPQL query
    @Query("SELECT b FROM Bus b WHERE " +
           "LOWER(b.fromCity) LIKE LOWER(CONCAT('%', :from, '%')) AND " +
           "LOWER(b.toCity) LIKE LOWER(CONCAT('%', :to, '%')) AND " +
           "b.active = true ORDER BY b.price ASC")
    List<Bus> searchBuses(@Param("from") String from, @Param("to") String to);
}

// ============================================================
// 4. REPOSITORY: BookingRepository.java
// ============================================================
package com.busgo.repository;

import com.busgo.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByPnr(String pnr);
    List<Booking> findByEmail(String email);
    long countByBusIdAndTravelDate(Long busId, java.time.LocalDate date);
}

// ============================================================
// 5. SERVICE: BusService.java
// ============================================================
package com.busgo.service;

import com.busgo.model.Bus;
import com.busgo.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    public List<Bus> searchBuses(String from, String to) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            return busRepository.findAll();
        }
        return busRepository.searchBuses(from.trim(), to.trim());
    }

    public Bus getBusById(Long id) {
        return busRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Bus not found: " + id));
    }

    public int getAvailableSeats(Long busId, java.time.LocalDate date) {
        Bus bus = getBusById(busId);
        long booked = bookingRepository.countByBusIdAndTravelDate(busId, date);
        return bus.getTotalSeats() - (int) booked;
    }
}

// ============================================================
// 6. SERVICE: BookingService.java
// ============================================================
package com.busgo.service;

import com.busgo.model.Booking;
import com.busgo.model.Bus;
import com.busgo.dto.BookingRequest;
import com.busgo.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class BookingService {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private BusService busService;

    @Transactional
    public Booking createBooking(BookingRequest request) {
        // Validate bus exists
        Bus bus = busService.getBusById(request.getBusId());

        // Check seat availability
        int available = busService.getAvailableSeats(request.getBusId(), request.getTravelDate());
        if (available < request.getSeats().size()) {
            throw new RuntimeException("Not enough seats available.");
        }

        // Generate unique PNR
        String pnr = "BG" + System.currentTimeMillis();

        // Calculate total
        BigDecimal total = bus.getPrice().multiply(BigDecimal.valueOf(request.getSeats().size()));

        // Create booking entity
        Booking booking = new Booking();
        booking.setPnr(pnr);
        booking.setBus(bus);
        booking.setPassengerName(request.getPassengerName());
        booking.setPhone(request.getPhone());
        booking.setEmail(request.getEmail());
        booking.setTravelDate(request.getTravelDate());
        booking.setSeatsBooked(request.getSeats().toString());
        booking.setTotalAmount(total);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setCreatedAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    public Booking getBookingByPnr(String pnr) {
        return bookingRepository.findByPnr(pnr)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + pnr));
    }

    @Transactional
    public Booking cancelBooking(String pnr) {
        Booking booking = getBookingByPnr(pnr);
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
}

// ============================================================
// 7. CONTROLLER: BusController.java (REST API)
// ============================================================
package com.busgo.controller;

import com.busgo.model.Bus;
import com.busgo.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/buses")
@CrossOrigin(origins = "*")
public class BusController {

    @Autowired
    private BusService busService;

    // GET /api/buses/search?from=Bangalore&to=Mumbai
    @GetMapping("/search")
    public ResponseEntity<List<Bus>> searchBuses(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to) {
        return ResponseEntity.ok(busService.searchBuses(from, to));
    }

    // GET /api/buses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Bus> getBusById(@PathVariable Long id) {
        return ResponseEntity.ok(busService.getBusById(id));
    }

    // GET /api/buses/{id}/seats?date=2025-01-01
    @GetMapping("/{id}/seats")
    public ResponseEntity<Integer> getAvailableSeats(
        @PathVariable Long id,
        @RequestParam String date) {
        return ResponseEntity.ok(busService.getAvailableSeats(
            id, java.time.LocalDate.parse(date)));
    }
}

// ============================================================
// 8. CONTROLLER: BookingController.java
// ============================================================
package com.busgo.controller;

import com.busgo.dto.BookingRequest;
import com.busgo.model.Booking;
import com.busgo.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // POST /api/bookings/create
    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    // GET /api/bookings/pnr/{pnr}
    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<Booking> getBookingByPnr(@PathVariable String pnr) {
        return ResponseEntity.ok(bookingService.getBookingByPnr(pnr));
    }

    // PUT /api/bookings/cancel/{pnr}
    @PutMapping("/cancel/{pnr}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String pnr) {
        return ResponseEntity.ok(bookingService.cancelBooking(pnr));
    }
}

// ============================================================
// 9. DTO: BookingRequest.java
// ============================================================
package com.busgo.dto;

import java.time.LocalDate;
import java.util.List;

public class BookingRequest {
    private Long busId;
    private String passengerName;
    private String phone;
    private String email;
    private LocalDate travelDate;
    private List<Integer> seats;
    private String paymentMethod;

    // Getters and Setters
    public Long getBusId()            { return busId; }
    public String getPassengerName()  { return passengerName; }
    public String getPhone()          { return phone; }
    public String getEmail()          { return email; }
    public LocalDate getTravelDate()  { return travelDate; }
    public List<Integer> getSeats()   { return seats; }
    public String getPaymentMethod()  { return paymentMethod; }

    public void setBusId(Long id)     { this.busId = id; }
    public void setPassengerName(String n) { this.passengerName = n; }
    public void setPhone(String p)    { this.phone = p; }
    public void setEmail(String e)    { this.email = e; }
    public void setTravelDate(LocalDate d) { this.travelDate = d; }
    public void setSeats(List<Integer> s)  { this.seats = s; }
    public void setPaymentMethod(String m) { this.paymentMethod = m; }
}

// ============================================================
// 10. MAIN: BusGoApplication.java
// ============================================================
package com.busgo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BusGoApplication {
    public static void main(String[] args) {
        SpringApplication.run(BusGoApplication.class, args);
    }
}

// ============================================================
// 11. application.properties
// ============================================================
// spring.datasource.url=jdbc:mysql://localhost:3306/busgo_db
// spring.datasource.username=root
// spring.datasource.password=yourpassword
// spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
// spring.jpa.hibernate.ddl-auto=update
// spring.jpa.show-sql=true
// spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
// server.port=8080

// ============================================================
// 12. API ENDPOINTS SUMMARY
// ============================================================
// GET  /api/buses/search?from=X&to=Y     → Search buses
// GET  /api/buses/{id}                   → Get bus details
// GET  /api/buses/{id}/seats?date=DATE   → Available seats
// POST /api/bookings/create              → Create booking
// GET  /api/bookings/pnr/{pnr}           → Get by PNR
// PUT  /api/bookings/cancel/{pnr}        → Cancel booking
// POST /api/users/register               → Register user
// POST /api/users/login                  → Login user
// ============================================================
