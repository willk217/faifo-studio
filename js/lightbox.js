/* Auko gallery lightbox — direct manipulation, interruptible springs, velocity handoff,
   momentum projection, rubber-banding. See js/spring.js for the physics primitives. */
(function () {
  'use strict';
  const S = window.FaifoSpring;
  if (!S) return;

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const backdrop = lightbox.querySelector('.lightbox__backdrop');
  const stage = lightbox.querySelector('.lightbox__stage');
  const frame = lightbox.querySelector('.lightbox__frame');
  const img = lightbox.querySelector('.lightbox__img');
  const idxEl = lightbox.querySelector('[data-lightbox-index]');
  const capEl = lightbox.querySelector('[data-lightbox-caption]');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const prevBtn = lightbox.querySelector('.lightbox__nav.is-prev .lightbox__nav-btn');
  const nextBtn = lightbox.querySelector('.lightbox__nav.is-next .lightbox__nav-btn');

  let gallery = [];
  let currentIndex = 0;
  let isOpen = false;
  let triggerEl = null;
  let incomingImg = null;
  let stageWidth = 0;

  // Live presentation values — always the source of truth for interruption.
  let frameX = 0, frameY = 0, frameScale = 1, frameOpacity = 0, backdropOpacity = 0;

  let openCtrl = null, pageCtrl = null, dismissCtrl = null;
  let dragAxis = null, dragging = false, startX = 0, startY = 0;
  const xTracker = S.VelocityTracker(120);
  const yTracker = S.VelocityTracker(120);

  function buildGallery() {
    const figs = document.querySelectorAll('#work .mosaic figure');
    gallery = Array.from(figs).map((fig, i) => {
      const im = fig.querySelector('img');
      const cap = fig.querySelector('figcaption');
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'Open larger — ' + (im.alt || 'photo'));
      fig.addEventListener('click', () => open(i, fig));
      fig.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, fig); }
      });
      return { src: im.currentSrc || im.src, alt: im.alt, caption: cap ? cap.textContent.trim() : '' };
    });
  }

  function render() {
    frame.style.transform = 'translate(' + frameX + 'px,' + frameY + 'px) scale(' + frameScale + ')';
    frame.style.opacity = String(frameOpacity);
    backdrop.style.opacity = String(backdropOpacity);
    if (incomingImg) {
      const sign = incomingImg.dataset.side === 'next' ? 1 : -1;
      incomingImg.style.transform = 'translateX(' + (sign * stageWidth + frameX) + 'px)';
    }
  }

  function updateCaption() {
    idxEl.textContent = (currentIndex + 1) + ' / ' + gallery.length;
    capEl.textContent = gallery[currentIndex].caption;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === gallery.length - 1;
  }

  function open(index, trigger) {
    if (!gallery.length) return;
    currentIndex = index;
    triggerEl = trigger;
    isOpen = true;
    stageWidth = stage.clientWidth;
    img.src = gallery[index].src;
    img.alt = gallery[index].alt;
    updateCaption();
    lightbox.style.display = 'block';
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';

    frameX = 0; frameY = 0;
    frameScale = 0.92; frameOpacity = 0; backdropOpacity = 0;
    render();

    if (openCtrl) openCtrl.stop();
    openCtrl = S.animateSpring({
      from: 0, to: 1, velocity: 0, damping: 1, response: 0.42,
      onUpdate: (v) => { frameScale = 0.92 + v * 0.08; frameOpacity = v; backdropOpacity = v * 0.96; render(); },
    });

    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  }

  function close(withVelocity) {
    document.removeEventListener('keydown', onKeydown);
    isOpen = false;
    document.documentElement.style.overflow = '';
    lightbox.setAttribute('aria-hidden', 'true');
    if (triggerEl) triggerEl.focus();

    const cleanup = () => { lightbox.style.display = 'none'; };

    if (S.reducedMotion()) { cleanup(); return; }

    if (openCtrl) openCtrl.stop();
    openCtrl = S.animateSpring({
      from: frameOpacity, to: 0,
      velocity: withVelocity || 0,
      damping: withVelocity ? 0.9 : 1, response: 0.32,
      onUpdate: (v) => {
        frameOpacity = v; backdropOpacity = v * 0.96;
        frameScale = 0.92 + v * 0.08;
        render();
      },
      onSettle: cleanup,
    });
  }

  function goTo(newIndex) {
    if (newIndex < 0 || newIndex >= gallery.length || newIndex === currentIndex) return;
    currentIndex = newIndex;
    img.src = gallery[currentIndex].src;
    img.alt = gallery[currentIndex].alt;
    updateCaption();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowRight' && !nextBtn.disabled) { pageTo(1); return; }
    if (e.key === 'ArrowLeft' && !prevBtn.disabled) { pageTo(-1); return; }
    if (e.key === 'Tab') {
      const focusables = lightbox.querySelectorAll('button:not(:disabled)');
      const list = Array.prototype.slice.call(focusables);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Programmatic page (button/keyboard) — same spring path as a flick, just no pointer velocity.
  function pageTo(dir) {
    const target = currentIndex + dir;
    if (target < 0 || target >= gallery.length) return;
    beginIncoming(dir);
    if (pageCtrl) pageCtrl.stop();
    stageWidth = stage.clientWidth;
    pageCtrl = S.animateSpring({
      from: frameX, to: -dir * stageWidth, velocity: 0, damping: 1, response: 0.36,
      onUpdate: (v) => { frameX = v; render(); },
      onSettle: () => finishPage(dir),
    });
  }

  function beginIncoming(dir) {
    const nextIndex = currentIndex + dir;
    if (incomingImg) incomingImg.remove();
    incomingImg = document.createElement('img');
    incomingImg.className = 'lightbox__img';
    incomingImg.src = gallery[nextIndex].src;
    incomingImg.alt = gallery[nextIndex].alt;
    incomingImg.dataset.side = dir > 0 ? 'next' : 'prev';
    incomingImg.style.position = 'absolute';
    incomingImg.draggable = false;
    frame.appendChild(incomingImg);
  }

  function finishPage(dir) {
    currentIndex += dir;
    img.src = gallery[currentIndex].src;
    img.alt = gallery[currentIndex].alt;
    if (incomingImg) { incomingImg.remove(); incomingImg = null; }
    frameX = 0;
    render();
    updateCaption();
  }

  function cancelPage() {
    if (pageCtrl) pageCtrl.stop();
    pageCtrl = S.animateSpring({
      from: frameX, to: 0, velocity: 0, damping: 1, response: 0.32,
      onUpdate: (v) => { frameX = v; render(); },
      onSettle: () => { if (incomingImg) { incomingImg.remove(); incomingImg = null; } },
    });
  }

  // ---- pointer drag: 1:1 tracking, axis lock, rubber-banding, velocity handoff ----

  function onPointerDown(e) {
    if (!isOpen) return;
    if (e.target === closeBtn || e.target === prevBtn || e.target === nextBtn) return;
    dragging = true;
    dragAxis = null;
    startX = e.clientX; startY = e.clientY;
    xTracker.reset(); yTracker.reset();
    xTracker.push(e.clientX, performance.now());
    yTracker.push(e.clientY, performance.now());
    stage.setPointerCapture(e.pointerId);
    // Interrupt: stop whatever's animating and keep the live value as the new baseline.
    if (openCtrl) openCtrl.stop();
    if (pageCtrl) pageCtrl.stop();
    if (dismissCtrl) dismissCtrl.stop();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const now = performance.now();
    xTracker.push(e.clientX, now);
    yTracker.push(e.clientY, now);

    if (!dragAxis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (dragAxis === 'x') stageWidth = stage.clientWidth;
    }

    if (dragAxis === 'x') {
      const atStart = currentIndex === 0 && dx > 0;
      const atEnd = currentIndex === gallery.length - 1 && dx < 0;
      const effective = (atStart || atEnd) ? S.rubberband(dx, stageWidth) : dx;
      if (!incomingImg && !atStart && !atEnd) beginIncoming(dx < 0 ? 1 : -1);
      if ((atStart || atEnd) && incomingImg) { incomingImg.remove(); incomingImg = null; }
      frameX = effective;
      frameY = 0; frameScale = 1; frameOpacity = 1; backdropOpacity = 0.96;
      render();
    } else {
      const effective = dy < 0 ? S.rubberband(dy, 200) : dy;
      frameY = effective;
      frameX = 0;
      const t = Math.min(Math.abs(effective) / 280, 1);
      frameScale = 1 - t * 0.12;
      backdropOpacity = 0.96 * (1 - t * 0.7);
      frameOpacity = 1;
      render();
    }
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const now = performance.now();

    if (dragAxis === 'x') {
      const vx = xTracker.velocity(now);
      const projected = frameX + S.project(vx);
      const dir = frameX < 0 ? 1 : -1;
      const wantsAdvance = Math.abs(projected) > stageWidth * 0.32 || Math.abs(vx) > 550;
      const canAdvance = dir > 0 ? currentIndex < gallery.length - 1 : currentIndex > 0;
      if (wantsAdvance && canAdvance) {
        pageCtrl = S.animateSpring({
          from: frameX, to: -dir * stageWidth, velocity: vx, damping: 0.86, response: 0.36,
          onUpdate: (v) => { frameX = v; render(); },
          onSettle: () => finishPage(dir),
        });
      } else {
        cancelPage();
      }
    } else if (dragAxis === 'y') {
      const vy = yTracker.velocity(now);
      const wantsDismiss = frameY > 120 || vy > 600;
      if (wantsDismiss) {
        close(vy);
      } else {
        dismissCtrl = S.animateSpring({
          from: frameY, to: 0, velocity: vy, damping: 1, response: 0.32,
          onUpdate: (v) => {
            frameY = v;
            const t = Math.min(Math.abs(v) / 280, 1);
            frameScale = 1 - t * 0.12;
            backdropOpacity = 0.96 * (1 - t * 0.7);
            render();
          },
        });
      }
    }
    dragAxis = null;
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildGallery();
    if (!gallery.length) return;

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    closeBtn.addEventListener('click', () => close());
    backdrop.addEventListener('click', () => close());
    prevBtn.addEventListener('click', () => pageTo(-1));
    nextBtn.addEventListener('click', () => pageTo(1));

    window.addEventListener('resize', () => { stageWidth = stage.clientWidth; });
  });
})();
