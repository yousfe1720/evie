/* =========================================================
   CAL — site behaviour
   Progressive enhancement: everything degrades to readable static content.
========================================================= */
(function () {
  'use strict';
  const CFG = window.CAL_CONFIG || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const hasG = typeof window.gsap !== 'undefined';
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = mqReduce.matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (reduce) document.documentElement.classList.add('reduce');
  if (hasG && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- theme ---------- */
  const root = document.documentElement;
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('cal-theme', next); } catch (e) {}
    b.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }));

  /* ---------- header ---------- */
  const hdr = $('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 12);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  const menuBtn = $('.menu-btn'), mnav = $('.mnav');
  if (menuBtn && mnav) {
    const setMenu = open => {
      mnav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', () => setMenu(!mnav.classList.contains('open')));
    $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (innerWidth > 1060) setMenu(false); });
  }

  /* ---------- reveal ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  function whenVisible(el, fn, th) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th || .35 });
    o.observe(el);
  }

  /* =========================================================
     MASCOT — built from the supplied SVG geometry.
     Body, fold and notch are untouched; the eyes are the supplied
     cut-outs, kept as separate layers so they can express state.
  ========================================================= */
  const BODY = 'M110 20 C215 6 305 0 395 0 C450 0 463 20 480 56 L520 126 C535 153 554 156 590 166 C632 176 650 198 650 245 L650 465 C650 530 607 570 540 570 L110 570 C45 570 0 530 0 465 L0 190 C0 70 35 27 110 20 Z';
  const FOLD = 'M493 18 L602 83 C625 97 628 115 625 137 L581 124 C564 119 556 108 545 90 Z';
  const NOTCH = 'M200 570 C230 570 245 550 245 520 L245 486 C245 451 262 435 295 435 L355 435 C388 435 405 451 405 486 L405 520 C405 550 420 570 450 570 L450 610 L200 610 Z';
  const S = 'fill="none" stroke="#000" stroke-width="22" stroke-linecap="round"';
  const EYES = {
    neutral: '<rect x="220" y="220" width="70" height="125" rx="35"/><rect x="360" y="220" width="70" height="125" rx="35"/>',
    happy: `<path d="M220 290 Q255 235 290 290" ${S}/><path d="M360 290 Q395 235 430 290" ${S}/>`,
    thinking: '<rect x="220" y="230" width="70" height="110" rx="35"/><rect x="360" y="260" width="70" height="54" rx="27"/>',
    listening: '<rect x="225" y="203" width="60" height="145" rx="30"/><rect x="365" y="203" width="60" height="145" rx="30"/>',
    surprised: '<circle cx="255" cy="282" r="47"/><circle cx="395" cy="282" r="47"/>',
    wink: `<rect x="220" y="220" width="70" height="125" rx="35"/><path d="M360 282 Q395 270 430 282" ${S}/>`,
    sleepy: '<rect x="220" y="274" width="70" height="24" rx="12"/><rect x="360" y="274" width="70" height="24" rx="12"/>',
    focused: '<rect x="225" y="248" width="60" height="74" rx="30"/><rect x="365" y="248" width="60" height="74" rx="30"/>'
  };
  const STATES = Object.keys(EYES);
  let mid = 0;
  const live = [];

  function buildMascot(opts) {
    opts = opts || {};
    const id = 'cm' + (++mid);
    const g = svgEl('g');
    const inner = svgEl('g', opts.centered ? { transform: 'translate(-325 -285)' } : {}, g);
    const defs = svgEl('defs', {}, inner);
    const mask = svgEl('mask', { id, maskUnits: 'userSpaceOnUse', x: -10, y: -10, width: 680, height: 640, style: 'mask-type:luminance' }, defs);
    svgEl('rect', { x: -10, y: -10, width: 680, height: 640, fill: '#fff' }, mask);
    svgEl('path', { d: NOTCH, fill: '#000' }, mask);
    const eyes = svgEl('g', {}, mask);
    const sg = {};
    STATES.forEach(s => {
      const grp = svgEl('g', { fill: '#000', opacity: 0 }, eyes);
      grp.innerHTML = EYES[s];
      sg[s] = grp;
    });
    const bob = svgEl('g', {}, inner);
    const bodyP = svgEl('path', { d: BODY, fill: 'currentColor', mask: `url(#${id})` }, bob);
    const fold = svgEl('path', { d: FOLD, fill: 'currentColor' }, bob);

    const m = { g, body: bodyP, fold, cur: null, st: { gx: 0, gy: 0, sy: 1, by: 0, fr: 0 }, sleepy: false };
    const paint = () => {
      const s = m.st;
      eyes.setAttribute('transform', `translate(${s.gx.toFixed(2)} ${s.gy.toFixed(2)}) translate(325 282) scale(1 ${s.sy.toFixed(3)}) translate(-325 -282)`);
      bob.setAttribute('transform', `translate(0 ${s.by.toFixed(2)})`);
      fold.setAttribute('transform', `rotate(${s.fr.toFixed(2)} 545 95)`);
    };
    m.setState = (name, d) => {
      if (!EYES[name] || name === m.cur) return;
      const prev = m.cur; m.cur = name; m.sleepy = name === 'sleepy';
      if (hasG && !reduce && prev) {
        gsap.to(sg[prev], { attr: { opacity: 0 }, duration: d == null ? .28 : d, overwrite: true });
        gsap.to(sg[name], { attr: { opacity: 1 }, duration: d == null ? .28 : d, overwrite: true });
      } else {
        STATES.forEach(k => sg[k].setAttribute('opacity', k === name ? 1 : 0));
      }
    };
    m.look = (x, y) => {   // x,y in -1..1
      if (hasG && !reduce) gsap.to(m.st, { gx: x * 12, gy: y * 9, duration: .5, ease: 'power3.out', onUpdate: paint, overwrite: 'auto' });
      else { m.st.gx = x * 12; m.st.gy = y * 9; paint(); }
    };
    m.blink = () => {
      if (!hasG || reduce || m.sleepy) return;
      gsap.timeline({ onUpdate: paint }).to(m.st, { sy: .08, duration: .07 }).to(m.st, { sy: 1, duration: .12 });
    };
    if (hasG && !reduce && opts.idle !== false) {
      gsap.to(m.st, { by: -7, duration: 2.6 + Math.random() * .6, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: paint });
      gsap.to(m.st, { fr: 3.2, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: paint });
      const loop = () => { setTimeout(() => { if (document.body.contains(g) || !g.isConnected) { m.blink(); } loop(); }, 2400 + Math.random() * 3600); };
      loop();
    }
    m.setState(opts.state || 'neutral', 0);
    paint();
    live.push(m);
    return m;
  }

  function mascotSVG(state, cls, opts) {
    const svg = svgEl('svg', { viewBox: '-16 -16 682 602', class: 'mascot ' + (cls || ''), role: 'img', 'aria-label': 'CAL mascot', focusable: 'false' });
    const m = buildMascot(Object.assign({ state }, opts || {}));
    svg.appendChild(m.g); m.svg = svg;
    return m;
  }

  // hydrate placeholders:  <span data-mascot="happy" data-cls="mascot-sm">
  const hydrated = [];
  let gid = 0;
  $$('[data-mascot]').forEach(ph => {
    const m = mascotSVG(ph.dataset.mascot, ph.dataset.cls || '', { idle: ph.dataset.idle !== 'off' });
    if (ph.dataset.label === 'hide') m.svg.setAttribute('aria-hidden', 'true'), m.svg.removeAttribute('role'), m.svg.removeAttribute('aria-label');
    if (ph.dataset.grad) {   /* the body is painted with the card's own two colours (--g1 / --g2 set in CSS) */
      const id = 'mgrad' + (++gid), defs = svgEl('defs', {}, m.svg);
      const lg = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      svgEl('stop', { offset: 0, style: 'stop-color:var(--g1)' }, lg); svgEl('stop', { offset: 1, style: 'stop-color:var(--g2)' }, lg);
      m.body.setAttribute('fill', `url(#${id})`); m.fold.setAttribute('fill', `url(#${id})`);
    }
    m.base = ph.dataset.mascot;
    ph.replaceWith(m.svg); m.svg.dataset.hy = '1'; hydrated.push(m);
  });
  /* division cards: the mascot reacts when its card opens */
  $$('.dv').forEach(dv => {
    const m = hydrated.find(h => dv.contains(h.svg)); if (!m) return;
    let t = 0;
    dv.addEventListener('mouseenter', () => { clearTimeout(t); m.setState('surprised'); t = setTimeout(() => m.setState('happy'), 420); });
    dv.addEventListener('mouseleave', () => { clearTimeout(t); m.setState(m.base); });
  });

  // gaze follows the pointer on desktop (restrained)
  if (fine && !reduce) {
    let raf = 0;
    window.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / innerWidth - .5) * 2, y = (e.clientY / innerHeight - .5) * 2;
        live.forEach(m => { if (m.g.isConnected) m.look(x, y); });
        const js = $('.journey-stage');
        if (js) { js.style.setProperty('--mx', e.clientX + 'px'); js.style.setProperty('--my', (e.clientY) + 'px'); }
      });
    }, { passive: true });
  }

  /* =========================================================
     ICONS (generic category glyphs — no third-party brand marks)
  ========================================================= */
  const IC = {
    mail: 'M3 6h18v12H3z M3 7l9 6 9-6', calendar: 'M4 5h16v15H4z M4 10h16 M8 3v4 M16 3v4',
    chat: 'M4 5h16v11H9l-5 4z', doc: 'M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7',
    code: 'M9 7l-5 5 5 5 M15 7l5 5-5 5', mega: 'M3 10v4h4l8 4V6L7 10z M18 9a4 4 0 010 6',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-4-4',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
    home: 'M4 11l8-7 8 7 M6 10v10h12V10 M10 20v-5h4v5', camera: 'M3 8h4l2-3h6l2 3h4v12H3z M12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
    brief: 'M3 8h18v12H3z M9 8V5h6v3 M3 13h18', folder: 'M3 6h6l2 3h10v11H3z', check: 'M5 12l4 4 10-10',
    lock: 'M6 11h12v9H6z M8 11V8a4 4 0 018 0v3', spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M18 6l-2.5 2.5 M8.5 15.5L6 18',
    mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z M6 11a6 6 0 0012 0 M12 17v4', user: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z', link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1 M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'
  };
  function icon(name, parent, attrs) {
    const g = svgEl('g', attrs || {}, parent);
    IC[name].split(' M').forEach((d, i) => svgEl('path', { d: (i ? 'M' : '') + d }, g));
    return g;
  }
  const iconHTML = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[n].split(' M').map((d, i) => `<path d="${i ? 'M' : ''}${d}"/>`).join('')}</svg>`;
  $$('[data-icon]').forEach(e => { e.innerHTML = iconHTML(e.dataset.icon); });

  /* =========================================================
     HOME — the signature journey
  ========================================================= */
  const SCENES = [
    { s: 'sleepy', t: 'A signal.', p: 'Something small and quiet reaches CAL. Intelligence starts with paying attention.' },
    { s: 'listening', t: 'CAL wakes.', p: 'It listens for your voice, and it responds only when you ask.' },
    { s: 'thinking', t: 'It reaches your phone.', p: 'Your request travels to the device in your hand, not to another tab.' },
    { s: 'focused', t: 'A request becomes a task.', p: 'CAL turns what you said into steps you can see, approve and follow.' },
    { s: 'neutral', t: 'Privacy Cloud', p: 'Your conversations are encrypted and can\u2019t be read by anyone but you. Not even us.' },
    { s: 'happy', t: 'A network of personal intelligence.', p: 'Context that stays with you, so you stop starting every conversation from zero.' },
    { s: 'neutral', t: 'It connects your world.', p: 'Mail, calendars, files, documents, devices: only the ones you authorize.' },
    { s: 'wink', t: 'Be there when intelligence leaves the screen.', p: 'Join the waitlist and be among the first to discover a more connected way to live and work.' }
  ];

  const journey = $('.journey');
  if (journey) {
    const wantStatic = !hasG || !window.ScrollTrigger || reduce || innerWidth < 900;
    if (wantStatic) buildStatic(); else buildJourney();
    let wasStatic = wantStatic;
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
      const nowStatic = !hasG || reduce || innerWidth < 900; if (nowStatic !== wasStatic) location.reload(); }, 300); });
  }

  function buildStatic() {
    journey.classList.add('static');
    const box = $('.journey-static', journey);
    const hero = $('.hero-mascot-static', journey);
    if (hero) { const m = mascotSVG('neutral', ''); hero.appendChild(m.svg); setTimeout(() => m.setState('surprised'), 500); setTimeout(() => m.setState('neutral'), 1500); }
    if (!box) return;
    SCENES.slice(1).forEach((sc, i) => {
      const row = document.createElement('div'); row.className = 'jstep reveal';
      const m = mascotSVG(sc.s, 'mascot-sm', { idle: false }); const wrap = document.createElement('div'); wrap.appendChild(m.svg);
      const txt = document.createElement('div'); txt.innerHTML = `<h3>${sc.t}</h3><p>${sc.p}</p>`;
      row.append(wrap, txt); box.appendChild(row); io && io.observe(row);
    });
  }

  function buildJourney() {
    const svg = $('#stage'); if (!svg) return;
    svg.setAttribute('viewBox', '0 -40 1200 760'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const lines = svgEl('g', { fill: 'none' }, svg);
    const ldefs = svgEl('defs', {}, svg);
    const lmask = svgEl('mask', { id: 'lnmask', maskUnits: 'userSpaceOnUse', x: -400, y: -400, width: 2000, height: 1600, style: 'mask-type:luminance' }, ldefs);
    svgEl('rect', { x: -400, y: -400, width: 2000, height: 1600, fill: '#fff' }, lmask);
    const lmg = svgEl('g', {}, lmask), lsil = svgEl('g', { transform: 'translate(-325 -285)' }, lmg);
    svgEl('path', { d: BODY, fill: '#000', stroke: '#000', 'stroke-width': 26, 'stroke-linejoin': 'round' }, lsil);
    svgEl('path', { d: FOLD, fill: '#000' }, lsil);
    lines.setAttribute('mask', 'url(#lnmask)');
    const secLinks = svgEl('g', { fill: 'none' }, svg);
    const dotsG = svgEl('g', {}, svg);
    const nodesG = svgEl('g', {}, svg);
    const badgesG = svgEl('g', {}, svg);
    const phone = svgEl('g', { opacity: 0 }, svg);
    const signal = svgEl('g', {}, svg);
    const wave = svgEl('circle', { r: 30, class: 's-accs', fill: 'none', 'stroke-width': 2, opacity: 0 }, svg);
    const mAnchor = svgEl('g', {}, svg);
    const mas = buildMascot({ centered: true, state: 'sleepy' });
    mAnchor.appendChild(mas.g);
    mas.g.setAttribute('class', 'mascot'); mas.g.style.color = 'var(--mascot)';
    // soft light behind the mascot (a gradient, not a filter, so the eye cut-outs stay clean)
    const sdefs = svgEl('defs', {}, svg); const sg = svgEl('radialGradient', { id: 'stg' }, sdefs);
    svgEl('stop', { offset: '0', 'stop-color': 'var(--accent)', 'stop-opacity': .32 }, sg); svgEl('stop', { offset: '1', 'stop-color': 'var(--accent)', 'stop-opacity': 0 }, sg);
    mAnchor.insertBefore(svgEl('circle', { r: 520, fill: 'url(#stg)' }), mAnchor.firstChild);

    // signal
    svgEl('circle', { r: 26, class: 's-acc', opacity: .16 }, signal);
    svgEl('circle', { r: 11, class: 's-acc' }, signal);
    const sr = svgEl('circle', { r: 11, class: 's-accs', fill: 'none', 'stroke-width': 2 }, signal);

    // phone
    svgEl('rect', { x: -125, y: -235, width: 250, height: 470, rx: 36, class: 's-surface s-line', 'stroke-width': 2 }, phone);
    svgEl('rect', { x: -32, y: -219, width: 64, height: 8, rx: 4, class: 's-line-f' }, phone);
    const pt = (x, y, txt, cls, size, weight) => { const t = svgEl('text', { x, y, class: cls, 'font-size': size || 13, 'font-weight': weight || 500 }, phone); t.textContent = txt; return t; };
    pt(-100, -178, 'Task', 's-muted', 12);
    const reqBox = svgEl('g', { opacity: 0 }, phone);
    svgEl('rect', { x: -100, y: -160, width: 200, height: 74, rx: 16, class: 's-acc' }, reqBox);
    [['Call the clinic and help me', -132], ['arrange an appointment.', -112]].forEach(r => { const t = svgEl('text', { x: -88, y: r[1] + 2, fill: '#fff', 'font-size': 13, 'font-weight': 500 }, reqBox); t.textContent = r[0]; });
    const mic = svgEl('g', { transform: 'translate(79 -109) scale(.6)' }, reqBox); icon('mic', mic, { fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const rows = ['Understand the request', 'Check your calendar', 'Prepare the call', 'Ask for your approval'].map((txt, i) => {
      const y = -50 + i * 56; const g = svgEl('g', { opacity: 0 }, phone);
      svgEl('rect', { x: -100, y: y - 4, width: 200, height: 42, rx: 12, class: 's-bg2' }, g);
      svgEl('circle', { cx: -78, cy: y + 17, r: 10, class: 's-line s-surface', 'stroke-width': 2 }, g);
      const ck = svgEl('g', { transform: `translate(-85 ${y + 10}) scale(.58)`, opacity: 0 }, g); icon('check', ck, { fill: 'none', stroke: 'var(--accent)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      const t = svgEl('text', { x: -60, y: y + 22, class: 's-fg', 'font-size': 12.5, 'font-weight': 500 }, g); t.textContent = txt;
      return { g, ck };
    });

    // nodes
    const NODES = [['mail', 'Email'], ['calendar', 'Calendar'], ['files', 'Files'], ['chat', 'Messages'], ['doc', 'Documents'], ['code', 'Dev tools'], ['home', 'Devices'], ['camera', 'Sensors']];
    const nodes = NODES.map((n, i) => {
      const g = svgEl('g', { opacity: 0 }, nodesG);
      svgEl('circle', { r: 33, class: 's-surface s-line', 'stroke-width': 1.6 }, g);
      const ic = svgEl('g', { transform: 'translate(-12 -12)' }, g);
      icon(n[0] === 'files' ? 'folder' : n[0], ic, { class: 'ic' });
      const t = svgEl('text', { y: 54, 'text-anchor': 'middle', class: 's-fg', 'font-size': 12.5, 'font-weight': 500 }, g); t.textContent = n[1];
      const line = svgEl('path', { pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, class: 's-accs', 'stroke-width': 1.6, opacity: .7 }, lines);
      return { g, line, t };
    });
    const ringLinks = nodes.map(() => svgEl('path', { pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, class: 's-line', 'stroke-width': 1.2 }, secLinks));
    // lines to divisions
    const DIVS = ['Connected to home devices', 'Personal use and tools', 'Providing support in the work environment', 'Preparing files'];
    const dpos = [[235, 165], [965, 165], [235, 455], [965, 455]];
    const badges = DIVS.map((d, i) => {
      const g = svgEl('g', { opacity: 0 }, badgesG);
      const w = d.length * 8.4 + 44;
      svgEl('rect', { x: -w / 2, y: -20, width: w, height: 40, rx: 20, class: 's-fg-f' }, g);
      const t = svgEl('text', { y: 5, 'text-anchor': 'middle', class: 's-bg-t', 'font-size': 13.5, 'font-weight': 500 }, g); t.textContent = d;
      const line = svgEl('path', { pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, class: 's-line', 'stroke-width': 1.4 }, lines);
      return { g, line };
    });
    // ambient dots
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const dots = Array.from({ length: 22 }, () => { const a = rnd() * 6.28, r = .55 + rnd() * .45;
      const c = svgEl('circle', { r: 2.4 + rnd() * 2, class: 's-acc', opacity: 0, cx: 600 + Math.cos(a) * r * 520, cy: 360 + Math.sin(a) * r * 330 }, dotsG); return c; });

    // positions
    /* lower half of each ring is flattened so the tools never run into the caption block at the bottom-left */
    const polar = (i, rx, ry, off) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + (off || 0), sn = Math.sin(a); return { x: 600 + Math.cos(a) * rx, y: 360 + sn * ry * (sn > 0 ? .78 : 1) }; };
    const ringA = i => polar(i, 300, 205, 0), ringB = i => polar(i, 460, 262, .26);
    const clusterOf = [1, 1, 3, 3, 2, 2, 0, 0];   // devices,sensors→Home devices; email,calendar→Personal tools; docs,code→Work support; files,messages→Files
    const cpos = i => { const c = dpos[clusterOf[i]]; const k = i % 2 ? 1 : -1; return { x: c[0] + k * 62, y: c[1] + (clusterOf[i] < 2 ? 84 : -84) }; };
    const P0 = { x: 920, y: 372, s: .5 }, P2 = { x: 310, y: 372, s: .46 }, P4 = { x: 600, y: 360, s: .4 }, P5 = { x: 600, y: 360, s: .46 }, P6 = { x: 600, y: 360, s: .34 };

    // Every moving item is a plain {x,y,s,o} state written to its transform attribute.
    // (Deterministic, and immune to SVG transform-origin quirks.)
    const mk = (g, x, y, s, o) => ({ g, x, y, s, o });
    const mS = mk(mAnchor, P0.x, P0.y, P0.s, 1), sigS = mk(signal, 1090, 150, 1, 1), phS = mk(phone, 1000, 380, .85, 0), wvS = mk(wave, P0.x, P0.y - 40, 1, 0);
    const nS = nodes.map(n => mk(n.g, 900, 380, 0, 0)), bS = badges.map((b, i) => mk(b.g, dpos[i][0], dpos[i][1], .6, 0));
    const all = [mS, sigS, phS, wvS, ...nS, ...bS];
    const put = s => { const x = +s.x, y = +s.y, k = Math.max(+s.s, .001), o = Math.min(1, Math.max(0, +s.o)); s.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})`); s.g.setAttribute('opacity', o.toFixed(3)); };
    const putAll = () => all.forEach(put);
    putAll();

    // signal pulse (ambient)
    gsap.to(sr, { attr: { r: 34 }, opacity: 0, duration: 1.8, repeat: -1, ease: 'power2.out' });

    // activation on load: signal reaches CAL, CAL wakes
    const intro = gsap.timeline({ delay: .5, onUpdate: putAll });
    intro.from(sigS, { s: 0, duration: .7, ease: 'back.out(2)' })
      .to(sigS, { x: 985, y: 300, duration: .9, ease: 'power2.inOut' }, '+=.35')
      .add(() => { mas.setState('surprised'); gsap.fromTo(wave, { attr: { r: 30 } }, { attr: { r: 150 }, duration: 1.2, ease: 'power2.out' }); gsap.fromTo(wvS, { o: .7 }, { o: 0, duration: 1.2, ease: 'power2.out', onUpdate: putAll }); }, '>-.05')
      .to(sigS, { o: 0, s: .2, duration: .4 }, '<')
      .add(() => mas.setState('neutral'), '+=.9');
    let introDone = false; intro.eventCallback('onComplete', () => { introDone = true; });
    mas.setState('sleepy', 0);

    const link0 = svgEl('path', { pathLength: 1, 'stroke-dasharray': '0.02 0.03', class: 's-accs', 'stroke-width': 2, fill: 'none', opacity: 0 }, lines);
    gsap.to(link0, { attr: { 'stroke-dashoffset': -1 }, duration: 3, repeat: -1, ease: 'none' });
    const redraw = () => {
      putAll();
      nS.forEach((n, i) => {
        const bb = bS[clusterOf[i]], sx = mS.x + (bb.x - mS.x) * LK.k, sy = mS.y + (bb.y - mS.y) * LK.k;
        nodes[i].line.setAttribute('d', `M${sx.toFixed(1)} ${sy.toFixed(1)} L${n.x.toFixed(1)} ${n.y.toFixed(1)}`);
        const nx = nS[(i + 1) % 8]; ringLinks[i].setAttribute('d', `M${n.x} ${n.y} L${nx.x} ${nx.y}`);
      });
      bS.forEach((b, i) => badges[i].line.setAttribute('d', `M${mS.x} ${mS.y} L${b.x} ${b.y}`));
      link0.setAttribute('d', `M${mS.x + 90} ${mS.y} L${phS.x - 128} ${phS.y}`);
      lmg.setAttribute('transform', `translate(${mS.x.toFixed(1)} ${mS.y.toFixed(1)}) scale(${Math.max(mS.s, .001).toFixed(3)})`);
    };

    // ---- master timeline, 0..100 mapped to scroll ----
    const LK = { k: 0 };   /* 0 = tool lines start at the avatar, 1 = they start at their division badge */
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: redraw });
    const T = (t, v, at) => tl.to(t, v, at);
    const hero = $('.hero-copy'), hint = $('.scroll-hint');
    T(hero, { opacity: 0, y: -36, duration: 6, ease: 'none' }, 2); if (hint) T(hint, { opacity: 0, duration: 3 }, 1);
    // S1 signal / wake (8-22): CAL leans in to listen
    T(mS, { x: 880, y: 372, s: .6, duration: 10 }, 8);
    // S2 phone (22-38)
    T(mS, { x: P2.x, y: P2.y, s: P2.s, duration: 14 }, 22);
    T(phS, { o: 1, x: 880, y: 372, s: 1, duration: 12 }, 24);
    // S3 task (38-54)
    T(link0, { opacity: 1, duration: 4 }, 34);
    T(reqBox, { attr: { opacity: 1 }, duration: 3 }, 38);
    rows.forEach((r, i) => { T(r.g, { attr: { opacity: 1 }, duration: 3 }, 42 + i * 3.2); T(r.ck, { attr: { opacity: 1 }, duration: 2 }, 45 + i * 3.2); });
    // S4 connect (54-68): the phone becomes the network
    T(link0, { opacity: 0, duration: 3 }, 54);
    T(mS, { x: P4.x, y: P4.y, s: P4.s, duration: 10 }, 54);
    T(phS, { x: 600, y: 360, s: .12, o: 0, duration: 10 }, 54);
    nodes.forEach((n, i) => {
      const a = ringA(i); T(nS[i], { x: a.x, y: a.y, s: 1, o: 1, duration: 9, ease: 'back.out(1.1)' }, 57 + i * .5);
      T(n.line, { attr: { 'stroke-dashoffset': 0 }, duration: 6 }, 61 + i * .5);
    });
    // S5 expand (68-80)
    nodes.forEach((n, i) => { const b = ringB(i); T(nS[i], { x: b.x, y: b.y, duration: 11 }, 68); });
    ringLinks.forEach((l, i) => T(l, { attr: { 'stroke-dashoffset': 0 }, duration: 8 }, 70 + i * .4));
    T(mS, { s: P5.s, duration: 8 }, 68);
    dots.forEach((d, i) => T(d, { attr: { opacity: .55 }, duration: 5 }, 70 + (i % 8) * .6));
    // S6 divisions (80-92)
    nodes.forEach((n, i) => { const c = cpos(i); T(nS[i], { x: c.x, y: c.y, s: .82, duration: 11 }, 80); T(n.t, { attr: { opacity: 0 }, duration: 3 }, 80); });
    ringLinks.forEach(l => T(l, { opacity: 0, duration: 4 }, 80));
    dots.forEach(d => T(d, { attr: { opacity: 0 }, duration: 5 }, 80));
    T(mS, { s: P6.s, duration: 8 }, 80);
    T(LK, { k: 1, duration: 10 }, 81);
    badges.forEach((b, i) => { T(bS[i], { o: 1, s: 1, duration: 5 }, 84 + i * .8); T(b.line, { attr: { 'stroke-dashoffset': 0 }, duration: 5 }, 85 + i * .8); });
    // S7 converge (92-100)
    nodes.forEach((n, i) => { T(nS[i], { x: 600, y: 360, s: 0, o: 0, duration: 6 }, 92); T(n.line, { attr: { 'stroke-dashoffset': 1 }, duration: 5 }, 92); });
    badges.forEach((b, i) => { T(bS[i], { x: 600, y: 360, s: 0, o: 0, duration: 6 }, 92); T(b.line, { attr: { 'stroke-dashoffset': 1 }, duration: 5 }, 92); });
    T(LK, { k: 0, duration: 6 }, 92);
    T(mS, { x: P0.x, y: P0.y, s: P0.s * 1.05, duration: 8 }, 92);
    tl.to({}, { duration: .01 }, 100);


    // captions
    const capWrap = $('.caps');
    const caps = SCENES.slice(1).map((sc, i) => {
      const d = document.createElement('div'); d.className = 'cap';
      d.innerHTML = `<h3>${sc.t}</h3><p>${sc.p}</p>` + (i === 6 ? `<div class="cta-row" style="margin-top:22px;pointer-events:auto"><a class="btn btn-primary" href="${CFG.DEPLOY_URL || 'waitlist/index.html'}">Deploy CAL to your system</a></div>` : '');
      capWrap.appendChild(d); return d;
    });
    const capWin = [[10, 22], [22, 38], [38, 54], [54, 68], [68, 80], [80, 92], [94, 101]];
    capWin.forEach((w, i) => {
      const dur = 3;
      tl.fromTo(caps[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: dur, ease: 'power2.out' }, w[0] + 1);
      if (i < 6) tl.to(caps[i], { opacity: 0, y: -14, duration: dur, ease: 'power2.in' }, w[1] - 3);
    });

    // state mapping + progress UI
    const bounds = [[0, 8, null], [8, 22, 'listening'], [22, 38, 'thinking'], [38, 54, 'focused'], [54, 68, 'neutral'], [68, 80, 'happy'], [80, 92, 'neutral'], [92, 101, 'wink']];
    const bar = $('.jbar i');
    ScrollTrigger.create({
      trigger: journey, start: 'top top', end: 'bottom bottom', scrub: .7, animation: tl,
      onUpdate: self => {
        const p = self.progress * 100;
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
        if (!introDone && p > 1) { intro.progress(1); introDone = true; }
        const b = bounds.find(b => p >= b[0] && p < b[1]);
        if (b && b[2]) mas.setState(b[2]); else if (p < 8 && introDone) mas.setState('neutral');
      }
    });
    redraw();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* =========================================================
     COMPARE — traditional vs CAL, a connected sequence
  ========================================================= */
  const cmp = $('.cmp');
  if (cmp) {
    const run = () => $$('.track', cmp).forEach((tr, ti) => {
      const st = $$('.st', tr); const steps = $('.steps', tr);
      st.forEach(s => s.classList.remove('on')); steps.style.setProperty('--fill', 0);
      const delay = ti ? 700 + $$('.track', cmp)[0].querySelectorAll('.st').length * 520 : 0;
      st.forEach((s, i) => setTimeout(() => { s.classList.add('on'); steps.style.setProperty('--fill', (i) / (st.length - 1)); }, delay + i * 520));
    });
    whenVisible(cmp, run, .3);
    const rb = $('[data-replay="cmp"]'); if (rb) rb.addEventListener('click', run);
  }

  /* =========================================================
     VOICE DEMO — illustrative scenarios (no microphone access)
  ========================================================= */
  const demo = $('#voice-demo');
  if (demo) {
    const CMDS = [
      { k: 'clinic', label: 'Call the clinic', say: 'Hey CAL, call the clinic and help me arrange an appointment.', intent: 'Arrange a clinic appointment', task: 'Contact clinic, propose times', tool: 'Phone + calendar (with your approval)', prog: 'Preparing call script, checking your calendar', res: ['Waiting for your approval', 'Three possible time slots found. Nothing is booked until you confirm.'] },
      { k: 'files', label: 'Organize my files', say: 'Hey CAL, organize my files.', intent: 'Tidy a folder', task: 'Group files by project and date', tool: 'File storage you connected', prog: 'Scanning 148 items (sample)', res: ['Proposed structure ready', 'Review the plan first. Files move only after you accept.'] },
      { k: 'mail', label: 'Summarize emails', say: 'Hey CAL, summarize today\u2019s important emails.', intent: 'Summarize inbox', task: 'Rank by importance, draft summary', tool: 'Email account you connected', prog: 'Reading today\u2019s messages', res: ['Summary ready', 'Five items need a reply; two are time-sensitive. Drafts are saved, not sent.'] },
      { k: 'meet', label: 'Prepare for my meeting', say: 'Hey CAL, help me prepare for my meeting.', intent: 'Meeting preparation', task: 'Gather notes, agenda, open questions', tool: 'Calendar + documents', prog: 'Collecting context from your notes', res: ['Briefing ready', 'One-page brief with agenda, past decisions and three suggested questions.'] },
      { k: 'trans', label: 'Translate this message', say: 'Hey CAL, translate this message.', intent: 'Translate text', task: 'Detect language, translate, check tone', tool: 'Language models', prog: 'Translating and matching tone', res: ['Translation ready', 'Shown beside the original so you can check meaning before sending.'] },
      { k: 'appt', label: 'Find a suitable appointment', say: 'Hey CAL, find a suitable appointment.', intent: 'Find a time that works', task: 'Compare availability and preferences', tool: 'Calendar + provider options', prog: 'Comparing availability', res: ['Options shortlisted', 'Three times fit your calendar. You choose; CAL does the rest.'] },
      { k: 'doc', label: 'Explain this document', say: 'Hey CAL, explain this document to me.', intent: 'Explain a document', task: 'Read, simplify, highlight what matters', tool: 'Document you share', prog: 'Reading and simplifying', res: ['Plain-language version ready', 'Key points, deadlines and anything that needs your decision, in short sentences.'] },
      { k: 'cmp', label: 'Compare these options', say: 'Hey CAL, help me compare these options.', intent: 'Compare options', task: 'Build a side-by-side with trade-offs', tool: 'Research + your notes', prog: 'Gathering criteria', res: ['Comparison ready', 'A short table, a recommendation, and the assumptions behind it.'] }
    ];
    const STAGES = ['Voice activation', 'Understanding intent', 'Identifying the task', 'Connecting an authorized tool', 'Showing progress', 'Task status'];
    const cmdBox = $('.cmds'), sayEl = $('.say', demo), pipe = $('.pipe', demo), result = $('.result', demo), waveEl = $('.wave', demo), dm = $('[data-dm]', demo), status = $('.dev-status', demo);
    const bars = Array.from({ length: 30 }, () => { const i = document.createElement('i'); waveEl.appendChild(i); return i; });
    const dmx = mascotSVG('neutral', 'mascot-sm', { idle: false }); dm.replaceWith(dmx.svg); dmx.svg.setAttribute('aria-hidden', 'true');
    /* fixed-height rows: the detail line is reserved up front, so rows never change size as the task runs */
    pipe.innerHTML = STAGES.map((s, i) => `<li data-i="${i}"><span class="d"></span><span><span class="lb">${s}</span><span class="dt"></span></span></li>`).join('');
    const rows = $$('li', pipe);
    let timers = [], waveOn = false, raf = 0;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    /* One attribute drives the whole card: idle -> listening -> working -> done (see .device[data-state] in the CSS). */
    const setState = (st, label) => { demo.dataset.state = st; status.textContent = label; };
    const animateWave = t => {
      bars.forEach((b, i) => { const a = waveOn ? (Math.sin(t / 130 + i * .6) * .5 + .5) * (Math.sin(t / 370 + i) * .5 + .5) : 0; b.style.height = (6 + a * 46) + 'px'; });
      raf = requestAnimationFrame(animateWave);
    };
    if (!reduce) raf = requestAnimationFrame(animateWave);
    CMDS.forEach((c, i) => { const b = document.createElement('button'); b.className = 'cmd'; b.type = 'button'; b.textContent = c.label; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => play(i)); cmdBox.appendChild(b); });
    const cursor = document.createElement('span'); cursor.className = 'cursor';

    function play(i) {
      clear(); const c = CMDS[i];
      $$('.cmd', cmdBox).forEach((b, j) => b.setAttribute('aria-pressed', j === i));
      /* 1. clean slate */
      rows.forEach(li => { li.className = ''; $('.dt', li).textContent = ''; });
      result.classList.remove('show'); sayEl.textContent = '';
      /* 2. the user says "Hey CAL, ..." */
      setState('listening', 'Listening\u2026'); dmx.setState('listening'); waveOn = true;
      const full = c.say, speed = reduce ? 0 : 26; let n = 0;
      const type = () => { sayEl.textContent = full.slice(0, n); if (n < full.length) { sayEl.appendChild(cursor); n++; later(type, speed); } };
      if (reduce) sayEl.textContent = full; else type();
      /* 3. the phone works through the request, one step at a time */
      const base = reduce ? 80 : full.length * speed + 450, step = reduce ? 60 : 850;
      const det = ['Heard \u201CHey CAL\u201D', c.intent, c.task, c.tool, c.prog, c.res[0]];
      const faces = ['listening', 'thinking', 'thinking', 'focused', 'focused', 'happy'];
      STAGES.forEach((_, s) => later(() => {
        rows.forEach((li, k) => { li.className = k < s ? 'done' : k === s ? (s === 5 ? 'done' : 'act') : ''; });
        $('.dt', rows[s]).textContent = det[s];
        dmx.setState(faces[s]);
        if (s === 1) { waveOn = false; setState('working', 'Working on it\u2026'); }
        if (s === 5) { setState('done', 'Done'); result.innerHTML = `<strong>${c.res[0]}</strong>${c.res[1]}`; result.classList.add('show'); }
      }, base + s * step));
    }
    whenVisible(demo, () => play(0), .3);
  }

  /* =========================================================
     ECOSYSTEM — categories, not a wall of logos
  ========================================================= */
  const eco = $('#eco');
  if (eco) {
    const CATS = [
      { n: 'Email & calendars', i: 'mail', d: 'Triage, draft and schedule across the inboxes and calendars you connect.', l: ['Summarize and prioritize', 'Draft replies for your review', 'Find and propose meeting times'], lg: [['gmail', 'Gmail'], ['outlook', 'Outlook & Hotmail'], ['google-calendar', 'Google Calendar'], ['yahoo', 'Yahoo Mail'], ['protonmail', 'Proton Mail'], ['apple', 'Apple Mail']] },
      { n: 'Messaging', i: 'chat', d: 'Keep conversations moving: summaries, replies, translations.', l: ['Summarize long threads', 'Translate and match tone'], lg: [['whatsapp', 'WhatsApp'], ['telegram', 'Telegram'], ['slack', 'Slack'], ['teams', 'Microsoft Teams'], ['discord', 'Discord'], ['messenger', 'Messenger'], ['signal', 'Signal']] },
      { n: 'Documents & productivity', i: 'doc', d: 'Prepare, review and organize documents, notes and slides.', l: ['Explain and simplify a document', 'Prepare notes and briefs'], lg: [['google-docs', 'Google Docs'], ['word', 'Word'], ['excel', 'Excel'], ['notion', 'Notion'], ['google-drive', 'Google Drive'], ['dropbox', 'Dropbox'], ['onedrive', 'OneDrive'], ['evernote', 'Evernote']] },
      { n: 'Development tools', i: 'code', d: 'Assist coding and coordinate with development workflows.', l: ['Coding assistance', 'Coordinate with other AI agents'], lg: [['github', 'GitHub'], ['gitlab', 'GitLab'], ['vscode', 'VS Code'], ['docker', 'Docker'], ['jira', 'Jira'], ['linear', 'Linear'], ['figma', 'Figma'], ['postman', 'Postman']] },
      { n: 'Marketing', i: 'mega', d: 'Plan and produce content and campaigns, with a human approving.', l: ['Draft content', 'Organize campaign work'], lg: [['mailchimp', 'Mailchimp'], ['hubspot', 'HubSpot'], ['meta', 'Meta'], ['google-ads', 'Google Ads'], ['linkedin', 'LinkedIn'], ['canva', 'Canva'], ['buffer', 'Buffer'], ['semrush', 'Semrush']] },
      { n: 'Research', i: 'search', d: 'Find, compare and summarize information, with sources you can check.', l: ['Gather and compare options', 'Summaries with references'], lg: [['google', 'Google'], ['perplexity', 'Perplexity'], ['google-scholar', 'Google Scholar'], ['wikipedia', 'Wikipedia'], ['arxiv', 'arXiv'], ['pubmed', 'PubMed'], ['zotero', 'Zotero'], ['mendeley', 'Mendeley']] },
      { n: 'Communication', i: 'phone', d: 'Help with calls and messages to people and services, with your approval.', l: ['Prepare call scripts', 'Calling on your behalf'], lg: [['zoom', 'Zoom'], ['google-meet', 'Google Meet'], ['teams', 'Microsoft Teams'], ['skype', 'Skype'], ['twilio', 'Twilio'], ['webex', 'Webex'], ['viber', 'Viber'], ['google-chat', 'Google Chat']] },
      { n: 'Smart devices', i: 'home', d: 'Work with compatible household devices you choose to connect.', l: ['Compatible-device control'], lg: [['google-home', 'Google Home'], ['home-assistant', 'Home Assistant'], ['philips-hue', 'Philips Hue'], ['smartthings', 'SmartThings'], ['sonos', 'Sonos'], ['xiaomi', 'Xiaomi'], ['ikea', 'IKEA']] },
      { n: 'Cameras & sensors', i: 'camera', d: 'Receive alerts from supported sensors, only for events you configure.', l: ['Configured-event alerts'], lg: [['ring', 'Ring'], ['arlo', 'Arlo'], ['home-assistant', 'Home Assistant'], ['raspberry-pi', 'Raspberry Pi'], ['arduino', 'Arduino'], ['smartthings', 'SmartThings']] },
      { n: 'Business applications', i: 'brief', d: 'Connect to the systems teams already run, through authorized access.', l: ['CRM and support workflows', 'Reporting and handoffs'], lg: [['salesforce', 'Salesforce'], ['sap', 'SAP'], ['monday', 'monday.com'], ['quickbooks', 'QuickBooks'], ['stripe', 'Stripe'], ['shopify', 'Shopify'], ['asana', 'Asana'], ['trello', 'Trello']] }
    ];
    const svg = $('.eco-svg', eco); const cx = 320, cy = 280;
    const gl = svgEl('g', {}, svg), gn = svgEl('g', {}, svg), gd = svgEl('g', {}, svg);
    const emask = svgEl('mask', { id: 'ecomask', maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 1040, height: 760, style: 'mask-type:luminance' }, svgEl('defs', {}, svg));
    svgEl('rect', { x: -200, y: -200, width: 1040, height: 760, fill: '#fff' }, emask);
    const esil = svgEl('g', { transform: `translate(${cx} ${cy}) scale(.2) translate(-325 -285)` }, emask);
    svgEl('path', { d: BODY, fill: '#000', stroke: '#000', 'stroke-width': 44, 'stroke-linejoin': 'round' }, esil); svgEl('path', { d: FOLD, fill: '#000' }, esil);
    gl.setAttribute('mask', 'url(#ecomask)'); gd.setAttribute('mask', 'url(#ecomask)');
    const hub = svgEl('g', { transform: `translate(${cx} ${cy}) scale(.2)`, class: 'hubm', style: 'color:var(--mascot)' }, svg);
    const hm = buildMascot({ centered: true, state: 'neutral', idle: false }); hub.appendChild(hm.g);
    const nodes = [], links = [], dots = [];
    CATS.forEach((c, i) => {
      const a = (i / CATS.length) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(a) * 250, y = cy + Math.sin(a) * 205;
      const link = svgEl('path', { d: `M${cx} ${cy} Q${(cx + x) / 2 + (y - cy) * .12} ${(cy + y) / 2 - (x - cx) * .12} ${x} ${y}`, class: 'link' }, gl); links.push(link);
      const g = svgEl('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': c.n, transform: `translate(${x} ${y})` }, gn);
      svgEl('circle', { r: 31, class: 'ring' }, g);
      icon(c.i, svgEl('g', { transform: 'translate(-12 -12)' }, g), { class: 'ic' });
      const t = svgEl('text', { y: 52 }, g); t.textContent = c.n.length > 18 ? c.n.split(' & ')[0] : c.n;
      g.addEventListener('click', () => sel(i)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(i); } });
      g.addEventListener('mouseenter', () => { if (fine) sel(i); });
      nodes.push(g);
      const dot = svgEl('circle', { r: 3.4, class: 'dot', opacity: 0 }, gd); dots.push({ dot, link });
    });
    if (hasG && !reduce) dots.forEach((d, i) => {
      const len = d.link.getTotalLength(); const o = { t: 0 };
      gsap.to(o, { t: 1, duration: 3 + (i % 3) * .5, repeat: -1, delay: i * .3, ease: 'none', onUpdate: () => {
        const p = d.link.getPointAtLength(len * o.t); d.dot.setAttribute('cx', p.x); d.dot.setAttribute('cy', p.y); d.dot.setAttribute('opacity', Math.sin(o.t * Math.PI) * .9); } });
    });
    const panel = $('.eco-panel', eco);
    function sel(i) {
      const c = CATS[i];
      nodes.forEach((n, j) => { n.classList.toggle('sel', j === i); links[j].classList.toggle('sel', j === i); });
      panel.innerHTML = `<h3 class="h3">${c.n}</h3><p class="muted">${c.d}</p><ul>${c.l.map(x => `<li>${x}</li>`).join('')}</ul>
        <div class="logos" aria-label="Example tools">${c.lg.map((x, k) => `<span class="lg" style="--i:${k}" title="${x[1]}"><span class="tile"><img src="assets/logos/${x[0]}.svg" alt="${x[1]}" width="30" height="30" loading="lazy"></span><small>${x[1]}</small></span>`).join('')}</div>
        <a class="btn btn-ghost eco-more" href="integrations/index.html">And 5,000+ more tools <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`;
      hm.setState(['thinking', 'focused', 'listening', 'neutral'][i % 4]);
    }
    sel(0);
  }

  /* =========================================================
     ACCESSIBILITY tabs
  ========================================================= */
  const acc = $('#acc');
  if (acc) {
    const V = {
      doc: `<div class="ba"><div class="before"><h5>Before</h5>The party of the first part shall indemnify and hold harmless the party of the second part against any and all claims arising hereunder, notwithstanding any provision to the contrary, save where otherwise stipulated in Schedule B&hellip;</div><div class="after"><h5>With CAL</h5><strong>In short:</strong> if something goes wrong, you pay for it, unless Schedule B says otherwise. <br><br><strong>Needs your decision:</strong> whether you accept Schedule B. <br><span class="muted" style="font-size:12.5px">Explanations are not legal advice.</span></div></div>`,
      doctor: `<div class="bubble a">Hallo, womit kann ich helfen?<small>Doctor, original language</small></div><div class="bubble b">Hello, how can I help?<small>CAL, in your language</small></div><div class="bubble a">Seit drei Tagen habe ich Husten.<small>You, spoken</small></div><div class="bubble b">I have had a cough for three days.<small>CAL to the doctor, for you to confirm</small></div><p class="muted" style="font-size:12.5px">Translation support, not medical advice. A qualified person should handle anything urgent.</p>`,
      voice: `<div style="text-align:center;padding:28px 0"><div class="wave" style="height:72px" id="accwave"></div><p class="say" style="min-height:0;font-size:20px">\u201CRead me the next step.\u201D</p><p class="muted" style="margin-top:14px;font-size:14px">No menus. No small buttons. You speak; CAL answers in a calm, clear voice.</p></div>`,
      lang: `<div class="ba"><div class="before"><h5>Original</h5>Votre rendez-vous est confirm\u00E9 pour jeudi \u00E0 14 h. Merci d\u2019apporter votre carte d\u2019identit\u00E9.</div><div class="after"><h5>With CAL</h5>Your appointment is confirmed for Thursday at 2 pm. Please bring your ID card.<br><br><span class="muted" style="font-size:12.5px">Tone: polite, formal.</span></div></div>`
    };
    const tabs = $$('.tab', acc), view = $('.acc-view', acc);
    const show = k => { tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.k === k)); view.innerHTML = V[k];
      const w = $('#accwave'); if (w) { for (let i = 0; i < 26; i++) { const b = document.createElement('i'); b.style.height = (10 + Math.abs(Math.sin(i * .7)) * 44) + 'px'; w.appendChild(b); } } };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.k)));
    tabs.forEach(t => t.addEventListener('keydown', e => { const i = tabs.indexOf(t); if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); show(tabs[(i + 1) % tabs.length].dataset.k); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i + tabs.length - 1) % tabs.length].focus(); show(tabs[(i + tabs.length - 1) % tabs.length].dataset.k); } }));
    show('doc');
  }

  /* ---------- how it works ---------- */
  const how = $('.how');
  if (how) whenVisible(how, () => { const hw = $$('.hw', how); hw.forEach((h, i) => setTimeout(() => { h.classList.add('on'); how.style.setProperty('--fill', i / (hw.length - 1)); }, i * 700)); }, .3);

  /* ---------- personal cloud art ---------- */
  const cl = $('#cloud-art');
  if (cl) {
    const svg = svgEl('svg', { viewBox: '0 0 520 520', role: 'img', 'aria-label': 'A private environment around CAL, with permission-controlled connection points' }, cl);
    const defs = svgEl('defs', {}, svg);
    const rg = svgEl('radialGradient', { id: 'cg' }, defs); svgEl('stop', { offset: '0', 'stop-color': 'var(--accent)', 'stop-opacity': .28 }, rg); svgEl('stop', { offset: '1', 'stop-color': 'var(--accent)', 'stop-opacity': 0 }, rg);
    svgEl('circle', { cx: 260, cy: 260, r: 250, fill: 'url(#cg)' }, svg);
    svgEl('circle', { cx: 260, cy: 260, r: 200, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round', opacity: .7 }, svg);
    svgEl('circle', { cx: 260, cy: 260, r: 150, fill: 'color-mix(in srgb,var(--accent) 6%,transparent)', stroke: 'var(--line-strong)' }, svg);
    const a = svgEl('g', { class: 'ring-a' }, svg), b = svgEl('g', { class: 'ring-b' }, svg);
    for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2; svgEl('circle', { cx: 260 + Math.cos(t) * 200, cy: 260 + Math.sin(t) * 200, r: 5, fill: 'var(--accent)' }, a); }
    for (let i = 0; i < 4; i++) { const t = i / 4 * Math.PI * 2 + .4; svgEl('circle', { cx: 260 + Math.cos(t) * 150, cy: 260 + Math.sin(t) * 150, r: 3.5, fill: 'var(--fg)', opacity: .6 }, b); }
    const gates = [['Mail', -.5], ['Calendar', .55], ['Devices', 2.2], ['Files', 3.7]];
    gates.forEach(g => { const x = 260 + Math.cos(g[1]) * 235, y = 260 + Math.sin(g[1]) * 235; const grp = svgEl('g', { transform: `translate(${x} ${y})` }, svg);
      svgEl('rect', { x: -34, y: -15, width: 68, height: 30, rx: 15, fill: 'var(--surface)', stroke: 'var(--line-strong)' }, grp);
      const t = svgEl('text', { y: 4.5, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 500, fill: 'var(--fg)', 'font-family': 'var(--font)' }, grp); t.textContent = g[0];
      svgEl('path', { d: `M${-Math.cos(g[1]) * 34} ${-Math.sin(g[1]) * 34} L${-Math.cos(g[1]) * 70} ${-Math.sin(g[1]) * 70}`, stroke: 'var(--accent)', 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '3 5' }, grp); });
    const mg = svgEl('g', { transform: 'translate(260 262) scale(.2)', style: 'color:var(--mascot)' }, svg);
    const mm = buildMascot({ centered: true, state: 'neutral' }); mg.appendChild(mm.g);
    whenVisible(cl, () => { mm.setState('happy'); setTimeout(() => mm.setState('neutral'), 2200); });
  }

  /* ---------- video ---------- */
  const vid = $('.vid');
  if (vid) {
    const v = $('video', vid), play = $('.vplay', vid), big = $('.vid-big', vid), bar = $('.bar', vid), fill = $('.bar i', vid), tm = $('time', vid);
    const M = CFG.MEDIA || {};
    if (M.video && v.getAttribute('src') !== M.video) v.setAttribute('src', M.video);
    if (M.poster) v.setAttribute('poster', M.poster);
    const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
    const toggle = () => v.paused ? v.play().catch(() => {}) : v.pause();
    play.addEventListener('click', toggle); big.addEventListener('click', toggle); v.addEventListener('click', toggle);
    v.addEventListener('play', () => { vid.classList.add('playing'); play.setAttribute('aria-label', 'Pause video'); play.querySelector('svg').innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'; });
    v.addEventListener('pause', () => { play.setAttribute('aria-label', 'Play video'); play.querySelector('svg').innerHTML = '<path d="M7 4l13 8-13 8z"/>'; });
    v.addEventListener('timeupdate', () => { fill.style.width = (v.currentTime / v.duration * 100 || 0) + '%'; tm.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration); });
    bar.addEventListener('click', e => { const r = bar.getBoundingClientRect(); v.currentTime = (e.clientX - r.left) / r.width * v.duration; });
    bar.addEventListener('keydown', e => { if (e.key === 'ArrowRight') v.currentTime += 5; if (e.key === 'ArrowLeft') v.currentTime -= 5; });
    v.addEventListener('error', () => vid.classList.add('missing'));
    const src = v.querySelector('source'); if (src) src.addEventListener('error', () => vid.classList.add('missing'));
  }

  /* ---------- scenarios (division pages) ---------- */
  $$('[data-scn]').forEach(card => {
    const items = $$('.scn-steps li', card); const mm = $('svg.mascot', card);
    const seq = (card.dataset.seq || 'listening,thinking,focused,focused,happy').split(',');
    const mi = hydrated.find(h => h.svg === mm); let timers = [];
    const play = () => { timers.forEach(clearTimeout); timers = []; items.forEach(li => li.classList.remove('on'));
      items.forEach((li, i) => timers.push(setTimeout(() => { li.classList.add('on'); if (mi) mi.setState(seq[Math.min(i, seq.length - 1)]); }, reduce ? 0 : 700 + i * 950))); };
    whenVisible(card, play, .4);
    const rb = $('.replay', card); if (rb) rb.addEventListener('click', play);
  });

  /* ---------- forms ---------- */
  $$('form[data-form]').forEach(form => {
    const kind = form.dataset.form; const status = $('.status', form); const btn = $('button[type=submit]', form);
    const url = kind === 'waitlist' ? CFG.WAITLIST_ENDPOINT : CFG.CONTACT_ENDPOINT;
    const say = (msg, cls) => { status.textContent = msg; status.className = 'status show ' + cls; status.setAttribute('role', cls === 'bad' ? 'alert' : 'status'); };
    const err = (f, msg) => { const i = $('[name=' + f + ']', form); if (!i) return; const e = i.closest('.field').querySelector('.err'); if (e) e.textContent = msg || ''; i.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    const q = new URLSearchParams(location.search).get('topic'); const ts = $('[name=topic]', form); if (q && ts) ts.value = q;
    form.addEventListener('submit', async e => {
      e.preventDefault(); status.className = 'status';
      const d = Object.fromEntries(new FormData(form).entries()); let ok = true;
      ['email', 'name', 'message'].forEach(f => err(f, ''));
      if (!d.email || !d.email.trim()) { err('email', 'Please enter your email address.'); ok = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) { err('email', 'That email address doesn\u2019t look right.'); ok = false; }
      if (kind === 'contact') { if (!d.name || !d.name.trim()) { err('name', 'Please tell us your name.'); ok = false; } if (!d.message || d.message.trim().length < 10) { err('message', 'Please add a few words about what you need.'); ok = false; } }
      if (kind === 'waitlist' && !form.elements.consent.checked) { say('Please tick the consent box so we know it\u2019s OK to email you.', 'bad'); ok = false; }
      if (!ok) { const first = $('[aria-invalid=true]', form); if (first) first.focus(); return; }
      if (d.website) return; // honeypot
      if (!url) { say(kind === 'waitlist' ? 'The waitlist isn\u2019t connected to a registration service yet, so your email was not saved. Please try again later.' : 'The contact form isn\u2019t connected yet, so your message was not sent.' + (CFG.SALES_EMAIL ? ' You can email ' + CFG.SALES_EMAIL + ' instead.' : ''), 'bad'); return; }
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending\u2026';
      try {
        const body = new URLSearchParams();
        Object.entries(Object.assign({}, d, { consent: !!(form.elements.consent && form.elements.consent.checked), source: location.pathname, form: kind })).forEach(([k, v]) => body.append(k, v));
        const res = await fetch(url, { method: 'POST', body });
        if (!res.ok) throw new Error(res.status);
        const out = await res.json();
        if (!out || out.result !== 'success') throw new Error((out && out.message) || 'failed');
        say(kind === 'waitlist' ? 'You\u2019re on the list. We\u2019ll be in touch when there\u2019s something to try.' : 'Thanks. Your message has been sent.', 'ok'); form.reset();
      } catch (x) { say('Something went wrong and your details were not saved. Please try again in a moment.', 'bad'); }
      finally { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
