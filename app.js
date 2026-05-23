/**
 * Chemistry Ph.D. Portfolio - Main Application Logic
 * Author: Antigravity Coding Assistant
 * Handles theme toggling, scroll reveals, publication filters, and forms.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollReveal();
  initPublicationFilters();
  initSmoothScroll();
  initContactForm();
  initActiveNavHighlight();
});

/**
 * 1. Dark/Light Theme Manager
 */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const sunIcon = `
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>
  `;

  const moonIcon = `
    <svg viewBox="0 0 24 24">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
    </svg>
  `;

  // Get initial theme from localStorage or system preferences
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  // Apply initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggleBtn.innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;

  // Toggle button handler
  themeToggleBtn.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    currentTheme = newTheme;

    // Apply
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;

    // Dispatch event to notify canvas
    const themeEvent = new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    });
    document.dispatchEvent(themeEvent);
  });
}

/**
 * 2. Scroll Reveal Animations (Intersection Observer)
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once revealed to keep scrolling fast and light
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * 3. Selected Publications Filter & Copy BibTeX
 */
function initPublicationFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const pubCards = document.querySelectorAll('.publication-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active class on buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      // Filter publications with smooth opacity fade
      pubCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
          const categories = card.getAttribute('data-category').split(' ');
          if (filterValue === 'all' || categories.includes(filterValue)) {
            card.style.display = 'flex';
            // Trigger reflow to restart animation
            card.offsetHeight; 
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          } else {
            card.style.display = 'none';
          }
        }, 200);
      });
    });
  });

  // Copy BibTeX functionality
  const bibtexBtns = document.querySelectorAll('.copy-bibtex-btn');
  bibtexBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const bibtexText = btn.getAttribute('data-bibtex');
      
      navigator.clipboard.writeText(bibtexText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `
          <svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg> Copied!
        `;
        btn.style.color = 'var(--accent)';
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = '';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  });
}

/**
 * 4. Smooth Scrolling for Navigation Anchor Links
 */
function initSmoothScroll() {
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  
  scrollLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetSection = document.querySelector(targetId);
      if (!targetSection) return;

      const headerOffset = 72; // height of sticky header
      const elementPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/**
 * 5. Active Navigation Link Highlighting on Scroll
 */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + 120; // compensation for sticky header

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

/**
 * 6. Contact Form Validation and Simulated Submission
 */
function initContactForm() {
  const form = document.getElementById('academic-contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('.btn-primary');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check basic validations
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
      alert('Please fill out all required fields.');
      return;
    }

    // Change button state to "Sending..."
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin-icon" style="width:16px;height:16px;animation:spin 1s linear infinite;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg> Sending...
    `;

    // Simulate API request (1.5 seconds)
    setTimeout(() => {
      // Success feedback animation
      submitBtn.innerHTML = `
        <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg> Message Sent!
      `;
      submitBtn.style.backgroundColor = '#10B981'; // Green success color
      
      // Reset form fields
      form.reset();

      setTimeout(() => {
        // Return button to original state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.style.backgroundColor = '';
      }, 3000);
    }, 1500);
  });
}

// Add simple CSS rotation animation for spin-icon in Javascript to keep styles isolated
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
  .nav-links a.active {
    color: var(--text-primary) !important;
  }
  .nav-links a.active::after {
    width: 100% !important;
  }
`;
document.head.appendChild(style);
