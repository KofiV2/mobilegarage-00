// Booking State
let bookingState = {
    package: null,
    packageName: '',
    price: 0,
    date: null,
    time: null,
    currentStep: 1,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeBooking();
    renderCalendar();
});

function initializeBooking() {
    // Package selection
    document.querySelectorAll('.package-card').forEach(card => {
        const btn = card.querySelector('.select-btn');
        btn.addEventListener('click', function() {
            selectPackage(card);
        });
    });

    // Navigation buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', nextStep);
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', function() {
        changeMonth(-1);
    });

    document.getElementById('next-month').addEventListener('click', function() {
        changeMonth(1);
    });

    // Form submission
    document.getElementById('booking-form').addEventListener('submit', submitBooking);
}

// Package Selection
function selectPackage(card) {
    // Remove previous selection
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));

    // Select this package
    card.classList.add('selected');

    bookingState.package = card.dataset.package;
    bookingState.packageName = card.querySelector('h3').textContent;
    bookingState.price = parseInt(card.dataset.price);
}

// Step Navigation
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }

    if (bookingState.currentStep < 4) {
        bookingState.currentStep++;
        updateStepDisplay();

        // Generate time slots when reaching step 3
        if (bookingState.currentStep === 3) {
            generateTimeSlots();
        }

        // Update summary when reaching step 4
        if (bookingState.currentStep === 4) {
            updateSummary();
        }
    }
}

function prevStep() {
    if (bookingState.currentStep > 1) {
        bookingState.currentStep--;
        updateStepDisplay();
    }
}

function validateCurrentStep() {
    if (bookingState.currentStep === 1) {
        if (!bookingState.package) {
            alert('Please select a wash package');
            return false;
        }
    } else if (bookingState.currentStep === 2) {
        if (!bookingState.date) {
            alert('Please select a date');
            return false;
        }
    } else if (bookingState.currentStep === 3) {
        if (!bookingState.time) {
            alert('Please select a time slot');
            return false;
        }
    }
    return true;
}

function updateStepDisplay() {
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < bookingState.currentStep) {
            step.classList.add('completed');
        } else if (stepNum === bookingState.currentStep) {
            step.classList.add('active');
        }
    });

    // Update step content
    document.querySelectorAll('.step-content').forEach((content, index) => {
        const stepNum = index + 1;
        content.classList.remove('active');

        if (stepNum === bookingState.currentStep) {
            content.classList.add('active');
        }
    });
}

// Calendar Functions
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

function renderCalendar() {
    const monthDisplay = document.getElementById('current-month');
    const daysContainer = document.getElementById('calendar-days');

    monthDisplay.textContent = `${monthNames[bookingState.currentMonth]} ${bookingState.currentYear}`;

    // Clear previous days
    daysContainer.innerHTML = '';

    // Get first day of month and total days
    const firstDay = new Date(bookingState.currentYear, bookingState.currentMonth, 1).getDay();
    const daysInMonth = new Date(bookingState.currentYear, bookingState.currentMonth + 1, 0).getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        daysContainer.appendChild(emptyDiv);
    }

    // Add days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;

        const dayDate = new Date(bookingState.currentYear, bookingState.currentMonth, day);
        dayDate.setHours(0, 0, 0, 0);

        // Disable past dates
        if (dayDate < today) {
            dayDiv.classList.add('disabled');
        } else {
            dayDiv.addEventListener('click', function() {
                selectDate(day);
            });

            // Highlight selected date
            if (bookingState.date) {
                const selectedDate = new Date(bookingState.date);
                if (selectedDate.getDate() === day &&
                    selectedDate.getMonth() === bookingState.currentMonth &&
                    selectedDate.getFullYear() === bookingState.currentYear) {
                    dayDiv.classList.add('selected');
                }
            }
        }

        daysContainer.appendChild(dayDiv);
    }
}

function changeMonth(direction) {
    const today = new Date();
    const newMonth = bookingState.currentMonth + direction;

    if (newMonth < 0) {
        bookingState.currentMonth = 11;
        bookingState.currentYear--;
    } else if (newMonth > 11) {
        bookingState.currentMonth = 0;
        bookingState.currentYear++;
    } else {
        bookingState.currentMonth = newMonth;
    }

    // Don't allow going to past months
    const checkDate = new Date(bookingState.currentYear, bookingState.currentMonth, 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (checkDate < currentMonth) {
        bookingState.currentMonth = today.getMonth();
        bookingState.currentYear = today.getFullYear();
        return;
    }

    renderCalendar();
}

function selectDate(day) {
    bookingState.date = new Date(bookingState.currentYear, bookingState.currentMonth, day);
    renderCalendar();
}

// Time Slots
function generateTimeSlots() {
    const slotsContainer = document.getElementById('time-slots');
    const dateInfo = document.getElementById('selected-date-info');

    // Display selected date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateInfo.textContent = bookingState.date.toLocaleDateString('en-US', options);

    // Clear previous slots
    slotsContainer.innerHTML = '';

    // Generate time slots from 8 AM to 8 PM
    const slots = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
        '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
    ];

    slots.forEach(time => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        slotDiv.textContent = time;

        slotDiv.addEventListener('click', function() {
            selectTimeSlot(time, slotDiv);
        });

        slotsContainer.appendChild(slotDiv);
    });
}

function selectTimeSlot(time, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Select this slot
    element.classList.add('selected');
    bookingState.time = time;
}

// Summary
function updateSummary() {
    const summaryContent = document.getElementById('summary-content');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = bookingState.date.toLocaleDateString('en-US', options);

    summaryContent.innerHTML = `
        <p><strong>Package:</strong> ${bookingState.packageName}</p>
        <p><strong>Price:</strong> AED ${bookingState.price}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${bookingState.time}</p>
    `;
}

// Submit Booking
function submitBooking(e) {
    e.preventDefault();

    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const location = document.getElementById('customer-location').value;
    const carModel = document.getElementById('car-model').value;
    const notes = document.getElementById('notes').value;

    if (!name || !phone || !location) {
        alert('Please fill in all required fields');
        return;
    }

    // Create WhatsApp message
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = bookingState.date.toLocaleDateString('en-US', options);

    let message = `🚗 MOBILE CARWASH BOOKING\n\n`;
    message += `📦 Package: ${bookingState.packageName}\n`;
    message += `💰 Price: AED ${bookingState.price}\n`;
    message += `📅 Date: ${dateStr}\n`;
    message += `🕐 Time: ${bookingState.time}\n\n`;
    message += `👤 Customer Details:\n`;
    message += `Name: ${name}\n`;
    message += `Phone: ${phone}\n`;
    message += `Location: ${location}\n`;
    if (carModel) message += `Car: ${carModel}\n`;
    if (notes) message += `\nNotes: ${notes}`;

    const whatsappNumber = '971503633007';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Show confirmation
    alert('Redirecting to WhatsApp to confirm your booking!');
}
