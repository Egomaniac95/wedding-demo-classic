/* Visible, lightweight floating particles. No duplicate particles.js loop. */
(function () {
  'use strict';
  function initializeParticles() {
    var host = document.getElementById('particles-js');
    if (!host) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'particles-js-canvas-el classic-particles-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var context = canvas.getContext('2d');
    if (!context) return;
    var motion = window.CLASSIC_MOTION;
    var enabled = motion ? motion.enabled : !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true;
    var width = 1;
    var height = 1;
    var particles = [];
    var frame = null;
    var previousTime = null;
    var colors = ['#cc772c', '#c4a05c', '#8c445b'];

    function createParticle() {
      return { x: Math.random() * width, y: Math.random() * height, radius: 1.2 + Math.random() * 2.1, speed: 12 + Math.random() * 24, drift: (Math.random() - .5) * 10, alpha: .3 + Math.random() * .4, color: colors[Math.floor(Math.random() * colors.length)] };
    }
    function draw() {
      context.clearRect(0, 0, width, height);
      particles.forEach(function (particle) {
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
    }
    function stop() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    }
    function canMove() { return enabled && visible && !document.hidden; }
    function tick(time) {
      frame = null;
      if (!canMove()) { previousTime = null; return; }
      var delta = previousTime === null ? 1 / 60 : Math.min((time - previousTime) / 1000, .05);
      previousTime = time;
      particles.forEach(function (particle) {
        particle.y -= particle.speed * delta;
        particle.x += particle.drift * delta;
        if (particle.y < -8) { particle.y = height + 8; particle.x = Math.random() * width; }
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
      });
      draw();
      frame = window.requestAnimationFrame(tick);
    }
    function update() {
      if (canMove()) { if (frame === null) frame = window.requestAnimationFrame(tick); }
      else { stop(); draw(); }
    }
    function resize() {
      var bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width || host.clientWidth || window.innerWidth);
      height = Math.max(1, bounds.height || host.clientHeight || 580);
      var ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      var desired = window.innerWidth < 768 ? 70 : 150;
      particles = Array.from({ length: desired }, createParticle);
      draw();
      update();
    }
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }, { rootMargin: '100px' }).observe(host);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    if (motion) motion.subscribe(function (state) { enabled = state.enabled; update(); });
    window.CLASSIC_PARTICLES = {
      get running() { return frame !== null; },
      get count() { return particles.length; },
      get positions() { return particles.map(function (particle) { return { x: particle.x, y: particle.y }; }); },
      refresh: resize
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeParticles, { once: true });
  else initializeParticles();
})();
