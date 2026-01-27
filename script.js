// ===================================
// Mobile Garage - Car Wash Booking App
// ===================================

// App State
const state = {
    phone: '',
    isGuest: false,
    selectedService: 'carwash',
    cars: [],
    location: {
        coords: null,
        emirate: '',
        address: '',
        instructions: ''
    },
    selectedDate: null,
    selectedTime: null,
    paymentMethod: '',
    bookingRef: ''
};

// Package Data
const packages = {
    platinum: {
        name: 'Platinum',
        sedan: 45,
        suv: 50,
        details: 'Interior & exterior wash, premium shampoo, tire polish, interior cleaning'
    },
    titanium: {
        name: 'Titanium',
        sedan: 80,
        suv: 85,
        details: 'Everything in Platinum + engine & rims degreaser, interior polish, deep wash'
    },
    diamond: {
        name: 'Diamond',
        sedan: null,
        suv: null,
        details: 'Coming Soon',
        comingSoon: true
    }
};

// Time slots (24hr format for logic, display in 12hr)
const timeSlots = [
    { value: '08:00', display: '8:00 AM' },
    { value: '09:00', display: '9:00 AM' },
    { value: '10:00', display: '10:00 AM' },
    { value: '11:00', display: '11:00 AM' },
    { value: '12:00', display: '12:00 PM' },
    { value: '13:00', display: '1:00 PM' },
    { value: '14:00', display: '2:00 PM' },
    { value: '15:00', display: '3:00 PM' },
    { value: '16:00', display: '4:00 PM' },
    { value: '17:00', display: '5:00 PM' },
    { value: '18:00', display: '6:00 PM' },
    { value: '19:00', display: '7:00 PM' },
    { value: '20:00', display: '8:00 PM' }
];

// DOM Elements
const screens = {
    phone: document.getElementById('screen-phone'),
    otp: document.getElementById('screen-otp'),
    services: document.getElementById('screen-services'),
    packages: document.getElementById('screen-packages'),
    location: document.getElementById('screen-location'),
    payment: document.getElementById('screen-payment'),
    summary: document.getElementById('screen-summary'),
    confirmation: document.getElementById('screen-confirmation')
};

// Initialize App
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupPhoneScreen();
    setupOTPScreen();
    setupServicesScreen();
    setupPackagesScreen();
    setupLocationScreen();
    setupPaymentScreen();
    setupSummaryScreen();
    setupConfirmationScreen();
}

// ===================================
// Navigation
// ===================================

function goToScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function showLoading(show = true) {
    document.getElementById('loading-overlay').classList.toggle('active', show);
}

// ===================================
// Screen 1: Phone Entry
// ===================================

function setupPhoneScreen() {
    const phoneInput = document.getElementById('phone-input');
    const btnSendOTP = document.getElementById('btn-send-otp');
    const btnGuest = document.getElementById('btn-guest');
    const phoneError = document.getElementById('phone-error');

    phoneInput.addEventListener('input', (e) => {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');

        const isValid = validatePhone(e.target.value);
        btnSendOTP.disabled = !isValid;

        if (e.target.value.length > 0 && !isValid) {
            phoneError.textContent = 'Enter a valid 9-digit UAE number';
        } else {
            phoneError.textContent = '';
        }
    });

    btnSendOTP.addEventListener('click', () => {
        state.phone = phoneInput.value;
        state.isGuest = false;

        // Display phone number on OTP screen
        document.getElementById('otp-phone-display').textContent =
            `+971 ${formatPhone(state.phone)}`;

        // Simulate sending OTP
        showLoading(true);
        setTimeout(() => {
            showLoading(false);
            goToScreen('screen-otp');
            startResendTimer();
        }, 1000);
    });

    btnGuest.addEventListener('click', () => {
        state.isGuest = true;
        state.phone = '';
        goToScreen('screen-services');
    });
}

function validatePhone(phone) {
    // UAE phone: 9 digits, typically starts with 5
    return /^[0-9]{9}$/.test(phone);
}

function formatPhone(phone) {
    if (phone.length === 9) {
        return `${phone.slice(0,2)} ${phone.slice(2,5)} ${phone.slice(5)}`;
    }
    return phone;
}

// ===================================
// Screen 2: OTP Verification
// ===================================

let resendInterval;

function setupOTPScreen() {
    const otpDigits = document.querySelectorAll('.otp-digit');
    const btnVerify = document.getElementById('btn-verify-otp');
    const btnResend = document.getElementById('btn-resend');
    const otpError = document.getElementById('otp-error');

    otpDigits.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');

            if (e.target.value && index < otpDigits.length - 1) {
                otpDigits[index + 1].focus();
            }

            checkOTPComplete();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpDigits[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

            for (let i = 0; i < Math.min(pastedData.length, 4); i++) {
                otpDigits[i].value = pastedData[i];
            }
            checkOTPComplete();
        });
    });

    function checkOTPComplete() {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        btnVerify.disabled = otp.length !== 4;
    }

    btnVerify.addEventListener('click', () => {
        const otp = Array.from(otpDigits).map(d => d.value).join('');

        showLoading(true);

        // Simulate OTP verification (accept any 4 digits for demo)
        setTimeout(() => {
            showLoading(false);

            // For demo: accept any 4-digit OTP
            if (otp.length === 4) {
                clearInterval(resendInterval);
                goToScreen('screen-services');
            } else {
                otpError.textContent = 'Invalid OTP. Please try again.';
            }
        }, 1000);
    });

    btnResend.addEventListener('click', () => {
        if (!btnResend.disabled) {
            showLoading(true);
            setTimeout(() => {
                showLoading(false);
                startResendTimer();
                // Clear OTP inputs
                otpDigits.forEach(d => d.value = '');
                otpDigits[0].focus();
            }, 1000);
        }
    });
}

function startResendTimer() {
    const btnResend = document.getElementById('btn-resend');
    const timerSpan = document.getElementById('resend-timer');
    let seconds = 30;

    btnResend.disabled = true;
    btnResend.innerHTML = `Resend in <span id="resend-timer">${seconds}</span>s`;

    clearInterval(resendInterval);
    resendInterval = setInterval(() => {
        seconds--;
        document.getElementById('resend-timer').textContent = seconds;

        if (seconds <= 0) {
            clearInterval(resendInterval);
            btnResend.disabled = false;
            btnResend.textContent = 'Resend OTP';
        }
    }, 1000);
}

// ===================================
// Screen 3: Service Selection
// ===================================

function setupServicesScreen() {
    const btnContinue = document.getElementById('btn-continue-service');

    btnContinue.addEventListener('click', () => {
        if (state.selectedService === 'carwash') {
            // Initialize with one car
            if (state.cars.length === 0) {
                addCar();
            }
            renderCars();
            goToScreen('screen-packages');
        }
    });
}

function selectService(service) {
    if (service === 'carwash') {
        state.selectedService = service;
    }
}

// ===================================
// Screen 4: Packages & Cars
// ===================================

function setupPackagesScreen() {
    const btnAddCar = document.getElementById('btn-add-car');
    const btnContinue = document.getElementById('btn-continue-packages');

    btnAddCar.addEventListener('click', () => {
        addCar();
        renderCars();
    });

    btnContinue.addEventListener('click', () => {
        if (calculateTotal() > 0) {
            generateDatePicker();
            goToScreen('screen-location');
        }
    });
}

function addCar() {
    state.cars.push({
        id: Date.now(),
        type: 'sedan',
        package: null
    });
}

function removeCar(carId) {
    state.cars = state.cars.filter(c => c.id !== carId);
    if (state.cars.length === 0) {
        addCar();
    }
    renderCars();
}

function renderCars() {
    const container = document.getElementById('cars-container');
    container.innerHTML = '';

    state.cars.forEach((car, index) => {
        const carEl = document.createElement('div');
        carEl.className = 'car-entry';
        carEl.innerHTML = `
            <div class="car-entry-header">
                <h4>Car ${index + 1}</h4>
                ${state.cars.length > 1 ? `<button class="btn-remove-car" onclick="removeCar(${car.id})">Remove</button>` : ''}
            </div>

            <div class="car-type-toggle">
                <button class="car-type-btn ${car.type === 'sedan' ? 'active' : ''}" onclick="setCarType(${car.id}, 'sedan')">Sedan</button>
                <button class="car-type-btn ${car.type === 'suv' ? 'active' : ''}" onclick="setCarType(${car.id}, 'suv')">SUV</button>
            </div>

            <div class="package-options">
                ${renderPackageOptions(car)}
            </div>
        `;
        container.appendChild(carEl);
    });

    updateTotal();
}

function renderPackageOptions(car) {
    return Object.entries(packages).map(([key, pkg]) => {
        const price = pkg[car.type];
        const isComingSoon = pkg.comingSoon;
        const isSelected = car.package === key;

        return `
            <label class="package-option">
                <input type="radio" name="package-${car.id}" value="${key}"
                    ${isSelected ? 'checked' : ''}
                    ${isComingSoon ? 'disabled' : ''}
                    onchange="setCarPackage(${car.id}, '${key}')">
                <div class="package-card ${isComingSoon ? 'disabled' : ''}">
                    <div class="package-header">
                        <span class="package-name">
                            ${pkg.name}
                            ${isComingSoon ? '<span class="coming-soon-badge">Soon</span>' : ''}
                        </span>
                        <span class="package-price">${isComingSoon ? '-' : price + ' AED'}</span>
                    </div>
                    <p class="package-details">${pkg.details}</p>
                </div>
            </label>
        `;
    }).join('');
}

function setCarType(carId, type) {
    const car = state.cars.find(c => c.id === carId);
    if (car) {
        car.type = type;
        renderCars();
    }
}

function setCarPackage(carId, packageKey) {
    const car = state.cars.find(c => c.id === carId);
    if (car && !packages[packageKey].comingSoon) {
        car.package = packageKey;
        updateTotal();
    }
}

function calculateTotal() {
    return state.cars.reduce((total, car) => {
        if (car.package && packages[car.package]) {
            return total + packages[car.package][car.type];
        }
        return total;
    }, 0);
}

function updateTotal() {
    const total = calculateTotal();
    document.getElementById('total-price').textContent = `${total} AED`;
    document.getElementById('btn-continue-packages').disabled = total === 0;
}

// ===================================
// Screen 5: Location & Time
// ===================================

function setupLocationScreen() {
    const btnGetLocation = document.getElementById('btn-get-location');
    const emirateSelect = document.getElementById('emirate-select');
    const addressInput = document.getElementById('address-input');
    const instructionsInput = document.getElementById('instructions-input');
    const btnContinue = document.getElementById('btn-continue-location');

    btnGetLocation.addEventListener('click', getCurrentLocation);

    emirateSelect.addEventListener('change', (e) => {
        state.location.emirate = e.target.value;
        validateLocationForm();
    });

    addressInput.addEventListener('input', (e) => {
        state.location.address = e.target.value;
        validateLocationForm();
    });

    instructionsInput.addEventListener('input', (e) => {
        state.location.instructions = e.target.value;
    });

    btnContinue.addEventListener('click', () => {
        if (isLocationFormValid()) {
            goToScreen('screen-payment');
        }
    });
}

function getCurrentLocation() {
    const locationDisplay = document.getElementById('current-location-display');

    if (!navigator.geolocation) {
        locationDisplay.textContent = 'Geolocation is not supported by your browser';
        return;
    }

    locationDisplay.textContent = 'Getting your location...';
    showLoading(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            showLoading(false);
            state.location.coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Reverse geocode to get address (using coordinates display for demo)
            locationDisplay.textContent = `Location detected: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            locationDisplay.classList.add('success');

            // Try to auto-detect emirate based on coordinates (simplified)
            detectEmirate(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            showLoading(false);
            let message = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Location unavailable.';
                    break;
                case error.TIMEOUT:
                    message += 'Request timed out.';
                    break;
            }
            locationDisplay.textContent = message;
            locationDisplay.classList.remove('success');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function detectEmirate(lat, lng) {
    // Simplified emirate detection based on coordinates
    // Dubai: ~25.2, 55.3
    // Sharjah: ~25.3, 55.4
    // Ajman: ~25.4, 55.5

    const emirateSelect = document.getElementById('emirate-select');

    if (lat >= 25.0 && lat <= 25.35 && lng >= 55.0 && lng <= 55.4) {
        emirateSelect.value = 'dubai';
        state.location.emirate = 'dubai';
    } else if (lat >= 25.3 && lat <= 25.45 && lng >= 55.3 && lng <= 55.5) {
        emirateSelect.value = 'sharjah';
        state.location.emirate = 'sharjah';
    } else if (lat >= 25.35 && lat <= 25.5 && lng >= 55.4 && lng <= 55.6) {
        emirateSelect.value = 'ajman';
        state.location.emirate = 'ajman';
    }

    validateLocationForm();
}

function generateDatePicker() {
    const container = document.getElementById('date-picker');
    container.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate next 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const dateEl = document.createElement('div');
        dateEl.className = 'date-option';
        dateEl.dataset.date = date.toISOString().split('T')[0];
        dateEl.innerHTML = `
            <div class="day-name">${i === 0 ? 'Today' : days[date.getDay()]}</div>
            <div class="day-num">${date.getDate()}</div>
            <div class="month">${months[date.getMonth()]}</div>
        `;

        dateEl.addEventListener('click', () => selectDate(dateEl));
        container.appendChild(dateEl);
    }
}

function selectDate(dateEl) {
    document.querySelectorAll('.date-option').forEach(d => d.classList.remove('selected'));
    dateEl.classList.add('selected');
    state.selectedDate = dateEl.dataset.date;

    generateTimeSlots(state.selectedDate);
    validateLocationForm();
}

function generateTimeSlots(selectedDate) {
    const container = document.getElementById('time-slots');
    container.innerHTML = '';

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    timeSlots.forEach(slot => {
        const slotHour = parseInt(slot.value.split(':')[0]);

        // If today, disable past time slots (add 1 hour buffer)
        const isPast = isToday && slotHour <= currentHour;

        const slotEl = document.createElement('div');
        slotEl.className = `time-slot ${isPast ? 'disabled' : ''}`;
        slotEl.textContent = slot.display;
        slotEl.dataset.time = slot.value;

        if (!isPast) {
            slotEl.addEventListener('click', () => selectTime(slotEl));
        }

        container.appendChild(slotEl);
    });
}

function selectTime(slotEl) {
    if (slotEl.classList.contains('disabled')) return;

    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slotEl.classList.add('selected');
    state.selectedTime = slotEl.dataset.time;

    validateLocationForm();
}

function isLocationFormValid() {
    return state.location.emirate &&
           state.location.address.trim() &&
           state.selectedDate &&
           state.selectedTime;
}

function validateLocationForm() {
    document.getElementById('btn-continue-location').disabled = !isLocationFormValid();
}

// ===================================
// Screen 6: Payment Method
// ===================================

function setupPaymentScreen() {
    const paymentInputs = document.querySelectorAll('input[name="payment"]');
    const btnContinue = document.getElementById('btn-continue-payment');

    paymentInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.paymentMethod = e.target.value;
            btnContinue.disabled = false;
        });
    });

    btnContinue.addEventListener('click', () => {
        if (state.paymentMethod) {
            renderSummary();
            goToScreen('screen-summary');
        }
    });
}

// ===================================
// Screen 7: Booking Summary
// ===================================

function setupSummaryScreen() {
    const btnConfirm = document.getElementById('btn-confirm-booking');

    btnConfirm.addEventListener('click', () => {
        confirmBooking();
    });
}

function renderSummary() {
    // Cars & Packages
    const carsContainer = document.getElementById('summary-cars');
    carsContainer.innerHTML = state.cars.map((car, index) => {
        const pkg = packages[car.package];
        const price = pkg[car.type];
        return `
            <div class="summary-car-item">
                <span>Car ${index + 1}: ${capitalize(car.type)} - ${pkg.name}</span>
                <span>${price} AED</span>
            </div>
        `;
    }).join('');

    // Location
    const locationContainer = document.getElementById('summary-location');
    locationContainer.innerHTML = `
        <p>${capitalize(state.location.emirate)}</p>
        <p>${state.location.address}</p>
        ${state.location.instructions ? `<p style="color: var(--grey-500); font-size: 13px;">Note: ${state.location.instructions}</p>` : ''}
    `;

    // Date & Time
    const dateContainer = document.getElementById('summary-datetime');
    const selectedDate = new Date(state.selectedDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeSlot = timeSlots.find(t => t.value === state.selectedTime);
    dateContainer.innerHTML = `
        <p>${selectedDate.toLocaleDateString('en-AE', options)}</p>
        <p>${timeSlot ? timeSlot.display : state.selectedTime}</p>
    `;

    // Payment
    const paymentContainer = document.getElementById('summary-payment');
    const paymentLabels = {
        cash: 'Cash',
        card: 'Card Payment',
        apple_pay: 'Apple Pay',
        bank_transfer: 'Bank Transfer'
    };
    paymentContainer.innerHTML = `<p>${paymentLabels[state.paymentMethod]}</p>`;

    // Total
    document.getElementById('summary-total-price').textContent = `${calculateTotal()} AED`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function confirmBooking() {
    showLoading(true);

    // Simulate booking confirmation
    setTimeout(() => {
        showLoading(false);

        // Generate booking reference
        state.bookingRef = 'MG-' + Math.random().toString(36).substr(2, 6).toUpperCase();

        // Update confirmation screen
        document.getElementById('booking-reference').textContent = state.bookingRef;

        const selectedDate = new Date(state.selectedDate);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const timeSlot = timeSlots.find(t => t.value === state.selectedTime);

        document.getElementById('confirm-datetime').textContent =
            `${selectedDate.toLocaleDateString('en-AE', options)} at ${timeSlot ? timeSlot.display : state.selectedTime}`;
        document.getElementById('confirm-location').textContent =
            `${capitalize(state.location.emirate)} - ${state.location.address}`;

        goToScreen('screen-confirmation');
    }, 1500);
}

// ===================================
// Screen 8: Confirmation
// ===================================

function setupConfirmationScreen() {
    const btnNewBooking = document.getElementById('btn-new-booking');

    btnNewBooking.addEventListener('click', () => {
        resetBooking();
        goToScreen('screen-services');
    });
}

function resetBooking() {
    state.cars = [];
    state.location = {
        coords: null,
        emirate: '',
        address: '',
        instructions: ''
    };
    state.selectedDate = null;
    state.selectedTime = null;
    state.paymentMethod = '';
    state.bookingRef = '';

    // Reset form inputs
    document.getElementById('emirate-select').value = '';
    document.getElementById('address-input').value = '';
    document.getElementById('instructions-input').value = '';
    document.getElementById('current-location-display').textContent = '';
    document.getElementById('current-location-display').classList.remove('success');

    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.checked = false;
    });

    document.getElementById('btn-continue-location').disabled = true;
    document.getElementById('btn-continue-payment').disabled = true;

    // Add initial car
    addCar();
}

// Make functions globally accessible
window.goToScreen = goToScreen;
window.selectService = selectService;
window.removeCar = removeCar;
window.setCarType = setCarType;
window.setCarPackage = setCarPackage;
