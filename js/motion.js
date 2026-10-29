/* One visitor-controlled motion preference, shared by every visual effect. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var storageKey = 'wedding-classic-motion';
  var mode = 'auto';
  var listeners = new Set();
  var toggle;
  var reset;
  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored === 'on' || stored === 'off') mode = stored;
  } catch (error) { /* The preference still works when browser storage is blocked. */ }

  function enabled() { return mode === 'on' || (mode === 'auto' && !preference.matches); }
  function snapshot() { return { enabled: enabled(), mode: mode, systemReduced: preference.matches }; }
  function sync() {
    var state = snapshot();
    document.documentElement.dataset.classicMotion = state.enabled ? 'on' : 'off';
    document.documentElement.dataset.classicMotionMode = state.mode;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(state.enabled));
      toggle.setAttribute('aria-label', state.enabled ? 'Pausar animaciones' : 'Activar animaciones');
      toggle.querySelector('span').textContent = state.enabled ? 'Animaciones activadas' : 'Activar animaciones';
      toggle.title = state.mode === 'auto' ? 'Se respeta la preferencia de movimiento de tu dispositivo.' : 'Elección guardada solo en este navegador.';
      reset.hidden = state.mode === 'auto';
    }
    listeners.forEach(function (listener) { listener(state); });
    window.dispatchEvent(new CustomEvent('classicmotionchange', { detail: state }));
  }
  function store() {
    try {
      if (mode === 'auto') window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, mode);
    } catch (error) { /* Browser-local persistence is optional. */ }
  }
  window.CLASSIC_MOTION = {
    get enabled() { return enabled(); },
    get mode() { return mode; },
    get systemReduced() { return preference.matches; },
    setEnabled: function (value) { mode = value ? 'on' : 'off'; store(); sync(); },
    useSystem: function () { mode = 'auto'; store(); sync(); },
    subscribe: function (listener) {
      if (typeof listener !== 'function') return function () {};
      listeners.add(listener);
      listener(snapshot());
      return function () { listeners.delete(listener); };
    }
  };
  function mount() {
    if (document.getElementById('classic-motion-toggle')) return;
    var controls = document.createElement('div');
    controls.className = 'classic-motion-controls';
    controls.innerHTML = '<button type="button" id="classic-motion-toggle" class="classic-motion-toggle" aria-pressed="false"><i class="fa fa-magic" aria-hidden="true"></i><span>Activar animaciones</span></button><button type="button" id="classic-motion-reset" class="classic-motion-reset" hidden>Usar ajuste del dispositivo</button>';
    document.body.appendChild(controls);
    toggle = controls.querySelector('#classic-motion-toggle');
    reset = controls.querySelector('#classic-motion-reset');
    toggle.addEventListener('click', function () { window.CLASSIC_MOTION.setEnabled(!enabled()); });
    reset.addEventListener('click', window.CLASSIC_MOTION.useSystem);
    sync();
  }
  function systemChanged() { sync(); }
  if (preference.addEventListener) preference.addEventListener('change', systemChanged);
  else if (preference.addListener) preference.addListener(systemChanged);
  sync();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
