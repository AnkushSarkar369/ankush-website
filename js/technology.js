/* Technology archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-technology-archive]');
  if (!archive) return;

  function setOpen(card, open, restoreFocus) {
    var trigger = card.querySelector('.technology-card__trigger');
    var body = card.querySelector('.technology-card__body');
    if (!trigger || !body) return;

    var reducedMotion = DisclosureAnimation.reducedMotion();
    var scrollBehavior = reducedMotion ? 'auto' : 'smooth';

    if (open) {
      DisclosureAnimation.expand(body, reducedMotion);
    } else {
      DisclosureAnimation.collapse(body, reducedMotion);
    }

    DisclosureAnimation.flip(card, function () {
      card.setAttribute('data-open', open ? 'true' : 'false');
    });

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open && restoreFocus) body.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
    if (!open && restoreFocus) trigger.focus();
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
})();

(function () {
  'use strict';

  var table = document.querySelector('.anime-catalogue__table');
  if (!table) return;

  var tbody = table.querySelector('tbody');
  var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
  var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.anime-catalogue__sort-btn'));
  var currentSort = 'no';
  var currentDirection = 'ascending';

  var rowData = rows.map(function (row, index) {
    return {
      element: row,
      chronology: parseInt(row.getAttribute('data-chronology'), 10) || 0,
      type: row.getAttribute('data-type') || '',
      language: row.getAttribute('data-language') || '',
      name: row.querySelector('.anime-catalogue__name')
        ? row.querySelector('.anime-catalogue__name').textContent.trim()
        : '',
      originalIndex: index
    };
  });

  function sortRows(sortKey, direction) {
    var sorted = rowData.slice().sort(function (a, b) {
      var valA;
      var valB;

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

      var cmp = 0;
      if (valA < valB) cmp = -1;
      else if (valA > valB) cmp = 1;
      if (cmp === 0 && sortKey !== 'no') cmp = a.chronology - b.chronology;
      if (cmp === 0) cmp = a.originalIndex - b.originalIndex;

      return direction === 'ascending' ? cmp : -cmp;
    });

    sorted.forEach(function (item) {
      tbody.appendChild(item.element);
    });
  }

  function updateButtonStates(activeButton, direction) {
    sortButtons.forEach(function (btn) {
      var isActive = btn === activeButton;
      var header = btn.closest('th');
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.removeAttribute('aria-sort');
      if (header) {
        header.removeAttribute('aria-sort');
        if (isActive) header.setAttribute('aria-sort', direction);
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

  sortRows('no', 'ascending');
})();

(function () {
  'use strict';

  var table = document.querySelector('.book-catalogue__table');
  if (!table) return;

  var tbody = table.querySelector('tbody');
  var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
  var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.book-catalogue__sort-btn'));
  var currentSort = 'no';
  var currentDirection = 'ascending';

  var rowData = rows.map(function (row, index) {
    return {
      element: row,
      chronology: parseInt(row.getAttribute('data-chronology'), 10) || 0,
      author: row.getAttribute('data-author') || '',
      name: row.querySelector('.book-catalogue__name')
        ? row.querySelector('.book-catalogue__name').textContent.trim()
        : '',
      originalIndex: index
    };
  });

  function sortRows(sortKey, direction) {
    var sorted = rowData.slice().sort(function (a, b) {
      var valA;
      var valB;

      switch (sortKey) {
        case 'no':
          valA = a.chronology;
          valB = b.chronology;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'author':
          valA = a.author.toLowerCase();
          valB = b.author.toLowerCase();
          break;
        default:
          valA = a.chronology;
          valB = b.chronology;
      }

      var cmp = 0;
      if (valA < valB) cmp = -1;
      else if (valA > valB) cmp = 1;
      if (cmp === 0 && sortKey !== 'no') cmp = a.chronology - b.chronology;
      if (cmp === 0) cmp = a.originalIndex - b.originalIndex;

      return direction === 'ascending' ? cmp : -cmp;
    });

    sorted.forEach(function (item) {
      tbody.appendChild(item.element);
    });
  }

  function updateButtonStates(activeButton, direction) {
    sortButtons.forEach(function (btn) {
      var isActive = btn === activeButton;
      var header = btn.closest('th');
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.removeAttribute('aria-sort');
      if (header) {
        header.removeAttribute('aria-sort');
        if (isActive) header.setAttribute('aria-sort', direction);
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

  sortRows('no', 'ascending');
})();
