// ============================================
// SECURITY LAYER - DDoS & Attack Protection
// ============================================

// CSRF Token Generation and Management
const SecurityManager = {
    csrfToken: null,
    requestLog: [],
    maxRequestsPerMinute: 10,
    blockedIPs: new Set(),

    // Generate CSRF token
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        sessionStorage.setItem('csrf_token', this.csrfToken);
        return this.csrfToken;
    },

    // Validate CSRF token
    validateCSRFToken(token) {
        return token === this.csrfToken || token === sessionStorage.getItem('csrf_token');
    },

    // Rate limiting - Prevent DDoS
    checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Clean old requests
        this.requestLog = this.requestLog.filter(timestamp => timestamp > oneMinuteAgo);

        // Check if limit exceeded
        if (this.requestLog.length >= this.maxRequestsPerMinute) {
            console.warn('⚠️ Rate limit exceeded. Please slow down.');
            return false;
        }

        // Log this request
        this.requestLog.push(now);
        return true;
    },

    // Input sanitization - Prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        const div = document.createElement('div');
        div.textContent = input;
        let sanitized = div.innerHTML;

        // Additional sanitization
        sanitized = sanitized
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/eval\(/gi, '')
            .replace(/script/gi, '');

        return sanitized.trim();
    },

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    // Bot detection - Check for suspicious behavior
    detectBot() {
        const checks = {
            hasWebdriver: navigator.webdriver === true,
            hasPhantom: window.phantom !== undefined,
            hasCallPhantom: window.callPhantom !== undefined,
            hasSuspiciousPlugins: navigator.plugins.length === 0,
            hasSuspiciousLanguages: navigator.languages.length === 0,
            automationDetected: false
        };

        // Check for automation
        if (navigator.webdriver || window.phantom || window.callPhantom) {
            checks.automationDetected = true;
        }

        return checks.automationDetected;
    },

    // Initialize security
    init() {
        this.generateCSRFToken();

        // Detect and log suspicious activity
        if (this.detectBot()) {
            console.warn('🤖 Automated browser detected');
        }

        // Monitor for suspicious activity
        this.monitorSuspiciousActivity();
    },

    // Monitor for suspicious patterns
    monitorSuspiciousActivity() {
        let clickCount = 0;
        let lastClickTime = 0;

        document.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastClickTime < 100) {
                clickCount++;
                if (clickCount > 10) {
                    console.warn('⚠️ Suspicious clicking pattern detected');
                }
            } else {
                clickCount = 0;
            }
            lastClickTime = now;
        });
    }
};

// Initialize security on page load
SecurityManager.init();

// Copy Protection - Disable right-click, copy, cut, paste
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('cut', (e) => e.preventDefault());
document.addEventListener('paste', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());

// Disable keyboard shortcuts for copy/paste/save
document.addEventListener('keydown', (e) => {
    // Disable Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I
    if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'x' || e.key === 'X')) ||
        (e.ctrlKey && (e.key === 'v' || e.key === 'V')) ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'A')) ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'j' || e.key === 'J')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) ||
        e.key === 'F12'
    ) {
        e.preventDefault();
        return false;
    }
});

// Click/Touch Ripple Effect
function createRipple(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';

    // Get click/touch position
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    document.body.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effect on click and touch
document.addEventListener('click', createRipple);
document.addEventListener('touchstart', createRipple);

// Smooth scroll navigation with offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navigation scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

function highlightNavigation() {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', highlightNavigation);

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinksContainer = document.getElementById('navLinks');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav')) {
            navLinksContainer.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Animate skill bars when they come into view
            if (entry.target.classList.contains('skill-category')) {
                const progressBars = entry.target.querySelectorAll('.skill-progress');
                progressBars.forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 100);
                });
            }
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.project-card, .skill-category, .about-text, .about-image').forEach(el => {
    observer.observe(el);
});

// Contact form handling with ENHANCED SECURITY
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    // Add CSRF token to form
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = SecurityManager.csrfToken;
    contactForm.appendChild(csrfInput);

    // Add honeypot field (invisible to users, catches bots)
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    contactForm.appendChild(honeypot);

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // SECURITY CHECK 1: Rate Limiting
        if (!SecurityManager.checkRateLimit()) {
            showNotification('⚠️ Too many requests. Please wait a moment.', 'error');
            return;
        }

        // SECURITY CHECK 2: Honeypot (bot detection)
        const honeypotValue = contactForm.querySelector('input[name="website"]').value;
        if (honeypotValue) {
            console.warn('🤖 Bot detected via honeypot');
            showNotification('Error submitting form', 'error');
            return;
        }

        // SECURITY CHECK 3: CSRF Token Validation
        const csrfToken = contactForm.querySelector('input[name="csrf_token"]').value;
        if (!SecurityManager.validateCSRFToken(csrfToken)) {
            showNotification('Security validation failed. Please refresh the page.', 'error');
            return;
        }

        const formData = new FormData(contactForm);
        let name = formData.get('name').trim();
        let email = formData.get('email').trim();
        let subject = formData.get('subject').trim();
        let message = formData.get('message').trim();

        // SECURITY CHECK 4: Input Validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // SECURITY CHECK 5: Input Length Validation (prevent overflow attacks)
        if (name.length > 100 || subject.length > 200 || message.length > 5000) {
            showNotification('Input too long. Please shorten your message.', 'error');
            return;
        }

        // SECURITY CHECK 6: Email Validation
        if (!SecurityManager.validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // SECURITY CHECK 7: Sanitize all inputs (prevent XSS)
        name = SecurityManager.sanitizeInput(name);
        email = SecurityManager.sanitizeInput(email);
        subject = SecurityManager.sanitizeInput(subject);
        message = SecurityManager.sanitizeInput(message);

        // SECURITY CHECK 8: Check for spam patterns
        const spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'click here', 'buy now'];
        const messageLC = message.toLowerCase();
        if (spamKeywords.some(keyword => messageLC.includes(keyword))) {
            console.warn('⚠️ Spam detected in message');
            showNotification('Message flagged as spam', 'error');
            return;
        }

        // All security checks passed - Create mailto link
        const mailtoLink = `mailto:notfarruxd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        )}`;

        // Open mailto link
        window.location.href = mailtoLink;

        // Show success message
        showNotification('✅ Opening your email client...', 'success');

        // Reset form after a short delay
        setTimeout(() => {
            contactForm.reset();
            // Regenerate CSRF token for next submission
            csrfInput.value = SecurityManager.generateCSRFToken();
        }, 1000);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Removed parallax effect for better performance
// The effect was causing lag on scroll

// Add smooth reveal on page load
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Custom Cursor - OPTIMIZED for Performance
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
cursor.innerHTML = '<img src="cursor.png" alt="">';
document.body.appendChild(cursor);

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

// REMOVED TRAIL EFFECT - was causing lag and DOM bloat

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Trail effect removed for better performance
});

const interactiveElements = document.querySelectorAll('a, button, .btn, .project-link, .social-link, .nav-link, input, textarea');
let cursorScale = 1;

interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursorScale = 1.6;
    });

    element.addEventListener('mouseleave', () => {
        cursorScale = 1;
    });

    element.addEventListener('mousedown', () => {
        cursorScale = 1.3;
    });

    element.addEventListener('mouseup', () => {
        cursorScale = 1.6;
    });
});

// OPTIMIZED cursor animation - instant response, no lag
function animateCursor() {
    // Increased ease from 0.4 to 0.9 for near-instant response
    const ease = 0.9;
    cursorX += (mouseX - cursorX) * ease;
    cursorY += (mouseY - cursorY) * ease;

    // Use transform3d for GPU acceleration (prevents disappearing)
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(${cursorScale})`;

    requestAnimationFrame(animateCursor);
}

// Initialize cursor
cursor.style.left = '0';
cursor.style.top = '0';
animateCursor();

// Add interactive hover effects to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    // Simplified hover effect for better performance
    // Removed 3D transforms that were causing lag
    card.addEventListener('mousemove', function (e) {
        // Removed heavy 3D perspective transforms
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = '';
    });
});

// Lazy loading for images (if you add real images later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                console.log(`⚡ Page loaded in ${Math.round(loadTime)}ms`);
            }
        }, 0);
    });
}

// Add easter egg for developers
console.log(
    '%c👋 Hey there, developer!',
    'font-size: 20px; font-weight: bold; color: #6366f1; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'
);
console.log(
    '%cLike what you see? Let\'s build something together!',
    'font-size: 14px; color: #8b5cf6;'
);
console.log(
    '%c📧 alex.morgan@example.com',
    'font-size: 12px; color: #9ca3af;'
);

// Prevent project links from navigating (since they're placeholders)
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('This is a portfolio demo. Project details would be shown here.', 'info');
    });
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // Press 'h' to go to home
    if (e.key === 'h' && !e.target.matches('input, textarea')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Press 'c' to focus contact form
    if (e.key === 'c' && !e.target.matches('input, textarea')) {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                const firstInput = contactForm.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 500);
        }
    }
});

// Add focus visible for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// Smooth scroll to top button (appears after scrolling)
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
`;
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: var(--accent-primary);
    color: white;
    border: none;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;
    z-index: 999;
`;

document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

scrollToTopBtn.addEventListener('mouseenter', function () {
    this.style.transform = 'translateY(-4px)';
    this.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
});

scrollToTopBtn.addEventListener('mouseleave', function () {
    this.style.transform = '';
    this.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
});
