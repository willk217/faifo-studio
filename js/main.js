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
    const company = (data.get('company') || '').toString().trim();
    const projectType = (data.get('projectType') || '').toString().trim();
    const budget = (data.get('budget') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      status.textContent = 'Fill in your name, email and what you need before sending.';
      form.querySelector(!name ? '#f-name' : !email ? '#f-email' : '#f-message').focus();
      return;
    }

    const subject = encodeURIComponent(`Enquiry — ${company || projectType || 'new project'}`);
    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Company / property: ${company || '—'}`,
      `Project type: ${projectType || '—'}`,
      `Budget range: ${budget || '—'}`,
      '',
      message,
    ];
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:studio@faifo.studio?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your mail app, addressed to studio@faifo.studio.';
  });
})();
