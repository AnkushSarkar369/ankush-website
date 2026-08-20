/* Technology archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-technology-archive]');
  if (!archive) return;

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

  function setOpen(card, open, restoreFocus) {
    var trigger = card.querySelector('.technology-card__trigger');
    var body = card.querySelector('.technology-card__body');
    if (!trigger || !body) return;
    card.setAttribute('data-open', open ? 'true' : 'false');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    
    // Check reduced motion preference for scroll behavior
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
    
    if (open) {
      body.removeAttribute('hidden');
      // Force reflow to ensure transition runs
      body.offsetHeight;
      body.classList.add('is-expanded');
      if (restoreFocus) body.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
    } else {
      body.classList.remove('is-expanded');
      // Set hidden after transition for accessibility
      var onTransitionEnd = function(e) {
        if (e.propertyName === 'opacity' || e.propertyName === 'grid-template-rows') {
          body.setAttribute('hidden', '');
          body.removeEventListener('transitionend', onTransitionEnd);
        }
      };
      body.addEventListener('transitionend', onTransitionEnd);
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(function() {
        body.setAttribute('hidden', '');
        body.removeEventListener('transitionend', onTransitionEnd);
      }, 500);
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