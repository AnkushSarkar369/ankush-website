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
    if (open) {
      body.hidden = false;
      if (restoreFocus) body.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      body.hidden = true;
      if (restoreFocus) trigger.focus();
    }
  }
})();