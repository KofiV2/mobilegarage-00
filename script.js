// Language Switcher Functionality
let currentLanguage = 'en';

// Cache DOM elements for better performance
const domCache = {
    html: document.documentElement,
    body: document.body,
    btnEn: null,
    btnAr: null,
    translatableElements: null
};

function switchLanguage(lang) {
    currentLanguage = lang;

    // Lazy initialize cached elements
    if (!domCache.btnEn) {
        domCache.btnEn = document.getElementById('btn-en');
        domCache.btnAr = document.getElementById('btn-ar');
    }

    // Use cached elements
    const { html, body, btnEn, btnAr } = domCache;

    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
        // Update HTML attributes
        if (lang === 'ar') {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            body.setAttribute('dir', 'rtl');
            if (btnAr) btnAr.classList.add('active');
            if (btnEn) btnEn.classList.remove('active');
        } else {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            body.setAttribute('dir', 'ltr');
            if (btnEn) btnEn.classList.add('active');
            if (btnAr) btnAr.classList.remove('active');
        }

        // Update all translatable elements
        updateTranslations(lang);

        // Save preference
        localStorage.setItem('preferredLanguage', lang);
    });
}

function updateTranslations(lang) {
    // Cache translatable elements on first run
    if (!domCache.translatableElements) {
        domCache.translatableElements = document.querySelectorAll('[data-en][data-ar]');
    }

    // Use cached elements
    const elements = domCache.translatableElements;
    const fragment = document.createDocumentFragment();

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

    // Mobile Bottom Navigation Active State
    initMobileNav();
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
        // Add body class for padding
        document.body.classList.add('cookie-visible');

        // Show banner after a short delay
        setTimeout(function() {
            cookieBanner.classList.add('show');
        }, 500);

        // Auto-dismiss after 30 seconds (auto-accept)
        const autoDismissTimer = setTimeout(function() {
            acceptCookies();
        }, 30000);

        // Auto-dismiss on scroll or interaction
        let hasInteracted = false;
        const handleInteraction = function() {
            if (!hasInteracted) {
                hasInteracted = true;
                clearTimeout(autoDismissTimer);
                setTimeout(function() {
                    acceptCookies();
                }, 10000); // Accept after 10 more seconds of browsing
            }
        };

        window.addEventListener('scroll', handleInteraction, { once: true });
        document.addEventListener('click', handleInteraction, { once: true });

        // Accept cookies function
        function acceptCookies() {
            localStorage.setItem('cookieConsent', 'accepted');
            hideBanner();

            // Load Google Analytics
            if (typeof loadGoogleAnalytics === 'function') {
                loadGoogleAnalytics();
            }
        }

        // Hide banner function
        function hideBanner() {
            cookieBanner.classList.remove('show');
            document.body.classList.remove('cookie-visible');
            setTimeout(function() {
                cookieBanner.classList.add('hidden');
            }, 400);
        }

        // Accept button handler
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                clearTimeout(autoDismissTimer);
                acceptCookies();
            });
        }

        // Decline button handler
        if (declineBtn) {
            declineBtn.addEventListener('click', function() {
                clearTimeout(autoDismissTimer);
                localStorage.setItem('cookieConsent', 'declined');
                hideBanner();
            });
        }
    } else {
        cookieBanner.classList.add('hidden');
    }
}

// Debounce helper function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile Bottom Navigation Active State Handler
function initMobileNav() {
    const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');

    if (!navItems.length) return;

    // Set active state based on current page
    const currentPage = window.location.pathname;

    // Cache sections for scroll handler
    const sections = Array.from(document.querySelectorAll('section[id]'));
    let ticking = false;
    let lastKnownScrollPosition = 0;

    navItems.forEach(item => {
        const href = item.getAttribute('href');

        // Remove active class from all items first
        item.classList.remove('active');

        // Add active class based on current page
        if (href === 'index.html' && (currentPage === '/' || currentPage.includes('index.html'))) {
            item.classList.add('active');
        } else if (href === 'wizard.html' && currentPage.includes('wizard.html')) {
            item.classList.add('active');
        }

        // Handle hash links (Services)
        item.addEventListener('click', function(e) {
            if (href.startsWith('#')) {
                // Don't prevent default for hash links
                // Batch DOM updates
                requestAnimationFrame(() => {
                    navItems.forEach(nav => nav.classList.remove('active'));
                    this.classList.add('active');
                });
            }
        });
    });

    // Optimized scroll handler with requestAnimationFrame
    function updateActiveNav(scrollPos) {
        let current = '';

        // Use cached sections array
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionTop = section.offsetTop;
            if (scrollPos >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        }

        if (current) {
            requestAnimationFrame(() => {
                navItems.forEach(item => {
                    const href = item.getAttribute('href');
                    if (href === `#${current}`) {
                        if (!item.classList.contains('active')) {
                            navItems.forEach(nav => nav.classList.remove('active'));
                            item.classList.add('active');
                        }
                    }
                });
            });
        }

        ticking = false;
    }

    // Debounced scroll handler for better performance
    const handleScroll = debounce(() => {
        lastKnownScrollPosition = window.pageYOffset;

        if (!ticking) {
            requestAnimationFrame(() => {
                updateActiveNav(lastKnownScrollPosition);
            });
            ticking = true;
        }
    }, 100); // Debounce for 100ms

    window.addEventListener('scroll', handleScroll, { passive: true });
}
