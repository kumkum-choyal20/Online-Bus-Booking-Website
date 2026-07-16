/* ============================================================
   BusGo — Online Bus Booking Application
   Full JavaScript Application Logic

   Mirrors Java Spring Boot + SQL architecture:
   - BusDatabase      → SQL tables (buses, bookings, users)
   - BusService       → Java Service layer (business logic)
   - AppState         → Session/context management
   - UIController     → Spring MVC Controller (DOM actions)
   ============================================================ */

/* ============================================================
   1. DATABASE LAYER - Simulates SQL Tables + JPA Repositories
   ============================================================ */
const BusDatabase = (() => {
  const buses = [
    { id:1,  operator:"VRL Travels",       type:"volvo",    from:"Bangalore", to:"Mumbai",    dep:"20:00", arr:"08:00", duration:"12h",     price:1200, totalSeats:40, bookedSeats:[3,7,12,19,25],    rating:4.8, amenities:["WiFi","AC","USB"] },
    { id:2,  operator:"Orange Tours",      type:"sleeper",  from:"Bangalore", to:"Mumbai",    dep:"19:00", arr:"07:30", duration:"12h 30m", price:900,  totalSeats:36, bookedSeats:[1,5,9,14],        rating:4.3, amenities:["AC","Blanket"] },
    { id:3,  operator:"SRS Travels",       type:"ac",       from:"Bangalore", to:"Mumbai",    dep:"22:00", arr:"11:00", duration:"13h",     price:750,  totalSeats:44, bookedSeats:[2,8,11,22,33,35], rating:4.1, amenities:["AC","Water"] },
    { id:4,  operator:"Konduskar",         type:"volvo",    from:"Pune",      to:"Goa",       dep:"08:00", arr:"14:00", duration:"6h",      price:650,  totalSeats:40, bookedSeats:[4,6,15,28],       rating:4.6, amenities:["WiFi","AC","Snacks"] },
    { id:5,  operator:"Paulo Travels",     type:"sleeper",  from:"Pune",      to:"Goa",       dep:"21:30", arr:"06:00", duration:"8h 30m", price:800,  totalSeats:36, bookedSeats:[10,20,30],        rating:4.5, amenities:["AC","Pillow"] },
    { id:6,  operator:"MSRTC Shivneri",    type:"ac",       from:"Mumbai",    to:"Pune",      dep:"06:00", arr:"09:30", duration:"3h 30m", price:350,  totalSeats:44, bookedSeats:[1,3,7],           rating:4.4, amenities:["AC"] },
    { id:7,  operator:"IntrCity SmartBus", type:"volvo",    from:"Delhi",     to:"Jaipur",    dep:"07:00", arr:"12:00", duration:"5h",      price:499,  totalSeats:40, bookedSeats:[5,11,17,23],      rating:4.7, amenities:["WiFi","AC","USB"] },
    { id:8,  operator:"Raj National",      type:"ordinary", from:"Delhi",     to:"Jaipur",    dep:"09:00", arr:"15:30", duration:"6h 30m", price:250,  totalSeats:50, bookedSeats:[2,9,16,21,38],    rating:3.9, amenities:[] },
    { id:9,  operator:"Neeta Tours",       type:"volvo",    from:"Mumbai",    to:"Ahmedabad", dep:"23:00", arr:"07:00", duration:"8h",      price:700,  totalSeats:40, bookedSeats:[4,13,26,37],      rating:4.5, amenities:["WiFi","AC","Blanket"] },
    { id:10, operator:"GSRTC",             type:"ac",       from:"Ahmedabad", to:"Mumbai",    dep:"18:00", arr:"02:00", duration:"8h",      price:580,  totalSeats:44, bookedSeats:[8,15,29],         rating:4.0, amenities:["AC"] },
    { id:11, operator:"KPN Travels",       type:"sleeper",  from:"Chennai",   to:"Bangalore", dep:"22:30", arr:"04:30", duration:"6h",      price:600,  totalSeats:36, bookedSeats:[3,9,18,27,33],    rating:4.2, amenities:["AC","Blanket"] },
    { id:12, operator:"APSRTC Garuda",     type:"volvo",    from:"Hyderabad", to:"Bangalore", dep:"20:45", arr:"07:00", duration:"10h 15m",price:850,  totalSeats:40, bookedSeats:[6,12,24,36],      rating:4.6, amenities:["WiFi","AC"] },
  ];
  const bookings = [];
  const users    = [];
  const popularRoutes = [
    { from:"Mumbai",    to:"Pune",      price:350, duration:"3h 30m", bookings:12500 },
    { from:"Delhi",     to:"Jaipur",    price:249, duration:"5h",     bookings:9800  },
    { from:"Bangalore", to:"Hyderabad", price:699, duration:"10h",    bookings:8700  },
    { from:"Pune",      to:"Goa",       price:599, duration:"6h",     bookings:7600  },
    { from:"Chennai",   to:"Bangalore", price:499, duration:"6h",     bookings:7200  },
    { from:"Mumbai",    to:"Ahmedabad", price:599, duration:"8h",     bookings:6900  },
  ];
  return { buses, bookings, users, popularRoutes };
})();

/* ============================================================
   2. SERVICE LAYER - Simulates Java @Service classes
   ============================================================ */
const BusService = {
  searchBuses(from, to, filter) {
    return BusDatabase.buses.filter(b => {
      const matchRoute = (!from && !to) ||
        (b.from.toLowerCase().includes(from.toLowerCase()) &&
         b.to.toLowerCase().includes(to.toLowerCase()));
      return matchRoute && (filter === 'all' || b.type === filter);
    });
  },
  getBusById(id) { return BusDatabase.buses.find(b => b.id === id); },
  getAvailableSeats(bus) { return bus.totalSeats - bus.bookedSeats.length; },
  createBooking(data) {
    const pnr = 'BG' + Date.now().toString().slice(-8).toUpperCase();
    const booking = { id: BusDatabase.bookings.length + 1, pnr, ...data, status:'CONFIRMED', createdAt: new Date().toISOString() };
    BusDatabase.bookings.push(booking);
    const bus = BusService.getBusById(data.busId);
    if (bus) data.seats.forEach(s => bus.bookedSeats.push(s));
    return booking;
  },
  validateForm(name, phone, email) {
    if (!name || name.trim().length < 2) return 'Please enter a valid passenger name.';
    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s+/g,''))) return 'Please enter a valid 10-digit Indian phone number.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    return null;
  },
  sortBuses(buses, by) {
    return [...buses].sort((a,b) => {
      if (by === 'price') return a.price - b.price;
      if (by === 'rating') return b.rating - a.rating;
      if (by === 'duration') return a.duration.localeCompare(b.duration);
      return 0;
    });
  }
};

/* ============================================================
   3. APPLICATION STATE
   ============================================================ */
const AppState = {
  currentSearch: { from:'', to:'', date:'', seats:1 },
  currentBus:    null,
  selectedSeats: [],
  currentFilter: 'all',
  currentSort:   'price',
  allResults:    []
};

/* ============================================================
   4. UI CONTROLLER
   ============================================================ */

// Navbar scroll
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 50);
});

document.addEventListener('DOMContentLoaded', () => {
  const di = document.getElementById('travelDate');
  di.setAttribute('min', new Date().toISOString().split('T')[0]);
  di.value = new Date().toISOString().split('T')[0];
  renderPopularRoutes();
  initCounters();
});

// ---- SEARCH ----
function searchBuses(e) {
  e.preventDefault();
  const from  = document.getElementById('fromCity').value.trim();
  const to    = document.getElementById('toCity').value.trim();
  const date  = document.getElementById('travelDate').value;
  const seats = parseInt(document.getElementById('seatCount').value);

  if (from && to && from.toLowerCase() === to.toLowerCase()) {
    showToast('Departure and destination cannot be the same.', 'error'); return;
  }
  AppState.currentSearch = { from, to, date, seats };
  AppState.currentFilter = 'all';
  AppState.currentSort   = 'price';
  const results = BusService.searchBuses(from, to, 'all');
  AppState.allResults = results;
  renderResults(results, from, to);
  document.getElementById('resultsSection').style.display = 'block';
  setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior:'smooth' }), 100);
}

function renderResults(buses, from, to) {
  const sorted = BusService.sortBuses(buses, AppState.currentSort);
  document.getElementById('resultsTitle').textContent =
    `${buses.length} bus${buses.length!==1?'es':''} found \u2014 ${from||'All'} \u2192 ${to||'All'}`;

  if (!buses.length) {
    document.getElementById('busList').innerHTML = `<div class="text-center py-5"><div style="font-size:3rem">🚫</div><h5 class="mt-3">No buses found</h5><p class="text-muted">Try different cities or dates.</p></div>`;
    return;
  }
  const badgeMap = { ac:'badge-ac', sleeper:'badge-sleeper', volvo:'badge-volvo', ordinary:'badge-ordinary' };
  document.getElementById('busList').innerHTML = sorted.map(bus => {
    const avail = BusService.getAvailableSeats(bus);
    const amen  = bus.amenities.map(a => `<span class="badge bg-light text-secondary me-1" style="font-size:11px;">${a}</span>`).join('');
    return `<div class="bus-card" data-type="${bus.type}">
      <div class="row align-items-center g-3">
        <div class="col-md-3">
          <div class="bus-operator">${bus.operator}</div>
          <div class="mt-1"><span class="bus-type-badge ${badgeMap[bus.type]||'badge-ordinary'} me-1">${bus.type.toUpperCase()}</span><span class="rating-badge">&#11088; ${bus.rating}</span></div>
          <div class="mt-2">${amen}</div>
        </div>
        <div class="col-md-3">
          <div class="d-flex align-items-center gap-2">
            <div class="text-center"><div class="dep-time">${bus.dep}</div><div style="font-size:12px;color:#6B7280;">${bus.from}</div></div>
            <div class="flex-grow-1 text-center"><div style="font-size:11px;color:#6B7280;">${bus.duration}</div><div style="height:2px;background:linear-gradient(90deg,#FF6B35,#FFD700);border-radius:1px;"></div><div style="font-size:11px;color:#6B7280;">Direct</div></div>
            <div class="text-center"><div class="arr-time">${bus.arr}</div><div style="font-size:12px;color:#6B7280;">${bus.to}</div></div>
          </div>
        </div>
        <div class="col-md-2 text-center"><div class="bus-price">&#8377;${bus.price}</div><div style="font-size:12px;color:#6B7280;">per seat</div></div>
        <div class="col-md-2 text-center"><div class="seats-left">${avail} seats left</div><div style="font-size:12px;color:#6B7280;">of ${bus.totalSeats}</div></div>
        <div class="col-md-2 text-center"><button class="btn btn-primary book-btn" onclick="openSeatSelection(${bus.id})">Book Now &#8594;</button></div>
      </div>
    </div>`;
  }).join('');
}

function filterBuses(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  AppState.currentFilter = type;
  const f = type === 'all' ? AppState.allResults : AppState.allResults.filter(b => b.type === type);
  renderResults(f, AppState.currentSearch.from, AppState.currentSearch.to);
}

function sortBuses(by) {
  AppState.currentSort = by;
  const f = AppState.currentFilter === 'all' ? AppState.allResults : AppState.allResults.filter(b => b.type === AppState.currentFilter);
  renderResults(f, AppState.currentSearch.from, AppState.currentSearch.to);
}

function swapCities() {
  const f = document.getElementById('fromCity'), t = document.getElementById('toCity');
  [f.value, t.value] = [t.value, f.value];
}

function setTripType(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`${type === 'one-way' ? 'One Way' : 'Round Trip'} selected`, 'info');
}

// ---- SEAT SELECTION ----
function openSeatSelection(busId) {
  const bus = BusService.getBusById(busId);
  if (!bus) return;
  AppState.currentBus    = bus;
  AppState.selectedSeats = [];
  document.getElementById('seatModalTitle').textContent = `Select Seat \u2014 ${bus.operator}`;
  document.getElementById('sumBus').textContent   = bus.operator;
  document.getElementById('sumRoute').textContent = `${bus.from} \u2192 ${bus.to}`;
  document.getElementById('sumDate').textContent  = formatDate(AppState.currentSearch.date);
  document.getElementById('sumSeats').textContent = 'None';
  document.getElementById('sumTotal').textContent = '&#8377;0';
  renderSeatGrid(bus);
  openModal('seatModal');
}

function renderSeatGrid(bus) {
  let html = '';
  for (let i = 1; i <= bus.totalSeats; i++) {
    const booked = bus.bookedSeats.includes(i);
    if (i % 4 === 3) html += '<div></div>';
    html += `<div class="seat ${booked?'booked':'available'}" id="seat-${i}" onclick="${booked?'':` toggleSeat(${i})`}">${i}</div>`;
  }
  document.getElementById('seatGrid').innerHTML = html;
}

function toggleSeat(n) {
  const max = AppState.currentSearch.seats || 1;
  const el  = document.getElementById(`seat-${n}`);
  if (AppState.selectedSeats.includes(n)) {
    AppState.selectedSeats = AppState.selectedSeats.filter(s => s !== n);
    el.className = 'seat available';
  } else {
    if (AppState.selectedSeats.length >= max) { showToast(`Max ${max} seat(s) allowed.`, 'error'); return; }
    AppState.selectedSeats.push(n);
    el.className = 'seat selected';
  }
  const total = AppState.selectedSeats.length * AppState.currentBus.price;
  document.getElementById('sumSeats').textContent = AppState.selectedSeats.length ? AppState.selectedSeats.join(', ') : 'None';
  document.getElementById('sumTotal').textContent = `\u20B9${total}`;
}

// ---- PAYMENT ----
function proceedToPayment() {
  const name  = document.getElementById('passengerName').value.trim();
  const phone = document.getElementById('passengerPhone').value.trim();
  const email = document.getElementById('passengerEmail').value.trim();
  const err   = BusService.validateForm(name, phone, email);
  if (err) { showToast(err, 'error'); return; }
  if (!AppState.selectedSeats.length) { showToast('Please select at least one seat.', 'error'); return; }
  document.getElementById('payAmount').textContent = `\u20B9${AppState.selectedSeats.length * AppState.currentBus.price}`;
  closeModal('seatModal');
  openModal('paymentModal');
}

function selectPayMethod(m) {
  ['card','upi','netbank'].forEach(x => {
    document.getElementById(`pm-${x}`).classList.toggle('active', x === m);
    const el = document.getElementById(`payForm${x.charAt(0).toUpperCase()+x.slice(1)}`);
    if (el) el.style.display = x === m ? 'block' : 'none';
  });
}

function formatCard(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function confirmPayment() {
  showToast('Processing payment...', 'info');
  setTimeout(() => {
    const bus = AppState.currentBus;
    const b   = BusService.createBooking({
      busId: bus.id,
      passengerName: document.getElementById('passengerName').value.trim(),
      phone: document.getElementById('passengerPhone').value.trim(),
      email: document.getElementById('passengerEmail').value.trim(),
      seats: [...AppState.selectedSeats],
      date: AppState.currentSearch.date,
      from: bus.from, to: bus.to, busOperator: bus.operator,
      total: AppState.selectedSeats.length * bus.price
    });
    document.getElementById('ticketCard').innerHTML = `
      <div class="ticket-id">PNR: ${b.pnr}</div>
      <div class="t-row"><span class="t-label">Passenger</span><span class="t-val">${b.passengerName}</span></div>
      <div class="t-row"><span class="t-label">Route</span><span class="t-val">${b.from} \u2192 ${b.to}</span></div>
      <div class="t-row"><span class="t-label">Bus</span><span class="t-val">${b.busOperator}</span></div>
      <div class="t-row"><span class="t-label">Date</span><span class="t-val">${formatDate(b.date)}</span></div>
      <div class="t-row"><span class="t-label">Seats</span><span class="t-val">${b.seats.join(', ')}</span></div>
      <div class="t-row"><span class="t-label">Amount</span><span class="t-val" style="color:var(--primary)">\u20B9${b.total}</span></div>
      <div class="t-row"><span class="t-label">Status</span><span class="t-val" style="color:#22C55E;">\u2705 ${b.status}</span></div>`;
    closeModal('paymentModal');
    openModal('successModal');
    showToast('Booking confirmed! \uD83C\uDF89', 'success');
  }, 1800);
}

// ---- AUTH ----
function loginUser()    { closeModal('loginModal');    showToast('Welcome back!', 'success'); }
function registerUser() { closeModal('registerModal'); showToast('Account created successfully!', 'success'); }

// ---- POPULAR ROUTES ----
function renderPopularRoutes() {
  document.getElementById('routesGrid').innerHTML = BusDatabase.popularRoutes.map(r => `
    <div class="col-md-4 col-sm-6">
      <div class="route-card" onclick="fillRoute('${r.from}','${r.to}')">
        <div class="route-from-to">${r.from} \u2192 ${r.to}</div>
        <div class="route-details">\u23F1 ${r.duration} &nbsp;|&nbsp; \uD83C\uDF9F ${(r.bookings/1000).toFixed(1)}k bookings</div>
        <div class="route-price">From \u20B9${r.price}</div>
        <div class="route-arrow">\u2192</div>
      </div>
    </div>`).join('');
}

function fillRoute(from, to) {
  document.getElementById('fromCity').value = from;
  document.getElementById('toCity').value   = to;
  document.getElementById('search-section').scrollIntoView({ behavior:'smooth' });
  showToast(`Route: ${from} \u2192 ${to}`, 'info');
}

// ---- MODAL UTILITIES ----
function openModal(id)  { document.getElementById(id).classList.add('active');    document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow=''; }
function closeModalOnOverlay(e, id) { if (e.target===document.getElementById(id)) closeModal(id); }

// ---- TOAST ----
function showToast(msg, type='info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  const icons = { success:'\u2705', error:'\u274C', info:'\u2139\uFE0F' };
  t.className = `toast-msg ${type}`;
  t.innerHTML = `<span>${icons[type]||'\u2139\uFE0F'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.cssText='opacity:0;transform:translateX(40px);transition:all 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

// ---- HELPERS ----
function formatDate(s) {
  if (!s) return '\u2014';
  return new Date(s+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
}

function resetAll() {
  AppState.currentBus = null; AppState.selectedSeats = [];
  ['passengerName','passengerPhone','passengerEmail'].forEach(id => document.getElementById(id).value='');
}

// ---- COUNTER ANIMATION ----
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseInt(el.getAttribute('data-count'));
      let cur = 0;
      const step = Math.ceil(target/60);
      const t = setInterval(() => {
        cur = Math.min(cur+step, target);
        el.textContent = cur.toLocaleString('en-IN')+'+';
        if (cur>=target) clearInterval(t);
      }, 30);
      obs.unobserve(el);
    });
  }, { threshold:0.5 });
  document.querySelectorAll('.stat-num').forEach(el => obs.observe(el));
}

/* ============================================================
   JAVA BACKEND ARCHITECTURE REFERENCE
   ============================================================
   // BusController.java (@RestController)
   @GetMapping("/api/buses/search")
   ResponseEntity<List<Bus>> search(@RequestParam String from,
     @RequestParam String to, @RequestParam LocalDate date)

   // BookingController.java
   @PostMapping("/api/bookings/create")
   ResponseEntity<Booking> createBooking(@RequestBody BookingRequest req)

   // SQL SCHEMA
   CREATE TABLE buses (id BIGINT PK, operator VARCHAR(100),
     type ENUM('ac','sleeper','volvo','ordinary'),
     from_city VARCHAR(50), to_city VARCHAR(50),
     departure TIME, arrival TIME, price DECIMAL(8,2),
     total_seats INT, rating DECIMAL(3,2));

   CREATE TABLE bookings (id BIGINT PK, bus_id BIGINT FK,
     passenger_name VARCHAR(100), phone VARCHAR(15),
     email VARCHAR(100), seats VARCHAR(100),
     travel_date DATE, total DECIMAL(10,2),
     pnr VARCHAR(20) UNIQUE,
     status ENUM('CONFIRMED','CANCELLED','PENDING'),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

   CREATE TABLE users (id BIGINT PK, name VARCHAR(100),
     email VARCHAR(100) UNIQUE, phone VARCHAR(15),
     password_hash VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
   ============================================================ */
