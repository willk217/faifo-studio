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

    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (lastX !== null && Math.hypot(x - lastX, y - lastY) < MIN_DIST) return;
      lastX = x; lastY = y;
      spawn(x, y);
    });

    hero.addEventListener('pointerleave', () => { lastX = lastY = null; });
  }

  // Scroll stepper (test) — pins the section and wipes through frames as the
  // page scrolls, clip-path driven (same technique as verostudio.com's
  // pinned reveal). Reduced-motion gets a static first frame instead — see
  // the matching CSS media query, which also collapses the tall scroll track.
  const stepper = document.getElementById('scroll-test');
  if (stepper && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const track = stepper.querySelector('.scroll-stepper__track');
    const frames = [...stepper.querySelectorAll('.scroll-stepper__frame')];
    const indexEl = stepper.querySelector('.scroll-stepper__index');
    const titleEl = stepper.querySelector('.scroll-stepper__title');
    const descEl = stepper.querySelector('.scroll-stepper__desc');
    const services = [
      { title: 'Real estate<br>photography', desc: 'The kind of images that make a space feel like somewhere you’d want to be, not just document it exists.' },
      { title: 'Videography', desc: 'Property films, hotel and resort walkthroughs, brand films. Shot to be watched, not skipped.' },
      { title: 'Drone', desc: 'Aerial coverage for properties, resorts, and land that photos on the ground can’t show.' },
      { title: 'Brand design', desc: 'Logos, visual identity, brand guidelines. The system that holds everything else together.' },
      { title: 'Brand media', desc: 'Ongoing content, social assets, campaign shoots. For brands that need more than a one-off.' },
    ];
    const steps = frames.length;
    let ticking = false;
    let lastStep = -1;

    function update() {
      ticking = false;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const stepProgress = progress * (steps - 1);

      // Frame 0 is the resting base layer (always fully visible, per its CSS
      // default) — only frames 1..N-1 wipe in on top of it as scroll passes
      // each one's slot, each covering the frame beneath.
      for (let i = 1; i < frames.length; i++) {
        const p = Math.min(1, Math.max(0, stepProgress - (i - 1)));
        frames[i].style.clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
      }

      const current = Math.min(steps - 1, Math.floor(stepProgress));
      if (current !== lastStep) {
        lastStep = current;
        indexEl.textContent = `${String(current + 1).padStart(2, '0')} / ${String(steps).padStart(2, '0')}`;
        titleEl.innerHTML = services[current]?.title || '';
        descEl.textContent = services[current]?.desc || '';
      }
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
