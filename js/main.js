/* main.js — no framework. Five small jobs:
   1. Gate display-font text visibility until fonts are ready (no FOUT).
   2. One orchestrated entrance reveal, staggered, reduced-motion-safe.
   3. Mark the nav link for the section currently in view.
   4. Theme toggle: switch light/dark, persist the choice, default to the
      system preference. The effective theme is resolved before paint
      (inline <head> script) so there is no flash; this wires the control.
   5. Wire the existing subsection disclosure controls.
   ========================================================================= */
(function () {
  'use strict';
  var docEl = document.documentElement;

  /* ---------- 1. Fonts: hold display-font text visibility until ready ---------- */
  docEl.classList.add('fonts-pending');

  function revealFonts() {
    docEl.classList.remove('fonts-pending');
    docEl.classList.add('fonts-ready');
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('400 1em "Newsreader"'),
      document.fonts.load('500 1em "Newsreader"'),
      document.fonts.load('400 1em "Hanken Grotesk"'),
      document.fonts.load('500 1em "Hanken Grotesk"')
    ]).then(revealFonts).catch(revealFonts);
  }
  window.setTimeout(revealFonts, 2500);

  /* ---------- 2. Entrance reveal ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = el.dataset.revealDelay ? parseInt(el.dataset.revealDelay, 10) : 0;
        window.setTimeout(function () {
          el.style.transition =
            'opacity var(--dur-entry) var(--ease-out-soft), transform var(--dur-entry) var(--ease-out-soft)';
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Active nav link by section in view ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-nav-target]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if (sections.length && links.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-nav-target');
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + id) {
            a.setAttribute('aria-current', 'page');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (section) { navIO.observe(section); });
  }

  /* ---------- 4. Theme toggle ---------- */
  var STORAGE_KEY = 'theme';
  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.classList.remove('no-js-hidden');

    function currentTheme() {
      return docEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function syncPressed() {
      var dark = currentTheme() === 'dark';
      toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    syncPressed();
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      docEl.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
      syncPressed();
    });
  }

  /* ---------- 5. Subsection disclosure ---------- */
  function setExpanded(element, open) {
    var trigger = element.querySelector('.subsection__trigger');
    var contentId = trigger && trigger.getAttribute('aria-controls');
    var content = contentId ? document.getElementById(contentId) : null;

    element.setAttribute('data-subsection-open', open ? 'true' : 'false');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (content) {
      if (open) {
        content.removeAttribute('hidden');
        // Force reflow to ensure transition runs
        content.offsetHeight;
        content.classList.add('is-expanded');
      } else {
        content.classList.remove('is-expanded');
        // Set hidden after transition for accessibility
        // Use opacity transitionend as the primary indicator since grid-template-rows may not fire reliably
        var onTransitionEnd = function(e) {
          if (e.propertyName === 'opacity' || e.propertyName === 'grid-template-rows') {
            content.setAttribute('hidden', '');
            content.removeEventListener('transitionend', onTransitionEnd);
          }
        };
        content.addEventListener('transitionend', onTransitionEnd);
        // Fallback timeout in case transitionend doesn't fire
        setTimeout(function() {
          content.setAttribute('hidden', '');
          content.removeEventListener('transitionend', onTransitionEnd);
        }, 500);
      }
    }
  }

  function bindDisclosure(element) {
    var trigger = element.querySelector('.subsection__trigger');
    if (!trigger) return;

    function toggleDisclosure() {
      var open = element.getAttribute('data-subsection-open') === 'true';
      setExpanded(element, !open);
    }

    trigger.addEventListener('click', toggleDisclosure);

    var header = trigger.closest('.creation-category__head, .technology-category__head');
    if (header) {
      header.addEventListener('click', function (event) {
        if (event.target.closest('button')) return;
        toggleDisclosure();
      });
    }
  }

  function removeRedundantSectionControls() {
    document.querySelectorAll('.section[data-section-open]').forEach(function (section) {
      var trigger = section.querySelector(':scope > .container > .section__head .section__trigger');
      if (trigger) {
        var heading = trigger.parentElement;
        trigger.replaceWith(document.createTextNode(trigger.textContent.trim()));
        if (heading) heading.normalize();
      }

      var state = section.querySelector(':scope > .container > .section__head .section__state');
      if (state) state.remove();

      section.removeAttribute('data-section-open');
    });
  }

  function ensureThresholds() {
    var ids = ['about', 'creation', 'technology'];
    ids.forEach(function (id) {
      var section = document.getElementById(id);
      if (!section || !section.parentNode) return;
      var next = section.nextElementSibling;
      if (next && next.classList.contains('threshold')) return;

      var threshold = document.createElement('div');
      threshold.className = 'threshold threshold__glyph';
      threshold.setAttribute('aria-hidden', 'true');
      threshold.textContent = '· · ·';
      section.parentNode.insertBefore(threshold, section.nextSibling);
    });
  }

  function initExpansion() {
    removeRedundantSectionControls();

    Array.prototype.slice.call(document.querySelectorAll('[data-subsection-open]')).forEach(function (subsection) {
      bindDisclosure(subsection);
      // Initialize to match HTML initial state (open = true based on data-subsection-open="true")
      var trigger = subsection.querySelector('.subsection__trigger');
      var contentId = trigger && trigger.getAttribute('aria-controls');
      var content = contentId ? document.getElementById(contentId) : null;
      var initiallyOpen = subsection.getAttribute('data-subsection-open') === 'true';
      
      if (trigger) trigger.setAttribute('aria-expanded', initiallyOpen ? 'true' : 'false');
      if (content) {
        if (initiallyOpen) {
          content.removeAttribute('hidden');
          content.classList.add('is-expanded');
        } else {
          content.setAttribute('hidden', '');
          content.classList.remove('is-expanded');
        }
      }
    });

    ensureThresholds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExpansion);
  } else {
    initExpansion();
  }

  /* ---------- 6. Support section: UPI QR modal ---------- */
  var showQrBtn = document.getElementById('show-qr-btn');
  var qrModal = document.getElementById('upi-qr-modal');
  var qrModalClose = qrModal ? qrModal.querySelector('.modal__close') : null;
  var qrModalOverlay = qrModal ? qrModal.querySelector('.modal__overlay') : null;
  var qrContainer = document.getElementById('upi-qr-code');

  // UPI deep link for QR code
  var upiDeepLink = 'upi://pay?pa=ankushisonline369%40okhdfcbank&pn=Ankush+Sarkar&tn=Thank+You%21&cu=INR';

  function generateQrCode() {
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    // Use a simple QR code service (Google Charts API alternative or inline generation)
    // We'll use a lightweight approach: create an image with a QR code service
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(upiDeepLink);
    var img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'UPI QR Code for ankushisonline369@okhdfcbank';
    img.width = 200;
    img.height = 200;
    qrContainer.appendChild(img);
  }

  function openQrModal() {
    if (!qrModal) return;
    qrModal.hidden = false;
    showQrBtn.setAttribute('aria-expanded', 'true');
    generateQrCode();
    // Trap focus
    qrModalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeQrModal() {
    if (!qrModal) return;
    qrModal.hidden = true;
    showQrBtn.setAttribute('aria-expanded', 'false');
    showQrBtn.focus();
    document.body.style.overflow = '';
  }

  if (showQrBtn) {
    showQrBtn.addEventListener('click', openQrModal);
  }

  if (qrModalClose) {
    qrModalClose.addEventListener('click', closeQrModal);
  }

  if (qrModalOverlay) {
    qrModalOverlay.addEventListener('click', closeQrModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && qrModal && !qrModal.hidden) {
      closeQrModal();
    }
  });
})();
