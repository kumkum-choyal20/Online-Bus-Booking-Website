-- ============================================================
-- BusGo Database Schema (MySQL / PostgreSQL)
-- SQL Layer for Java Spring Boot Backend
-- ============================================================

CREATE DATABASE IF NOT EXISTS busgo_db;
USE busgo_db;

-- Table: users
CREATE TABLE users (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    phone          VARCHAR(15)  NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('USER','ADMIN') DEFAULT 'USER',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: buses
CREATE TABLE buses (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    operator     VARCHAR(100) NOT NULL,
    type         ENUM('ac','sleeper','volvo','ordinary') NOT NULL,
    from_city    VARCHAR(50) NOT NULL,
    to_city      VARCHAR(50) NOT NULL,
    departure    TIME NOT NULL,
    arrival      TIME NOT NULL,
    duration     VARCHAR(20) NOT NULL,
    price        DECIMAL(8,2) NOT NULL,
    total_seats  INT NOT NULL DEFAULT 40,
    rating       DECIMAL(3,2) DEFAULT 4.0,
    amenities    VARCHAR(255),
    active       BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: seats
CREATE TABLE seats (
    id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    bus_id    BIGINT NOT NULL,
    seat_no   INT NOT NULL,
    type      ENUM('window','aisle') DEFAULT 'window',
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bus_seat (bus_id, seat_no)
);

-- Table: bookings
CREATE TABLE bookings (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pnr             VARCHAR(20) NOT NULL UNIQUE,
    user_id         BIGINT,
    bus_id          BIGINT NOT NULL,
    passenger_name  VARCHAR(100) NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    email           VARCHAR(100) NOT NULL,
    travel_date     DATE NOT NULL,
    seats_booked    VARCHAR(100) NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('card','upi','netbanking') DEFAULT 'card',
    payment_status  ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
    status          ENUM('CONFIRMED','CANCELLED','PENDING') DEFAULT 'CONFIRMED',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id)  REFERENCES buses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: popular_routes
CREATE TABLE popular_routes (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_city   VARCHAR(50) NOT NULL,
    to_city     VARCHAR(50) NOT NULL,
    base_price  DECIMAL(8,2),
    duration    VARCHAR(20),
    bookings    INT DEFAULT 0
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO buses (operator, type, from_city, to_city, departure, arrival, duration, price, total_seats, rating, amenities) VALUES
('VRL Travels',       'volvo',    'Bangalore', 'Mumbai',    '20:00', '08:00', '12h',      1200.00, 40, 4.8, 'WiFi,AC,USB'),
('Orange Tours',      'sleeper',  'Bangalore', 'Mumbai',    '19:00', '07:30', '12h 30m',   900.00, 36, 4.3, 'AC,Blanket'),
('SRS Travels',       'ac',       'Bangalore', 'Mumbai',    '22:00', '11:00', '13h',       750.00, 44, 4.1, 'AC,Water'),
('Konduskar',         'volvo',    'Pune',      'Goa',       '08:00', '14:00', '6h',        650.00, 40, 4.6, 'WiFi,AC,Snacks'),
('IntrCity SmartBus', 'volvo',    'Delhi',     'Jaipur',    '07:00', '12:00', '5h',        499.00, 40, 4.7, 'WiFi,AC,USB'),
('MSRTC Shivneri',    'ac',       'Mumbai',    'Pune',      '06:00', '09:30', '3h 30m',    350.00, 44, 4.4, 'AC');

INSERT INTO popular_routes (from_city, to_city, base_price, duration, bookings) VALUES
('Mumbai',    'Pune',      350, '3h 30m', 12500),
('Delhi',     'Jaipur',    249, '5h',      9800),
('Bangalore', 'Hyderabad', 699, '10h',     8700),
('Pune',      'Goa',       599, '6h',      7600),
('Chennai',   'Bangalore', 499, '6h',      7200),
('Mumbai',    'Ahmedabad', 599, '8h',      6900);

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Search buses by route
SELECT * FROM buses
WHERE from_city = 'Bangalore' AND to_city = 'Mumbai' AND active = TRUE
ORDER BY price ASC;

-- Get available seat count
SELECT b.id, b.operator,
       (b.total_seats - COUNT(bk.id)) AS available_seats
FROM buses b
LEFT JOIN bookings bk ON b.id = bk.bus_id AND bk.travel_date = CURDATE()
GROUP BY b.id;

-- Get booking by PNR
SELECT bk.*, b.operator, b.from_city, b.to_city, b.departure
FROM bookings bk
JOIN buses b ON bk.bus_id = b.id
WHERE bk.pnr = 'BG12345678';

-- Revenue report by operator
SELECT b.operator, COUNT(bk.id) AS total_bookings, SUM(bk.total_amount) AS revenue
FROM bookings bk
JOIN buses b ON bk.bus_id = b.id
WHERE bk.status = 'CONFIRMED'
GROUP BY b.operator
ORDER BY revenue DESC;
