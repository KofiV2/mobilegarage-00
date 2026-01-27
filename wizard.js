// Wizard Booking System with Dynamic Pricing
let currentStep = 1;
const totalSteps = 6;
const bookingData = {
    vehicleType: '',
    vehicleSubType: '', // for boat size or caravan length
    package: '',
    isMonthly: false,
    price: 0,
    date: '',
    time: '',
    latitude: '',
    longitude: '',
    villaNumber: '',
    streetNumber: '',
    city: '',
    area: '',
    buildingName: '',
    specialInstructions: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    additionalVehicles: [] // for multi-vehicle bookings
};

// Pricing structure
const pricing = {
    sedan: {
        platinum: 45,
        titanium: 80
    },
    suv: {
        platinum: 50,
        titanium: 85
    },
    motorcycle: {
        platinum: 30,
        titanium: 55
    },
    boat: {
        small: {
            platinum: 60,
            titanium: 100
        },
        medium: {
            platinum: 90,
            titanium: 140
        },
        large: {
            platinum: 130,
            titanium: 200
        }
    },
    caravan: {
        short: {
            platinum: 55,
            titanium: 90
        },
        medium: {
            platinum: 75,
            titanium: 120
        },
        long: {
            platinum: 100,
            titanium: 160
        }
    }
};

// Initialize wizard
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    setupEventListeners();
    setMinDate();
    setupDateTimeFiltering();
    loadSavedContactInfo();
    setupOptionalContactToggle();
    setupMultiVehicle();
});

function setMinDate() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        // Set minimum to today (not tomorrow)
        dateInput.min = today.toISOString().split('T')[0];

        // Set default to today
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function setupDateTimeFiltering() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');

    if (dateInput && timeSelect) {
        // Filter time slots when date changes
        dateInput.addEventListener('change', function() {
            filterTimeSlots();
        });

        // Initial filter on page load
        filterTimeSlots();
    }
}

function filterTimeSlots() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');

    if (!dateInput || !timeSelect) return;

    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Get all time options
    const allOptions = timeSelect.querySelectorAll('option');

    if (isToday) {
        const currentHour = today.getHours();

        // Show only future time slots
        allOptions.forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
                return;
            }

            const optionHour = parseInt(option.value.split(':')[0]);
            const actualHour = optionHour === 0 ? 24 : optionHour; // Midnight is 24:00

            // Show if time is at least 1 hour from now
            if (actualHour > currentHour + 1) {
                option.style.display = 'block';
                option.disabled = false;
            } else {
                option.style.display = 'none';
                option.disabled = true;
            }
        });
    } else {
        // Future date: show all time slots
        allOptions.forEach(option => {
            option.style.display = 'block';
            option.disabled = false;
        });
    }

    // Reset selection if currently selected time is now hidden
    if (timeSelect.selectedOptions[0]?.style.display === 'none') {
        timeSelect.value = '';
    }
}

function setupEventListeners() {
    // Vehicle selection
    document.querySelectorAll('.select-vehicle-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.vehicle-card');
            const vehicleType = card.dataset.vehicle;

            // Remove selected from all cards
            document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
            // Add selected to this card
            card.classList.add('selected');

            bookingData.vehicleType = vehicleType;

            // Show sub-selection for boat or caravan
            if (vehicleType === 'boat') {
                document.getElementById('boat-sizes').style.display = 'block';
                document.getElementById('caravan-lengths').style.display = 'none';
            } else if (vehicleType === 'caravan') {
                document.getElementById('caravan-lengths').style.display = 'block';
                document.getElementById('boat-sizes').style.display = 'none';
            } else {
                // Auto-advance for other vehicles
                setTimeout(() => {
                    updatePricing();
                    nextStep();
                }, 500);
            }
        });
    });

    // Boat size confirmation
    const confirmBoatBtn = document.querySelector('.confirm-boat-btn');
    if (confirmBoatBtn) {
        confirmBoatBtn.addEventListener('click', function() {
            const selectedSize = document.querySelector('input[name="boat-size"]:checked');
            if (!selectedSize) {
                alert('Please select a boat size');
                return;
            }
            bookingData.vehicleSubType = selectedSize.value;
            updatePricing();
            nextStep();
        });
    }

    // Caravan length confirmation
    const confirmCaravanBtn = document.querySelector('.confirm-caravan-btn');
    if (confirmCaravanBtn) {
        confirmCaravanBtn.addEventListener('click', function() {
            const selectedLength = document.querySelector('input[name="caravan-length"]:checked');
            if (!selectedLength) {
                alert('Please select a caravan length');
                return;
            }
            bookingData.vehicleSubType = selectedLength.value;
            updatePricing();
            nextStep();
        });
    }

    // Monthly subscription toggle
    const subscriptionToggle = document.getElementById('monthly-subscription');
    if (subscriptionToggle) {
        subscriptionToggle.addEventListener('change', function() {
            bookingData.isMonthly = this.checked;
            updatePricing();
        });
    }

    // Package selection
    document.querySelectorAll('.select-package-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            if (this.disabled) return;

            const card = this.closest('.package-card');
            const packageName = card.dataset.package;

            // Remove selected from all cards
            document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
            // Add selected to this card
            card.classList.add('selected');

            bookingData.package = packageName;
            calculateFinalPrice();

            // Auto-advance to next step after selection
            setTimeout(() => nextStep(), 500);
        });
    });

    // Next buttons
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                collectStepData(currentStep);
                nextStep();
            }
        });
    });

    // Previous buttons
    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            previousStep();
        });
    });

    // Confirm button
    const confirmBtn = document.querySelector('.confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            sendToWhatsApp();
        });
    }

    // Geolocation button
    const useLocationBtn = document.getElementById('use-location-btn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function() {
            getGeolocation();
        });
    }
}

function updatePricing() {
    const vehicleType = bookingData.vehicleType;
    const vehicleSubType = bookingData.vehicleSubType;

    let platinumPrice, titaniumPrice;

    if (vehicleType === 'boat' || vehicleType === 'caravan') {
        if (!vehicleSubType) return;
        platinumPrice = pricing[vehicleType][vehicleSubType].platinum;
        titaniumPrice = pricing[vehicleType][vehicleSubType].titanium;
    } else {
        platinumPrice = pricing[vehicleType].platinum;
        titaniumPrice = pricing[vehicleType].titanium;
    }

    // Update price display
    updatePriceDisplay('platinum', platinumPrice);
    updatePriceDisplay('titanium', titaniumPrice);
}

function updatePriceDisplay(packageName, basePrice) {
    const priceElement = document.getElementById(`${packageName}-price`);
    const isMonthly = bookingData.isMonthly;

    if (isMonthly) {
        const monthlyPrice = basePrice * 4 * 0.925; // 4 washes with 7.5% discount
        const savingsPerWash = basePrice - (monthlyPrice / 4);
        priceElement.innerHTML = `<del>AED ${(basePrice * 4).toFixed(0)}</del> AED ${monthlyPrice.toFixed(0)}`;
        priceElement.classList.add('subscription-price');
    } else {
        priceElement.textContent = `AED ${basePrice}`;
        priceElement.classList.remove('subscription-price');
    }
}

function calculateFinalPrice() {
    const vehicleType = bookingData.vehicleType;
    const vehicleSubType = bookingData.vehicleSubType;
    const packageName = bookingData.package;
    const isMonthly = bookingData.isMonthly;

    let basePrice;

    if (vehicleType === 'boat' || vehicleType === 'caravan') {
        basePrice = pricing[vehicleType][vehicleSubType][packageName];
    } else {
        basePrice = pricing[vehicleType][packageName];
    }

    if (isMonthly) {
        bookingData.price = basePrice * 4 * 0.925; // 4 washes with 7.5% discount
    } else {
        bookingData.price = basePrice;
    }
}

function getGeolocation() {
    const btn = document.getElementById('use-location-btn');
    const citySelect = document.getElementById('city');
    const areaInput = document.getElementById('area');
    const addressInput = document.getElementById('address');

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    // Show loading state
    const originalText = btn.textContent;
    btn.textContent = '📍 Getting location...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // Use OpenStreetMap Nominatim API for reverse geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await response.json();

                if (data && data.address) {
                    // Extract location info
                    const city = data.address.city || data.address.town || data.address.state || '';
                    const suburb = data.address.suburb || data.address.neighbourhood || '';
                    const road = data.address.road || '';
                    const houseNumber = data.address.house_number || '';

                    // Map to our cities or use closest match
                    if (city.includes('Dubai') || suburb.includes('Dubai')) {
                        citySelect.value = 'Dubai';
                    } else if (city.includes('Sharjah') || suburb.includes('Sharjah')) {
                        citySelect.value = 'Sharjah';
                    } else if (city.includes('Ajman') || suburb.includes('Ajman')) {
                        citySelect.value = 'Ajman';
                    }

                    // Fill in area and address
                    if (suburb) areaInput.value = suburb;
                    if (road) {
                        addressInput.value = houseNumber ? `${houseNumber} ${road}` : road;
                    }

                    btn.textContent = '✅ Location detected!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Could not get address details');
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                alert('Could not get your address details. Please enter manually.');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        },
        function(error) {
            console.error('Geolocation error:', error);
            let errorMsg = 'Could not get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Please allow location access and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'Please enter your location manually.';
            }
            alert(errorMsg);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    );
}

function validateStep(step) {
    switch(step) {
        case 1:
            if (!bookingData.vehicleType) {
                alert('Please select a vehicle type');
                return false;
            }
            if ((bookingData.vehicleType === 'boat' || bookingData.vehicleType === 'caravan') && !bookingData.vehicleSubType) {
                alert('Please select the size/length');
                return false;
            }
            return true;

        case 2:
            if (!bookingData.package) {
                alert('Please select a package');
                return false;
            }
            return true;

        case 3:
            const date = document.getElementById('booking-date').value;
            const time = document.getElementById('booking-time').value;
            if (!date || !time) {
                alert('Please select both date and time');
                return false;
            }
            return true;

        case 4:
            const city = document.getElementById('city').value;
            const area = document.getElementById('area').value;
            const address = document.getElementById('address').value;
            if (!city || !area || !address) {
                alert('Please fill in all required location fields');
                return false;
            }
            return true;

        case 5:
            const name = document.getElementById('customer-name').value;
            const phone = document.getElementById('customer-phone').value;
            if (!name || !phone) {
                alert('Please provide your name and phone number');
                return false;
            }
            return true;

        default:
            return true;
    }
}

function collectStepData(step) {
    switch(step) {
        case 3:
            bookingData.date = document.getElementById('booking-date').value;
            bookingData.time = document.getElementById('booking-time').value;
            break;

        case 4:
            bookingData.city = document.getElementById('city').value;
            bookingData.area = document.getElementById('area').value;
            bookingData.address = document.getElementById('address').value;
            bookingData.specialInstructions = document.getElementById('special-instructions').value;
            break;

        case 5:
            bookingData.customerName = document.getElementById('customer-name').value;
            bookingData.customerPhone = document.getElementById('customer-phone').value;
            bookingData.customerEmail = document.getElementById('customer-email').value;
            updateSummary();
            break;
    }
}

function nextStep() {
    if (currentStep < totalSteps) {
        // Hide current step
        document.getElementById(`step-${currentStep}`).classList.remove('active');

        // Mark current step as completed
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');

        currentStep++;

        // Show next step
        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Update step indicator
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

        updateProgress();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousStep() {
    if (currentStep > 1) {
        // Hide current step
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');

        currentStep--;

        // Show previous step
        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Remove completed class from previous step
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('completed');

        updateProgress();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function updateSummary() {
    // Vehicle
    let vehicleText = bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1);
    if (bookingData.vehicleSubType) {
        vehicleText += ` (${bookingData.vehicleSubType.charAt(0).toUpperCase() + bookingData.vehicleSubType.slice(1)})`;
    }
    document.getElementById('summary-vehicle').textContent = vehicleText;

    // Package & Price
    const packageText = bookingData.package.charAt(0).toUpperCase() + bookingData.package.slice(1) + ' Package';
    const priceText = bookingData.isMonthly
        ? `AED ${bookingData.price.toFixed(0)}/month (4 washes - 7.5% savings!)`
        : `AED ${bookingData.price.toFixed(0)}`;
    document.getElementById('summary-package').innerHTML = `${packageText}<br><strong>${priceText}</strong>`;

    // Date & Time
    const date = new Date(bookingData.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('summary-datetime').textContent =
        `${formattedDate} at ${bookingData.time}`;

    // Location
    document.getElementById('summary-location').innerHTML =
        `${bookingData.city}, ${bookingData.area}<br>${bookingData.address}` +
        (bookingData.directions ? `<br><small>${bookingData.directions}</small>` : '');

    // Contact
    document.getElementById('summary-contact').innerHTML =
        `${bookingData.customerName}<br>${bookingData.customerPhone}` +
        (bookingData.customerEmail ? `<br>${bookingData.customerEmail}` : '');
}

function sendToWhatsApp() {
    // Format the message
    let vehicleText = bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1);
    if (bookingData.vehicleSubType) {
        vehicleText += ` (${bookingData.vehicleSubType})`;
    }

    const subscriptionText = bookingData.isMonthly
        ? `Monthly Subscription - ${bookingData.package.charAt(0).toUpperCase() + bookingData.package.slice(1)} (4 washes/month with 7.5% discount)`
        : `Single Wash - ${bookingData.package.charAt(0).toUpperCase() + bookingData.package.slice(1)}`;

    const message = `
🚗 *New Car Wash Booking*

🚘 *Vehicle:* ${vehicleText}

📦 *Package:* ${subscriptionText}
💰 *Price:* AED ${bookingData.price.toFixed(0)}${bookingData.isMonthly ? '/month' : ''}

📅 *Date:* ${bookingData.date}
🕐 *Time:* ${bookingData.time}

📍 *Location:*
${bookingData.city}, ${bookingData.area}
${bookingData.address}
${bookingData.directions ? 'Directions: ' + bookingData.directions : ''}

👤 *Customer:*
Name: ${bookingData.customerName}
Phone: ${bookingData.customerPhone}
${bookingData.customerEmail ? 'Email: ' + bookingData.customerEmail : ''}
    `.trim();

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp URL
    const whatsappURL = `https://wa.me/971554995611?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappURL, '_blank');

    // Optional: Redirect to thank you page or home after a delay
    setTimeout(() => {
        alert('Thank you! Your booking has been sent. We will confirm shortly.');
        window.location.href = 'index.html';
    }, 2000);
}
