/* Small enhancements to the original layout, without a framework or server. */
(function () {
  'use strict';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motion = window.CLASSIC_MOTION;
  var keyboardInput = false;
  function motionEnabled() { return motion ? motion.enabled : !reducedMotion.matches; }
  document.addEventListener('keydown', function (event) { if (event.key === 'Tab' || event.key.indexOf('Arrow') === 0) keyboardInput = true; }, true);
  document.addEventListener('pointerdown', function () { keyboardInput = false; }, true);
  var navigation = document.querySelector('.navigation');
  var menu = navigation.querySelector('.menu');
  var menuButton = navigation.querySelector('.hamburger');
  var guestSections = document.getElementById('section-to-guests');
  var links = Array.from(menu.querySelectorAll('a'));
  var sections = links.map(function (link) {
    return link.hash && link.hash !== '#' ? document.querySelector(link.hash) : document.querySelector('header');
  });
  var scheduled = false;

  function syncNavigation() {
    scheduled = false;
    var height = navigation.offsetHeight;
    document.documentElement.style.setProperty('--classic-nav-height', height + 'px');
    var limit = document.documentElement.scrollHeight - window.innerHeight;
    navigation.style.setProperty('--page-progress', String(limit > 0 ? Math.max(0, Math.min(1, window.scrollY / limit)) : 0));
    var selected = 0;
    sections.forEach(function (section, index) {
      if (!section || (index > 0 && guestSections.style.display !== 'block')) return;
      if (section.getBoundingClientRect().top <= height + 120) selected = index;
    });
    links.forEach(function (link, index) {
      link.classList.toggle('active', index === selected);
      if (index === selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleNavigation() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(syncNavigation);
  }
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1100) {
      menu.classList.remove('active');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
    }
    scheduleNavigation();
  });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleNavigation).observe(navigation);
  if ('MutationObserver' in window) new MutationObserver(scheduleNavigation).observe(guestSections, { attributes: true, attributeFilter: ['style'] });
  document.addEventListener('click', function (event) {
    if (!menu.classList.contains('active') || navigation.contains(event.target)) return;
    menu.classList.remove('active');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
  });
  syncNavigation();

  // Expose visible photos, including loop clones, once per canonical image.
  var carousel = document.querySelector('.owl-carousel-2');
  function syncGalleryAccess() {
    if (!carousel) return;
    var visiblePictures = new Map();
    carousel.querySelectorAll('.owl-item').forEach(function (slide) {
      slide.setAttribute('aria-hidden', 'true');
      slide.querySelectorAll('.gallery-photo').forEach(function (button) {
        button.tabIndex = -1;
        if (!slide.classList.contains('active')) return;
        var index = button.dataset.galleryIndex;
        if (!visiblePictures.has(index) || !slide.classList.contains('cloned')) visiblePictures.set(index, button);
      });
    });
    visiblePictures.forEach(function (button) {
      button.closest('.owl-item').setAttribute('aria-hidden', 'false');
      button.tabIndex = 0;
    });
    carousel.querySelectorAll('.owl-dot').forEach(function (dot, index) {
      dot.setAttribute('aria-label', 'Ver grupo de fotos ' + (index + 1));
      if (dot.classList.contains('active')) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  if (carousel && window.jQuery && window.jQuery.fn.owlCarousel) {
    window.jQuery(carousel).on('translated.owl.carousel refreshed.owl.carousel', syncGalleryAccess);
    carousel.addEventListener('focusin', function () { if (keyboardInput) window.jQuery(carousel).trigger('stop.owl.autoplay'); });
    carousel.addEventListener('focusout', function (event) {
      var toggle = document.getElementById('gallery-autoplay');
      var dialog = document.getElementById('classic-gallery-dialog');
      if (carousel.contains(event.relatedTarget) || (dialog && dialog.open) || !motionEnabled() || document.hidden || (toggle && toggle.getAttribute('aria-pressed') === 'true')) return;
      window.jQuery(carousel).trigger('play.owl.autoplay');
    });
    syncGalleryAccess();
  }

  // Effects are temporary animations, never permanent opacity:0 content.
  var revealElements = Array.from(document.querySelectorAll('#section-to-guests .headings, #about .box, #about .box2, .phrase-container, .mein-event .events, #story .story-row, #regalos .box-regalos, #family .familys'));
  var played = new WeakSet();
  var lastPlayed = new WeakMap();
  var activeAnimations = new Set();
  var pendingNavigationTarget = null;
  var navigationReplayTimer = null;
  function playElement(element, order) {
    if (!motionEnabled() || document.hidden || !element.animate) return;
    if (Date.now() - (lastPlayed.get(element) || 0) < 900) return;
    lastPlayed.set(element, Date.now());
    played.add(element);
    var from = element.matches('.box2, .events, .familys') ? 'translateY(30px) scale(.985)' : 'translateY(22px)';
    var animation = element.animate([{ opacity: .15, transform: from }, { opacity: 1, transform: 'translateY(0) scale(1)' }], {
      duration: 850, delay: Math.min(order || 0, 4) * 85, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards'
    });
    activeAnimations.add(animation);
    animation.onfinish = animation.oncancel = function () { activeAnimations.delete(animation); };
  }
  function isVisible(element) {
    var bounds = element.getBoundingClientRect();
    return bounds.height > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight;
  }
  function playVisible() { revealElements.filter(isVisible).forEach(playElement); }
  function playWithin(target) {
    revealElements.filter(function (element) { return element === target || target.contains(element); }).slice(0, 7).forEach(playElement);
  }
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      var order = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || played.has(entry.target) || !motionEnabled()) return;
        playElement(entry.target, order++);
      });
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach(function (element) { observer.observe(element); });
  }
  function replayNavigation() {
    if (navigationReplayTimer) window.clearTimeout(navigationReplayTimer);
    navigationReplayTimer = window.setTimeout(function () {
      if (pendingNavigationTarget) playWithin(pendingNavigationTarget);
      pendingNavigationTarget = null;
      navigationReplayTimer = null;
    }, 220);
  }
  menu.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link || !link.hash || link.hash === '#' || guestSections.style.display !== 'block') return;
    pendingNavigationTarget = document.querySelector(link.hash);
    if (pendingNavigationTarget) replayNavigation();
  });
  window.addEventListener('scroll', function () { if (pendingNavigationTarget) replayNavigation(); }, { passive: true });
  function motionChanged() {
    if (motionEnabled()) playVisible();
    else { activeAnimations.forEach(function (animation) { animation.cancel(); }); activeAnimations.clear(); }
  }
  if (motion) motion.subscribe(motionChanged);
  else if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChanged);
  if (carousel && window.jQuery && window.jQuery.fn.owlCarousel) {
    window.jQuery(carousel).on('translated.owl.carousel.classicMotion', function () {
      if (!motionEnabled()) return;
      carousel.querySelectorAll('.owl-item.active .gallery-photo').forEach(function (photo, index) { playElement(photo, index); });
    });
  }
})();
