/* Creation archive only: accessible inline expansion. */
(function () {
  'use strict';

  var cards = Array.prototype.slice.call(document.querySelectorAll('.creation-card'));
  if (!cards.length) return;

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
})();
