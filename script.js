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
  // Each phrase renders as <PhraseName/> in a code-editor style: brackets in
  // muted gray, the name in a rotating accent color per line.
  const twEl = document.getElementById('heroTypewriter');
  if (twEl) {
    const phrases = [
      { name: 'TrustedPartner', colorClass: 'c0' },
      { name: 'UnderstandFirst', colorClass: 'c1' },
      { name: 'RealResults', colorClass: 'c2' },
    ];

    function renderPhrase(name, colorClass, charCount) {
      const full = '<' + name + '/>';
      const shown = full.slice(0, charCount);
      let html = '';
      for (let i = 0; i < shown.length; i++) {
        const ch = shown[i];
        const isBracketChar = ch === '<' || ch === '/' || ch === '>';
        const cls = isBracketChar ? 'tw-bracket' : 'tw-name ' + colorClass;
        html += '<span class="' + cls + '">' + ch + '</span>';
      }
      return html;
    }

    if (prefersReducedMotion) {
      twEl.innerHTML = renderPhrase(phrases[0].name, phrases[0].colorClass, ('<' + phrases[0].name + '/>').length);
    } else {
      let phraseIndex = 0;
      const typeSpeed = 55;
      const deleteSpeed = 28;
      const holdTime = 1600;
      const pauseBetween = 350;

      function typePhrase() {
        const { name, colorClass } = phrases[phraseIndex];
        const full = '<' + name + '/>';
        let charIndex = 0;
        (function type() {
          charIndex++;
          twEl.innerHTML = renderPhrase(name, colorClass, charIndex);
          if (charIndex < full.length) {
            setTimeout(type, typeSpeed);
          } else {
            setTimeout(deletePhrase, holdTime);
          }
        })();
      }
      function deletePhrase() {
        const { name, colorClass } = phrases[phraseIndex];
        const full = '<' + name + '/>';
        let charIndex = full.length;
        (function del() {
          charIndex--;
          twEl.innerHTML = renderPhrase(name, colorClass, Math.max(charIndex, 0));
          if (charIndex > 0) {
            setTimeout(del, deleteSpeed);
          } else {
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typePhrase, pauseBetween);
          }
        })();
      }
      typePhrase();
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
  const isDarkNow = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-pressed', String(isDarkNow));
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      document.querySelectorAll('.theme-toggle').forEach(b => b.setAttribute('aria-pressed', String(next === 'dark')));
      try { localStorage.setItem('eazify-theme', next); } catch (e) {}
    });
  });

  // Reusable celebration: a burst of blue + warm-white confetti plus a
  // thumbs-up, used whenever a form (contact, newsletter) submits successfully.
  window.eazifyCelebrate = function (originEl) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = originEl && originEl.getBoundingClientRect
      ? originEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const colors = ['#0A63F7', '#3D8BFF', '#FFF8F0', '#FFFFFF', '#7C3AED'];
    const particles = [];
    const count = 90;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        gravity: 0.18 + Math.random() * 0.08,
        life: 1,
      });
    }

    // Thumbs-up emoji element, pops in near the origin
    const thumbsUp = document.createElement('div');
    thumbsUp.textContent = '👍';
    thumbsUp.style.cssText = `position:fixed; left:${originX}px; top:${originY - 20}px; transform:translate(-50%,-50%) scale(0);
      font-size:38px; z-index:10000; pointer-events:none; transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;`;
    document.body.appendChild(thumbsUp);
    requestAnimationFrame(() => {
      thumbsUp.style.transform = 'translate(-50%, -60px) scale(1)';
    });
    setTimeout(() => {
      thumbsUp.style.opacity = '0';
      thumbsUp.style.transform = 'translate(-50%, -90px) scale(0.8)';
    }, 1100);
    setTimeout(() => thumbsUp.remove(), 1600);

    let frame = 0;
    const maxFrames = 110;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (frame > maxFrames * 0.6) p.life -= 1 / (maxFrames * 0.4);
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  };

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
          window.eazifyCelebrate(btn);
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
