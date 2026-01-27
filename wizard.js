// Wizard Booking System with Dynamic Pricing
let currentStep = 1;
const totalSteps = 7;
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
    paymentMethod: '', // link, transfer, or cash
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
    setupSlidingDateTime();
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

    // Payment method selection
    document.querySelectorAll('.select-payment-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.payment-card');
            const paymentMethod = card.dataset.payment;

            // Remove selected from all cards
            document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
            // Add selected to this card
            card.classList.add('selected');

            bookingData.paymentMethod = paymentMethod;

            // Automatically go to next step
            if (validateStep(currentStep)) {
                collectStepData(currentStep);
                nextStep();
            }
        });
    });
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
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const citySelect = document.getElementById('city');
    const areaInput = document.getElementById('area');

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

            // Save coordinates to hidden fields
            latInput.value = lat;
            lonInput.value = lon;

            try {
                // Use OpenStreetMap Nominatim API for reverse geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await response.json();

                if (data && data.address) {
                    // Extract location info
                    const city = data.address.city || data.address.town || data.address.state || '';
                    const suburb = data.address.suburb || data.address.neighbourhood || '';

                    // Map to our cities or use closest match
                    if (city.includes('Dubai') || suburb.includes('Dubai')) {
                        citySelect.value = 'Dubai';
                    } else if (city.includes('Sharjah') || suburb.includes('Sharjah')) {
                        citySelect.value = 'Sharjah';
                    } else if (city.includes('Ajman') || suburb.includes('Ajman')) {
                        citySelect.value = 'Ajman';
                    }

                    // Fill in area
                    if (suburb) areaInput.value = suburb;

                    btn.textContent = '✅ Location saved!';
                    alert('Location coordinates saved! Please fill in Villa/Form Number and Street Number.');
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Could not get address details');
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                alert('Location coordinates saved! Please fill in address details manually.');
                btn.textContent = '✅ Coordinates saved';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
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
            const villaNumber = document.getElementById('villa-number').value;
            const streetNumber = document.getElementById('street-number').value;
            if (!villaNumber || !streetNumber) {
                alert('Please provide Villa/Form Number and Street Number');
                return false;
            }
            return true;

        case 5:
            if (!bookingData.paymentMethod) {
                alert('Please select a payment method');
                return false;
            }
            return true;

        case 6:
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
            bookingData.latitude = document.getElementById('latitude').value;
            bookingData.longitude = document.getElementById('longitude').value;
            bookingData.villaNumber = document.getElementById('villa-number').value;
            bookingData.streetNumber = document.getElementById('street-number').value;
            bookingData.city = document.getElementById('city').value;
            bookingData.area = document.getElementById('area').value;
            bookingData.buildingName = document.getElementById('building-name').value;
            bookingData.specialInstructions = document.getElementById('special-instructions').value;

            // Check if optional phone was provided
            const optionalPhone = document.getElementById('customer-phone-optional').value;
            if (optionalPhone) {
                bookingData.customerPhone = optionalPhone;
            }
            break;

        case 5:
            // Payment method already collected via event listener
            break;

        case 6:
            bookingData.customerName = document.getElementById('customer-name').value;
            bookingData.customerPhone = document.getElementById('customer-phone').value;
            bookingData.customerEmail = document.getElementById('customer-email').value;

            // Save contact info to localStorage for future bookings
            saveContactInfo(bookingData.customerName, bookingData.customerPhone, bookingData.customerEmail);

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
    let locationText = `${bookingData.villaNumber}, ${bookingData.streetNumber}`;
    if (bookingData.city) locationText = `${bookingData.city} - ${locationText}`;
    if (bookingData.area) locationText += `<br>${bookingData.area}`;
    if (bookingData.buildingName) locationText += `<br>${bookingData.buildingName}`;
    if (bookingData.specialInstructions) locationText += `<br><small>${bookingData.specialInstructions}</small>`;

    document.getElementById('summary-location').innerHTML = locationText;

    // Payment Method
    let paymentText = '';
    if (bookingData.paymentMethod === 'link') {
        paymentText = '💳 Link Payment';
    } else if (bookingData.paymentMethod === 'transfer') {
        paymentText = '🏦 Bank Transfer';
    } else if (bookingData.paymentMethod === 'cash') {
        paymentText = '💵 Cash';
    }
    document.getElementById('summary-payment').textContent = paymentText;

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

    // Build location string
    let locationStr = `Villa/Form: ${bookingData.villaNumber}\nStreet: ${bookingData.streetNumber}`;
    if (bookingData.city) locationStr += `\nCity: ${bookingData.city}`;
    if (bookingData.area) locationStr += `\nArea: ${bookingData.area}`;
    if (bookingData.buildingName) locationStr += `\nBuilding: ${bookingData.buildingName}`;
    if (bookingData.specialInstructions) locationStr += `\nInstructions: ${bookingData.specialInstructions}`;

    // Add Google Maps link if coordinates available
    let mapsLink = '';
    if (bookingData.latitude && bookingData.longitude) {
        mapsLink = `\n📍 *Google Maps:* https://www.google.com/maps?q=${bookingData.latitude},${bookingData.longitude}`;
    }

    // Format payment method
    let paymentMethodText = '';
    if (bookingData.paymentMethod === 'link') {
        paymentMethodText = '💳 Link Payment';
    } else if (bookingData.paymentMethod === 'transfer') {
        paymentMethodText = '🏦 Bank Transfer';
    } else if (bookingData.paymentMethod === 'cash') {
        paymentMethodText = '💵 Cash';
    }

    const message = `
🚗 *New Car Wash Booking*

🚘 *Vehicle:* ${vehicleText}

📦 *Package:* ${subscriptionText}
💰 *Price:* AED ${bookingData.price.toFixed(0)}${bookingData.isMonthly ? '/month' : ''}

📅 *Date:* ${bookingData.date}
🕐 *Time:* ${bookingData.time}

📍 *Location:*
${locationStr}${mapsLink}

💳 *Payment Method:* ${paymentMethodText}

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
// Load saved contact information from localStorage
function loadSavedContactInfo() {
    const savedContact = localStorage.getItem('3on_customer_contact');

    if (savedContact) {
        try {
            const contact = JSON.parse(savedContact);

            // Pre-fill contact fields if they exist
            const nameInput = document.getElementById('customer-name');
            const phoneInput = document.getElementById('customer-phone');
            const emailInput = document.getElementById('customer-email');

            if (nameInput && contact.name) nameInput.value = contact.name;
            if (phoneInput && contact.phone) phoneInput.value = contact.phone;
            if (emailInput && contact.email) emailInput.value = contact.email;
        } catch (e) {
            console.log('Error loading saved contact info:', e);
        }
    }
}

// Save contact information to localStorage
function saveContactInfo(name, phone, email) {
    const contactData = {
        name: name,
        phone: phone,
        email: email,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('3on_customer_contact', JSON.stringify(contactData));
}

// Setup optional contact toggle
function setupOptionalContactToggle() {
    const checkbox = document.getElementById('add-contact-now');
    const contactFields = document.getElementById('contact-fields');

    if (checkbox && contactFields) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                contactFields.style.display = 'block';
            } else {
                contactFields.style.display = 'none';
            }
        });
    }
}

// Setup multi-vehicle functionality
function setupMultiVehicle() {
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    const multiVehicleSection = document.querySelector('.multi-vehicle-section');

    // Show multi-vehicle section after package selection
    const packageBtns = document.querySelectorAll('.select-package-btn');
    packageBtns.forEach(btn => {
        const originalClickHandler = btn.onclick;
        btn.addEventListener('click', function() {
            if (multiVehicleSection && !btn.disabled) {
                multiVehicleSection.style.display = 'block';
            }
        });
    });

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', function() {
            // Store current selection as additional vehicle
            if (bookingData.vehicleType && bookingData.package) {
                const additionalVehicle = {
                    vehicleType: bookingData.vehicleType,
                    vehicleSubType: bookingData.vehicleSubType,
                    package: bookingData.package,
                    price: bookingData.price
                };

                bookingData.additionalVehicles.push(additionalVehicle);

                // Add to UI
                addVehicleToList(additionalVehicle, bookingData.additionalVehicles.length - 1);

                // Go back to step 1 to select another vehicle
                currentStep = 1;
                document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
                document.getElementById('step-1').classList.add('active');
                updateProgress();
            }
        });
    }
}

function addVehicleToList(vehicle, index) {
    const list = document.getElementById('additional-vehicles-list');
    if (!list) return;

    const vehicleItem = document.createElement('div');
    vehicleItem.className = 'additional-vehicle-item';

    const vehicleInfo = document.createElement('div');
    vehicleInfo.className = 'vehicle-info';

    const vehicleTitle = document.createElement('strong');
    vehicleTitle.textContent = formatVehicleDisplay(vehicle);

    const vehicleDetails = document.createElement('small');
    vehicleDetails.textContent = vehicle.package.charAt(0).toUpperCase() + vehicle.package.slice(1) + ' - AED ' + vehicle.price;

    vehicleInfo.appendChild(vehicleTitle);
    vehicleInfo.appendChild(vehicleDetails);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-vehicle-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.dataset.index = index;

    removeBtn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        bookingData.additionalVehicles.splice(idx, 1);
        vehicleItem.remove();
    });

    vehicleItem.appendChild(vehicleInfo);
    vehicleItem.appendChild(removeBtn);
    list.appendChild(vehicleItem);
}

function formatVehicleDisplay(vehicle) {
    let display = vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1);
    if (vehicle.vehicleSubType) {
        display += ' (' + vehicle.vehicleSubType + ')';
    }
    return display;
}

// Sliding Date & Time Selector
let currentWeekOffset = 0;
let selectedDate = null;
let selectedTime = null;
const bookedSlots = {}; // Mock booked slots: {date: [times]}

function setupSlidingDateTime() {
    generateMockBookedSlots();
    renderWeekSlider();
    setupWeekNavigation();
    setupFallbackDatePicker();

    // Select today by default
    const today = new Date();
    selectDate(today);
}

// Generate mock booked slots for demo purposes
function generateMockBookedSlots() {
    const today = new Date();

    // Generate random booked slots for next 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Randomly book 2-4 time slots per day
        const numBooked = Math.floor(Math.random() * 3) + 2;
        const bookedTimes = [];
        const availableTimes = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];

        for (let j = 0; j < numBooked; j++) {
            const randomIndex = Math.floor(Math.random() * availableTimes.length);
            const time = availableTimes.splice(randomIndex, 1)[0];
            if (time) bookedTimes.push(time);
        }

        bookedSlots[dateStr] = bookedTimes;
    }
}

function renderWeekSlider() {
    const weekSlider = document.getElementById('week-slider');
    if (!weekSlider) return;

    weekSlider.innerHTML = '';

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (currentWeekOffset * 7));

    // Show 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        const dayBtn = createDayButton(date);
        weekSlider.appendChild(dayBtn);
    }
}

function createDayButton(date) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-btn';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCheck = new Date(date);
    dateCheck.setHours(0, 0, 0, 0);

    // Check if past
    if (dateCheck < today) {
        btn.classList.add('past');
        btn.disabled = true;
    }

    // Check if selected
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
        btn.classList.add('selected');
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = dayNames[date.getDay()];
    const dayDate = date.getDate();
    const dayMonth = monthNames[date.getMonth()];

    const dayNameDiv = document.createElement('div');
    dayNameDiv.className = 'day-name';
    dayNameDiv.textContent = dayName;

    const dayDateDiv = document.createElement('div');
    dayDateDiv.className = 'day-date';
    dayDateDiv.textContent = dayDate;

    const dayMonthDiv = document.createElement('div');
    dayMonthDiv.className = 'day-month';
    dayMonthDiv.textContent = dayMonth;

    btn.appendChild(dayNameDiv);
    btn.appendChild(dayDateDiv);
    btn.appendChild(dayMonthDiv);

    btn.addEventListener('click', () => selectDate(date));

    return btn;
}

function selectDate(date) {
    selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Update hidden input
    document.getElementById('booking-date').value = selectedDate.toISOString().split('T')[0];

    // Update UI
    document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('selected'));
    const dayBtns = document.querySelectorAll('.day-btn');
    dayBtns.forEach(btn => {
        const btnDate = extractDateFromButton(btn);
        if (btnDate && btnDate.toDateString() === selectedDate.toDateString()) {
            btn.classList.add('selected');
        }
    });

    // Render time slots for selected date
    renderTimeSlots();
}

function extractDateFromButton(btn) {
    try {
        const dateText = btn.querySelector('.day-date').textContent;
        const monthText = btn.querySelector('.day-month').textContent;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames.indexOf(monthText);
        const day = parseInt(dateText);
        const year = new Date().getFullYear();
        return new Date(year, month, day);
    } catch (e) {
        return null;
    }
}

function renderTimeSlots() {
    const timeGrid = document.getElementById('time-slots-grid');
    if (!timeGrid || !selectedDate) return;

    timeGrid.innerHTML = '';

    const times = [
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
    ];

    const timeLabels = [
        '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
        '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'
    ];

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    const dateStr = selectedDate.toISOString().split('T')[0];
    const bookedTimes = bookedSlots[dateStr] || [];

    times.forEach((time, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = timeLabels[index];
        btn.dataset.time = time;

        const timeHour = parseInt(time.split(':')[0]);
        const actualHour = timeHour === 0 ? 24 : timeHour;

        // Check if past (for today only)
        if (isToday && actualHour <= currentHour + 1) {
            btn.classList.add('past');
            btn.disabled = true;
        }
        // Check if booked
        else if (bookedTimes.includes(time)) {
            btn.classList.add('booked');
            btn.disabled = true;
        }
        // Available
        else {
            btn.addEventListener('click', () => selectTime(time, timeLabels[index], btn));
        }

        // Check if selected
        if (selectedTime === time) {
            btn.classList.add('selected');
        }

        timeGrid.appendChild(btn);
    });
}

function selectTime(time, label, btn) {
    selectedTime = time;

    // Update hidden input
    document.getElementById('booking-time').value = time;

    // Update UI
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function setupWeekNavigation() {
    const prevBtn = document.getElementById('prev-week-btn');
    const nextBtn = document.getElementById('next-week-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentWeekOffset > 0) {
                currentWeekOffset--;
                renderWeekSlider();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentWeekOffset++;
            renderWeekSlider();
        });
    }

    // Update prev button state
    const updateNavButtons = () => {
        if (prevBtn) {
            prevBtn.disabled = currentWeekOffset === 0;
        }
    };

    updateNavButtons();
    setInterval(updateNavButtons, 100);
}

function setupFallbackDatePicker() {
    const pickDateBtn = document.getElementById('pick-another-date-btn');
    const fallbackPicker = document.getElementById('fallback-date-picker');
    const fallbackInput = document.getElementById('fallback-date-input');
    const confirmBtn = document.getElementById('confirm-fallback-date');

    if (pickDateBtn && fallbackPicker && fallbackInput && confirmBtn) {
        // Set min date to today
        const today = new Date();
        fallbackInput.min = today.toISOString().split('T')[0];

        pickDateBtn.addEventListener('click', () => {
            fallbackPicker.style.display = fallbackPicker.style.display === 'none' ? 'flex' : 'none';
        });

        confirmBtn.addEventListener('click', () => {
            const selectedDateStr = fallbackInput.value;
            if (selectedDateStr) {
                const date = new Date(selectedDateStr + 'T12:00:00');
                selectDate(date);

                // Calculate week offset to show this date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = date - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                currentWeekOffset = Math.floor(diffDays / 7);

                renderWeekSlider();
                fallbackPicker.style.display = 'none';
            }
        });
    }
}
