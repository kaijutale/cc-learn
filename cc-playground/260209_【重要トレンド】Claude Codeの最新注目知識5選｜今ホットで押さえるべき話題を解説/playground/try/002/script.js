/* ============================================
   GUCCI History — Scroll Animations & Interactions
   ============================================ */

(function () {
  'use strict';

  // --- Loading Screen ---
  const loadingScreen = document.getElementById('loadingScreen');
  document.body.classList.add('loading');

  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      document.body.classList.remove('loading');
    }, 2200);
  });

  // --- Current Year ---
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Hero Particles ---
  const particlesContainer = document.getElementById('heroParticles');
  if (particlesContainer) {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (8 + Math.random() * 12) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
      particle.style.width = (1 + Math.random() * 2) + 'px';
      particle.style.height = particle.style.width;
      particlesContainer.appendChild(particle);
    }
  }

  // --- Navigation Scroll Effect ---
  const nav = document.getElementById('nav');

  function handleNavScroll() {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  // --- Parallax on Hero Background ---
  const heroBg = document.getElementById('heroBg');

  function handleParallax() {
    if (!heroBg) return;
    const scrollY = window.scrollY;
    const heroHeight = window.innerHeight;
    if (scrollY < heroHeight) {
      const parallaxOffset = scrollY * 0.35;
      heroBg.style.transform = 'translateY(' + parallaxOffset + 'px)';
    }
  }

  // --- Optimized scroll handler using requestAnimationFrame ---
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavScroll();
        handleParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Intersection Observer for Scroll Animations ---
  const animatedElements = document.querySelectorAll('[data-animate]:not(.hero [data-animate])');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.15,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.style.animationDelay;
        if (delay) {
          const ms = parseFloat(delay) * 1000;
          setTimeout(() => {
            el.classList.add('in-view');
          }, ms);
        } else {
          el.classList.add('in-view');
        }
        observer.unobserve(el);
      }
    });
  }, observerOptions);

  animatedElements.forEach((el) => {
    observer.observe(el);
  });

  // --- Timeline Items: also observe for dot glow ---
  const timelineItems = document.querySelectorAll('.timeline-item');

  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        timelineObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.2,
  });

  timelineItems.forEach((item) => {
    timelineObserver.observe(item);
  });

  // --- Smooth scroll for nav links ---
  const navLinks = document.querySelectorAll('.nav-link, .nav-logo');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

})();
