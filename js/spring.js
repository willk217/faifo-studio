/* Vanilla spring physics — Apple's damping/response model, no dependencies.
   damping: 1.0 = critically damped (no overshoot). <1.0 = bouncier.
   response: seconds to reach target — not a fixed duration, the settle time emerges from the physics. */
(function (global) {
  'use strict';

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function Spring(damping, response) {
    damping = damping == null ? 1 : damping;
    response = response == null ? 0.4 : response;
    const omega = (2 * Math.PI) / response;
    this.k = omega * omega;           // stiffness (mass = 1)
    this.c = 2 * damping * omega;     // damping coefficient
  }

  // Runs a spring from `from` to `to`, starting at `velocity` (units/second), calling onUpdate(value, velocity) every frame.
  // Returns a controller: { retarget(to, opts), stop(), value(), velocity() }.
  function animateSpring(opts) {
    const spring = new Spring(opts.damping, opts.response);
    let value = opts.from;
    let velocity = opts.velocity || 0;
    let target = opts.to;
    const onUpdate = opts.onUpdate || function () {};
    const onSettle = opts.onSettle || function () {};
    const precision = opts.precision || 0.01;
    let raf = null;
    let last = null;

    if (reducedMotion() && !opts.ignoreReducedMotion) {
      value = target;
      onUpdate(value, 0);
      onSettle(value);
      return { retarget() {}, stop() {}, value: () => value, velocity: () => 0 };
    }

    function step(now) {
      if (last === null) last = now;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.064) dt = 0.064; // clamp huge frame gaps (tab switches etc.)

      // semi-implicit Euler, substepped for stability
      const substeps = 4;
      const sdt = dt / substeps;
      for (let i = 0; i < substeps; i++) {
        const accel = -spring.k * (value - target) - spring.c * velocity;
        velocity += accel * sdt;
        value += velocity * sdt;
      }

      onUpdate(value, velocity);

      const settled = Math.abs(value - target) < precision && Math.abs(velocity) < precision;
      if (settled) {
        value = target;
        velocity = 0;
        onUpdate(value, velocity);
        onSettle(value);
        raf = null;
        return;
      }
      raf = requestAnimationFrame(step);
    }

    function start() {
      last = null;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    }
    start();

    return {
      // Re-target mid-flight from the CURRENT presentation value/velocity — this is the whole point of springs.
      retarget(newTarget, newOpts) {
        target = newTarget;
        if (newOpts && typeof newOpts.damping === 'number') spring.k = (function () {
          const omega = (2 * Math.PI) / (newOpts.response || opts.response || 0.4);
          spring.c = 2 * newOpts.damping * omega;
          return omega * omega;
        })();
        if (newOpts && typeof newOpts.velocity === 'number') velocity = newOpts.velocity;
        if (!raf) start();
      },
      stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      value: () => value,
      velocity: () => velocity,
    };
  }

  // Apple's momentum projection (Designing Fluid Interfaces, WWDC18): where a flick would coast to a stop.
  function project(velocityPxPerSec, decelerationRate) {
    decelerationRate = decelerationRate == null ? 0.998 : decelerationRate;
    return (velocityPxPerSec / 1000) * decelerationRate / (1 - decelerationRate);
  }

  // Progressive resistance past a boundary — real things slow before they stop.
  function rubberband(overshoot, dimension, constant) {
    constant = constant == null ? 0.55 : constant;
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  }

  // Tracks recent pointer samples to compute release velocity (px/s) from the last ~100ms, not just the last delta.
  function VelocityTracker(windowMs) {
    windowMs = windowMs || 100;
    let samples = [];
    return {
      push(value, timeMs) {
        samples.push({ value, t: timeMs });
        const cutoff = timeMs - windowMs;
        while (samples.length > 1 && samples[0].t < cutoff) samples.shift();
      },
      velocity(nowMs) {
        if (samples.length < 2) return 0;
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (dt <= 0) return 0;
        return (last.value - first.value) / dt;
      },
      reset() { samples = []; },
    };
  }

  global.FaifoSpring = { animateSpring, project, rubberband, VelocityTracker, reducedMotion };
})(window);
