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
    bookingRef: '',
    recurring: {
        enabled: false,
        frequency: 'weekly'
    },
    currentStep: 1,
    editingBookingId: null,
    currentRating: 0,
    notificationsEnabled: false
};

// Package Data with Icons
const packages = {
    platinum: {
        name: 'Platinum',
        sedan: 45,
        suv: 50,
        details: 'Interior & exterior wash, premium shampoo, tire polish, interior cleaning',
        icon: `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1a365d" d="M17 5H3c-1.1 0-2 .9-2 2v9h2c0 1.65 1.35 3 3 3s3-1.35 3-3h5.5c0 1.65 1.35 3 3 3s3-1.35 3-3H23v-5l-6-6zM6 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM21 12h-4V8h2l2 4z"/></svg>`,
        features: ['Exterior Wash', 'Interior Clean', 'Tire Polish', 'Shampoo']
    },
    titanium: {
        name: 'Titanium',
        sedan: 80,
        suv: 85,
        details: 'Everything in Platinum + engine & rims degreaser, interior polish, deep wash',
        icon: `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1a365d" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
        features: ['All Platinum', 'Engine Clean', 'Rims Degreaser', 'Deep Wash', 'Interior Polish']
    },
    diamond: {
        name: 'Diamond',
        sedan: null,
        suv: null,
        details: 'Coming Soon',
        icon: `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#a0aec0" d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z"/></svg>`,
        comingSoon: true,
        features: []
    }
};

// Time slots
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

// Initialize App
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Show splash screen, then initialize
    setTimeout(() => {
        hideSplashScreen();
        initializeApp();
    }, 2200);
}

function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('hidden');
}

function initializeApp() {
    registerServiceWorker();
    setupPhoneScreen();
    setupOTPScreen();
    setupServicesScreen();
    setupPackagesScreen();
    setupLocationScreen();
    setupPaymentScreen();
    setupSummaryScreen();
    setupConfirmationScreen();
    setupHistoryScreen();
    setupEditScreen();
    setupCancelScreen();
    setupRatingScreen();
    loadFavoriteLocations();
    setupHomeScreen();
    setupProfileScreen();
    setupTrackScreen();
}

// ===================================
// Service Worker Registration
// ===================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);
            })
            .catch(err => {
                console.log('SW registration failed:', err);
            });
    }
}

// ===================================
// Progress Indicator
// ===================================

function updateProgress(step) {
    state.currentStep = step;
    const indicator = document.getElementById('progress-indicator');
    const steps = indicator.querySelectorAll('.progress-step');
    const lines = indicator.querySelectorAll('.progress-line');

    // Show/hide progress indicator
    if (step > 0 && step <= 5) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }

    steps.forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');

        if (stepNum < step) {
            stepEl.classList.add('completed');
        } else if (stepNum === step) {
            stepEl.classList.add('active');
        }
    });

    lines.forEach((line, index) => {
        if (index < step - 1) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

// ===================================
// Navigation
// ===================================

function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);

    // Update progress based on screen
    const progressMap = {
        'screen-services': 1,
        'screen-packages': 2,
        'screen-location': 3,
        'screen-payment': 4,
        'screen-summary': 5
    };

    if (progressMap[screenId]) {
        updateProgress(progressMap[screenId]);
    } else {
        updateProgress(0);
    }

    // Handle screen-specific initialization
    if (screenId === 'screen-location') {
        // Generate date picker when entering location screen
        generateDatePicker();
        // Load favorite locations
        loadFavoriteLocations();
    }

    // Show/hide navbar based on screen
    const hasNavbar = document.getElementById(screenId).classList.contains('has-navbar');
    const navbar = document.getElementById('bottom-navbar');
    if (navbar) {
        navbar.classList.toggle('hidden', !hasNavbar);
    }
}

function showLoading(show = true) {
    document.getElementById('loading-overlay').classList.toggle('active', show);
}

// ===================================
// Toast Notifications
// ===================================

function showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===================================
// Screen 1: Phone Entry with Auto-Format
// ===================================

function setupPhoneScreen() {
    const phoneInput = document.getElementById('phone-input');
    const btnSendOTP = document.getElementById('btn-send-otp');
    const btnGuest = document.getElementById('btn-guest');
    const phoneError = document.getElementById('phone-error');

    phoneInput.addEventListener('input', (e) => {
        // Auto-format phone number
        let value = e.target.value.replace(/\D/g, '');

        // Format as XX XXX XXXX
        if (value.length > 2) {
            value = value.slice(0, 2) + ' ' + value.slice(2);
        }
        if (value.length > 6) {
            value = value.slice(0, 6) + ' ' + value.slice(6);
        }

        e.target.value = value;

        const digits = value.replace(/\s/g, '');
        const isValid = validatePhone(digits);
        btnSendOTP.disabled = !isValid;

        if (digits.length > 0 && !isValid) {
            phoneError.textContent = 'Enter a valid 9-digit UAE number';
        } else {
            phoneError.textContent = '';
        }
    });

    btnSendOTP.addEventListener('click', () => {
        state.phone = phoneInput.value.replace(/\s/g, '');
        state.isGuest = false;

        document.getElementById('otp-phone-display').textContent =
            `+971 ${formatPhone(state.phone)}`;

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
        // Go to home screen and show navbar
        navigateTo('screen-home');
    });
}

function validatePhone(phone) {
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

        setTimeout(() => {
            showLoading(false);

            if (otp.length === 4) {
                clearInterval(resendInterval);
                // Go to home screen and show navbar
                navigateTo('screen-home');
                showToast('Phone verified successfully', 'success');
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
                otpDigits.forEach(d => d.value = '');
                otpDigits[0].focus();
                showToast('OTP sent again');
            }, 1000);
        }
    });
}

function startResendTimer() {
    const btnResend = document.getElementById('btn-resend');
    let seconds = 30;

    btnResend.disabled = true;
    btnResend.innerHTML = `Resend in <span id="resend-timer">${seconds}</span>s`;

    clearInterval(resendInterval);
    resendInterval = setInterval(() => {
        seconds--;
        const timerEl = document.getElementById('resend-timer');
        if (timerEl) timerEl.textContent = seconds;

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
    const recurringToggle = document.getElementById('recurring-toggle');
    const recurringOptions = document.getElementById('recurring-options');
    const recurringFrequency = document.getElementById('recurring-frequency');

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

    // Recurring booking toggle
    recurringToggle.addEventListener('change', (e) => {
        state.recurring.enabled = e.target.checked;
        recurringOptions.classList.toggle('hidden', !e.target.checked);
    });

    recurringFrequency.addEventListener('change', (e) => {
        state.recurring.frequency = e.target.value;
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
                            <span class="package-icon">${pkg.icon}</span>
                            ${pkg.name}
                            ${isComingSoon ? '<span class="coming-soon-badge">Soon</span>' : ''}
                        </span>
                        <span class="package-price">${isComingSoon ? '-' : price + ' AED'}</span>
                    </div>
                    <p class="package-details">${pkg.details}</p>
                    ${!isComingSoon && pkg.features ? `
                        <div class="package-features">
                            ${pkg.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                        </div>
                    ` : ''}
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
    const saveAsFavorite = document.getElementById('save-as-favorite');

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
            // Save as favorite if checked
            if (saveAsFavorite.checked && state.location.address) {
                saveFavoriteLocation({
                    emirate: state.location.emirate,
                    address: state.location.address
                });
                showToast('Location saved to favorites', 'success');
            }
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

            locationDisplay.textContent = `Location detected: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            locationDisplay.classList.add('success');

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

// Favorite Locations
function loadFavoriteLocations() {
    const favorites = getFavoriteLocations();
    const container = document.getElementById('favorite-locations');
    const list = document.getElementById('favorites-list');

    if (favorites.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = favorites.map((fav, index) => `
        <div class="favorite-item" onclick="selectFavorite(${index})">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>${capitalize(fav.emirate)} - ${fav.address}</span>
            <button class="delete-favorite" onclick="event.stopPropagation(); deleteFavorite(${index})">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>
    `).join('');
}

function getFavoriteLocations() {
    return JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
}

function saveFavoriteLocation(location) {
    const favorites = getFavoriteLocations();
    favorites.push(location);
    localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
    loadFavoriteLocations();
}

function selectFavorite(index) {
    const favorites = getFavoriteLocations();
    const fav = favorites[index];

    document.getElementById('emirate-select').value = fav.emirate;
    document.getElementById('address-input').value = fav.address;
    state.location.emirate = fav.emirate;
    state.location.address = fav.address;

    validateLocationForm();
    showToast('Location selected');
}

function deleteFavorite(index) {
    const favorites = getFavoriteLocations();
    favorites.splice(index, 1);
    localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
    loadFavoriteLocations();
    showToast('Location removed');
}

function generateDatePicker() {
    const container = document.getElementById('date-picker');
    container.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function generateTimeSlots(selectedDate, containerId = 'time-slots') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    timeSlots.forEach(slot => {
        const slotHour = parseInt(slot.value.split(':')[0]);
        const isPast = isToday && slotHour <= currentHour;

        const slotEl = document.createElement('div');
        slotEl.className = `time-slot ${isPast ? 'disabled' : ''}`;
        slotEl.textContent = slot.display;
        slotEl.dataset.time = slot.value;

        if (!isPast) {
            slotEl.addEventListener('click', () => selectTime(slotEl, containerId));
        }

        container.appendChild(slotEl);
    });
}

function selectTime(slotEl, containerId = 'time-slots') {
    if (slotEl.classList.contains('disabled')) return;

    document.querySelectorAll(`#${containerId} .time-slot`).forEach(s => s.classList.remove('selected'));
    slotEl.classList.add('selected');

    if (containerId === 'time-slots') {
        state.selectedTime = slotEl.dataset.time;
        validateLocationForm();
    } else {
        // For edit screen
        document.getElementById('btn-save-edit').disabled = false;
    }
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
    const notificationToggle = document.getElementById('notification-toggle');

    paymentInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.paymentMethod = e.target.value;
            btnContinue.disabled = false;
        });
    });

    // Push notification opt-in
    notificationToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            const permission = await requestNotificationPermission();
            state.notificationsEnabled = permission === 'granted';
            if (!state.notificationsEnabled) {
                e.target.checked = false;
                showToast('Please enable notifications in your browser settings', 'error');
            } else {
                showToast('You will receive booking reminders', 'success');
            }
        } else {
            state.notificationsEnabled = false;
        }
    });

    btnContinue.addEventListener('click', () => {
        if (state.paymentMethod) {
            renderSummary();
            goToScreen('screen-summary');
        }
    });
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    return await Notification.requestPermission();
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

    // Recurring
    const recurringSection = document.getElementById('summary-recurring');
    const recurringText = document.getElementById('summary-recurring-text');
    if (state.recurring.enabled) {
        recurringSection.classList.remove('hidden');
        const freqText = {
            'weekly': 'Every Week',
            'biweekly': 'Every 2 Weeks',
            'monthly': 'Every Month'
        };
        recurringText.innerHTML = `<p>${freqText[state.recurring.frequency]}</p>`;
    } else {
        recurringSection.classList.add('hidden');
    }

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

    setTimeout(() => {
        showLoading(false);

        // Generate booking reference
        state.bookingRef = 'MG-' + Math.random().toString(36).substr(2, 6).toUpperCase();

        // Save booking to history
        saveBookingToHistory();

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
        updateProgress(0);

        // Launch confetti
        launchConfetti();
    }, 1500);
}

// ===================================
// Confetti Animation
// ===================================

function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#1a365d', '#4299e1', '#48bb78', '#ed8936', '#f6e05e'];

    // Create particles
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }

    let frame = 0;
    const maxFrames = 150;

    function animate() {
        if (frame >= maxFrames) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // gravity
            p.rotation += p.rotationSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
            ctx.restore();
        });

        frame++;
        requestAnimationFrame(animate);
    }

    animate();
}

// ===================================
// Screen 8: Confirmation
// ===================================

function setupConfirmationScreen() {
    const btnNewBooking = document.getElementById('btn-new-booking');

    btnNewBooking.addEventListener('click', () => {
        resetBooking();
        navigateTo('screen-home');
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
    state.recurring = { enabled: false, frequency: 'weekly' };

    // Reset form inputs
    document.getElementById('emirate-select').value = '';
    document.getElementById('address-input').value = '';
    document.getElementById('instructions-input').value = '';
    document.getElementById('current-location-display').textContent = '';
    document.getElementById('current-location-display').classList.remove('success');
    document.getElementById('recurring-toggle').checked = false;
    document.getElementById('recurring-options').classList.add('hidden');
    document.getElementById('save-as-favorite').checked = false;

    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.checked = false;
    });

    document.getElementById('btn-continue-location').disabled = true;
    document.getElementById('btn-continue-payment').disabled = true;

    addCar();
}

// ===================================
// Booking History Storage
// ===================================

function saveBookingToHistory() {
    const bookings = getBookingHistory();

    const booking = {
        id: Date.now(),
        ref: state.bookingRef,
        date: state.selectedDate,
        time: state.selectedTime,
        emirate: state.location.emirate,
        address: state.location.address,
        cars: state.cars.map(c => ({
            type: c.type,
            package: c.package
        })),
        total: calculateTotal(),
        status: 'upcoming',
        recurring: state.recurring.enabled ? state.recurring.frequency : null,
        createdAt: new Date().toISOString()
    };

    bookings.unshift(booking);
    localStorage.setItem('bookingHistory', JSON.stringify(bookings));
}

function getBookingHistory() {
    return JSON.parse(localStorage.getItem('bookingHistory') || '[]');
}

function updateBookingStatus(bookingId, status) {
    const bookings = getBookingHistory();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = status;
        localStorage.setItem('bookingHistory', JSON.stringify(bookings));
    }
}

// ===================================
// Screen 9: Booking History
// ===================================

function setupHistoryScreen() {
    // Pull to refresh setup
    setupPullToRefresh();
}

function loadBookingHistory() {
    const skeleton = document.getElementById('history-skeleton');
    const list = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');

    // Show skeleton
    skeleton.classList.remove('hidden');
    list.innerHTML = '';
    empty.classList.add('hidden');

    // Simulate loading
    setTimeout(() => {
        skeleton.classList.add('hidden');

        const bookings = getBookingHistory();

        if (bookings.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        // Update statuses based on dates
        const now = new Date();
        bookings.forEach(b => {
            const bookingDate = new Date(b.date + 'T' + b.time);
            if (b.status === 'upcoming' && bookingDate < now) {
                b.status = 'completed';
            }
        });
        localStorage.setItem('bookingHistory', JSON.stringify(bookings));

        list.innerHTML = bookings.map(booking => {
            const date = new Date(booking.date);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const timeSlot = timeSlots.find(t => t.value === booking.time);

            return `
                <div class="history-item" onclick="viewBooking(${booking.id})">
                    <div class="history-item-header">
                        <span class="history-item-ref">${booking.ref}</span>
                        <span class="history-item-status status-${booking.status}">${booking.status}</span>
                    </div>
                    <div class="history-item-details">
                        <p>${date.toLocaleDateString('en-AE', options)} at ${timeSlot ? timeSlot.display : booking.time}</p>
                        <p>${capitalize(booking.emirate)} - ${booking.address}</p>
                        <p>${booking.cars.length} car(s) - ${booking.cars.map(c => packages[c.package]?.name).join(', ')}</p>
                    </div>
                    <div class="history-item-price">${booking.total} AED</div>
                </div>
            `;
        }).join('');
    }, 800);
}

function viewBooking(bookingId) {
    const bookings = getBookingHistory();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) return;

    state.editingBookingId = bookingId;

    // Hide navbar for edit/rate screens
    document.getElementById('bottom-navbar').classList.add('hidden');

    // If completed, go to rating
    if (booking.status === 'completed') {
        goToScreen('screen-rate');
        return;
    }

    // If upcoming, go to edit
    if (booking.status === 'upcoming') {
        document.getElementById('edit-booking-ref').textContent = booking.ref;
        generateDatePicker('edit-date-picker');
        goToScreen('screen-edit');
    }

    // If cancelled, show toast
    if (booking.status === 'cancelled') {
        showToast('This booking was cancelled');
    }
}

function setupPullToRefresh() {
    const container = document.querySelector('#screen-history .pull-to-refresh-container');
    const ptr = document.querySelector('.pull-to-refresh');
    let startY = 0;
    let isPulling = false;

    container.addEventListener('touchstart', (e) => {
        if (container.scrollTop === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    });

    container.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 50) {
            ptr.classList.add('visible');
        }
    });

    container.addEventListener('touchend', () => {
        if (ptr.classList.contains('visible')) {
            ptr.classList.add('refreshing');
            ptr.querySelector('span').textContent = 'Refreshing...';

            setTimeout(() => {
                loadBookingHistory();
                ptr.classList.remove('visible', 'refreshing');
                ptr.querySelector('span').textContent = 'Pull to refresh';
            }, 1000);
        }
        isPulling = false;
    });
}

// ===================================
// Screen 10: Edit Booking
// ===================================

function setupEditScreen() {
    const btnSave = document.getElementById('btn-save-edit');
    const btnCancel = document.getElementById('btn-cancel-booking');

    btnSave.addEventListener('click', () => {
        // Get selected date and time from edit screen
        const selectedDate = document.querySelector('#edit-date-picker .date-option.selected');
        const selectedTime = document.querySelector('#edit-time-slots .time-slot.selected');

        if (selectedDate && selectedTime) {
            const bookings = getBookingHistory();
            const booking = bookings.find(b => b.id === state.editingBookingId);

            if (booking) {
                booking.date = selectedDate.dataset.date;
                booking.time = selectedTime.dataset.time;
                localStorage.setItem('bookingHistory', JSON.stringify(bookings));

                showToast('Booking updated successfully', 'success');
                navigateTo('screen-history');
            }
        }
    });

    btnCancel.addEventListener('click', () => {
        document.getElementById('bottom-navbar').classList.add('hidden');
        goToScreen('screen-cancel');
    });
}

function generateDatePicker(containerId = 'date-picker') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

        dateEl.addEventListener('click', () => {
            document.querySelectorAll(`#${containerId} .date-option`).forEach(d => d.classList.remove('selected'));
            dateEl.classList.add('selected');

            const timeContainerId = containerId === 'edit-date-picker' ? 'edit-time-slots' : 'time-slots';
            generateTimeSlots(dateEl.dataset.date, timeContainerId);
        });

        container.appendChild(dateEl);
    }
}

// ===================================
// Screen 11: Cancel Booking
// ===================================

function setupCancelScreen() {
    const cancelReasons = document.querySelectorAll('input[name="cancel-reason"]');
    const otherReasonContainer = document.getElementById('cancel-other-reason');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');

    cancelReasons.forEach(input => {
        input.addEventListener('change', (e) => {
            btnConfirmCancel.disabled = false;

            if (e.target.value === 'other') {
                otherReasonContainer.classList.remove('hidden');
            } else {
                otherReasonContainer.classList.add('hidden');
            }
        });
    });

    btnConfirmCancel.addEventListener('click', () => {
        showLoading(true);

        setTimeout(() => {
            showLoading(false);
            updateBookingStatus(state.editingBookingId, 'cancelled');
            showToast('Booking cancelled', 'success');

            // Reset cancel form
            cancelReasons.forEach(r => r.checked = false);
            otherReasonContainer.classList.add('hidden');
            btnConfirmCancel.disabled = true;

            navigateTo('screen-history');
        }, 1000);
    });
}

// ===================================
// Screen 12: Rating
// ===================================

function setupRatingScreen() {
    const stars = document.querySelectorAll('.star-btn');
    const ratingText = document.getElementById('rating-text');
    const feedbackContainer = document.getElementById('rating-feedback');
    const btnSubmit = document.getElementById('btn-submit-rating');

    const ratingTexts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent!'
    };

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            state.currentRating = rating;

            // Update star visuals
            stars.forEach(s => {
                const sRating = parseInt(s.dataset.rating);
                s.classList.toggle('active', sRating <= rating);
            });

            // Update text
            ratingText.textContent = ratingTexts[rating];

            // Show feedback for low ratings
            if (rating <= 3) {
                feedbackContainer.classList.remove('hidden');
            } else {
                feedbackContainer.classList.add('hidden');
            }

            btnSubmit.disabled = false;
        });
    });

    btnSubmit.addEventListener('click', () => {
        showLoading(true);

        setTimeout(() => {
            showLoading(false);
            showToast('Thank you for your feedback!', 'success');

            // Reset rating screen
            state.currentRating = 0;
            stars.forEach(s => s.classList.remove('active'));
            ratingText.textContent = 'Tap a star to rate';
            feedbackContainer.classList.add('hidden');
            document.getElementById('rating-comment').value = '';
            btnSubmit.disabled = true;

            navigateTo('screen-history');
        }, 1000);
    });
}

// ===================================
// Make functions globally accessible
// ===================================

// ===================================
// Navigation & Bottom Navbar
// ===================================

function navigateTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

    // Show target screen
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);

    // Update navbar active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.screen === screenId) {
            item.classList.add('active');
        }
    });

    // Show/hide navbar based on screen
    const hasNavbar = document.getElementById(screenId).classList.contains('has-navbar');
    const navbar = document.getElementById('bottom-navbar');
    navbar.classList.toggle('hidden', !hasNavbar);

    // Hide progress indicator for navbar screens
    if (hasNavbar) {
        updateProgress(0);
    }

    // Load content for specific screens
    if (screenId === 'screen-history') {
        loadBookingHistory();
    } else if (screenId === 'screen-home') {
        loadRecentBookings();
        updateActiveBookingCard();
    } else if (screenId === 'screen-profile') {
        updateProfileStats();
    } else if (screenId === 'screen-track') {
        checkActiveBookings();
    }
}

function startNewBooking() {
    // Reset booking state
    resetBooking();

    // Navigate to services screen
    goToScreen('screen-services');
    updateProgress(1);

    // Hide navbar during booking flow
    document.getElementById('bottom-navbar').classList.add('hidden');
}

// ===================================
// Home Screen
// ===================================

function setupHomeScreen() {
    updateGreeting();
    // Greeting updates every minute
    setInterval(updateGreeting, 60000);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    }

    document.getElementById('greeting-text').textContent = greeting;

    // Update user name if logged in
    if (state.phone) {
        document.getElementById('user-name').textContent = `+971 ${formatPhone(state.phone)}`;
    }
}

function loadRecentBookings() {
    const container = document.getElementById('recent-bookings');
    const bookings = getBookingHistory();

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p style="margin-bottom: 0;">No bookings yet. Book your first wash!</p>
            </div>
        `;
        return;
    }

    // Show only last 3 bookings
    const recent = bookings.slice(0, 3);

    container.innerHTML = recent.map(booking => {
        const date = new Date(booking.date);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const timeSlot = timeSlots.find(t => t.value === booking.time);

        return `
            <div class="recent-booking-item" onclick="viewBooking(${booking.id})">
                <div class="recent-booking-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1a365d" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                </div>
                <div class="recent-booking-info">
                    <strong>${booking.ref}</strong>
                    <span>${date.toLocaleDateString('en-AE', options)} at ${timeSlot ? timeSlot.display : booking.time}</span>
                </div>
                <span class="recent-booking-status status-${booking.status}">${booking.status}</span>
            </div>
        `;
    }).join('');
}

function updateActiveBookingCard() {
    const section = document.getElementById('active-booking-section');
    const bookings = getBookingHistory();

    // Find active/upcoming booking
    const now = new Date();
    const activeBooking = bookings.find(b => {
        if (b.status !== 'upcoming') return false;
        const bookingDateTime = new Date(b.date + 'T' + b.time);
        // Active if within 2 hours of booking time
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        return timeDiff > -2 * 60 * 60 * 1000 && timeDiff < 24 * 60 * 60 * 1000;
    });

    if (activeBooking) {
        section.classList.remove('hidden');
        document.getElementById('active-ref').textContent = activeBooking.ref;

        const bookingDateTime = new Date(activeBooking.date + 'T' + activeBooking.time);
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        const minutesUntil = Math.round(timeDiff / 60000);

        if (minutesUntil > 0) {
            document.getElementById('active-status').textContent = 'Scheduled';
            document.getElementById('active-eta').textContent = minutesUntil > 60
                ? `In ${Math.round(minutesUntil / 60)} hours`
                : `In ${minutesUntil} mins`;
        } else {
            document.getElementById('active-status').textContent = 'Washer on the way';
            document.getElementById('active-eta').textContent = 'ETA: 15 mins';
        }
    } else {
        section.classList.add('hidden');
    }
}

// ===================================
// Profile Screen
// ===================================

function setupProfileScreen() {
    // Initial setup if needed
}

function updateProfileStats() {
    const bookings = getBookingHistory();
    const completedBookings = bookings.filter(b => b.status === 'completed');

    document.getElementById('stat-bookings').textContent = bookings.length;

    const totalSpent = bookings.reduce((sum, b) => sum + (b.total || 0), 0);
    document.getElementById('stat-spent').textContent = totalSpent;

    // Points = 10 per AED spent
    document.getElementById('stat-points').textContent = Math.floor(totalSpent * 0.1);

    // Update phone in profile
    if (state.phone) {
        document.getElementById('profile-phone').textContent = `+971 ${formatPhone(state.phone)}`;
        document.getElementById('profile-name').textContent = 'User';
    } else if (state.isGuest) {
        document.getElementById('profile-phone').textContent = 'Guest';
        document.getElementById('profile-name').textContent = 'Guest User';
    }
}

// ===================================
// Track Screen
// ===================================

function setupTrackScreen() {
    // Setup track screen if needed
}

function checkActiveBookings() {
    const bookings = getBookingHistory();
    const now = new Date();

    // Find active booking
    const activeBooking = bookings.find(b => {
        if (b.status !== 'upcoming') return false;
        const bookingDateTime = new Date(b.date + 'T' + b.time);
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        return timeDiff > -2 * 60 * 60 * 1000;
    });

    const emptyState = document.getElementById('track-empty');
    const trackContent = document.getElementById('track-content');

    if (activeBooking) {
        emptyState.classList.add('hidden');
        trackContent.classList.remove('hidden');

        document.getElementById('track-booking-ref').textContent = activeBooking.ref;

        // Simulate tracking times
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        document.getElementById('track-time-1').textContent = new Date(now.getTime() - 30 * 60000).toLocaleTimeString('en-US', options);
        document.getElementById('track-time-2').textContent = new Date(now.getTime() - 25 * 60000).toLocaleTimeString('en-US', options);
    } else {
        emptyState.classList.remove('hidden');
        trackContent.classList.add('hidden');
    }
}

// ===================================
// Logout Functions
// ===================================

function showLogoutConfirm() {
    document.getElementById('logout-modal').classList.remove('hidden');
}

function hideLogoutModal() {
    document.getElementById('logout-modal').classList.add('hidden');
}

function confirmLogout() {
    hideLogoutModal();

    // Reset state
    state.phone = '';
    state.isGuest = false;

    // Clear UI
    document.getElementById('phone-input').value = '';
    document.getElementById('bottom-navbar').classList.add('hidden');

    // Go to login screen
    goToScreen('screen-phone');

    showToast('Logged out successfully');
}

// ===================================
// Offers Functions
// ===================================

function copyPromoCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('Promo code copied!', 'success');
    }).catch(() => {
        showToast('Copy code: ' + code);
    });
}

function shareApp() {
    const shareData = {
        title: 'Mobile Garage',
        text: 'Get your car washed at your doorstep! Use my referral code for a free wash.',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareData.text + ' ' + shareData.url).then(() => {
            showToast('Link copied to clipboard!', 'success');
        });
    }
}

// ===================================
// Make functions globally accessible
// ===================================

window.goToScreen = goToScreen;
window.selectService = selectService;
window.removeCar = removeCar;
window.setCarType = setCarType;
window.setCarPackage = setCarPackage;
window.selectFavorite = selectFavorite;
window.deleteFavorite = deleteFavorite;
window.viewBooking = viewBooking;
window.navigateTo = navigateTo;
window.startNewBooking = startNewBooking;
window.showLogoutConfirm = showLogoutConfirm;
window.hideLogoutModal = hideLogoutModal;
window.confirmLogout = confirmLogout;
window.copyPromoCode = copyPromoCode;
window.shareApp = shareApp;
