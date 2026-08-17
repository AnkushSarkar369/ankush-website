/* Creation archive only: accessible inline expansion. */
(function () {
  'use strict';

  var archive = document.querySelector('[data-creation-archive]');
  if (!archive) return;

  Array.prototype.slice.call(document.querySelectorAll('.creation-category')).forEach(function (category) {
    archive.appendChild(category);
  });

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

  var cards = Array.prototype.slice.call(document.querySelectorAll('.creation-card'));
  cards.forEach(function (card) {
    var trigger = card.querySelector('.creation-card__trigger');
    if (!trigger) return;
    card.setAttribute('data-creation-card', '');
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
      setOpen(card, trigger.getAttribute('aria-expanded') !== 'true', false);
    });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setOpen(card, false, true);
      }
    });
  });

  normalizeAsenpaiMedia();
})();
