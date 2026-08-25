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

  // Services pin — scroll position through the 190vh scroller drives which of
  // the three full-viewport panels is active. Only wired above the mobile
  // breakpoint; below it CSS forces every panel to a plain stacked, always-
  // visible sequence, so nothing here needs to run (or matter) on touch.
  const servicesPin = document.querySelector('.services-pin');
  if (servicesPin && window.matchMedia('(min-width: 861px)').matches) {
    const scroller = servicesPin.querySelector('.services-pin__scroller');
    const panels = Array.from(servicesPin.querySelectorAll('.services-pin__panel'));
    const dots = Array.from(servicesPin.querySelectorAll('.services-pin__dot'));
    const counter = servicesPin.querySelector('[data-current]');

    // Cached on load/resize, not read on every scroll tick — same reasoning
    // as the hero trail's cached rect above.
    let scrollerTop = 0, scrollerHeight = 0, ticking = false;
    function measure() {
      const rect = scroller.getBoundingClientRect();
      scrollerTop = rect.top + window.scrollY;
      scrollerHeight = rect.height;
    }

    function update() {
      ticking = false;
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.scrollY - scrollerTop) / (scrollerHeight - vh)));
      const index = Math.min(panels.length - 1, Math.floor(progress * panels.length));
      panels.forEach((p, i) => p.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    }

    measure();
    update();
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
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

  // Filmstrip gallery (Photography proof) — native overflow-x scroll stays
  // the accessible baseline (touch/trackpad/keyboard already work); this
  // just translates vertical wheel input into horizontal movement, tracks
  // scroll progress, and shows a cursor-follow "View" cue on fine pointers.
  const filmstrip = document.getElementById('filmstrip');
  if (filmstrip) {
    filmstrip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      filmstrip.scrollLeft += e.deltaY;
    }, { passive: false });

    const progressBar = document.querySelector('.filmstrip-progress__bar');
    function updateProgress() {
      const max = filmstrip.scrollWidth - filmstrip.clientWidth;
      const pct = max > 0 ? Math.min(100, (filmstrip.scrollLeft / max) * 100) : 0;
      if (progressBar) progressBar.style.width = pct + '%';
    }
    filmstrip.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const cursor = document.querySelector('.filmstrip-cursor');
      const wrap = filmstrip.closest('.filmstrip-wrap');
      wrap?.addEventListener('pointermove', (e) => {
        const rect = wrap.getBoundingClientRect();
        cursor.style.left = (e.clientX - rect.left) + 'px';
        cursor.style.top = (e.clientY - rect.top) + 'px';
      });
      filmstrip.querySelectorAll('figure').forEach((fig) => {
        fig.addEventListener('pointerenter', () => cursor?.classList.add('is-active'));
        fig.addEventListener('pointerleave', () => cursor?.classList.remove('is-active'));
      });
    }
  }
})();
