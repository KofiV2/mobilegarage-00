// Language Switcher Functionality
let currentLanguage = 'en';

function switchLanguage(lang) {
    currentLanguage = lang;
    const html = document.documentElement;
    const btnEn = document.getElementById('btn-en');
    const btnAr = document.getElementById('btn-ar');

    // Update HTML attributes
    if (lang === 'ar') {
        html.setAttribute('lang', 'ar');
        html.setAttribute('dir', 'rtl');
        document.body.setAttribute('dir', 'rtl');
        btnAr.classList.add('active');
        btnEn.classList.remove('active');
    } else {
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        document.body.setAttribute('dir', 'ltr');
        btnEn.classList.add('active');
        btnAr.classList.remove('active');
    }

    // Update all translatable elements
    updateTranslations(lang);

    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

function updateTranslations(lang) {
    const elements = document.querySelectorAll('[data-en][data-ar]');

    elements.forEach(element => {
        const translation = element.getAttribute(`data-${lang}`);
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('mobile-menu-toggle');

    nav.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Close mobile menu when clicking a link
function closeMobileMenu() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('mobile-menu-toggle');

    if (nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.classList.remove('active');
    }
}

// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        switchLanguage(savedLanguage);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('#main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const nav = document.getElementById('main-nav');
        const toggle = document.getElementById('mobile-menu-toggle');

        if (nav && toggle &&
            !nav.contains(event.target) &&
            !toggle.contains(event.target) &&
            nav.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Handle form submission - Redirect to WhatsApp
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;

            // Create WhatsApp message
            const whatsappMessage = `Hello! 👋\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\n\nMessage:\n${message}`;

            // Encode message for URL
            const encodedMessage = encodeURIComponent(whatsappMessage);

            // WhatsApp number (replace with your actual number)
            const whatsappNumber = '971503633007';

            // Redirect to WhatsApp
            window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

            // Reset form
            contactForm.reset();
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and features on page load
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .feature, .city');

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Cookie Consent Banner
    initCookieConsent();
});

// Cookie Consent Functionality
function initCookieConsent() {
    const cookieBanner = document.getElementById('cookie-consent');
    const acceptBtn = document.getElementById('cookie-accept');
    const declineBtn = document.getElementById('cookie-decline');

    if (!cookieBanner) return;

    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');

    if (!consent) {
        // Show banner after a short delay
        setTimeout(function() {
            cookieBanner.classList.add('show');
        }, 1000);
    } else {
        cookieBanner.classList.add('hidden');
    }

    // Accept button handler
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieBanner.classList.remove('show');
            setTimeout(function() {
                cookieBanner.classList.add('hidden');
            }, 400);

            // Load Google Analytics
            if (typeof loadGoogleAnalytics === 'function') {
                loadGoogleAnalytics();
            }
        });
    }

    // Decline button handler
    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'declined');
            cookieBanner.classList.remove('show');
            setTimeout(function() {
                cookieBanner.classList.add('hidden');
            }, 400);
        });
    }
}

// ==================== BOOKING WIZARD FUNCTIONALITY ====================

// Booking wizard state
let bookingData = {
    service: '',
    date: null,
    time: '',
    name: '',
    phone: '',
    email: '',
    location: '',
    notes: ''
};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;

// Service name mappings
const serviceNames = {
    'general-repair': { en: 'General Repair', ar: 'الإصلاح العام' },
    'oil-change': { en: 'Oil Change', ar: 'تغيير الزيت' },
    'battery-service': { en: 'Battery Service', ar: 'خدمة البطارية' },
    'tire-service': { en: 'Tire Service', ar: 'خدمة الإطارات' },
    'diagnostics': { en: 'Diagnostics', ar: 'التشخيص' },
    'maintenance': { en: 'Maintenance', ar: 'الصيانة' }
};

// Month names
const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};

// Open booking wizard
function openBookingWizard() {
    const modal = document.getElementById('booking-wizard-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        resetBookingWizard();
        renderCalendar();
        updateTranslations(currentLanguage);
    }
}

// Close booking wizard
function closeBookingWizard() {
    const modal = document.getElementById('booking-wizard-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Reset booking wizard
function resetBookingWizard() {
    bookingData = {
        service: '',
        date: null,
        time: '',
        name: '',
        phone: '',
        email: '',
        location: '',
        notes: ''
    };
    selectedDate = null;
    goToStep(1);

    // Reset form inputs
    const serviceInputs = document.querySelectorAll('input[name="service"]');
    serviceInputs.forEach(input => input.checked = false);

    const form = document.getElementById('booking-form');
    if (form) form.reset();
}

// Navigate to specific step
function goToStep(stepNumber) {
    // Hide all steps
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach(step => step.classList.remove('active'));

    // Show target step
    const targetStep = document.getElementById(`wizard-step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress indicators
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Next step validation
function nextStep(stepNumber) {
    const currentStep = stepNumber - 1;

    // Validate current step
    if (currentStep === 1) {
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (!selectedService) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار خدمة' : 'Please select a service');
            return;
        }
        bookingData.service = selectedService.value;
    } else if (currentStep === 2) {
        if (!selectedDate) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار تاريخ' : 'Please select a date');
            return;
        }
        bookingData.date = selectedDate;
        generateTimeSlots();
    } else if (currentStep === 3) {
        const selectedTime = document.querySelector('.time-slot.selected');
        if (!selectedTime) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار وقت' : 'Please select a time slot');
            return;
        }
        bookingData.time = selectedTime.dataset.time;
        displayBookingSummary();
    }

    goToStep(stepNumber);
}

// Previous step
function previousStep(stepNumber) {
    goToStep(stepNumber);
}

// Render calendar
function renderCalendar() {
    const daysContainer = document.getElementById('date-picker-days');
    const titleElement = document.getElementById('date-picker-title');

    if (!daysContainer || !titleElement) return;

    // Update title
    const monthName = monthNames[currentLanguage][currentMonth];
    titleElement.textContent = `${monthName} ${currentYear}`;

    // Clear existing days
    daysContainer.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'date-day empty';
        daysContainer.appendChild(emptyDay);
    }

    // Add days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('button');
        dayElement.className = 'date-day';
        dayElement.textContent = day;

        const dayDate = new Date(currentYear, currentMonth, day);
        dayDate.setHours(0, 0, 0, 0);

        // Disable past dates
        if (dayDate < today) {
            dayElement.classList.add('disabled');
            dayElement.disabled = true;
        } else {
            dayElement.onclick = function() {
                selectDate(day);
            };
        }

        // Mark selected date
        if (selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear) {
            dayElement.classList.add('selected');
        }

        daysContainer.appendChild(dayElement);
    }
}

// Select date
function selectDate(day) {
    selectedDate = new Date(currentYear, currentMonth, day);
    renderCalendar();
}

// Previous month
function previousMonth() {
    const today = new Date();
    const targetDate = new Date(currentYear, currentMonth - 1, 1);

    // Don't allow going to past months
    if (targetDate.getFullYear() < today.getFullYear() ||
        (targetDate.getFullYear() === today.getFullYear() && targetDate.getMonth() < today.getMonth())) {
        return;
    }

    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

// Next month
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Generate time slots
function generateTimeSlots() {
    const timeSlotsContainer = document.getElementById('time-slots');
    const dateDisplay = document.getElementById('selected-date-display');

    if (!timeSlotsContainer || !dateDisplay) return;

    // Display selected date
    const dateStr = selectedDate.toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    dateDisplay.textContent = dateStr;

    // Clear existing slots
    timeSlotsContainer.innerHTML = '';

    // Generate time slots (8 AM to 8 PM, hourly)
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
        const time12 = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const timeStr = `${time12}:00 ${ampm}`;
        slots.push({ time: timeStr, hour: hour });
    }

    // Render time slots
    slots.forEach(slot => {
        const slotElement = document.createElement('button');
        slotElement.className = 'time-slot';
        slotElement.dataset.time = slot.time;
        slotElement.textContent = slot.time;

        slotElement.onclick = function() {
            // Remove selected class from all slots
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            // Add selected class to clicked slot
            slotElement.classList.add('selected');
        };

        timeSlotsContainer.appendChild(slotElement);
    });
}

// Display booking summary
function displayBookingSummary() {
    const summaryContainer = document.getElementById('booking-summary');
    if (!summaryContainer) return;

    const serviceName = serviceNames[bookingData.service][currentLanguage];
    const dateStr = bookingData.date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const summaryHTML = `
        <div class="summary-section">
            <h3>${currentLanguage === 'ar' ? 'ملخص الحجز' : 'Booking Summary'}</h3>
            <p><strong>${currentLanguage === 'ar' ? 'الخدمة:' : 'Service:'}</strong> ${serviceName}</p>
            <p><strong>${currentLanguage === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${dateStr}</p>
            <p><strong>${currentLanguage === 'ar' ? 'الوقت:' : 'Time:'}</strong> ${bookingData.time}</p>
        </div>
    `;

    summaryContainer.innerHTML = summaryHTML;
}

// Submit booking
function submitBooking() {
    // Get form values
    bookingData.name = document.getElementById('booking-name').value;
    bookingData.phone = document.getElementById('booking-phone').value;
    bookingData.email = document.getElementById('booking-email').value;
    bookingData.location = document.getElementById('booking-location').value;
    bookingData.notes = document.getElementById('booking-notes').value;

    // Validate form
    if (!bookingData.name || !bookingData.phone || !bookingData.email || !bookingData.location) {
        alert(currentLanguage === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
        return;
    }

    // Create WhatsApp message
    const serviceName = serviceNames[bookingData.service][currentLanguage];
    const dateStr = bookingData.date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const message = currentLanguage === 'ar'
        ? `مرحباً! أود حجز موعد\n\n📋 الخدمة: ${serviceName}\n📅 التاريخ: ${dateStr}\n🕐 الوقت: ${bookingData.time}\n\n👤 الاسم: ${bookingData.name}\n📞 الهاتف: ${bookingData.phone}\n📧 البريد الإلكتروني: ${bookingData.email}\n📍 الموقع: ${bookingData.location}${bookingData.notes ? `\n\n📝 ملاحظات: ${bookingData.notes}` : ''}`
        : `Hello! I would like to book an appointment\n\n📋 Service: ${serviceName}\n📅 Date: ${dateStr}\n🕐 Time: ${bookingData.time}\n\n👤 Name: ${bookingData.name}\n📞 Phone: ${bookingData.phone}\n📧 Email: ${bookingData.email}\n📍 Location: ${bookingData.location}${bookingData.notes ? `\n\n📝 Notes: ${bookingData.notes}` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '971503633007';

    // Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    // Close modal
    closeBookingWizard();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar with current date
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
});
