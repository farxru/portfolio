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

// Contact form handling with validation
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const subject = formData.get('subject').trim();
        const message = formData.get('message').trim();

        // Validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        // Simulate form submission (replace with actual backend call)
        setTimeout(() => {
            console.log('Form submitted:', { name, email, subject, message });

            // Show success message
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');

            // Reset form
            contactForm.reset();

            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }, 1500);
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

// Parallax effect for hero section (subtle)
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero-content');

            if (hero && scrolled < window.innerHeight) {
                const opacity = 1 - (scrolled / window.innerHeight) * 0.5;
                const translateY = scrolled * 0.2;
                hero.style.transform = `translateY(${translateY}px)`;
                hero.style.opacity = opacity;
            }

            ticking = false;
        });

        ticking = true;
    }
});

// Add smooth reveal on page load
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Custom RGB Cursor with Image and Trail Effect
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
cursor.innerHTML = '<img src="cursor.png" alt="">';
document.body.appendChild(cursor);

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let lastTrailTime = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Create trail effect (reduced frequency for better performance)
    const now = Date.now();
    if (now - lastTrailTime > 80) { // Create trail every 80ms
        createCursorTrail(mouseX, mouseY);
        lastTrailTime = now;
    }
});

// Create cursor trail
function createCursorTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.innerHTML = '<img src="cursor.png" alt="">';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    document.body.appendChild(trail);

    // Remove trail after animation
    setTimeout(() => {
        trail.remove();
    }, 800);
}

// Smooth cursor animation
function animateCursor() {
    // Smooth follow effect (optimized for smooth movement)
    const ease = 0.25; // Increased for smoother, more fluid movement
    cursorX += (mouseX - cursorX) * ease;
    cursorY += (mouseY - cursorY) * ease;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    requestAnimationFrame(animateCursor);
}

animateCursor();

// Cursor interaction with buttons and links
const interactiveElements = document.querySelectorAll('a, button, .btn, .project-link, .social-link, .nav-link, input, textarea');

interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.transition = 'transform 0.2s ease';
    });

    element.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
    });

    element.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(1.2)';
    });

    element.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1.5)';
    });
});

// Add interactive hover effects to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    card.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
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
