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
