(() => {
  'use strict';

  // iOS Safari only applies :active styles when a touchstart listener exists
  // somewhere in the document — otherwise press feedback never renders on tap.
  document.addEventListener('touchstart', () => {}, { passive: true });

  // Fullscreen intro — mark fades/scales in, holds, then the ink curtain lifts.
  // html.show-intro is only present when the inline head script (index.html)
  // confirmed a fresh session and motion is allowed, so this just plays the
  // sequence; it never decides whether to.
  const intro = document.getElementById('intro');
  if (intro && document.documentElement.classList.contains('show-intro')) {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => intro.classList.add('is-in'));
    });
    setTimeout(() => {
      intro.classList.add('is-hiding');
      document.body.style.overflow = '';
      intro.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'opacity') return;
        intro.removeEventListener('transitionend', done);
        intro.classList.add('is-done');
      });
      setTimeout(() => intro.classList.add('is-done'), 700); // fallback if transitionend never fires
    }, 1500);
  }

  // Mobile nav
  const toggle = document.getElementById('navToggle');
  const closeBtn = document.getElementById('navClose');
  const panel = document.getElementById('navPanel');

  function openNav() {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    panel.querySelector('a')?.focus();
  }
  function closeNav() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  }
  toggle?.addEventListener('click', openNav);
  closeBtn?.addEventListener('click', closeNav);
  panel?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closeNav();
  });

  // Hero cursor trail — a handful of photos spawn and fade along the mouse
  // path across the hero. Desktop/mouse only: gated behind hover+fine-pointer
  // (matches the CSS media query hiding .hero__trail on touch/small screens)
  // and reduced-motion, so nothing here runs or matters where it's hidden.
  const heroTrail = document.getElementById('heroTrail');
  const heroEl = document.querySelector('.hero');
  if (
    heroTrail && heroEl &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const TRAIL_IMAGES = [
      'assets/photo/personal/mountain-window.jpg',
      'assets/photo/personal/murmurations.jpg',
      'assets/photo/personal/vietnam-bike-mountains.jpg',
      'assets/photo/personal/waterfall.jpg',
      'assets/photo/auko/lifestyle-01.jpg',
      'assets/photo/auko/lodge-canopy-01.jpg',
    ];
    const MIN_DIST = 110; // px the pointer must travel before the next image spawns
    const MAX_LIVE = 5;   // images kept in the DOM at once
    const HOLD_MS = 550;  // how long a spawned image stays before it starts fading out

    let heroRect = heroEl.getBoundingClientRect();
    function measureHero() { heroRect = heroEl.getBoundingClientRect(); }
    window.addEventListener('resize', measureHero, { passive: true });

    const live = [];
    let lastX = null, lastY = null, lastIndex = -1;

    function retire(img) {
      img.classList.remove('is-in');
      img.classList.add('is-out');
      img.addEventListener('transitionend', () => img.remove(), { once: true });
      setTimeout(() => img.remove(), 500); // fallback if transitionend never fires
    }

    function spawn(x, y) {
      let index = Math.floor(Math.random() * TRAIL_IMAGES.length);
      if (index === lastIndex) index = (index + 1) % TRAIL_IMAGES.length;
      lastIndex = index;

      const img = document.createElement('img');
      img.className = 'hero__trail-img';
      img.src = TRAIL_IMAGES[index];
      img.alt = '';
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      heroTrail.appendChild(img);
      requestAnimationFrame(() => img.classList.add('is-in'));

      live.push(img);
      if (live.length > MAX_LIVE) retire(live.shift());

      setTimeout(() => {
        const i = live.indexOf(img);
        if (i !== -1) { live.splice(i, 1); retire(img); }
      }, HOLD_MS);
    }

    heroEl.addEventListener('pointerenter', measureHero);
    heroEl.addEventListener('pointermove', (e) => {
      const x = e.clientX - heroRect.left;
      const y = e.clientY - heroRect.top;
      if (lastX !== null) {
        const dx = x - lastX, dy = y - lastY;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_DIST) return;
      }
      lastX = x; lastY = y;
      spawn(x, y);
    });
  }

  // Impact stats — count up from 0 once each number scrolls into view.
  // The "∞" item has no data-count-to, so it just rides the plain .reveal
  // fade-up above rather than trying to animate toward an infinite target.
  const countEls = document.querySelectorAll('[data-count-to]');
  const reduceMotionCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (countEls.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.countTo, 10);
      const suffix = el.dataset.suffix || '';
      if (reduceMotionCount) { el.textContent = target + suffix; return; }
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const countIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { animateCount(entry.target); countIo.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      countEls.forEach(el => countIo.observe(el));
    } else {
      countEls.forEach(el => { el.textContent = el.dataset.countTo + (el.dataset.suffix || ''); });
    }
  }

  // Reveal on scroll — one authored moment, staggered by DOM order within a section
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Array.from(el.parentElement.querySelectorAll('.reveal')).indexOf(el) % 6;
          el.style.transitionDelay = (delay * 70) + 'ms';
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Enquiry form — no backend; compose a mailto with the field values
  const form = document.getElementById('enquireForm');
  const status = document.getElementById('formStatus');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const projectType = (data.get('projectType') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      status.textContent = 'Fill in your name, email and what you need before sending.';
      form.querySelector(!name ? '#f-name' : !email ? '#f-email' : '#f-message').focus();
      return;
    }

    const subject = encodeURIComponent(`Enquiry — ${projectType || 'new project'}`);
    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Project type: ${projectType || '—'}`,
      '',
      message,
    ];
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:hello@faifostudio.com?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your mail app, addressed to hello@faifostudio.com.';
  });

  // Statement — words brighten as the section scrolls through the viewport,
  // cascading rather than all lighting at once. Reduced-motion (and any
  // browser without matchMedia support failing the check) skips the JS
  // entirely; the CSS default is already fully lit, so that's a complete,
  // readable statement on its own, not a degraded state.
  const statementEl = document.getElementById('statementText');
  if (statementEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const words = Array.from(statementEl.querySelectorAll('.word'));
    let stTop = 0, stHeight = 0, stTicking = false;

    function measureStatement() {
      const rect = statementEl.closest('.statement').getBoundingClientRect();
      stTop = rect.top + window.scrollY;
      stHeight = rect.height;
    }

    function updateStatement() {
      stTicking = false;
      const vh = window.innerHeight;
      // Tight, viewport-relative range (not tied to section height, which
      // varies with word count/wrap) — the whole cascade resolves within
      // well under one screen of scrolling instead of dragging across two.
      const start = stTop - vh * 0.62;
      const end = stTop + vh * 0.05;
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      const n = words.length;
      const windowSize = (1 / n) * 1.5;
      // t is remapped inside [windowSize/2, 1-windowSize/2] rather than the
      // raw [0,1] index spread — otherwise the first/last words' transition
      // midpoints land exactly on progress's own clamped boundaries, so they
      // can only ever reach "raw" 0.5 (half lit) instead of 0 or 1. That was
      // the bug behind the last word ("visuals.") never fully unblurring.
      words.forEach((w, i) => {
        const t = windowSize / 2 + (i / (n - 1)) * (1 - windowSize);
        const raw = (progress - t) / windowSize + 0.5;
        const lit = Math.min(1, Math.max(0, raw));
        w.style.opacity = String(0.2 + lit * 0.8);
        w.style.filter = `blur(${(1 - lit) * 5}px)`;
        w.style.transform = `translateY(${(1 - lit) * 10}px)`;
      });
    }

    measureStatement();
    updateStatement();
    window.addEventListener('scroll', () => {
      if (!stTicking) { stTicking = true; requestAnimationFrame(updateStatement); }
    }, { passive: true });
    window.addEventListener('resize', () => { measureStatement(); updateStatement(); }, { passive: true });
  }

  // Services — hover, click/tap, or keyboard focus a row and its companion
  // photo (or, for Cinematography, the Auko walkthrough video) swaps in
  // below the list. Desktop only — below the breakpoint CSS expands every
  // item with its own photo inline instead, so there's nothing to wire up
  // (hover has nothing to trigger it on touch, same reasoning as the hero
  // trail and the old services scrim's mobile gate).
  const servicesList = document.getElementById('servicesList');
  if (servicesList && window.matchMedia('(min-width: 861px)').matches) {
    const items = Array.from(servicesList.querySelectorAll('.services2__item'));
    const previewImg = document.getElementById('servicesPreviewImg');
    const previewVideo = document.getElementById('servicesPreviewVideo');
    const caption = document.getElementById('servicesPreviewCaption');
    const reduceMotionSvc = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function activateService(item) {
      items.forEach(i => { i.classList.remove('is-active'); i.setAttribute('aria-pressed', 'false'); });
      item.classList.add('is-active');
      item.setAttribute('aria-pressed', 'true');
      caption.textContent = item.dataset.desc;

      if (item.dataset.media === 'video') {
        previewImg.classList.add('is-hidden');
        previewVideo.classList.remove('is-hidden');
        if (!reduceMotionSvc) previewVideo.play().catch(() => {}); // autoplay can still be blocked; poster stays visible either way
      } else {
        previewVideo.classList.add('is-hidden');
        previewVideo.pause();
        previewVideo.currentTime = 0;
        previewImg.classList.remove('is-hidden');
        previewImg.src = item.dataset.img;
      }
    }

    items.forEach(item => {
      item.addEventListener('mouseenter', () => activateService(item));
      item.addEventListener('click', () => activateService(item));
      item.addEventListener('focus', () => activateService(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateService(item); }
      });
    });
  }

})();
