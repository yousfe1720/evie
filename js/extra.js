/* CAL — "Hello from CAL" language strip + Deaf / non-speaking scenario card */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     15 languages: [BCP-47 code, native name, greeting, rtl?]
     Add or remove rows here. Everything else follows automatically.
  ------------------------------------------------------------ */
  const LANGS = [
    ['en', 'English', 'Hello'],
    ['es', 'Español', 'Hola'],
    ['fr', 'Français', 'Bonjour'],
    ['de', 'Deutsch', 'Hallo'],
    ['zh-CN', '中文', '你好'],
    ['ar', 'العربية', 'مرحباً', 1],
    ['ko', '한국어', '안녕하세요'],
    ['pt-BR', 'Português', 'Olá'],
    ['pl', 'Polski', 'Cześć'],
    ['ja', '日本語', 'こんにちは'],
    ['hi', 'हिन्दी', 'नमस्ते'],
    ['tr', 'Türkçe', 'Merhaba'],
    ['it', 'Italiano', 'Ciao'],
    ['ru', 'Русский', 'Привет'],
    ['uk', 'Українська', 'Привіт']
  ];
  /* Poppins ships Latin only here: any word with a glyph beyond Latin-1 is set entirely in the system font so a word never mixes two typefaces. */
  const needsSys = t => /[^\u0000-\u00FF]/.test(t);

  (function hello() {
    const word = $('#hello-word'), strip = $('#hello-strip'); if (!word || !strip) return;
    const track = $('.hello-track', strip), sec = $('#languages');
    const chips = LANGS.map((l, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hchip' + (needsSys(l[1]) ? ' sys' : '');
      b.lang = l[0]; if (l[3]) b.dir = 'rtl';
      b.textContent = l[1]; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { go(i); restart(); });
      track.appendChild(b); return b;
    });
    let cur = -1, timer = 0, paused = false, hovering = false, visible = false, swapT = 0;

    function center(i, instant) {
      const c = chips[i], left = c.offsetLeft - (strip.clientWidth - c.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: instant || reduce ? 'auto' : 'smooth' });
    }
    function paint(i) {
      const l = LANGS[i];
      word.textContent = l[2]; word.lang = l[0]; word.dir = l[3] ? 'rtl' : 'ltr';
      word.classList.toggle('sys', needsSys(l[2]));
    }
    function go(i, instant) {
      if (i === cur) return;
      const first = cur < 0; cur = i;
      chips.forEach((c, k) => { const on = k === i; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      center(i, instant || first);
      clearTimeout(swapT);
      if (first || reduce) { paint(i); return; }
      word.classList.add('out');
      swapT = setTimeout(() => { paint(i); word.classList.remove('out'); word.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove('in'))); }, 280);
    }
    function tick() { go((cur + 1) % LANGS.length); }
    function stop() { clearInterval(timer); timer = 0; }
    function start() { if (reduce || paused || hovering || !visible || document.hidden || timer) return; timer = setInterval(tick, 2400); }
    function restart() { stop(); start(); }

    strip.addEventListener('pointerenter', () => { hovering = true; stop(); });
    strip.addEventListener('pointerleave', () => { hovering = false; start(); });
    strip.addEventListener('focusin', () => { hovering = true; stop(); });
    strip.addEventListener('focusout', () => { hovering = false; start(); });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    go(0, true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: .25 }).observe(sec);
    } else { visible = true; start(); }
    window.addEventListener('resize', () => center(cur, true));
  })();

  /* ------------------------------------------------------------
     Deaf / hard-of-hearing / non-speaking scenario
  ------------------------------------------------------------ */
  (function inclusion() {
    const card = $('#inc-card'); if (!card) return;
    const I = {
      hand: 'M18 11V6a2 2 0 0 0-4 0 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15',
      mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
      cc: 'M3 5h18v14H3z M10 10.5a2.2 2.2 0 1 0 0 3 M17 10.5a2.2 2.2 0 1 0 0 3',
      spk: 'M11 5L6 9H3v6h3l5 4z M15.5 8.5a5 5 0 0 1 0 7 M19 5a10 10 0 0 1 0 14',
      spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M18 6l-2.5 2.5 M8.5 15.5L6 18',
      cam: 'M3 7h4l2-3h6l2 3h4v13H3z M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'
    };
    const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[k].split(' M').map((d, i) => `<path d="${i ? 'M' : ''}${d}"/>`).join('')}</svg>`;
    const DATA = {
      sign: [
        ['cam', 'Connect your camera', 'Point it at yourself and start signing to CAL.'],
        ['hand', 'CAL understands your signs', 'It reads English sign language and knows what you mean.'],
        ['spark', 'CAL gets it done', 'It answers, writes or acts on what you signed.']
      ],
      hear: [
        ['mic', 'CAL listens for you', 'The room, a phone call or a video meeting.'],
        ['hand', 'CAL talks to you in sign language', 'When you can\u2019t hear, CAL speaks to you in sign language.'],
        ['cam', 'You answer by signing', 'Sign back to your camera and CAL carries your reply across.']
      ]
    };
    const steps = $$('.inc-steps li', card), tabs = $$('.tab', card);
    let key = 'sign', timers = [];
    function render() {
      DATA[key].forEach((d, i) => {
        const li = steps[i];
        $('.ic', li).innerHTML = svg(d[0]); $('b', li).textContent = d[1]; $('small', li).textContent = d[2];
      });
    }
    function play() {
      timers.forEach(clearTimeout); timers = [];
      steps.forEach(li => li.classList.remove('on'));
      steps.forEach((li, i) => { timers.push(setTimeout(() => li.classList.add('on'), reduce ? 0 : 500 + i * 1100)); });
    }
    function select(k) {
      key = k; tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.k === k));
      render(); play();
    }
    tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.k)));
    render();
    if (reduce || !('IntersectionObserver' in window)) { steps.forEach(li => li.classList.add('on')); }
    else {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: .35 });
      io.observe(card);
    }
  })();

  /* ------------------------------------------------------------
     Footer: "Callistox" in dots. Dots flee the pointer and spring back together.
  ------------------------------------------------------------ */
  (function dots() {
    const host = $('.ftr .wrap'); if (!host) return;
    const box = document.createElement('div'); box.className = 'ftr-dots'; box.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas'); box.appendChild(cv); host.appendChild(box);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let W = 0, H = 0, dpr = 1, P = [], raf = 0, running = false, visible = false, color = '31,25,26';
    const mouse = { x: -9999, y: -9999, on: false };
    const readColor = () => { color = document.documentElement.dataset.theme === 'dark' ? '244,243,242' : '31,25,26'; };

    function build() {
      W = box.clientWidth; if (!W) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      /* fit the word to the width; crop the bottom like a wordmark rising out of the page */
      const probe = document.createElement('canvas').getContext('2d'), word = 'Callistox';
      probe.font = '600 200px Poppins, system-ui, sans-serif';
      const fs = 200 * W / probe.measureText(word).width * 0.985;
      H = Math.round(fs * 0.66); box.style.setProperty('--dots-h', H + 'px');
      cv.width = W * dpr; cv.height = H * dpr;
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d'); o.fillStyle = '#000'; o.textBaseline = 'alphabetic'; o.textAlign = 'center';
      o.font = '600 ' + fs + 'px Poppins, system-ui, sans-serif';
      o.fillText(word, W / 2, fs * 0.8);
      const data = o.getImageData(0, 0, W, H).data, step = W < 520 ? 4 : W < 900 ? 5 : 6;
      P = [];
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
        if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 128) P.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0 });
      }
      r = step * 0.36;
      draw();
    }
    let r = 2;
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < P.length; i++) {
        const p = P[i], d = Math.hypot(p.x - p.hx, p.y - p.hy), a = Math.min(.8, .2 + d / 70);
        ctx.fillStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
      }
    }
    function step() {
      const R = Math.max(70, Math.min(130, W * .09)); let moving = false;
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        if (mouse.on) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6; p.vx += dx / d * f + (Math.random() - .5) * 1.2; p.vy += dy / d * f + (Math.random() - .5) * 1.2; }
        }
        p.vx += (p.hx - p.x) * .045; p.vy += (p.hy - p.y) * .045;
        p.vx *= .84; p.vy *= .84; p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) > .02 || Math.abs(p.vy) > .02 || Math.abs(p.x - p.hx) > .05 || Math.abs(p.y - p.hy) > .05) moving = true;
      }
      draw();
      if (moving || mouse.on) raf = requestAnimationFrame(step); else running = false;
    }
    const kick = () => { if (!running && visible) { running = true; raf = requestAnimationFrame(step); } };
    box.addEventListener('pointermove', e => { const b = box.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; mouse.on = true; kick(); });
    box.addEventListener('pointerleave', () => { mouse.on = false; kick(); });
    box.addEventListener('pointerdown', e => { const b = box.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; mouse.on = true; kick(); });
    box.addEventListener('pointerup', () => { mouse.on = false; kick(); });
    new MutationObserver(() => { readColor(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) { cancelAnimationFrame(raf); running = false; } }, { threshold: 0 }).observe(box); else visible = true;
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    readColor();
    (document.fonts && document.fonts.load ? document.fonts.load('600 100px Poppins') : Promise.resolve()).then(build, build);
    if (reduce) { box.style.pointerEvents = 'none'; }
  })();
})();
