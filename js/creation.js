/* Creation archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-creation-archive]');
  if (!archive) return;

  /* The source HTML has had a few malformed closing tags over time. Re-parent
     every category explicitly so one broken card cannot swallow the categories
     that follow it. */
  Array.prototype.slice.call(document.querySelectorAll('.creation-category')).forEach(function (category) {
    archive.appendChild(category);
  });

  var cards = Array.prototype.slice.call(document.querySelectorAll('.creation-card'));

  var classifications = {
    'Timekeeper Gaming YT': 'YouTube · Gaming',
    'Allrounder Buddy': 'YouTube · Collaborative',
    'ASenpai': 'YouTube · Anime editing',
    'Ankush Sarkar': 'YouTube · Self-development',
    'Beyond The Boundaries': 'YouTube · Intellectual discussion',
    "Ankush's Substack": 'Substack · Journal',
    '@ankush369sarkar': 'Instagram · Self-development'
  };

  function setOpen(card, open, restoreFocus) {
    var trigger = card.querySelector('.creation-card__trigger');
    var body = card.querySelector('.creation-card__body');
    if (!trigger || !body) return;

    card.setAttribute('data-open', open ? 'true' : 'false');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
      body.hidden = false;
      if (restoreFocus) body.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      body.hidden = true;
      if (restoreFocus) trigger.focus();
    }
  }

  function repairAsenpaiCaptions() {
    var asenpai = document.querySelector('.creation-card .creation-card__title');
    var cardsWithTitle = Array.prototype.slice.call(document.querySelectorAll('.creation-card'));
    var asenpaiCard = cardsWithTitle.find(function (title) {
      return title.textContent.trim() === 'ASenpai';
    });
    if (!asenpaiCard) return;

    var card = asenpaiCard.closest('.creation-card');
    var figures = Array.prototype.slice.call(card.querySelectorAll('.creation-entry__material figure.creation-entry__image'));

    figures.forEach(function (figure) {
      var image = figure.querySelector('img');
      if (!image) return;
      var src = image.getAttribute('src') || '';
      var file = src.split('/').pop();

      var captions = {
        '2.png': 'AMVs sorted by views.',
        '3.png': 'AMVs sorted by views.',
        '4.png': 'The Madara AMV before going viral.',
        '6.png': 'An average editing timeline for an AMV.'
      };

      if (file === '5.png') {
        figure.remove();
        return;
      }

      if (captions[file]) {
        var caption = figure.querySelector('figcaption');
        if (!caption) {
          caption = document.createElement('figcaption');
          figure.appendChild(caption);
        }
        caption.textContent = captions[file];
      }
    });
  }

  cards.forEach(function (card) {
    var trigger = card.querySelector('.creation-card__trigger');
    if (!trigger) return;

    card.setAttribute('data-creation-card', '');

    var title = card.querySelector('.creation-card__title');
    var classification = card.querySelector('.creation-card__classification');
    if (title && classification && classifications[title.textContent.trim()]) {
      classification.textContent = classifications[title.textContent.trim()];
    }

    if (card.hasAttribute('data-speculative')) {
      var entry = card.querySelector('.creation-entry');
      if (entry && !entry.querySelector('.creation-disclaimer')) {
        var disclaimer = document.createElement('aside');
        disclaimer.className = 'creation-disclaimer';
        disclaimer.setAttribute('aria-label', 'Speculative work disclaimer');
        disclaimer.textContent = 'Speculative / experimental work. Not established scientific fact.';
        entry.appendChild(disclaimer);
      }
    }

    trigger.addEventListener('click', function () {
      var open = trigger.getAttribute('aria-expanded') === 'true';
      setOpen(card, !open, false);
    });

    card.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setOpen(card, false, true);
      }
    });
  });

  repairAsenpaiCaptions();
})();
