(() => {
  'use strict';

  // iOS Safari only applies :active styles when a touchstart listener exists
  // somewhere in the document — otherwise press feedback never renders on tap.
  document.addEventListener('touchstart', () => {}, { passive: true });

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

  // Hero mouse trail — real Auko frames pop up near the cursor and fade out,
  // leaving a trail. Fine-pointer + motion-OK only; touch/reduced-motion get
  // the plain ink ground with nothing extra.
  const hero = document.getElementById('top');
  const trail = hero?.querySelector('.hero__trail');
  const canTrail = hero && trail
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canTrail) {
    const images = [
      'overview-01-aerial-day.jpg', 'overview-02-dusk.jpg', 'land-01.jpg', 'land-02.jpg',
      'lodge-ground-01.jpg', 'lodge-canopy-01.jpg', 'lodge-earth-01.jpg', 'lodge-river-01.jpg',
      'welcome-01.jpg', 'wellness-01.jpg', 'lifestyle-01.jpg', 'lifestyle-03.jpg',
    ].map(f => `assets/photo/auko/${f}`);

    const MIN_DIST = 110;
    const MAX_LIVE = 5;
    const HOLD_MS = 550;
    const live = [];
    let lastX = null, lastY = null, lastSrc = null;

    function spawn(x, y) {
      let src = images[Math.floor(Math.random() * images.length)];
      if (src === lastSrc) src = images[(images.indexOf(src) + 1) % images.length];
      lastSrc = src;

      const img = document.createElement('img');
      img.className = 'hero__trail-img';
      img.src = src;
      img.alt = '';
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      trail.appendChild(img);
      live.push(img);
      requestAnimationFrame(() => img.classList.add('is-in'));

      if (live.length > MAX_LIVE) retire(live[0]);
      setTimeout(() => retire(img), HOLD_MS);
    }

    function retire(img) {
      if (!img.isConnected || img.classList.contains('is-out')) return;
      const i = live.indexOf(img);
      if (i !== -1) live.splice(i, 1);
      img.classList.remove('is-in');
      img.classList.add('is-out');
      img.addEventListener('transitionend', () => img.remove(), { once: true });
      setTimeout(() => img.remove(), 700); // fallback if transitionend never fires
    }

    // Cached, not read on every pointermove — a forced layout read that often
    // would jank the very effect it's positioning. Refreshed on enter/resize.
    let heroRect = null;
    const refreshRect = () => { heroRect = hero.getBoundingClientRect(); };
    hero.addEventListener('pointerenter', refreshRect);
    window.addEventListener('resize', refreshRect, { passive: true });

    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!heroRect) refreshRect();
      const x = e.clientX - heroRect.left;
      const y = e.clientY - heroRect.top;
      if (lastX !== null && Math.hypot(x - lastX, y - lastY) < MIN_DIST) return;
      lastX = x; lastY = y;
      spawn(x, y);
    });

    hero.addEventListener('pointerleave', () => { lastX = lastY = null; });
  }

  // FAQ accordion — plain button + region, not native <details>, so the
  // open/close height can transition smoothly (grid-template-rows trick)
  // instead of the hard cut native details gives on most browsers.
  document.querySelectorAll('.faq__item').forEach((item) => {
    const btn = item.querySelector('.faq__q');
    btn?.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
})();
