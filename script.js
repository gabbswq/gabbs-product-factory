// ================================================
// Navigation Scroll Effect
// ================================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ================================================
// Mobile Navigation Toggle
// ================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// ================================================
// Smooth Scroll for Anchor Links
// ================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 70;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ================================================
// Form Submission
// ================================================
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // Simple validation
  if (name && email && message) {
    // Show success message
    showNotification('Mensagem enviada com sucesso!', 'success');

    // Reset form
    contactForm.reset();

    // Log submission (in real app, send to server)
    console.log('Form submitted:', { name, email, message });
  } else {
    showNotification('Por favor, preencha todos os campos.', 'error');
  }
});

// ================================================
// Notification System
// ================================================
function showNotification(message, type) {
  // Remove existing notification if any
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  `;

  // Add animation keyframes
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
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
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ================================================
// Intersection Observer for Animations
// ================================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .testimonial-card, .stat').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Add animation styles
const animateStyles = document.createElement('style');
animateStyles.textContent = `
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(animateStyles);

// ================================================
// Typing Effect for Hero (Optional Enhancement)
// ================================================
const heroTitle = document.querySelector('.hero-title');

// Add subtle hover effect to cards
document.querySelectorAll('.feature-card, .testimonial-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.zIndex = '10';
  });

  card.addEventListener('mouseleave', function() {
    this.style.zIndex = '1';
  });
});

// ================================================
// Parallax Effect for Hero Background
// ================================================
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && scrolled < window.innerHeight) {
    heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
});

// ================================================
// Active Navigation Link Highlight
// ================================================
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;

  sections.forEach(section => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute('id');

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.add('active');
    } else {
      document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.remove('active');
    }
  });
});

// Add active link style
const activeStyle = document.createElement('style');
activeStyle.textContent = `
  .nav-links a.active {
    color: #6366f1;
  }
  .nav-links a.active::after {
    width: 100%;
  }
`;
document.head.appendChild(activeStyle);

// ================================================
// Initialize on Load
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  // Trigger initial animations
  document.body.classList.add('loaded');
});

// Add loaded class styles
const loadedStyles = document.createElement('style');
loadedStyles.textContent = `
  body.loaded .hero-content {
    animation: fadeInUp 0.8s ease;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(loadedStyles);

console.log('🚀 InnovateTech Landing Page carregada com sucesso!');
