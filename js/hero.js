/* CAL — header menus, download menu and the interactive desktop demo */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Solutions button: scroll to the "Four divisions. One CAL." section (from other pages: open it on the home page) */
  const SITE_ROOT = new URL('../', document.currentScript ? document.currentScript.src : location.href);
  const divTop = el => el.getBoundingClientRect().top + window.pageYOffset - 76;
  function goDivisions() {
    const el = document.getElementById('divisions');
    if (el) { window.scrollTo({ top: divTop(el), behavior: 'smooth' }); history.replaceState(null, '', '#divisions'); }
    else location.href = new URL('index.html#divisions', SITE_ROOT).href;
  }
  /* arriving with #divisions: wait for the pinned hero to be measured, then land exactly on the section */
  if (location.hash === '#divisions') window.addEventListener('load', () => setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    const el = document.getElementById('divisions'); if (el) window.scrollTo({ top: divTop(el), behavior: 'auto' });
  }, 350));

  /* Solutions dropdown + download split-button */
  function menu(root, btn) {
    if (!root || !btn) return;
    const set = o => { root.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
    const toDivisions = root.classList.contains('dd') && /^\s*Solutions/.test(btn.textContent) && matchMedia('(hover:hover)').matches;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (toDivisions) { set(false); goDivisions(); return; }
      set(!root.classList.contains('open'));
    });
    document.addEventListener('click', e => { if (!root.contains(e.target)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    if (matchMedia('(hover:hover)').matches && root.classList.contains('dd')) {
      let t; root.addEventListener('mouseenter', () => { clearTimeout(t); set(true); });
      root.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 160); });
    }
  }
  $$('.dd').forEach(d => menu(d, $('.dd-b', d)));
  menu($('#dl'), $('#dl .split-arrow'));
  /* platform options are not released yet: they look closed and do nothing */
  $$('#dl .dl-m a').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  /* Hero subtitle: cycles through its lines every 4s. The lines share one grid cell (.lead-rot),
     so the tallest sets the height and nothing below ever shifts. */
  (function () {
    const box = $('#lead-rot'); if (!box) return;
    const items = $$('p', box);
    if (items.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0, timer = 0;
    const next = () => {
      const out = items[i]; i = (i + 1) % items.length; const inn = items[i];
      out.classList.remove('is-on'); out.classList.add('is-out'); out.setAttribute('aria-hidden', 'true');
      inn.classList.remove('is-out'); inn.classList.add('is-on'); inn.removeAttribute('aria-hidden');
      setTimeout(() => out.classList.remove('is-out'), 700);   /* park it below, ready for its next entrance */
    };
    const start = () => { if (!timer) timer = setInterval(next, 4000); };
    const stopT = () => { clearInterval(timer); timer = 0; };
    document.addEventListener('visibilitychange', () => document.hidden ? stopT() : start());
    start();
  })();

  /* Desktop demo: simulated, local only. Three scenes, played in a loop while visible. */
  const desk = $('#desk'); if (!desk) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const say = $('.say', desk), toastEl = $('.toast', desk), tt = $('#tt', desk);
  const W = id => $('#w-' + id, desk);
  let run = 0;
  const wait = async (ms, id) => { await new Promise(r => setTimeout(r, ms)); if (id !== run) throw 0; };
  const eye = (x, y) => { desk.style.setProperty('--ex', x); desk.style.setProperty('--ey', y); };
  const flag = (k, on) => desk.dataset[k] = on ? 'on' : 'off';
  const pop = (el, on) => { el.classList.toggle('show', on); el.setAttribute('aria-hidden', !on); };
  const toast = t => { tt.textContent = t; toastEl.classList.add('show'); };
  async function speak(t, id) { say.hidden = false; say.classList.remove('ok'); say.textContent = ''; for (const ch of t) { say.textContent += ch; await wait(26, id); } }
  /* CAL always lands first; only afterwards does anything else happen */
  async function wake(id) { flag('cal', 1); await wait(900, id); }
  async function rest(id) { flag('wave', 0); flag('proc', 0); say.hidden = true; eye(0, 0); await wait(300, id); flag('cal', 0); await wait(900, id); }
  async function listen(id) { flag('wave', 1); flag('cal', 1); await wait(500, id); eye(-4, 0); await wait(650, id); eye(4, 0); await wait(650, id); eye(0, 0); await wait(450, id); flag('wave', 0); flag('proc', 1); say.hidden = true; }
  const clock = () => { const d = new Date(); const c = $('#clock', desk), t = $('#dt', desk); if (c) c.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); if (t) t.textContent = d.toLocaleDateString('en-GB'); };
  clock(); setInterval(clock, 30000);
  function clean() { flag('cal', 0); ['phone', 'browser', 'mail'].forEach(n => pop(W(n), false)); toastEl.classList.remove('show'); W('phone').classList.remove('live'); flag('wave', 0); flag('proc', 0); say.hidden = true; eye(0, 0); $$('.tile', desk).forEach(t => t.classList.remove('sp')); $('#mbody', desk).textContent = ''; $('#msend', desk).className = 'msend'; $('.lbl', $('#msend', desk)).textContent = 'Send'; }

  async function scenes(id) {
    clean(); flag('cal', 0); await wait(1300, id);
    await wake(id);
    /* Scene 1: gym */
    await speak('\u201CHey CAL, call the gym and book an appointment.\u201D', id); await listen(id);
    const ph = W('phone'), ps = $('.pst', ph); ps.textContent = 'Calling\u2026'; eye(0, 3); pop(ph, true); await wait(1500, id);
    ph.classList.add('live'); for (let s = 1; s <= 6; s++) { ps.textContent = 'Connected 00:0' + s; await wait(480, id); }
    ph.classList.remove('live'); ps.textContent = 'Call ended 00:06'; await wait(800, id); pop(ph, false); flag('proc', 0); eye(0, 0); await wait(600, id);
    toast('Gym appointment booked for 5:00 PM. Call me if you need anything.'); await wait(3600, id); toastEl.classList.remove('show'); await wait(500, id); await rest(id);
    /* Scene 2: meeting + email */
    await wake(id); await speak('\u201CHey CAL, can you attend the meeting for me and send the email?\u201D', id); await listen(id);
    const br = W('browser'), tiles = $$('.tile', desk), rt = $('#rt', desk); eye(2, 3); pop(br, true);
    for (let s = 0; s < 8; s++) { tiles.forEach((t, k) => t.classList.toggle('sp', k === [0, 1, 0, 3, 2, 0, 3, 1][s])); rt.textContent = '00:' + String(s * 5 + 5).padStart(2, '0'); await wait(560, id); }
    pop(br, false); await wait(700, id);
    const ml = W('mail'), body = $('#mbody', ml), btn = $('#msend', ml); eye(-1, 3); pop(ml, true); await wait(700, id);
    for (const ch of 'Hi Dana,\n\nI attended the product sync on your behalf. Launch moves to the 14th and the design review is on Friday. Notes are in the shared folder.\n\nBest,\nAlex') { body.textContent += ch; await wait(16, id); }
    await wait(500, id); btn.classList.add('press'); await wait(220, id); btn.classList.remove('press'); btn.classList.add('sent'); $('.lbl', btn).textContent = 'Sent'; await wait(900, id);
    pop(ml, false); flag('proc', 0); eye(0, 0); await wait(600, id); await rest(id);
    /* Scene 3: smart home */
    await wake(id); await speak('\u201CHey CAL, turn off the house lights.\u201D', id); await listen(id);
    flag('proc', 0); eye(0, 0); toast('House lights have been turned off.'); await wait(3800, id); toastEl.classList.remove('show'); await wait(500, id); await rest(id);
  }
  async function loop() { const id = ++run; try { while (true) await scenes(id); } catch (e) { /* stopped */ } }
  function stop() { run++; clean(); }
  function still() { flag('cal', 1); toast('Gym appointment booked for 5:00 PM. Call me if you need anything.'); }

  let vis = false;
  new IntersectionObserver(en => { const on = en[0].isIntersecting; if (on === vis) return; vis = on; if (reduce) { if (on) still(); return; } on ? loop() : stop(); }, { threshold: .4 }).observe(desk);

  /* Scroll story (desktop): the desk gains depth on entry; then CAL detaches, scales up and swallows the screen */
  if (!reduce && innerWidth >= 900 && window.gsap && window.ScrollTrigger) {
    const wrap = $('.desk-wrap'), d3 = $('.desk-3d'), notch = $('.notch', desk), cm = $('.cal-m', desk);
    const fly = $('.zoom-fly'), flySvg = $('svg', fly), fill = $('.zoom-fill'), story = $('.zoom-story'), lines = $$('p', story);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    /* Fit: on short screens the pinned desk used to run past the bottom edge, so the taskbar (the end of the demo)
       was never seen. Scale the whole desk down just enough that it fits the viewport while it is pinned. */
    const fit = () => Math.min(1, Math.max(.45, (innerHeight - 76 - 20) / wrap.offsetHeight));
    gsap.fromTo(d3, { rotationX: 9, scale: () => .93 * fit(), y: 36 }, { rotationX: 0, scale: () => fit(), y: 0, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 95%', end: 'top 40%', scrub: .6, invalidateOnRefresh: true } });
    const rgb = s => (s.match(/[\d.]+/g) || [250, 250, 249]).slice(0, 3).map(Number);
    const lerpA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k), css = a => 'rgb(' + a.map(Math.round).join(',') + ')';
    /* same contract as Framer Motion's useTransform(value, inputRange, outputRange) */
    const tf = (v, inp, out) => { if (v <= inp[0]) return out[0]; for (let i = 1; i < inp.length; i++) if (v <= inp[i]) return out[i - 1] + (out[i] - out[i - 1]) * (v - inp[i - 1]) / (inp[i] - inp[i - 1]); return out[out.length - 1]; };
    /* Pin is 360% (was 420%). Every stretch of it now does something: zoom -> three sentences back to back ->
       hand-off. There is no empty hold after the last sentence any more. */
    const Z0 = .15, Z1 = .31;                         /* zoom window (scroll progress of the pin) */
    const BEATS = [[.32, .53], [.54, .75], [.76, .96]]; /* one window per sentence, no gaps */
    let base = 0, handoff = 0;                        /* fill opacity from the zoom / fade-out driven by the next section */
    const paintFill = () => { fill.style.opacity = base * (1 - handoff); fill.style.visibility = base > 0 && handoff < 1 ? 'visible' : 'hidden'; };
    const off = () => { base = 0; fly.style.visibility = fill.style.visibility = story.style.visibility = 'hidden'; cm.style.opacity = ''; wrap.style.opacity = ''; lines.forEach(l => l.style.opacity = 0); };
    const pinST = ScrollTrigger.create({
      trigger: wrap, pin: true, pinSpacing: true, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 2,
      start: () => wrap.offsetHeight * fit() < innerHeight - 90 ? 'center center' : 'top 76px', end: '+=360%',
      onUpdate: self => {
        const p = self.progress, t = clamp((p - Z0) / (Z1 - Z0), 0, 1);
        if (t <= 0) { off(); return; }
        const n = notch.getBoundingClientRect(), u = n.width / 358, w = 58.6 * u, h = 51.5 * u;
        const S = (Math.hypot(innerWidth, innerHeight) / 2) / (0.0546 * w) * 1.15;
        Object.assign(flySvg.style, { left: n.left + 150 * u + 'px', top: n.top + 10 * u + 'px', width: w + 'px', height: h + 'px', transform: 'scale(' + Math.pow(S, t) + ')' });
        const bg = rgb(getComputedStyle(document.body).backgroundColor);
        /* the avatar body goes white -> page colour; its dark cut-outs (eyes, feet) dissolve INTO the body colour,
           so only the white shape swallows the screen and no black shapes ever grow out of it */
        const body = lerpA([255, 255, 255], bg, clamp((t - .72) / .28, 0, 1));
        flySvg.style.color = css(body);
        flySvg.style.setProperty('--fly-dark', css(lerpA([30, 30, 30], body, clamp((t - .06) / .26, 0, 1))));
        const o = 1 - clamp((p - .93) / .07, 0, 1);
        fly.style.visibility = 'visible'; fly.style.opacity = o;
        base = clamp((t - .9) / .1, 0, 1); fill.style.background = css(bg); paintFill();
        cm.style.opacity = 0; wrap.style.opacity = 1 - clamp((t - .55) / .35, 0, 1);
        /* storytelling: each sentence fades/blurs in, holds, then fades out while drifting up */
        story.style.visibility = 'visible'; story.style.opacity = o;
        lines.forEach((l, i) => {
          const [a, b] = BEATS[i], d = b - a, k = [a, a + d * .28, a + d * .72, b];
          l.style.opacity = tf(p, k, [0, 1, 1, 0]);
          l.style.transform = 'translateY(' + tf(p, k, [44, 0, 0, -44]) + 'px)';
          l.style.filter = 'blur(' + tf(p, k, [10, 0, 0, 10]) + 'px)';
        });
      },
      onLeaveBack: off
    });
    /* Hand-off: the page-coloured fill stays solid to the end of the pin, then dissolves while the next section
       scrolls up beneath it. Starting a few % BEFORE the pin releases means the screen is never blank. */
    const next = $('#journey');
    if (next) ScrollTrigger.create({
      trigger: next, invalidateOnRefresh: true, refreshPriority: 1,
      start: () => pinST.end - (pinST.end - pinST.start) * .035,
      end: () => Math.max(pinST.end + 120, next.getBoundingClientRect().top + window.pageYOffset - innerHeight * .35),
      onUpdate: self => { handoff = self.progress; paintFill(); },
      onLeaveBack: () => { handoff = 0; paintFill(); }
    });
  }
})();
