/* Technology archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-technology-archive]');
  if (!archive) return;

  /* Height-measured expand/collapse. Layered on top of the existing
     display:block/hidden disclosure — never changes the layout model
     of the content itself. Measures actual scrollHeight so variable
     content (images, tables, long text) is never clipped or guessed at. */
  function animateExpand(el, reducedMotion) {
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
    window.setTimeout(function () {
      if (!el.hidden) {
        el.hidden = true;
        el.style.maxHeight = '';
      }
    }, 400);
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.technology-card'));
  cards.forEach(function (card) {
    var trigger = card.querySelector('.technology-card__trigger');
    if (!trigger) return;
    card.setAttribute('data-technology-card', '');
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
    var trigger = card.querySelector('.technology-card__trigger');
    var body = card.querySelector('.technology-card__body');
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
})();

/* Anime Catalogue: accessible table sorting */
(function () {
  'use strict';

  var table = document.querySelector('.anime-catalogue__table');
  if (!table) return;

  var tbody = table.querySelector('tbody');
  var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
  var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.anime-catalogue__sort-btn'));
  
  var currentSort = 'no';
  var currentDirection = 'ascending';

  // Store original row data for reference
  var rowData = rows.map(function (row, index) {
    return {
      element: row,
      chronology: parseInt(row.getAttribute('data-chronology'), 10) || 0,
      type: row.getAttribute('data-type') || '',
      language: row.getAttribute('data-language') || '',
      name: row.querySelector('.anime-catalogue__name') ? row.querySelector('.anime-catalogue__name').textContent.trim() : '',
      originalIndex: index
    };
  });

  function sortRows(sortKey, direction) {
    var sorted = rowData.slice().sort(function (a, b) {
      var valA, valB;
      
      switch (sortKey) {
        case 'no':
          valA = a.chronology;
          valB = b.chronology;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'type':
          valA = a.type;
          valB = b.type;
          break;
        case 'language':
          valA = a.language;
          valB = b.language;
          break;
        default:
          valA = a.chronology;
          valB = b.chronology;
      }
      
      // Primary sort
      var cmp = 0;
      if (valA < valB) cmp = -1;
      else if (valA > valB) cmp = 1;
      
      // Secondary sort by chronology for non-chronology sorts
      if (cmp === 0 && sortKey !== 'no') {
        cmp = a.chronology - b.chronology;
      }
      
      // Tertiary sort by original index for stability
      if (cmp === 0) {
        cmp = a.originalIndex - b.originalIndex;
      }
      
      return direction === 'ascending' ? cmp : -cmp;
    });
    
    // Re-append rows in sorted order
    sorted.forEach(function (item) {
      tbody.appendChild(item.element);
    });
  }

  function updateButtonStates(activeButton, direction) {
    sortButtons.forEach(function (btn) {
      var isActive = btn === activeButton;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.removeAttribute('aria-sort');
      if (isActive) {
        btn.setAttribute('aria-sort', direction);
      }
    });
  }

  sortButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sortKey = btn.getAttribute('data-sort');
      var direction = 'ascending';
      
      if (sortKey === currentSort) {
        direction = currentDirection === 'ascending' ? 'descending' : 'ascending';
      }
      
      currentSort = sortKey;
      currentDirection = direction;
      
      sortRows(sortKey, direction);
      updateButtonStates(btn, direction);
    });
    
    btn.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        btn.click();
      }
    });
  });

  // Initial sort (chronological)
  sortRows('no', 'ascending');
})();