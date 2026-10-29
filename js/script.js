/* Invitación clásica: conserva carruseles, transiciones y reproducción manual. */
(function () {
  'use strict';
  var config = window.WEDDING_DEMO;
  var motion = window.CLASSIC_MOTION;
  var reduceMotion = motion ? !motion.enabled : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var input = document.getElementById('id_invitado');
  var form = document.getElementById('consulta_invitado');
  var loading = document.querySelector('.loading');
  var errorMessage = document.querySelector('.error-message');
  var envelope = document.querySelector('.envelope.paper');
  var guestCard = document.getElementById('prueba');
  var guestSections = document.getElementById('section-to-guests');
  var menuButton = document.querySelector('.hamburger');
  var menu = document.querySelector('.navigation .menu');

  function fadeIn(element, display) {
    element.style.display = display || 'block';
    element.style.opacity = '1';
    if (!reduceMotion && element.animate) element.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 850, easing: 'cubic-bezier(.2,.65,.3,1)' });
  }
  function closeMenu(returnFocus) {
    var wasOpen = menu.classList.contains('active');
    menu.classList.remove('active');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    if (wasOpen && returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', function () {
    var open = !menu.classList.contains('active');
    menu.classList.toggle('active', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  menu.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;
    closeMenu(false);
    if (link.hash && link.hash !== '#' && guestSections.style.display !== 'block') {
      event.preventDefault();
      document.getElementById('invitation_card_container').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      input.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(true); });
  window.addEventListener('scroll', function () { document.querySelector('.navigation').classList.toggle('nav-hide-show', window.scrollY > 0); }, { passive: true });

  // Una sola instancia de jQuery; la invitación sigue funcionando si un CDN falla.
  if (window.jQuery && window.jQuery.fn.owlCarousel) {
    window.jQuery('.owl-carousel-1').owlCarousel({
      loop: true, margin: 0, nav: true, dots: false, items: 1,
      autoplay: !reduceMotion, autoplayTimeout: 9000, autoplayHoverPause: true,
      smartSpeed: reduceMotion ? 0 : 800,
      animateOut: reduceMotion ? false : 'classic-hero-fade-out',
      animateIn: reduceMotion ? false : 'classic-hero-fade-in',
      navText: ['<span aria-label="Foto anterior">‹</span>', '<span aria-label="Foto siguiente">›</span>']
    });
    window.jQuery('.owl-carousel-2').owlCarousel({
      loop: true, margin: 18, autoplay: !reduceMotion, autoplayTimeout: 6500,
      autoplayHoverPause: true, autoplaySpeed: 700, smartSpeed: reduceMotion ? 0 : 600,
      nav: true, dots: true, center: false, autoHeight: false,
      navText: ['<span aria-hidden="true">‹</span>', '<span aria-hidden="true">›</span>'],
      responsive: {
        0: { items: 1, stagePadding: 28, margin: 14 },
        540: { items: 2, stagePadding: 20, margin: 18 },
        900: { items: 3, stagePadding: 24, margin: 20 },
        1400: { items: 4, stagePadding: 24, margin: 22 }
      }
    });
    window.jQuery('.owl-prev').attr('aria-label', 'Foto anterior');
    window.jQuery('.owl-next').attr('aria-label', 'Foto siguiente');
  }
  function updateCarouselMotion() {
    if (!window.jQuery || !window.jQuery.fn.owlCarousel) return;
    var hero = window.jQuery('.owl-carousel-1');
    var gallery = window.jQuery('.owl-carousel-2');
    [hero, gallery].forEach(function (element, index) {
      var instance = element.data && element.data('owl.carousel');
      if (!instance) return;
      var options = { smartSpeed: reduceMotion ? 0 : (index ? 650 : 1000), autoplaySpeed: reduceMotion ? 0 : 750 };
      if (!index) { options.animateOut = reduceMotion ? false : 'classic-hero-fade-out'; options.animateIn = reduceMotion ? false : 'classic-hero-fade-in'; }
      Object.assign(instance.options, options);
      Object.assign(instance.settings, options);
    });
    if (reduceMotion || document.hidden) {
      hero.trigger('stop.owl.autoplay');
      gallery.trigger('stop.owl.autoplay');
    } else hero.trigger('play.owl.autoplay');
  }
  if (motion) motion.subscribe(function (state) { reduceMotion = !state.enabled; updateCarouselMotion(); });
  document.addEventListener('visibilitychange', updateCarouselMotion);
  document.querySelectorAll('[data-wedding-couple]').forEach(function (element) { element.textContent = config.groom + ' & ' + config.bride; });
  var logo = document.querySelector('[data-wedding-logo]');
  logo.textContent = config.groom + ' ';
  var ampersand = document.createElement('span');
  ampersand.className = 'jr';
  ampersand.textContent = '&';
  logo.appendChild(ampersand);
  logo.appendChild(document.createTextNode(' ' + config.bride));
  document.querySelectorAll('[data-wedding-date]').forEach(function (element) { element.textContent = config.displayDate; });
  document.title = 'Nuestra Boda ' + config.groom.charAt(0) + '&' + config.bride.charAt(0) + ' · Muestra';

  // El acceso es una demostración local; nunca consulta datos de otra boda.
  input.addEventListener('input', function () { input.value = input.value.toUpperCase(); input.removeAttribute('aria-invalid'); errorMessage.style.display = 'none'; });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorMessage.style.display = 'none';
    if (input.value.trim().toUpperCase() !== config.code.toUpperCase()) {
      errorMessage.style.display = 'block';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    loading.style.display = 'block';
    window.setTimeout(function () {
      loading.style.display = 'none';
      document.getElementById('VIP-CODE').style.display = 'none';
      guestCard.replaceChildren();
      var heading = document.createElement('h1');
      heading.textContent = '¡ ' + config.guestName + ' !';
      var entries = document.createElement('div');
      entries.className = 'entradas';
      entries.textContent = 'Hemos reservado ' + config.seats + ' lugares para celebrar juntos.';
      var message = document.createElement('div');
      message.className = 'special-message';
      message.textContent = config.greeting;
      var more = document.createElement('a');
      more.className = 'footer';
      more.href = '#about';
      more.textContent = '⌄ MÁS DETALLES ⌄';
      guestCard.append(heading, entries, message, more);
      guestCard.setAttribute('tabindex', '-1');
      fadeIn(envelope);
      fadeIn(guestCard, 'flex');
      fadeIn(guestSections);
      guestCard.focus({ preventScroll: true });
      if (window.jQuery && window.jQuery.fn.owlCarousel) window.jQuery('.owl-carousel-2').trigger('refresh.owl.carousel');
    }, reduceMotion ? 0 : 450);
  });

  var weddingTime = new Date(config.date).getTime();
  var timer;
  function updateCountdown() {
    var remaining = Math.max(0, weddingTime - Date.now());
    var values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach(function (id, index) { document.getElementById(id).textContent = String(values[index]).padStart(2, '0'); });
    if (!remaining && timer) window.clearInterval(timer);
  }
  if (Number.isFinite(weddingTime)) { updateCountdown(); timer = window.setInterval(updateCountdown, 1000); }

  var audio = document.getElementById('my_audio');
  var player = document.querySelector('.player');
  var song = document.getElementById('song');
  var floating = document.createElement('button');
  floating.type = 'button';
  floating.className = 'classic-music-toggle';
  floating.setAttribute('aria-label', 'Reproducir música');
  floating.setAttribute('aria-pressed', 'false');
  floating.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i><span>Música</span>';
  document.body.appendChild(floating);
  audio.src = config.music.src;
  audio.volume = 0.55;
  function setPlaying(playing) {
    player.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    player.setAttribute('aria-pressed', String(playing));
    player.innerHTML = '<i class="fa ' + (playing ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i>';
    floating.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    floating.setAttribute('aria-pressed', String(playing));
    floating.innerHTML = '<i class="fa ' + (playing ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i><span>' + (playing ? 'Pausar' : 'Música') + '</span>';
    song.textContent = (playing ? '♫ ' : 'Ⅱ ') + config.music.title;
    song.style.display = 'block';
  }
  function toggleMusic() {
    if (!audio.paused) { audio.pause(); return; }
    audio.play().catch(function () { song.textContent = 'No se pudo reproducir la música. Revisa el archivo de audio.'; song.style.display = 'block'; });
  }
  player.addEventListener('click', toggleMusic);
  floating.addEventListener('click', toggleMusic);
  audio.addEventListener('play', function () { setPlaying(true); });
  audio.addEventListener('pause', function () { setPlaying(false); });
  audio.addEventListener('error', function () { song.textContent = 'La pista no está disponible.'; song.style.display = 'block'; });

  var query = encodeURIComponent(config.venueQuery);
  document.querySelectorAll('.events iframe').forEach(function (frame) { frame.src = 'https://www.google.com/maps?q=' + query + '&output=embed'; });
  document.querySelectorAll('.btn-ruta').forEach(function (link) { link.href = 'https://www.google.com/maps/dir/?api=1&destination=' + query; });
  var lazy = document.querySelectorAll('img[data-src], iframe[data-src]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.src = entry.target.dataset.src;
        fadeIn(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 100px 0px' });
    lazy.forEach(function (image) { observer.observe(image); });
  } else lazy.forEach(function (image) { image.src = image.dataset.src; });
  function updatePlaceholder() { input.placeholder = window.innerWidth < 600 ? 'Ingrese Código Secreto' : 'Ingrese su código de invitación'; }
  updatePlaceholder();
  window.addEventListener('resize', updatePlaceholder);
})();
