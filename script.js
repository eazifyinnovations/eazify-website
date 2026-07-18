// Eazify Innovations — shared site behavior

document.addEventListener('DOMContentLoaded', () => {
  // Reveal the page (CSS also force-reveals after 0.7s if JS is ever delayed/blocked)
  requestAnimationFrame(() => document.body.classList.add('page-loaded'));

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  // Header scroll state
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu toggle
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      document.body.classList.toggle('nav-open', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
    }));
  }

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // Typewriter hero eyebrow (homepage only — guarded by element existence)
  const twEl = document.getElementById('heroTypewriter');
  if (twEl) {
    const lines = [
      '<YourTrustedTechPartner />',
      'We understand your business before we touch any technology.',
      'Practical systems. Real growth. No jargon.',
    ];
    if (prefersReducedMotion) {
      twEl.textContent = lines[0];
    } else {
      let lineIndex = 0;
      const typeSpeed = 45;
      const deleteSpeed = 22;
      const holdTime = 1900;
      const pauseBetween = 400;

      function typeLine() {
        const line = lines[lineIndex];
        let charIndex = 0;
        (function type() {
          twEl.textContent = line.slice(0, charIndex + 1);
          charIndex++;
          if (charIndex < line.length) {
            setTimeout(type, typeSpeed);
          } else {
            setTimeout(deleteLine, holdTime);
          }
        })();
      }
      function deleteLine() {
        const line = lines[lineIndex];
        let charIndex = line.length;
        (function del() {
          charIndex--;
          twEl.textContent = line.slice(0, Math.max(charIndex, 0));
          if (charIndex > 0) {
            setTimeout(del, deleteSpeed);
          } else {
            lineIndex = (lineIndex + 1) % lines.length;
            setTimeout(typeLine, pauseBetween);
          }
        })();
      }
      typeLine();
    }
  }

  // Hero flow step cycling (Discover → Architect → Build → Integrate → Grow)
  const steps = document.querySelectorAll('.hero-flow-step');
  if (steps.length && !prefersReducedMotion) {
    let i = 0;
    setInterval(() => {
      steps.forEach(s => s.classList.remove('is-active'));
      steps[i].classList.add('is-active');
      i = (i + 1) % steps.length;
    }, 1800);
  } else if (steps.length) {
    steps[0].classList.add('is-active');
  }

  // Dark mode toggle (light is default; preference persists via localStorage)
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('eazify-theme', next); } catch (e) {}
    });
  });

  // Footer newsletter signup (shares the Formspree endpoint, tagged separately)
  document.querySelectorAll('[data-newsletter-form]').forEach(form => {
    const note = form.nextElementSibling;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      if (note) { note.textContent = ''; note.classList.remove('is-error'); }
      try {
        const response = await fetch('https://formspree.io/f/xaqrnqqb', {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          if (note) note.textContent = "You're on the list — thanks!";
          form.reset();
        } else if (note) {
          note.textContent = 'Something went wrong. Please try again.';
          note.classList.add('is-error');
        }
      } catch (err) {
        if (note) {
          note.textContent = 'Something went wrong. Please try again.';
          note.classList.add('is-error');
        }
      } finally {
        btn.disabled = false;
      }
    });
  });

  // FAQ accordion (used on FAQ page; harmless elsewhere)
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    const toggle = () => {
      const isOpen = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', String(isOpen));
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // Smooth page transitions: fade out before internal navigation, so clicks
  // never feel like a dead/unresponsive tap while the next page loads.
  if (!prefersReducedMotion) {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http://') || href.startsWith('https://')) return;
      e.preventDefault();
      document.body.classList.remove('page-loaded');
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 200);
    });
  }
});
