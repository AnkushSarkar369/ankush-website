/* main.js — no framework. Four small jobs:
   1. Gate display-font text visibility until fonts are ready (no FOUT).
   2. One orchestrated entrance reveal, staggered, reduced-motion-safe.
   3. Mark the nav link for the section currently in view.
   4. Wire the existing subsection disclosure controls.
   ========================================================================= */
(function () {
  'use strict';

  var docEl = document.documentElement;

  /* Shared disclosure animation machinery. */
  var DisclosureAnimation = window.DisclosureAnimation = {
    begin: function (el) {
      if (el._animationTransitionHandler) {
        el.removeEventListener('transitionend', el._animationTransitionHandler);
        el._animationTransitionHandler = null;
      }
      if (el._animationFallbackTimer) {
        window.clearTimeout(el._animationFallbackTimer);
        el._animationFallbackTimer = null;
      }
      el._animationToken = (el._animationToken || 0) + 1;
      return el._animationToken;
    },

    reducedMotion: function () {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    expand: function (el, reducedMotion) {
      var token = this.begin(el);
      el.hidden = false;

      if (reducedMotion) {
        el.style.maxHeight = 'none';
        el.classList.add('is-expanded');
        return;
      }

      el.style.maxHeight = '0px';
      el.offsetHeight;
      var target = el.scrollHeight;
      el.style.maxHeight = target + 'px';
      el.classList.add('is-expanded');

      var onEnd = function (e) {
        if (token !== el._animationToken || e.target !== el || e.propertyName !== 'max-height') return;
        el.style.maxHeight = 'none';
        el._animationTransitionHandler = null;
        el.removeEventListener('transitionend', onEnd);
      };

      el._animationTransitionHandler = onEnd;
      el.addEventListener('transitionend', onEnd);
    },

    collapse: function (el, reducedMotion) {
      var token = this.begin(el);

      if (reducedMotion) {
        el.style.maxHeight = '';
        el.classList.remove('is-expanded');
        el.hidden = true;
        return;
      }

      var current = el.scrollHeight;
      el.style.maxHeight = current + 'px';
      el.offsetHeight;
      el.classList.remove('is-expanded');
      el.style.maxHeight = '0px';

      var onEnd = function (e) {
        if (token !== el._animationToken || e.target !== el || e.propertyName !== 'max-height') return;
        el.hidden = true;
        el.style.maxHeight = '';
        el._animationTransitionHandler = null;
        el.removeEventListener('transitionend', onEnd);

        if (el._animationFallbackTimer) {
          window.clearTimeout(el._animationFallbackTimer);
          el._animationFallbackTimer = null;
        }
      };

      el._animationTransitionHandler = onEnd;
      el.addEventListener('transitionend', onEnd);
      el._animationFallbackTimer = window.setTimeout(function () {
        if (token !== el._animationToken || el.hidden) return;
        el.hidden = true;
        el.style.maxHeight = '';

        if (el._animationTransitionHandler === onEnd) {
          el._animationTransitionHandler = null;
          el.removeEventListener('transitionend', onEnd);
        }

        el._animationFallbackTimer = null;
      }, 400);
    },

    flip: function (card, mutate) {
      var reducedMotion = this.reducedMotion();
      if (reducedMotion) {
        mutate();
        return;
      }

      if (card._flipTransitionHandler) {
        card.removeEventListener('transitionend', card._flipTransitionHandler);
        card._flipTransitionHandler = null;
      }
      if (card._flipFrame) {
        window.cancelAnimationFrame(card._flipFrame);
        card._flipFrame = null;
      }

      card._flipToken = (card._flipToken || 0) + 1;
      var token = card._flipToken;
      var first = card.getBoundingClientRect();
      mutate();
      var last = card.getBoundingClientRect();
      var dx = first.left - last.left;
      var dy = first.top - last.top;
      if (!dx && !dy) return;

      card.style.transition = 'none';
      card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      card.offsetHeight;
      card._flipFrame = requestAnimationFrame(function () {
        card._flipFrame = null;
        if (token !== card._flipToken) return;

        card.style.transition = 'transform var(--dur-trans) var(--ease-out-soft)';
        card.style.transform = '';

        var onEnd = function (e) {
          if (token !== card._flipToken || e.target !== card || e.propertyName !== 'transform') return;
          card.style.transition = '';
          card._flipTransitionHandler = null;
          card.removeEventListener('transitionend', onEnd);
        };

        card._flipTransitionHandler = onEnd;
        card.addEventListener('transitionend', onEnd);
      });
    }
  };

  docEl.classList.add('fonts-pending');

  function revealFonts() {
    docEl.classList.remove('fonts-pending');
    docEl.classList.add('fonts-ready');
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('300 1em "Newsreader"'),
      document.fonts.load('400 1em "Newsreader"'),
      document.fonts.load('500 1em "Newsreader"'),
      document.fonts.load('400 1em "Hanken Grotesk"'),
      document.fonts.load('500 1em "Hanken Grotesk"'),
      document.fonts.load('600 1em "Hanken Grotesk"')
    ]).then(revealFonts).catch(revealFonts);
  }

  window.setTimeout(revealFonts, 2500);

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
          el.style.transition = 'opacity var(--dur-entry) var(--ease-out-soft), transform var(--dur-entry) var(--ease-out-soft)';
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);
        io.unobserve(el);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-nav-target]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));

  if (sections.length && links.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-nav-target');
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(function (section) {
      navIO.observe(section);
    });
  }

  function setExpanded(element, open) {
    var trigger = element.querySelector('.subsection__trigger');
    var contentId = trigger && trigger.getAttribute('aria-controls');
    var content = contentId ? document.getElementById(contentId) : null;
    element.setAttribute('data-subsection-open', open ? 'true' : 'false');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!content) return;

    var reducedMotion = DisclosureAnimation.reducedMotion();
    if (open) DisclosureAnimation.expand(content, reducedMotion);
    else DisclosureAnimation.collapse(content, reducedMotion);
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

  function ensureSubsectionLabel(element) {
    var labelId = element.getAttribute('aria-labelledby');
    if (!labelId || document.getElementById(labelId)) return;

    var heading = element.querySelector(':scope > .creation-category__head h3, :scope > .technology-category__head h3');
    if (heading) heading.id = labelId;
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
    ['about', 'creation', 'technology'].forEach(function (id) {
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
      ensureSubsectionLabel(subsection);
      var trigger = subsection.querySelector('.subsection__trigger');
      var contentId = trigger && trigger.getAttribute('aria-controls');
      var content = contentId ? document.getElementById(contentId) : null;
      subsection.setAttribute('data-subsection-open', 'false');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (content) {
        content.hidden = true;
        content.classList.remove('is-expanded');
      }
    });
    ensureThresholds();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initExpansion);
  else initExpansion();

  var showQrBtn = document.getElementById('show-qr-btn');
  var qrModal = document.getElementById('upi-qr-modal');
  var qrModalClose = qrModal ? qrModal.querySelector('.modal__close') : null;
  var qrModalOverlay = qrModal ? qrModal.querySelector('.modal__overlay') : null;
  var qrContainer = document.getElementById('upi-qr-code');
  var upiDeepLink = 'upi://pay?pa=ankushisonline369%40okhdfcbank&pn=Ankush+Sarkar&tn=Thank+You%21&cu=INR';
  var qrModalPreviousFocus = null;

  function generateQrCode() {
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(upiDeepLink);
    var img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'UPI QR Code for ankushisonline369@okhdfcbank';
    img.width = 200;
    img.height = 200;
    qrContainer.appendChild(img);
  }

  function getModalFocusableElements() {
    if (!qrModal) return [];
    return Array.prototype.slice.call(qrModal.querySelectorAll(
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) {
      return element.getClientRects().length > 0;
    });
  }

  function trapQrModalFocus(event) {
    if (event.key !== 'Tab' || !qrModal || qrModal.hidden) return;

    var focusable = getModalFocusableElements();
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openQrModal() {
    if (!qrModal) return;
    qrModalPreviousFocus = document.activeElement;
    qrModal.hidden = false;
    showQrBtn.setAttribute('aria-expanded', 'true');
    generateQrCode();
    qrModalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeQrModal() {
    if (!qrModal) return;
    qrModal.hidden = true;
    showQrBtn.setAttribute('aria-expanded', 'false');
    var restoreTarget = qrModalPreviousFocus && typeof qrModalPreviousFocus.focus === 'function'
      ? qrModalPreviousFocus
      : showQrBtn;
    qrModalPreviousFocus = null;
    restoreTarget.focus();
    document.body.style.overflow = '';
  }

  if (showQrBtn) showQrBtn.addEventListener('click', openQrModal);
  if (qrModalClose) qrModalClose.addEventListener('click', closeQrModal);
  if (qrModalOverlay) qrModalOverlay.addEventListener('click', closeQrModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && qrModal && !qrModal.hidden) closeQrModal();
    else trapQrModalFocus(e);
  });

  function initInternalDisclosureLinks() {
    /* Collect every collapsible ancestor of a target, innermost first, as
       { trigger, body } pairs, expanding outward: card body, then the
       subsection content that contains it. Both layers use the same
       max-height disclosure animation, and either (or both) may be
       collapsed when a footnote link is clicked. */
    function getDisclosureAncestors(target) {
      var layers = [];
      var node = target;

      while (node) {
        var card = node.closest ? node.closest('.creation-card, .technology-card') : null;
        if (card) {
          var cardTrigger = card.querySelector('.creation-card__trigger, .technology-card__trigger');
          var cardBody = card.querySelector('.creation-card__body, .technology-card__body');
          if (cardTrigger && cardBody) layers.push({ trigger: cardTrigger, body: cardBody });
          node = card.parentElement;
          continue;
        }

        var subsection = node.closest ? node.closest('[data-subsection-open]') : null;
        if (subsection) {
          var subTrigger = subsection.querySelector('.subsection__trigger');
          var subContentId = subTrigger && subTrigger.getAttribute('aria-controls');
          var subContent = subContentId ? document.getElementById(subContentId) : null;
          if (subTrigger && subContent) layers.push({ trigger: subTrigger, body: subContent });
          node = subsection.parentElement;
          continue;
        }

        node = null;
      }

      return layers;
    }

    Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;

      var target = document.getElementById(href.slice(1));
      if (!target) return;

      var layers = getDisclosureAncestors(target);
      if (!layers.length) return;

      link.addEventListener('click', function (event) {
        event.preventDefault();

        var scrollToTarget = function () {
          requestAnimationFrame(function () {
            target.scrollIntoView({ block: 'start', behavior: DisclosureAnimation.reducedMotion() ? 'auto' : 'smooth' });
          });
        };

        /* Expand every collapsed layer, outermost first, and sequentially:
           the inner card's expand must not start until the outer subsection
           has finished, since the outer's own max-height calculation (and
           the inner card's usable width/visibility) depend on it already
           being open. Each layer waits for its own transitionend (or a
           timeout fallback) before the next one starts. */
        var toExpand = layers
          .slice()
          .reverse()
          .filter(function (layer) { return layer.trigger.getAttribute('aria-expanded') !== 'true'; });

        var expandNext = function (index) {
          if (index >= toExpand.length) {
            scrollToTarget();
            return;
          }

          var layer = toExpand[index];
          layer.trigger.click();

          var settled = false;
          var finish = function () {
            if (settled) return;
            settled = true;
            layer.body.removeEventListener('transitionend', onEnd);
            expandNext(index + 1);
          };
          var onEnd = function (transitionEvent) {
            if (transitionEvent.target === layer.body && transitionEvent.propertyName === 'max-height') finish();
          };

          layer.body.addEventListener('transitionend', onEnd);
          window.setTimeout(finish, 450);
        };

        expandNext(0);

        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', href);
        }
      });
    });
  }

  function initializeAnimeSortHeaders() {
    var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.anime-catalogue__sort-btn'));
    sortButtons.forEach(function (button) {
      var header = button.closest('th');
      if (!header) return;

      var sort = button.getAttribute('aria-sort');
      button.removeAttribute('aria-sort');
      if (sort) header.setAttribute('aria-sort', sort);
    });
  }

  initInternalDisclosureLinks();
  initializeAnimeSortHeaders();
})();
