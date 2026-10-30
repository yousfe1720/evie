/* CAL rewards: confetti, count-up and a mascot that reacts to the form. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['#374FFF', '#4F63FF', '#93A0FF', '#123CEC', '#B7C0FF', '#1F191A'];

  function confetti(x, y, n) {
    if (reduce) return;
    var box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box);
    var parts = [];
    for (var i = 0; i < (n || 70); i++) {
      var el = document.createElement('i'); el.style.background = COLORS[i % COLORS.length];
      if (i % 3 === 0) { el.style.borderRadius = '50%'; el.style.width = el.style.height = '10px'; }
      box.appendChild(el);
      var a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 9;
      parts.push({ el: el, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, r: Math.random() * 360, vr: (Math.random() - .5) * 24 });
    }
    var t0 = performance.now();
    (function tick(t) {
      var life = (t - t0) / 1900, alive = false;
      parts.forEach(function (p) {
        p.vy += .38; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg)';
        p.el.style.opacity = Math.max(0, 1 - life * life);
        if (p.y < innerHeight + 40 && life < 1) alive = true;
      });
      if (alive) requestAnimationFrame(tick); else box.remove();
    })(t0);
  }
  window.CALConfetti = confetti;

  /* buttons with data-confetti pop on click */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-confetti]');
    if (!b) return;
    var r = b.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 36);
  });

  /* count-up for big reward numbers */
  var nums = document.querySelectorAll('[data-count]');
  function run(el) {
    var to = +el.dataset.count, d = 1100, t0 = performance.now();
    if (reduce) { el.textContent = to; return; }
    (function f(t) { var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }); }, { threshold: .6 });
    nums.forEach(function (n) { io.observe(n); });
  } else nums.forEach(run);

  /* the mascot next to the form reacts: listening while you type, happy on send */
  var peek = document.querySelector('[data-peek]'), form = document.querySelector('form[data-form="post"]');
  if (peek && form) {
    var set = function (k) { peek.setAttribute('data-face', k); };
    var hop = function () { peek.classList.remove('hop'); void peek.offsetWidth; peek.classList.add('hop'); };
    form.addEventListener('focusin', function () { set('typing'); });
    form.addEventListener('focusout', function () { set('idle'); });
    form.addEventListener('submit', function () { set('think'); });
    form.addEventListener('cal:sent', function () {
      set('sent'); hop();
      var r = peek.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 20, 110);
      var s = form.querySelector('.status'); if (s) s.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    });
    form.addEventListener('invalid', function () { set('idle'); }, true);
  }
})();
