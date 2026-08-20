/* Creation archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-creation-archive]');
  if (!archive) return;

  /* Height-measured expand/collapse. Layered on top of the existing
     display:block/hidden disclosure — never changes the layout model
     of the content itself. Measures actual scrollHeight so variable
     content (images, tables, long text) is never clipped or guessed at. */
  function animateExpand(el, reducedMotion) {
    el.removeEventListener('transitionend', el._collapseHandler || function () {});
    el.hidden = false;
    if (reducedMotion) {
      el.style.maxHeight = 'none';
      el.classList.add('is-expanded');
      return;
    }
    el.style.maxHeight = '0px';
    // Force reflow so the transition starts from 0.
    el.offsetHeight;
    var target = el.scrollHeight;
    el.style.maxHeight = target + 'px';
    el.classList.add('is-expanded');
    var onEnd = function (e) {
      if (e.target !== el || e.propertyName !== 'max-height') return;
      el.style.maxHeight = 'none';
      el.removeEventListener('transitionend', onEnd);
    };
    el.addEventListener('transitionend', onEnd);
  }

  function animateCollapse(el, reducedMotion) {
    if (reducedMotion) {
      el.style.maxHeight = '';
      el.classList.remove('is-expanded');
      el.hidden = true;
      return;
    }
    var current = el.scrollHeight;
    el.style.maxHeight = current + 'px';
    // Force reflow so the browser registers the starting height
    // before collapsing to 0, even though we came from "none".
    el.offsetHeight;
    el.classList.remove('is-expanded');
    el.style.maxHeight = '0px';
    var onEnd = function (e) {
      if (e.target !== el || e.propertyName !== 'max-height') return;
      el.hidden = true;
      el.style.maxHeight = '';
      el.removeEventListener('transitionend', onEnd);
    };
    el.addEventListener('transitionend', onEnd);
    // Fallback in case transitionend doesn't fire (e.g. display change mid-transition).
    window.setTimeout(function () {
      if (!el.hidden) {
        el.hidden = true;
        el.style.maxHeight = '';
      }
    }, 400);
  }

  Array.prototype.slice.call(document.querySelectorAll('.creation-category')).forEach(function (category) {
    archive.appendChild(category);
  });

  /* FLIP the card itself when opening/closing changes its grid position
     (two-column grid -> full-width row via `grid-column` on [data-open]).
     grid-column can't be CSS-transitioned, so we measure the before/after
     rects and animate a transform between them instead. Only engages when
     the card's position actually changes; a no-op otherwise. Leaves the
     body's own max-height/opacity animation untouched — this only moves
     the card as a whole. */
  function flipCardPosition(card, mutate) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      mutate();
      return;
    }
    var first = card.getBoundingClientRect();
    mutate();
    var last = card.getBoundingClientRect();
    var dx = first.left - last.left;
    var dy = first.top - last.top;
    var sx = first.width / last.width;
    if (!dx && !dy && sx === 1) return; // position/size unchanged, nothing to animate

    card.style.transition = 'none';
    card.style.transformOrigin = 'top left';
    card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scaleX(' + sx + ')';
    // Force reflow so the browser registers the starting transform
    // before we clear it on the next frame.
    card.offsetHeight;
    requestAnimationFrame(function () {
      card.style.transition = 'transform var(--dur-trans) var(--ease-out-soft)';
      card.style.transform = '';
      var onEnd = function (e) {
        if (e.target !== card || e.propertyName !== 'transform') return;
        card.style.transition = '';
        card.style.transformOrigin = '';
        card.removeEventListener('transitionend', onEnd);
      };
      card.addEventListener('transitionend', onEnd);
    });
  }

  function setOpen(card, open, restoreFocus) {
    var trigger = card.querySelector('.creation-card__trigger');
    var body = card.querySelector('.creation-card__body');
    if (!trigger || !body) return;

    flipCardPosition(card, function () {
      card.setAttribute('data-open', open ? 'true' : 'false');
    });
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scrollBehavior = reducedMotion ? 'auto' : 'smooth';

    if (open) {
      animateExpand(body, reducedMotion);
      if (restoreFocus) body.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
    } else {
      animateCollapse(body, reducedMotion);
      if (restoreFocus) trigger.focus();
    }
  }

  function normalizeAsenpaiMedia() {
    var card = Array.prototype.slice.call(document.querySelectorAll('.creation-card')).find(function (candidate) {
      var title = candidate.querySelector('.creation-card__title');
      return title && title.textContent.trim() === 'ASenpai';
    });
    if (!card) return;
    var material = card.querySelector('.creation-entry__material');
    if (!material) return;
    var figures = Array.prototype.slice.call(material.querySelectorAll(':scope > .creation-entry__image'));
    var madara = null;
    var editing = null;

    figures.forEach(function (figure) {
      var image = figure.querySelector('img');
      if (!image) return;
      var src = image.getAttribute('src') || '';
      var file = src.split('/').pop();
      if (file === '5.png') {
        if (!madara) madara = figure;
        else editing = figure;
      }
      if (file === '4.png' && (image.getAttribute('alt') || '').toLowerCase().indexOf('about') !== -1) {
        figure.remove();
      }
    });

    function ensureCaption(figure, text) {
      if (!figure) return;
      var caption = figure.querySelector('figcaption');
      if (!caption) {
        caption = document.createElement('figcaption');
        figure.appendChild(caption);
      }
      caption.textContent = text;
    }

    if (madara) {
      var madaraImage = madara.querySelector('img');
      madaraImage.setAttribute('src', 'assets/img/creation/asenpai/4.png');
      madaraImage.setAttribute('alt', 'Madara/Royalty AMV video page');
      ensureCaption(madara, 'The Madara AMV before going viral.');
    }
    if (editing) {
      var editingImage = editing.querySelector('img');
      editingImage.setAttribute('src', 'assets/img/creation/asenpai/5.png');
      editingImage.setAttribute('alt', 'After Effects editing session');
      ensureCaption(editing, 'An average editing timeline for an AMV.');
    }

    var captions = {
      '1.png': 'ASenpai.',
      '2.png': 'AMVs sorted by views.',
      '3.png': 'AMVs sorted by views.'
    };
    Array.prototype.slice.call(material.querySelectorAll(':scope > .creation-entry__image')).forEach(function (figure) {
      var image = figure.querySelector('img');
      if (!image) return;
      var file = (image.getAttribute('src') || '').split('/').pop();
      if (captions[file]) ensureCaption(figure, captions[file]);
    });
  }

  function moveExternalLinks() {
    Array.prototype.slice.call(document.querySelectorAll('.creation-entry__material > p > a')).forEach(function (link) {
      var entry = link.closest('.creation-entry');
      var logo = entry && entry.querySelector(':scope > .creation-entry__image');
      var wrapper = link.parentElement;
      if (!entry || !logo || !wrapper) return;
      link.classList.add('creation-entry__external-link');

      var identity = document.createElement('div');
      identity.className = 'creation-entry__identity';
      entry.insertBefore(identity, logo);
      identity.appendChild(logo);
      identity.appendChild(link);
      wrapper.remove();
    });
  }

  function initPickYourSong() {
    var pickButton = document.querySelector('.creation-entry__pick-song');
    if (!pickButton) return;

    var outputEl = pickButton.closest('.creation-entry__material').querySelector('.creation-entry__picked-song');
    if (!outputEl) return;

    var songList = null;

    function loadSongList() {
      return fetch('assets/song-list.txt')
        .then(function (response) {
          if (!response.ok) throw new Error('Failed to load song list');
          return response.text();
        })
        .then(function (text) {
          var lines = text.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line.length > 0; });
          if (lines.length === 0) throw new Error('Song list is empty');
          return lines;
        })
        .catch(function (err) {
          outputEl.hidden = false;
          outputEl.textContent = 'Unable to load song list: ' + err.message;
          outputEl.style.color = 'var(--color-error, #c00)';
          return null;
        });
    }

    pickButton.addEventListener('click', function () {
      if (!songList) {
        pickButton.disabled = true;
        pickButton.textContent = 'Loading...';
        loadSongList().then(function (lines) {
          songList = lines;
          pickButton.disabled = false;
          pickButton.textContent = 'Pick Your Song';
          if (songList) pickRandomSong();
        });
      } else {
        pickRandomSong();
      }
    });

    function pickRandomSong() {
      if (!songList || songList.length === 0) return;
      var randomIndex = Math.floor(Math.random() * songList.length);
      var selected = songList[randomIndex];
      outputEl.hidden = false;
      outputEl.textContent = 'Your song: ' + selected;
      outputEl.style.color = '';
    }
  }

  function normalizeScienceIdeasOrder() {
    var categories = Array.prototype.slice.call(document.querySelectorAll('.creation-category'));
    var science = categories.find(function (category) {
      var heading = category.querySelector('.creation-category__head h3');
      return heading && heading.textContent.trim() === 'Science & Ideas';
    });
    if (!science) return;

    science.classList.add('creation-category--science');

    var grid = science.querySelector('.creation-grid');
    if (!grid) return;

    var desiredOrder = [
      'The Coherent Theory of Interconnected Consciousness',
      'A Toy Model for Engineered Space-time Contraction',
      'A Computational Model of The Almighty'
    ];

    var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > .creation-card'));
    cards.sort(function (a, b) {
      var aTitle = a.querySelector('.creation-card__title');
      var bTitle = b.querySelector('.creation-card__title');
      var aIndex = desiredOrder.indexOf(aTitle ? aTitle.textContent.trim() : '');
      var bIndex = desiredOrder.indexOf(bTitle ? bTitle.textContent.trim() : '');
      if (aIndex === -1) aIndex = desiredOrder.length;
      if (bIndex === -1) bIndex = desiredOrder.length;
      return aIndex - bIndex;
    });

    cards.forEach(function (card, index) {
      grid.appendChild(card);
      var number = card.querySelector('.creation-card__number');
      if (number && index < desiredOrder.length) {
        number.textContent = String(index + 1).padStart(2, '0') + '.';
      }
    });
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.creation-card'));
  cards.forEach(function (card) {
    var trigger = card.querySelector('.creation-card__trigger');
    if (!trigger) return;
    card.setAttribute('data-creation-card', '');
    trigger.addEventListener('click', function () {
      setOpen(card, trigger.getAttribute('aria-expanded') !== 'true', false);
    });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setOpen(card, false, true);
      }
    });
  });

  normalizeScienceIdeasOrder();
  normalizeAsenpaiMedia();
  moveExternalLinks();
  initPickYourSong();
})();
