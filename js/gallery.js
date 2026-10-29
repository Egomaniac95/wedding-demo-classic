/* Galería clásica: OwlCarousel opcional y visor nativo accesible. */
(function () {
  'use strict';

  function initializeGallery() {
    var section = document.getElementById('gallary');
    if (!section) return;
    var carousel = section.querySelector('.owl-carousel-2');
    if (!carousel) return;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var motion = window.CLASSIC_MOTION;
    var toggle = document.getElementById('gallery-autoplay');
    var pausedByVisitor = (!motion && reducedMotion.matches) || Boolean(toggle && toggle.getAttribute('aria-pressed') === 'true');
    var activeIndex = 0;
    var opener = null;
    var pointerStart = null;
    var swipeStart = null;
    var suppressOpenUntil = 0;
    var openedWithKeyboard = true;
    function motionEnabled() { return motion ? motion.enabled : !reducedMotion.matches; }

    function getPictures() {
      var byIndex = new Map();
      carousel.querySelectorAll('.gallery-photo[data-gallery-index]').forEach(function (button) {
        if (button.closest('.cloned')) return;
        var index = Number(button.dataset.galleryIndex);
        var image = button.querySelector('img');
        if (!Number.isInteger(index) || !image || !image.getAttribute('src') || byIndex.has(index)) return;
        byIndex.set(index, {
          index: index,
          button: button,
          src: image.currentSrc || image.src,
          alt: image.alt || 'Fotografía de la galería',
          caption: button.dataset.caption || image.alt || 'Fotografía de la galería'
        });
      });
      return Array.from(byIndex.values()).sort(function (left, right) { return left.index - right.index; });
    }

    function owl(command) {
      if (window.jQuery && window.jQuery.fn.owlCarousel) window.jQuery(carousel).trigger(command);
    }

    var dialog = document.createElement('dialog');
    dialog.className = 'classic-gallery-dialog';
    dialog.id = 'classic-gallery-dialog';
    dialog.setAttribute('aria-label', 'Fotografía ampliada');
    dialog.innerHTML = '<div class="gallery-dialog-shell"><button type="button" class="gallery-dialog-close" aria-label="Cerrar fotografía"><span aria-hidden="true">×</span></button><figure class="gallery-dialog-figure"><img class="gallery-dialog-image" src="" alt=""><figcaption class="gallery-dialog-caption"><span class="gallery-dialog-description"></span><span class="gallery-dialog-count" aria-live="polite"></span></figcaption></figure><div class="gallery-dialog-controls"><button type="button" class="gallery-dialog-prev" aria-label="Fotografía anterior"><span aria-hidden="true">‹</span></button><button type="button" class="gallery-dialog-next" aria-label="Fotografía siguiente"><span aria-hidden="true">›</span></button></div></div>';
    document.body.appendChild(dialog);
    var expandedImage = dialog.querySelector('.gallery-dialog-image');
    var description = dialog.querySelector('.gallery-dialog-description');
    var count = dialog.querySelector('.gallery-dialog-count');
    var previous = dialog.querySelector('.gallery-dialog-prev');
    var next = dialog.querySelector('.gallery-dialog-next');
    var close = dialog.querySelector('.gallery-dialog-close');

    function updateToggle() {
      if (!toggle) return;
      var paused = pausedByVisitor || !motionEnabled();
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Reanudar galería' : 'Pausar galería');
      toggle.disabled = !motionEnabled();
      toggle.title = !motionEnabled() ? 'Activa las animaciones con el control de la página para reproducir la galería.' : '';
      var state = toggle.querySelector('.gallery-play-state');
      if (state) state.textContent = paused ? 'Reanudar galería' : 'Pausar galería';
      else toggle.textContent = paused ? 'Reanudar galería' : 'Pausar galería';
    }

    function resumeIfAllowed() {
      if (dialog.open || pausedByVisitor || !motionEnabled() || document.hidden || (openedWithKeyboard && carousel.contains(document.activeElement))) return;
      owl('play.owl.autoplay');
    }

    function renderPhoto(position) {
      var pictures = getPictures();
      if (!pictures.length) return false;
      activeIndex = (position + pictures.length) % pictures.length;
      var picture = pictures[activeIndex];
      expandedImage.src = picture.src;
      expandedImage.alt = picture.alt;
      description.textContent = picture.caption;
      count.textContent = (activeIndex + 1) + ' de ' + pictures.length;
      if (motionEnabled() && expandedImage.animate) expandedImage.animate([{ opacity: .45, transform: 'translateX(10px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 350, easing: 'ease-out' });
      previous.disabled = pictures.length < 2;
      next.disabled = pictures.length < 2;
      return true;
    }

    function openPhoto(button, keyboard) {
      if (typeof dialog.showModal !== 'function') {
        // Browsers without <dialog> can still open the image in a new tab.
        var fallbackImage = button.querySelector('img');
        if (fallbackImage) window.open(fallbackImage.currentSrc || fallbackImage.src, '_blank', 'noopener');
        return;
      }
      var pictures = getPictures();
      var requested = Number(button.dataset.galleryIndex);
      var position = pictures.findIndex(function (picture) { return picture.index === requested; });
      if (position < 0) return;
      opener = button;
      openedWithKeyboard = keyboard;
      if (!renderPhoto(position)) return;
      owl('stop.owl.autoplay');
      dialog.showModal();
      document.body.classList.add('classic-gallery-open');
      close.focus({ preventScroll: true });
    }

    function dismiss() { if (dialog.open) dialog.close(); }
    function restoreFocus() {
      var target = opener && opener.isConnected && !opener.disabled ? opener : null;
      // An Owl clone may have been removed during its carousel refresh.
      if (!target) {
        var pictures = getPictures();
        target = pictures[activeIndex] ? pictures[activeIndex].button : (pictures[0] && pictures[0].button);
      }
      if (target && target.isConnected) target.focus({ preventScroll: true });
      opener = null;
    }

    section.addEventListener('pointerdown', function (event) {
      var button = event.target.closest('.gallery-photo');
      pointerStart = button ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
    }, { passive: true });
    section.addEventListener('pointerup', function (event) {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12) suppressOpenUntil = Date.now() + 500;
      pointerStart = null;
    }, { passive: true });
    section.addEventListener('pointercancel', function () { pointerStart = null; suppressOpenUntil = Date.now() + 500; }, { passive: true });
    if (window.jQuery && window.jQuery.fn.owlCarousel) {
      window.jQuery(carousel).on('drag.owl.carousel.classicLightbox', function () { suppressOpenUntil = Date.now() + 500; });
      window.jQuery(carousel).on('dragged.owl.carousel.classicLightbox', function () { suppressOpenUntil = Date.now() + 500; });
    }
    section.addEventListener('click', function (event) {
      var button = event.target.closest('.gallery-photo');
      if (!button || !section.contains(button)) return;
      if (Date.now() < suppressOpenUntil || carousel.classList.contains('owl-grab')) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      openPhoto(button, event.detail === 0);
    }, true);

    close.addEventListener('click', dismiss);
    previous.addEventListener('click', function () { renderPhoto(activeIndex - 1); });
    next.addEventListener('click', function () { renderPhoto(activeIndex + 1); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dismiss(); });
    dialog.addEventListener('cancel', function () { /* Native Escape closes the modal. */ });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('classic-gallery-open');
      restoreFocus();
      resumeIfAllowed();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); renderPhoto(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); renderPhoto(activeIndex + 1); }
    });

    expandedImage.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1) { swipeStart = null; return; }
      swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    expandedImage.addEventListener('touchend', function (event) {
      if (!swipeStart || !event.changedTouches.length) return;
      var dx = event.changedTouches[0].clientX - swipeStart.x;
      var dy = event.changedTouches[0].clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
      renderPhoto(activeIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
    expandedImage.addEventListener('touchcancel', function () { swipeStart = null; }, { passive: true });

    if (toggle) toggle.addEventListener('click', function () {
      if (!motionEnabled()) return;
      pausedByVisitor = !pausedByVisitor;
      updateToggle();
      if (pausedByVisitor || !motionEnabled()) owl('stop.owl.autoplay');
      else resumeIfAllowed();
    });
    function motionPreferenceChanged() {
      if (reducedMotion.matches) { pausedByVisitor = true; owl('stop.owl.autoplay'); }
      updateToggle();
      // Removing the preference enables the control, preserving the pause.
      // Only a subsequent visitor action may resume a gallery paused this way.
    }
    if (motion) motion.subscribe(function () {
      updateToggle();
      if (!motionEnabled()) owl('stop.owl.autoplay');
      else resumeIfAllowed();
    });
    else if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionPreferenceChanged);
    else if (reducedMotion.addListener) reducedMotion.addListener(motionPreferenceChanged);
    updateToggle();
    if (pausedByVisitor || !motionEnabled()) owl('stop.owl.autoplay');
    document.addEventListener('visibilitychange', function () { if (document.hidden) owl('stop.owl.autoplay'); else resumeIfAllowed(); });

    window.CLASSIC_GALLERY = { close: dismiss, refresh: getPictures };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeGallery, { once: true });
  else initializeGallery();
})();
