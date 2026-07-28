/* WORKBENCH — shared site behaviour */
document.addEventListener('DOMContentLoaded', function () {

  /* ---- mobile nav toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('is-open'); });
    });
  }

  /* ---- highlight current nav link ---- */
  var here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var target = a.getAttribute('href');
    if (target === here || (here === '' && target === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  /* ---- footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- reveal-on-scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---- filter tabs (courses.html / projects.html) ---- */
  var filterRow = document.querySelector('.filter-row');
  if (filterRow) {
    var buttons = filterRow.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('[data-category]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var cat = btn.getAttribute('data-filter');
        items.forEach(function (item) {
          var itemCats = (item.getAttribute('data-category') || '').split(' ');
          var show = cat === 'all' || itemCats.indexOf(cat) !== -1;
          item.hidden = !show;
        });
      });
    });
  }

  /* ---- contact form validation (front-end only for now) ---- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');

    function setError(fieldId, message) {
      var field = document.getElementById(fieldId).closest('.field');
      var errorEl = field.querySelector('.field-error');
      if (message) {
        field.classList.add('has-error');
        errorEl.textContent = message;
      } else {
        field.classList.remove('has-error');
        errorEl.textContent = '';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var message = document.getElementById('message');
      var valid = true;

      if (!name.value.trim()) { setError('name', 'Tell us your name.'); valid = false; }
      else { setError('name', null); }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) { setError('email', 'Enter a valid email address.'); valid = false; }
      else { setError('email', null); }

      if (!message.value.trim() || message.value.trim().length < 10) { setError('message', 'Add a few more details (10+ characters).'); valid = false; }
      else { setError('message', null); }

      if (!valid) {
        status.className = 'form-status is-error';
        status.textContent = 'Please fix the fields marked above.';
        return;
      }

      /* No backend is wired up yet — this is a placeholder confirmation.
         When the CRM layer is added, this is where the lead gets sent
         to that system instead. */
      status.className = 'form-status is-success';
      status.textContent = 'Thanks — your message is queued. We reply within one business day.';
      form.reset();
    });
  }

  /* small polyfill-free closest fallback for older engines */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (selector) {
      var el = this;
      while (el) {
        if (el.matches(selector)) return el;
        el = el.parentElement;
      }
      return null;
    };
  }
});
