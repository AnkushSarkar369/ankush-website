/* main.js — no framework. Four small jobs:
   1. Gate display-font text visibility until fonts are ready (no FOUT).
   2. One orchestrated entrance reveal, staggered, reduced-motion-safe.
   3. Mark the nav link for the section currently in view.
   4. Theme toggle: switch light/dark, persist the choice, default to the
      system preference. The effective theme is resolved before paint
      (inline <head> script) so there is no flash; this wires the control.
   ========================================================================= */
(function () {
  'use strict';
  var docEl = document.documentElement;

  /* ---------- 1. Fonts: hold display text at opacity:0 until ready, then fade -------------- */
  docEl.classList.add('fonts-pending');

  function revealFonts() {
    docEl.classList.remove('fonts-pending');
    docEl.classList.add('fonts-ready');
  }
  // Kick the font load explicitly for the critical faces.
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('400 1em "Newsreader"'),
      document.fonts.load('500 1em "Newsreader"'),
      document.fonts.load('400 1em "Hanken Grotesk"'),
      document.fonts.load('500 1em "Hanken Grotesk"')
    ]).then(document.fonts.ready).then(revealFonts).catch(revealFonts);
  }
  // Safety: never leave text permanently hidden if the font fails.
  window.setTimeout(revealFonts, 2500);

  /* ---------- 2. Entrance reveal (staggered, reduced-motion-aware) -------------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.revealDelay ? parseInt(el.dataset.revealDelay, 10) : 0;
          window.setTimeout(function () {
            el.style.transition =
              'opacity var(--dur-entry) var(--ease-out-soft), transform var(--dur-entry) var(--ease-out-soft)';
            el.style.opacity = '1';
            el.style.transform = 'none';
          }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Active nav link by section in view -------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-nav-target]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if (sections.length && links.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('data-nav-target');
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + id) {
              a.setAttribute('aria-current', 'page');
            } else {
              a.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- 4. Theme toggle ------------------------------------ */
  var STORAGE_KEY = 'theme';
  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    // Control is only usable once JS is running; remove the no-js guard.
    toggle.classList.remove('no-js-hidden');

    function currentTheme() {
      var t = docEl.getAttribute('data-theme');
      return t === 'dark' ? 'dark' : 'light';
    }
    function syncPressed() {
      toggle.setAttribute('aria-pressed', currentTheme() === 'dark' ? 'true' : 'false');
      toggle.setAttribute('aria-label', currentTheme() === 'dark'
        ? 'Switch to light theme'
        : 'Switch to dark theme');
    }
    syncPressed();

    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      docEl.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
      syncPressed();
    });
  }

  /* ---------- 5. Shared expansion utility -------------- */
function setExpanded(element, open, contentId, focusTarget) {
  // Determine which data attribute to use
  var dataAttr;
  if (element.hasAttribute('data-section-open')) {
    dataAttr = 'data-section-open';
  } else if (element.hasAttribute('data-subsection-open')) {
    dataAttr = 'data-subsection-open';
  } else {
    dataAttr = 'data-open';
  }
  element.setAttribute(dataAttr, open ? 'true' : 'false');
  
  var trigger = element.querySelector('[aria-expanded]');
  var content = contentId ? document.getElementById(contentId) : element.querySelector('[hidden]');
  
  if (trigger) {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  
  if (content) {
    content.hidden = !open;
    if (open && focusTarget) {
      content.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (!open && focusTarget && trigger) {
      trigger.focus();
    }
  }
}

/* Section and subsection expansion */
function initExpansion() {
  // Section-level expansion (Creation and Technology)
  var sections = Array.prototype.slice.call(document.querySelectorAll('.section[data-section-open]'));
  sections.forEach(function (section) {
    var trigger = section.querySelector('.section__trigger');
    if (!trigger) return;
    var contentId = trigger.getAttribute('aria-controls');
    
    trigger.addEventListener('click', function () {
      var isOpen = section.getAttribute('data-section-open') === 'true';
      setExpanded(section, !isOpen, contentId, true);
    });
    
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var isOpen = section.getAttribute('data-section-open') === 'true';
        setExpanded(section, !isOpen, contentId, true);
      }
    });
  });

  // Subsection-level expansion (Creation categories and Technology categories)
  var subsections = Array.prototype.slice.call(document.querySelectorAll('[data-subsection-open]'));
  subsections.forEach(function (subsection) {
    var trigger = subsection.querySelector('.subsection__trigger');
    if (!trigger) return;
    var contentId = trigger.getAttribute('aria-controls');
    
    trigger.addEventListener('click', function () {
      var isOpen = subsection.getAttribute('data-subsection-open') === 'true';
      setExpanded(subsection, !isOpen, contentId, true);
    });
    
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var isOpen = subsection.getAttribute('data-subsection-open') === 'true';
        setExpanded(subsection, !isOpen, contentId, true);
      }
    });
  });
}

// Initialize expansion after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExpansion);
} else {
  initExpansion();
}
})();
