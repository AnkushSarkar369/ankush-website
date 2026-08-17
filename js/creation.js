/* Creation archive only: accessible inline expansion. */
(function () {
  'use strict';

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-creation-card]'));
  if (!cards.length) return;

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
    var close = card.querySelector('.creation-entry__close');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      var open = trigger.getAttribute('aria-expanded') === 'true';
      setOpen(card, !open, false);
    });

    if (close) {
      close.addEventListener('click', function () {
        setOpen(card, false, true);
      });
    }

    card.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setOpen(card, false, true);
      }
    });
  });
})();
