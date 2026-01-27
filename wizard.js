// Wizard Booking System
let currentStep = 1;
const totalSteps = 6;
const bookingData = {
    package: '',
    date: '',
    time: '',
    city: '',
    area: '',
    address: '',
    directions: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleColor: '',
    customerName: '',
    customerPhone: '',
    customerEmail: ''
};

// Initialize wizard
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    setupEventListeners();
    setMinDate();
});

function setMinDate() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

function setupEventListeners() {
    // Package selection
    document.querySelectorAll('.select-package-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.package-card');
            const packageName = card.dataset.package;

            // Remove selected from all cards
            document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
            // Add selected to this card
            card.classList.add('selected');

            bookingData.package = packageName;

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
}

function validateStep(step) {
    switch(step) {
        case 1:
            if (!bookingData.package) {
                alert('Please select a package');
                return false;
            }
            return true;

        case 2:
            const date = document.getElementById('booking-date').value;
            const time = document.getElementById('booking-time').value;
            if (!date || !time) {
                alert('Please select both date and time');
                return false;
            }
            return true;

        case 3:
            const city = document.getElementById('city').value;
            const area = document.getElementById('area').value;
            const address = document.getElementById('address').value;
            if (!city || !area || !address) {
                alert('Please fill in all required location fields');
                return false;
            }
            return true;

        case 4:
            const vehicleType = document.getElementById('vehicle-type').value;
            const vehicleModel = document.getElementById('vehicle-model').value;
            const vehicleColor = document.getElementById('vehicle-color').value;
            if (!vehicleType || !vehicleModel || !vehicleColor) {
                alert('Please fill in all vehicle details');
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
        case 2:
            bookingData.date = document.getElementById('booking-date').value;
            bookingData.time = document.getElementById('booking-time').value;
            break;

        case 3:
            bookingData.city = document.getElementById('city').value;
            bookingData.area = document.getElementById('area').value;
            bookingData.address = document.getElementById('address').value;
            bookingData.directions = document.getElementById('directions').value;
            break;

        case 4:
            bookingData.vehicleType = document.getElementById('vehicle-type').value;
            bookingData.vehicleModel = document.getElementById('vehicle-model').value;
            bookingData.vehicleColor = document.getElementById('vehicle-color').value;
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
    // Package
    document.getElementById('summary-package').textContent =
        bookingData.package.charAt(0).toUpperCase() + bookingData.package.slice(1) + ' Package';

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

    // Vehicle
    document.getElementById('summary-vehicle').textContent =
        `${bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)}: ${bookingData.vehicleModel} (${bookingData.vehicleColor})`;

    // Contact
    document.getElementById('summary-contact').innerHTML =
        `${bookingData.customerName}<br>${bookingData.customerPhone}` +
        (bookingData.customerEmail ? `<br>${bookingData.customerEmail}` : '');
}

function sendToWhatsApp() {
    // Format the message
    const message = `
🚗 *New Car Wash Booking*

📦 *Package:* ${bookingData.package.charAt(0).toUpperCase() + bookingData.package.slice(1)}

📅 *Date:* ${bookingData.date}
🕐 *Time:* ${bookingData.time}

📍 *Location:*
${bookingData.city}, ${bookingData.area}
${bookingData.address}
${bookingData.directions ? 'Directions: ' + bookingData.directions : ''}

🚙 *Vehicle:*
Type: ${bookingData.vehicleType}
Model: ${bookingData.vehicleModel}
Color: ${bookingData.vehicleColor}

👤 *Customer:*
Name: ${bookingData.customerName}
Phone: ${bookingData.customerPhone}
${bookingData.customerEmail ? 'Email: ' + bookingData.customerEmail : ''}
    `.trim();

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp URL
    const whatsappURL = `https://wa.me/971503633007?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappURL, '_blank');

    // Optional: Redirect to thank you page or home after a delay
    setTimeout(() => {
        alert('Thank you! Your booking has been sent. We will confirm shortly.');
        window.location.href = 'index.html';
    }, 2000);
}
