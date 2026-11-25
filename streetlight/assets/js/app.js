/* Shared Metrics Foundation · Data Trust & Agent Context Console
   Independent concept by Jim Chao · synthetic data · not affiliated with or endorsed by Jacobs or StreetLight.
   Libraries (self-hosted): GSAP 3.13 (ScrollTrigger, SplitText, Flip, Draggable), anime.js 3.2, Motion (motion.dev), Lenis.
   Hand-ported patterns: React Bits CountUp / DecryptedText / ShinyText / BlurText, Aceternity Spotlight + card spotlight +
   Animated Beam, Uiverse conic border button / toggle / range, Motion spring magnetic buttons. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable);
  gsap.defaults({ ease: 'power3.out', duration: 0.7 });
  const C = { teal: '#2dd4bf', teal3: '#0f766e', sig: '#ff8a3d', amber: '#f2c14e', red: '#f87171', pale: '#cfe9e4', faint: '#6f8584' };

  /* ---------------- seeded random + reveals ---------------- */
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const seenIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; seenIO.unobserve(e.target); const fns = e.target.__onSeen || []; e.target.__onSeen = null; fns.forEach(fn => fn());
  }), { threshold: 0.08 }) : null;
  // several callbacks may wait on the same element (reveal + its own demo), so keep a list
  function onSeen(el, fn) { if (!el) return; if (!seenIO) return fn(); (el.__onSeen = el.__onSeen || []).push(fn); seenIO.observe(el); }

  /* ---------------- React Bits: CountUp ---------------- */
  function countUp(el, dur = 1.6) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = v => pre + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, dec ? '' : ',') + suf;
    if (RM) { el.textContent = fmt(to); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: dur, ease: 'expo.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  }
  $$('[data-count]').forEach(el => onSeen(el, () => countUp(el)));

  /* ---------------- React Bits: DecryptedText ---------------- */
  function decrypt(el, final, dur = 900) {
    if (RM) { el.textContent = final; return Promise.resolve(); }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&_';
    return new Promise(res => {
      const start = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur), keep = Math.floor(final.length * p);
        el.textContent = final.split('').map((c, i) => (i < keep || c === ' ' || c === ',' || c === '.' ? c : chars[(Math.random() * chars.length) | 0])).join('');
        p < 1 ? requestAnimationFrame(tick) : res();
      })(start);
    });
  }

  /* ================= ROAD NETWORK (shared by the opening, hero and coverage map) =================
     A made-up county network in a 600 x 380 space. Each road is split into segments with IDs. */
  const URBAN = [330, 170];
  const ROADS = (function () {
    const out = [];
    const curve = (id, name, type, pts, n) => out.push({ id, name, type, pts, n });
    curve('R9', 'Route 9', 'hwy', [[10, 330], [140, 300], [250, 220], [360, 150], [470, 110], [590, 50]], 16);
    curve('I5', 'I-5', 'hwy', [[300, 0], [312, 90], [326, 180], [318, 280], [336, 380]], 10);
    curve('MS', 'Mill St', 'art', [[60, 120], [180, 140], [300, 160], [420, 180], [560, 230]], 10);
    curve('OA', 'Oak Ave', 'art', [[120, 40], [190, 120], [250, 200], [300, 300], [360, 370]], 8);
    curve('BR', 'Bay Rd', 'art', [[380, 20], [410, 110], [450, 200], [520, 290], [590, 340]], 8);
    curve('R2', 'Pine Hollow Rd', 'rural', [[10, 200], [60, 230], [90, 290], [150, 340], [230, 370]], 10);
    curve('CR', 'Cedar Ridge Rd', 'rural', [[460, 370], [500, 320], [560, 300], [600, 260]], 6);
    curve('LK', 'Lake Dr', 'art', [[200, 250], [260, 260], [340, 250], [420, 260], [480, 240]], 8);
    return out;
  })();
  function catmull(pts, steps = 12) {
    const res = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        res.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    res.push(pts[pts.length - 1]);
    return res;
  }
  ROADS.forEach(r => { r.line = catmull(r.pts); });
  // Segment scores per partner (synthetic): Vela, Orbit, Haulpath; blended trust.
  seed = 11;
  const SEGS = [];
  ROADS.forEach(r => {
    const L = r.line, per = Math.floor((L.length - 1) / r.n);
    for (let k = 0; k < r.n; k++) {
      const pts = L.slice(k * per, k === r.n - 1 ? L.length : (k + 1) * per + 1);
      const mid = pts[Math.floor(pts.length / 2)];
      const u = Math.exp(-Math.hypot(mid[0] - URBAN[0], mid[1] - URBAN[1]) / 190);
      const nz = () => (rnd() - 0.5) * 0.14;
      let v, o, h;
      if (r.type === 'hwy') { v = 0.82 + nz(); o = 0.68 + nz(); h = 0.8 + nz(); }
      else if (r.type === 'art') { v = 0.42 + 0.4 * u + nz(); o = 0.42 + 0.45 * u + nz(); h = 0.04; }
      else { v = 0.2 + 0.25 * u + nz(); o = 0.18 + 0.3 * u + nz(); h = 0; }
      const cl = x => Math.max(0, Math.min(0.98, x));
      v = cl(v); o = cl(o); h = cl(h);
      let b = cl(1 - (1 - v * 0.9) * (1 - o * 0.8) * (1 - h * 0.45));
      const id = r.id + '-' + String(k + 1).padStart(2, '0');
      if (id === 'R9-14') b = 0.86;
      if (id === 'R2-07') { b = 0.52; v = 0.31; o = 0.0; }
      SEGS.push({ id, road: r, pts, s: [v, o, h], b });
    }
  });

  function drawNet(ctx, w, h, alpha, glow) {
    const sx = w / 600, sy = h / 380, s = Math.max(sx, sy), ox = (w - 600 * s) / 2, oy = (h - 380 * s) / 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ROADS.forEach(r => {
      ctx.beginPath();
      r.line.forEach((p, i) => (i ? ctx.lineTo(ox + p[0] * s, oy + p[1] * s) : ctx.moveTo(ox + p[0] * s, oy + p[1] * s)));
      ctx.strokeStyle = `rgba(45,212,191,${alpha * (r.type === 'hwy' ? 0.55 : r.type === 'art' ? 0.32 : 0.18)})`;
      ctx.lineWidth = (r.type === 'hwy' ? 2.4 : 1.3) * Math.max(1, s * 0.6);
      if (glow) { ctx.shadowColor = 'rgba(45,212,191,.5)'; ctx.shadowBlur = 8; }
      ctx.stroke(); ctx.shadowBlur = 0;
    });
    return { s, ox, oy };
  }
  // topo contour rings
  function drawContours(ctx, w, h, t, alpha) {
    ctx.save(); ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      const R = 60 + i * 46;
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.12) {
        const wob = Math.sin(a * 3 + i * 0.7 + t * 0.15) * 10 + Math.sin(a * 5 - t * 0.1) * 6;
        const x = w * 0.72 + Math.cos(a) * (R + wob) * 1.25, y = h * 0.38 + Math.sin(a) * (R + wob) * 0.8;
        a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(150,214,204,${alpha * (0.06 - i * 0.003)})`; ctx.stroke();
    }
    ctx.restore();
  }
  function makeParticles(n) {
    const P = [];
    for (let i = 0; i < n; i++) {
      const r = ROADS[(Math.random() * ROADS.length) | 0];
      P.push({ r, t: Math.random(), v: (0.0006 + Math.random() * 0.0016) * (r.type === 'hwy' ? 1.6 : 1), dir: Math.random() > 0.5 ? 1 : -1, k: i % 3 });
    }
    return P;
  }
  const PCOL = ['#2dd4bf', '#ff8a3d', '#cfe9e4'];
  function stepParticles(ctx, P, geo, colorMode, a) {
    P.forEach(p => {
      if (p.k === 2 && p.r.id !== 'I5' && p.r.id !== 'R9') p.r = Math.random() > 0.5 ? ROADS[0] : ROADS[1]; // fleet = freight corridors
      p.t += p.v * p.dir; if (p.t > 1) p.t = 0; if (p.t < 0) p.t = 1;
      const L = p.r.line, f = p.t * (L.length - 1), i = Math.floor(f), q = f - i, A = L[i], B = L[Math.min(L.length - 1, i + 1)];
      const x = geo.ox + (A[0] + (B[0] - A[0]) * q) * geo.s, y = geo.oy + (A[1] + (B[1] - A[1]) * q) * geo.s;
      ctx.beginPath(); ctx.arc(x, y, p.k === 2 ? 2.2 : 1.6, 0, Math.PI * 2);
      ctx.fillStyle = colorMode ? PCOL[p.k] : 'rgba(207,233,228,.75)';
      ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1;
    });
  }

  /* ================= OPENING ================= */
  const intro = $('#intro'), cv = $('#introCanvas'), cx = cv.getContext('2d');
  let introRAF = 0, partnerColors = false, netGlow = 0.6;
  const parts = makeParticles(RM ? 0 : 170);
  function sizeCanvas(c) { const d = Math.min(2, devicePixelRatio || 1); c.width = c.clientWidth * d; c.height = c.clientHeight * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); }
  sizeCanvas(cv);
  function introFrame(now) {
    const w = cv.clientWidth, h = cv.clientHeight, t = now / 1000;
    cx.clearRect(0, 0, w, h);
    drawContours(cx, w, h, t, 1);
    const geo = drawNet(cx, w, h, netGlow, true);
    stepParticles(cx, parts, geo, partnerColors, 0.9);
    introRAF = requestAnimationFrame(introFrame);
  }
  if (RM) { const w = cv.clientWidth, h = cv.clientHeight; drawContours(cx, w, h, 0, 1); drawNet(cx, w, h, 0.6, false); }
  else introRAF = requestAnimationFrame(introFrame);

  // floating chips: segment IDs and partner names
  const CHIPS = [['seg', 'R9-14'], ['partner', 'Vela Drive'], ['seg', 'I5-06'], ['partner', 'Orbit Pulse'], ['seg', 'MS-04'], ['partner', 'Haulpath'], ['seg', 'R2-07'], ['metric', 'aadt.v3'], ['metric', 'vmt.v2'], ['seg', 'BR-03']];
  const chipWrap = $('#introChips');
  const chipEls = CHIPS.map(([k, v]) => { const d = document.createElement('div'); d.className = 'chip'; d.innerHTML = `<b>${k}</b>${v}`; chipWrap.appendChild(d); return d; });
  function placeChips() {
    const w = innerWidth, h = innerHeight;
    chipEls.forEach((el, i) => {
      const a = (i / chipEls.length) * Math.PI * 2 + 0.35;
      el.__x = Math.cos(a) * w * 0.4 + w / 2 - 50; el.__y = Math.sin(a) * h * 0.38 + h / 2 - 12;
      gsap.set(el, { x: el.__x, y: el.__y });
    });
  }
  placeChips();

  const fadeIn = ['.intro__kicker', '.intro__line', '.btn-enter', '.intro__hint', '.intro__legal', '.intro__skip'];
  if (!RM) {
    fadeIn.forEach(s => $$(s).forEach(e => (e.style.opacity = 0)));
    chipEls.forEach(e => (e.style.opacity = 0));
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: chipEls, opacity: [0, 0.85], delay: anime.stagger(80), duration: 900 }, 200)
      .add({ targets: '.intro__kicker', opacity: [0, 1], translateY: [12, 0], duration: 700 }, 450)
      .add({ targets: '.intro__line', opacity: [0, 1], translateY: [24, 0], filter: ['blur(10px)', 'blur(0px)'], delay: anime.stagger(380), duration: 1000 }, 700)
      .add({ targets: ['.btn-enter', '.intro__hint', '.intro__legal', '.intro__skip'], opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(90), duration: 800 }, 2200);
    $$('.intro__line[data-scramble]').forEach((el, i) => setTimeout(() => decrypt(el, el.dataset.scramble, 800), 700 + i * 380));
    chipEls.forEach((el, i) => gsap.to(el, { x: el.__x + (i % 2 ? 16 : -16), y: el.__y + (i % 3 ? -12 : 12), duration: 3 + i * 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }

  /* ---- Opening story (~25 s). Text types word by word in sync with the narration clip "story". ---- */
  const STORY = [
    { t: 0.2, e: 5.4, txt: 'Tuesday, 9 a.m. A county engineer asks one question:' },
    { t: 5.55, e: 8.9, txt: 'how many vehicles used Route 9 last quarter?', hl: true },
    { t: 9.04, e: 15.0, txt: 'Three products give three different answers, because each one built its own copy of the metric.' },
    { t: 15.21, e: 20.7, txt: 'Underneath, the data comes from three partners, each with gaps nobody can see.' },
    { t: 20.91, e: 25.0, txt: 'A shared foundation fixes that: one governed definition,' },
    { t: 25.17, e: 30.5, txt: 'metric aadt.v3, trust score 0.86, reused by every view and every agent.', hl: true }
  ];
  const STORY_END = 30.8;
  const storyEl = $('#story'), storyText = $('#storyText');
  const words = [];
  STORY.forEach(seg => {
    const ws = seg.txt.split(' '), span = (seg.e - seg.t) * 0.85;
    ws.forEach((w, i) => {
      const el = document.createElement('span'); el.className = 'w' + (seg.hl ? ' hl' : ''); el.textContent = w;
      storyText.appendChild(el); storyText.appendChild(document.createTextNode(' '));
      words.push({ el, at: seg.t + (span * i) / ws.length });
    });
  });
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
  storyText.appendChild(caret);
  const ansEls = $$('.ans');

  let entered = false, storyDone = false, storyRAF = 0;
  function enter(withSound) {
    if (entered) return; entered = true;
    let audio = null;
    if (withSound && window.Sound) { Sound.startAll(); audio = Sound.say('story'); }
    const center = $('.intro__center');
    const show = () => { center.style.display = 'none'; $('#skipBtn').style.display = 'none'; storyEl.hidden = false; $('#storySkip').focus({ preventScroll: true }); };
    if (RM) show();
    else anime({ targets: [center, '#skipBtn'], opacity: [1, 0], translateY: [0, -14], duration: 500, easing: 'easeInQuad', complete: show });
    gsap.killTweensOf(chipEls); gsap.to(chipEls, { opacity: 0.18, duration: 0.8 });
    const fired = {}, once = (k, fn) => { if (!fired[k]) { fired[k] = 1; fn(); } };
    const w = innerWidth, h = innerHeight, mob = w < 1180;
    // desktop: cards sit in the margins left and right of the story column; phone: above and below it
    const spots = mob ? [[0.04, 0.025], [0.52, 0.025], [0.04, 0.885], [0.5, 0.885]] : [[0.035, 0.16], [0.83, 0.16], [0.035, 0.7], [0.82, 0.68]];
    let t0 = performance.now() + (RM ? 0 : 500);
    function tick(now) {
      let t;
      if (audio && !audio.paused && audio.currentTime > 0) { t = audio.currentTime; t0 = now - t * 1000; }
      else t = Math.max(0, (now - t0) / 1000);
      words.forEach(x => { if (t >= x.at) x.el.classList.add('on'); });
      if (t >= 3.4) once('road', () => { netGlow = 1; });
      // "three different answers": three product cards appear in three corners
      if (t >= 6.6) once('answers', () => ansEls.slice(0, 3).forEach((el, i) => {
        gsap.set(el, { x: w * spots[i][0], y: h * spots[i][1] });
        gsap.fromTo(el, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.8, delay: i * 0.35, ease: 'back.out(1.6)' });
      }));
      // "three partners": particles take their partner colors, chips light up
      if (t >= 12.2) once('partners', () => { partnerColors = true; gsap.to(chipEls.filter((_, i) => i % 2), { opacity: 0.9, duration: 0.6, stagger: 0.15 }); });
      // "one governed definition": the three answers converge into one
      if (t >= 20.0) once('merge', () => {
        ansEls.slice(0, 3).forEach((el, i) => gsap.to(el, { x: w * spots[3][0], y: h * spots[3][1], opacity: 0, scale: 0.7, duration: 1.1, delay: i * 0.1, ease: 'expo.inOut' }));
        const g = ansEls[3]; gsap.set(g, { x: w * spots[3][0], y: h * spots[3][1] });
        gsap.fromTo(g, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.08, duration: 1, delay: 0.7, ease: 'back.out(1.7)' });
        gsap.to(chipEls, { opacity: 0.08, duration: 0.8 });
      });
      if (t >= 20.8) once('id', () => { $('#storyId').classList.add('on'); decrypt($('#storyMetric'), 'aadt.v3', 900); decrypt($('#storyTrust'), '0.86', 1100); });
      if (t >= STORY_END) once('end', () => { caret.remove(); setTimeout(() => exitIntro(withSound), 1500); });
      if (!storyDone) storyRAF = requestAnimationFrame(tick);
    }
    if (RM) {
      words.forEach(x => x.el.classList.add('on')); $('#storyId').classList.add('on'); $('#storySkip').textContent = 'Continue';
      if (audio) audio.addEventListener('ended', () => exitIntro(withSound), { once: true });
      return;
    }
    storyRAF = requestAnimationFrame(tick);
  }
  $('#storySkip').addEventListener('click', () => { if (window.Sound) Sound.stopClip(); exitIntro(window.Sound && Sound.voiceOn); });

  let exited = false;
  function exitIntro(withSound) {
    if (exited) return; exited = true; storyDone = true; cancelAnimationFrame(storyRAF);
    const finish = () => {
      cancelAnimationFrame(introRAF); intro.style.display = 'none';
      document.body.classList.remove('is-intro'); document.body.classList.add('is-in');
      ScrollTrigger.refresh(); heroIn(); $('#main').focus({ preventScroll: true }); drawBeams(); drawArch();
      if (withSound && window.Sound) setTimeout(() => Sound.say('intro'), 400);
    };
    if (RM) return finish();
    const tl = anime.timeline({ easing: 'easeInOutExpo', complete: finish });
    tl.add({ targets: [...chipEls, ...ansEls], opacity: 0, duration: 600 })
      .add({ targets: '#story', scale: [1, 0.94], opacity: [1, 0], duration: 600 }, 150)
      .add({ targets: '.intro__bar--top', translateY: ['-100%', '0%'], duration: 600 }, 500)
      .add({ targets: '.intro__bar--bot', translateY: ['100%', '0%'], duration: 600 }, 500)
      .add({ targets: intro, opacity: [1, 0], duration: 600 }, 1050);
  }
  $('#enterBtn').addEventListener('click', () => enter(true));
  $('#skipBtn').addEventListener('click', () => enter(false));
  $('#main').setAttribute('tabindex', '-1');
  $('#musicBtn').addEventListener('click', () => Sound.toggleMusic());
  $('#voiceBtn').addEventListener('click', () => { Sound.toggleVoice(); if (Sound.voiceOn) { Sound.resetSpoken(); const cur = currentSection(); if (cur && cur.dataset.narrate) Sound.say(cur.dataset.narrate); } });
  $('#replayIntro').addEventListener('click', () => location.reload());
  addEventListener('resize', () => { if (!entered) { sizeCanvas(cv); placeChips(); } });

  /* ================= LENIS + SCROLL ================= */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id === '#main') return;
    const t = $(id); if (!t) return; e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -64 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));
  gsap.to('#navProgress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  const sections = $$('main section[id]');
  function currentSection() { const y = innerHeight * 0.4; return sections.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); }
  sections.forEach(s => ScrollTrigger.create({
    trigger: s, start: 'top 45%', end: 'bottom 45%',
    onToggle: self => {
      const a = $(`[data-rail="${s.id}"]`); if (a) a.classList.toggle('is-on', self.isActive);
      if (self.isActive && s.dataset.narrate && window.Sound && document.body.classList.contains('is-in')) Sound.say(s.dataset.narrate);
    }
  }));

  /* ================= CARD FX: tilt + spotlight + magnetic ================= */
  function armCard(el) {
    if (!FINE || RM || el.__armed) return; el.__armed = true;
    const noTilt = el.hasAttribute('data-notilt');
    const rx = gsap.quickTo(el, '--rx', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, '--ry', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      if (noTilt) return;
      const big = r.width > 560 ? 2.5 : 7;
      rx((0.5 - y) * big); ry((x - 0.5) * big);
    });
    el.addEventListener('pointerenter', () => el.classList.add('is-hot'));
    el.addEventListener('pointerleave', () => { el.classList.remove('is-hot'); rx(0); ry(0); });
  }
  function armMagnet(b) {
    const { animate } = window.Motion || {};
    if (!animate || !FINE || RM) return;
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3 }, { type: 'spring', stiffness: 260, damping: 18 }); });
    b.addEventListener('pointerleave', () => animate(b, { x: 0, y: 0 }, { type: 'spring', stiffness: 200, damping: 14 }));
  }

  /* ================= HERO ================= */
  function heroIn() {
    if (RM) return;
    const split = new SplitText('#heroTitle', { type: 'words,chars' });
    gsap.from(split.chars, { yPercent: 60, opacity: 0, filter: 'blur(8px)', stagger: 0.016, duration: 0.9, ease: 'expo.out' });
    gsap.from(['.label-pill', '.hero__lede', '.hero__cta'], { y: 24, opacity: 0, stagger: 0.08, delay: 0.3, duration: 0.9, clearProps: 'transform' });
  }
  const hm = $('#heroMap'), hx = hm.getContext('2d'), hParts = makeParticles(RM ? 0 : 110);
  let heroOn = false, heroRAF = 0;
  sizeCanvas(hm);
  function heroFrame(now) {
    const w = hm.clientWidth, h = hm.clientHeight;
    hx.clearRect(0, 0, w, h);
    drawContours(hx, w, h, now / 1000, 0.8);
    const geo = drawNet(hx, w, h, 0.5, false);
    stepParticles(hx, hParts, geo, true, 0.7);
    if (heroOn) heroRAF = requestAnimationFrame(heroFrame);
  }
  if (RM) { drawContours(hx, hm.clientWidth, hm.clientHeight, 0, 0.8); drawNet(hx, hm.clientWidth, hm.clientHeight, 0.5, false); }
  else new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { heroOn = true; cancelAnimationFrame(heroRAF); heroRAF = requestAnimationFrame(heroFrame); } else heroOn = false;
  })).observe(hm);
  addEventListener('resize', () => sizeCanvas(hm));

  /* ================= R1: PRIORITISATION (GSAP Flip) ================= */
  const ASKS = [
    { id: 'gov', name: 'Governed AADT and VMT definitions', code: 'metric-layer', teams: ['Counts', 'Safety', 'Construction'], eff: 8, s: { trust: 10, speed: 9, ai: 8 } },
    { id: 'tui', name: 'Trust score beside every number', code: 'trust-ui', teams: ['Counts', 'Safety'], eff: 5, s: { trust: 9, speed: 4, ai: 6 } },
    { id: 'ent', name: 'Entitlements in the metric API', code: 'entitlements', teams: ['All views', 'Agent'], eff: 6, s: { trust: 8, speed: 5, ai: 9 } },
    { id: 'ctx', name: 'Agent context API with citations', code: 'agent-context', teams: ['Agent', 'Construction'], eff: 7, s: { trust: 5, speed: 6, ai: 10 } },
    { id: 'zon', name: 'Custom OD zones on demand', code: 'od-zones', teams: ['Construction'], eff: 6, s: { trust: 3, speed: 8, ai: 3 } },
    { id: 'rt', name: 'Near-real-time feed', code: 'rt-tier', teams: ['Safety'], eff: 9, s: { trust: 4, speed: 7, ai: 4 } },
    { id: 'aut', name: 'Self-serve metric authoring', code: 'authoring', teams: ['All views'], eff: 10, s: { trust: 4, speed: 10, ai: 5 } }
  ];
  const VERDICT = {
    trust: '<b>Customer-trust lens:</b> shared definitions, trust scores, entitlements and agent context fill all 26 weeks. <b>Trade-off:</b> self-serve authoring and the real-time tier wait a half, and Construction Impact keeps its current zones. I tell those PMs at planning, not at launch.',
    speed: '<b>Delivery-speed lens:</b> self-serve authoring jumps to the top because it frees every team later. <b>Trade-off:</b> no trust score in the UI and no entitlements this half, which blocks the agent. I would not pick this lens alone; it borrows against customer trust.',
    ai: '<b>AI-readiness lens:</b> context, entitlements and definitions first, so agents answer only from governed metrics. <b>Trade-off:</b> Safety\'s real-time ask and custom zones slip; the agent launches with fewer question types, but none ungoverned.'
  };
  const CAP = 26, prioList = $('#prioList');
  ASKS.forEach(a => {
    const li = document.createElement('li'); li.className = 'pi'; li.dataset.id = a.id;
    li.innerHTML = `<span class="pi__rank"></span><span class="pi__name"><b>${a.name}</b><span>${a.code}</span></span><span class="pi__teams">${a.teams.map(t => `<i>${t}</i>`).join('')}</span><span class="pi__eff">${a.eff} wk</span><span class="pi__bar"><i></i></span>`;
    a.el = li; prioList.appendChild(li);
  });
  const cut = document.createElement('li'); cut.className = 'cutline'; cut.textContent = 'capacity line · 26 wk';
  function setLens(lens, animate) {
    const state = animate && !RM ? Flip.getState([...$$('.pi'), cut]) : null;
    const order = [...ASKS].sort((a, b) => b.s[lens] - a.s[lens] || a.eff - b.eff);
    let used = 0, out = false;
    order.forEach((a, i) => {
      if (!out && used + a.eff <= CAP) used += a.eff; else out = true;
      a.el.classList.toggle('is-out', out);
      a.el.querySelector('.pi__rank').textContent = String(i + 1).padStart(2, '0');
      a.el.querySelector('.pi__bar i').style.transform = `scaleX(${a.s[lens] / 10})`;
      prioList.appendChild(a.el);
    });
    // the capacity line sits right before the first ask that does not fit
    const firstOut = order.find(a => a.el.classList.contains('is-out'));
    if (firstOut) prioList.insertBefore(cut, firstOut.el); else prioList.appendChild(cut);
    if (state) Flip.from(state, { duration: 0.7, ease: 'power3.inOut', stagger: 0.03 });
    const v = $('#prioVerdict'); v.innerHTML = VERDICT[lens] + ` <span class="mono" style="color:var(--muted)">(${used} of ${CAP} wk used)</span>`;
    if (animate && !RM) gsap.fromTo(v, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
  }
  setLens('trust', false);
  function radio(group, cb) {
    $$('button', group).forEach(b => b.addEventListener('click', () => {
      $$('button', group).forEach(x => x.setAttribute('aria-checked', x === b)); cb(b);
    }));
  }
  let lensTouched = false;
  radio($('.prio .seg'), b => { lensTouched = true; setLens(b.dataset.lens, true); });
  // auto-demo once when first seen: cycle the lenses so the reorder is visible without a click
  onSeen($('.prio'), () => {
    if (RM) return;
    ['speed', 'ai', 'trust'].forEach((l, i) => setTimeout(() => {
      if (lensTouched) return;
      $$('.prio .seg button').forEach(x => x.setAttribute('aria-checked', x.dataset.lens === l)); setLens(l, true);
    }, 2800 * (i + 1)));
  });

  /* ================= R2: SHARED DEFINITIONS + BEAMS ================= */
  const DEFS = {
    aadt: { title: 'Average annual daily traffic', rows: [['Formula', 'Expanded daily volumes ÷ valid sample days, per segment and period'], ['Inputs', 'Vela Drive + Orbit Pulse (Haulpath for truck share only)'], ['Calibrated', 'Against 212 permanent count stations'], ['Owner', 'Platform team · metric review with product PMs'], ['Consumers', 'Traffic Counts, Safety, Construction Impact, agent']],
      views: [['42,180', 'AADT on R9-14 · Q3'], ['42,180', 'crash-rate denominator'], ['42,180', 'baseline before closure']] },
    vmt: { title: 'Vehicle miles traveled', rows: [['Formula', 'aadt.v3 × segment length × days in period'], ['Inputs', 'aadt.v3 (inherits its trust score)'], ['Grain', 'Segment, county, custom zone'], ['Owner', 'Platform team'], ['Consumers', 'Traffic Counts, Safety, Construction Impact, agent']],
      views: [['1.92M', 'county VMT · Q3'], ['0.61', 'crashes per million VMT'], ['+2.4%', 'VMT change after Mill St closure']] },
    od: { title: 'Origin-destination trips', rows: [['Formula', 'Linked trips between zones, expanded to population'], ['Inputs', 'Orbit Pulse (trip chains), Vela Drive (validation)'], ['Privacy', 'Zones under 50 trips are suppressed'], ['Owner', 'Platform team · Data Science review'], ['Consumers', 'Traffic Counts, Construction Impact, agent']],
      views: [['8,460', 'trips downtown → R9 corridor'], ['n/a', 'not used by Safety today'], ['3,120', 'detour trips via Lake Dr']] }
  };
  const beams = $('#reuseBeams');
  function showDef(k, animate) {
    const d = DEFS[k];
    $('#defBody').innerHTML = `<h4>${d.title}</h4><dl>${d.rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
    $$('.view').forEach((v, i) => {
      const b = v.querySelector('[data-vnum]'), sp = v.querySelector('span'), uses = v.querySelector('.uses code');
      sp.textContent = d.views[i][1]; uses.textContent = d.views[i][0] === 'n/a' ? 'none' : k + (k === 'aadt' ? '.v3' : k === 'vmt' ? '.v2' : '.v1');
      if (animate) { decrypt(b, d.views[i][0], 700); v.classList.add('is-flash'); setTimeout(() => v.classList.remove('is-flash'), 700); }
      else b.textContent = d.views[i][0];
    });
    if (animate && !RM) gsap.from('#defBody > *', { opacity: 0, y: 10, stagger: 0.05, duration: 0.4 });
    pulseBeams();
  }
  $$('.def__tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.def__tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); showDef(b.dataset.def, true);
  }));
  showDef('aadt', false);
  // Aceternity / 21st.dev Animated Beam: curved paths from the definition card to each product view
  function drawBeams() {
    if (!beams || getComputedStyle(beams).display === 'none') return;
    const box = beams.getBoundingClientRect(), d = $('#defCard').getBoundingClientRect();
    const sx = d.right - box.left, sy = d.top + d.height / 2 - box.top;
    let html = `<defs><linearGradient id="bg1" x1="0" x2="1"><stop offset="0" stop-color="${C.teal}" stop-opacity="0"/><stop offset=".5" stop-color="${C.teal}"/><stop offset="1" stop-color="${C.sig}"/></linearGradient></defs>`;
    $$('.view').forEach(v => {
      const r = v.getBoundingClientRect(), ex = r.left - box.left, ey = r.top + r.height / 2 - box.top, mx = (sx + ex) / 2;
      const p = `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
      html += `<path d="${p}" fill="none" stroke="rgba(150,214,204,.18)" stroke-width="1.5"/><path class="beam" d="${p}" fill="none" stroke="url(#bg1)" stroke-width="2.5" stroke-linecap="round"/>`;
    });
    beams.innerHTML = html;
    beams.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    pulseBeams();
  }
  function pulseBeams() {
    $$('.beam', beams).forEach((p, i) => {
      const L = p.getTotalLength(); p.style.strokeDasharray = `60 ${L}`;
      if (RM) { p.style.strokeDasharray = 'none'; return; }
      gsap.fromTo(p, { strokeDashoffset: 60 }, { strokeDashoffset: -L, duration: 1.6, delay: i * 0.15, ease: 'power2.inOut', repeat: -1, repeatDelay: 1.2, overwrite: true });
    });
  }
  addEventListener('resize', () => { drawBeams(); drawArch(); });

  /* ================= R2: PARTNERS (trust layer) ================= */
  const PARTNERS = [
    { name: 'Vela Drive', kind: 'Connected-vehicle GPS', q: 0.88, cov: 0.71, fresh: '36 h lag', fp: 0.7, bias: 'Low', bp: 0.25, pen: '3.1% of vehicles',
      limits: ['Skews to newer vehicles; older fleets in lower-income areas are under-sampled.', 'Passenger cars dominate; trucks are under-counted.', 'Sparse on rural roads at night.'] },
    { name: 'Orbit Pulse', kind: 'Smartphone location SDK', q: 0.79, cov: 0.84, fresh: '72 h lag', fp: 0.45, bias: 'Medium', bp: 0.55, pen: '6.4% of devices',
      limits: ['App-usage skew toward younger, urban users.', 'Travel mode is inferred; car vs. bus error near 9%.', 'Contract renews in week 14 of the plan.'] },
    { name: 'Haulpath', kind: 'Fleet telematics', q: 0.91, cov: 0.38, fresh: '4 h lag', fp: 0.95, bias: 'High', bp: 0.85, pen: 'enterprise fleets only',
      limits: ['Heavy trucks on freight corridors only; not valid for general AADT.', 'Raw traces are licensed to freight customers only.', 'Excellent freshness, narrow coverage.'] }
  ];
  const pWrap = $('#partners');
  PARTNERS.forEach((p, i) => {
    const el = document.createElement('article'); el.className = 'partner card-fx';
    const circ = 2 * Math.PI * 26;
    el.innerHTML = `<div class="partner__top"><div><h4>${p.name}</h4><span>${p.kind}<br>panel: ${p.pen}</span></div>
      <div class="gauge" aria-label="Quality score ${p.q}"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" style="stroke:${i === 1 ? C.amber : C.teal}"/></svg><b>${p.q.toFixed(2)}</b><small>quality</small></div></div>
      <div class="pm">
        <div class="pm__row"><span>Coverage</span><span class="bar"><i style="--s:${p.cov}"></i></span><b>${Math.round(p.cov * 100)}%</b></div>
        <div class="pm__row"><span>Freshness</span><span class="bar"><i class="${p.fp < 0.5 ? 'w' : ''}" style="--s:${p.fp}"></i></span><b>${p.fresh.split(' ')[0]} ${p.fresh.split(' ')[1]}</b></div>
        <div class="pm__row"><span>Sample bias</span><span class="bar"><i class="${p.bp > 0.7 ? 'b' : p.bp > 0.4 ? 'w' : ''}" style="--s:${p.bp}"></i></span><b>${p.bias}</b></div>
      </div>
      <ul class="limits">${p.limits.map(l => `<li>${l}</li>`).join('')}</ul>`;
    pWrap.appendChild(el);
    onSeen(el, () => {
      el.querySelector('.fg').style.strokeDashoffset = circ * (1 - p.q);
      $$('.pm__row .bar i', el).forEach((b, k) => setTimeout(() => (b.style.transform = `scaleX(${b.style.getPropertyValue('--s')})`), RM ? 0 : 150 + k * 160));
    });
  });
  $('#limitsTgl').addEventListener('change', e => $('.trust').classList.toggle('show-limits', e.target.checked));
  onSeen($('#partners'), () => { if (!RM) setTimeout(() => { const t = $('#limitsTgl'); if (!t.__touched) { t.checked = true; t.dispatchEvent(new Event('change')); } }, 2200); });
  $('#limitsTgl').addEventListener('pointerdown', e => (e.target.__touched = true));

  /* ================= R2: COVERAGE MAP ================= */
  const map = $('#coverMap'), tip = $('#coverTip');
  let layer = 'blend', thr = 0.7;
  const pathD = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  SEGS.forEach(sg => {
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', pathD(sg.pts));
    p.setAttribute('stroke-width', sg.road.type === 'hwy' ? 5 : sg.road.type === 'art' ? 3.5 : 2.6);
    p.setAttribute('tabindex', '-1'); sg.el = p; map.appendChild(p);
    p.addEventListener('pointerenter', () => showTip(sg)); p.addEventListener('pointermove', moveTip); p.addEventListener('pointerleave', () => (tip.hidden = true));
  });
  [['Route 9', 520, 70], ['I-5', 334, 24], ['Mill St', 70, 110], ['Pine Hollow Rd', 20, 188], ['Bay Rd', 440, 30], ['Lake Dr', 410, 278]].forEach(([n, x, y]) => {
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = n; map.appendChild(t);
  });
  const val = sg => (layer === 'blend' ? sg.b : sg.s[+layer]);
  function tone(v) { // sequential teal ramp, colorblind-safe; withheld segments are dashed orange (not color-only)
    if (v < thr) return C.sig;
    const k = Math.min(1, (v - thr) / Math.max(0.05, 1 - thr));
    const a = [63, 143, 134], b = [94, 234, 212];
    return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * k)).join(',')})`;
  }
  function paintMap(animate) {
    let pub = 0, wd = 0;
    SEGS.forEach((sg, i) => {
      const v = val(sg), ok = v >= thr; ok ? pub++ : wd++;
      sg.el.setAttribute('stroke', tone(v));
      sg.el.setAttribute('stroke-dasharray', ok ? 'none' : '3 6');
      sg.el.style.opacity = ok ? 1 : 0.75;
      if (animate && !RM) gsap.fromTo(sg.el, { opacity: 0.15 }, { opacity: ok ? 1 : 0.75, duration: 0.5, delay: i * 0.006 });
    });
    $('#pubCount').textContent = pub; $('#wdCount').textContent = wd;
    const r = $('#thr'); r.style.setProperty('--pct', ((thr - 0.4) / 0.5) * 100 + '%'); $('#thrVal').textContent = thr.toFixed(2);
  }
  function showTip(sg) {
    const v = val(sg), ok = v >= thr;
    tip.innerHTML = `<b>${sg.id}</b> · ${sg.road.name}<br>trust ${v.toFixed(2)} · ${ok ? 'published' : 'withheld: ' + (sg.road.type === 'rural' ? 'thin rural sample' : layer === '2' ? 'outside freight corridors' : 'below threshold')}`;
    tip.hidden = false;
  }
  function moveTip(e) { const r = $('.cover').getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top + 14) + 'px'; }
  $('#thr').addEventListener('input', e => { thr = +e.target.value; paintMap(false); });
  radio($('.cover .seg'), b => { layer = b.dataset.layer; paintMap(true); });
  paintMap(false);
  onSeen(map, () => { if (RM) return; SEGS.forEach((sg, i) => { const L = sg.el.getTotalLength(); gsap.fromTo(sg.el, { strokeDashoffset: L, strokeDasharray: L }, { strokeDashoffset: 0, duration: 0.9, delay: i * 0.012, ease: 'power2.out', onComplete: () => gsap.set(sg.el, { clearProps: 'strokeDasharray,strokeDashoffset' }) }); }); });

  /* ================= R3: ARCHITECTURE ================= */
  const NODES = {
    src: { t: 'Sources', p: 'Three licensed partners plus public permanent count stations. Each partner has a data contract: schema, delivery cadence, license terms and who may see raw records.', l: ['Vela Drive · daily batch', 'Orbit Pulse · daily batch, 72 h lag', 'Haulpath · 15-minute stream, restricted license', '212 permanent counters for calibration'], api: 'contract: haulpath.v2\nlicense: raw = freight_customers_only' },
    ing: { t: 'Ingestion & APIs', p: 'Partner adapters normalise feeds into one schema. Bad files go to quarantine instead of silently into metrics.', l: ['Schema and volume checks on arrival', 'Quarantine with alerting to the partner manager', 'Idempotent re-runs for late files'], api: 'POST /ingest/{partner}/batches\n→ 202 accepted · quarantine on schema drift' },
    trust: { t: 'Trust scoring', p: 'Every segment and period gets a 0 to 1 trust score from coverage, valid sample days, freshness and known bias, calibrated against permanent counters.', l: ['Coverage and sample days per partner', 'Freshness clock per feed', 'Bias flags carried as limitations text', 'Publish threshold set per product (default 0.70)'], api: 'trust(R9-14, 2026Q3) = 0.86\nlimits: ["weekend relies on Orbit"]' },
    metric: { t: 'Metric layer', p: 'Versioned definitions, computed once. Products and agents ask for a metric by name and version; nobody re-implements AADT.', l: ['aadt.v3, vmt.v2, od.v1, truck_share.v1', 'New versions ship beside old ones', 'Precomputed standard periods; on-demand custom zones (ADR-007)'], api: 'GET /metrics/aadt.v3?segment=R9-14&period=2026Q3\n→ { value: 42180, trust: 0.86 }' },
    perm: { t: 'Permissions', p: 'One entitlement check for every consumer: workspace, geography and partner license. Every call is logged, including the agent\'s.', l: ['Row-level geography filters', 'Partner-license rules (raw vs. derived)', 'Audit log per request and per agent tool call'], api: 'check(workspace=city_alder, dataset=haulpath.raw)\n→ DENY · reason: license' },
    ui: { t: 'Product UIs', p: 'Traffic Counts, Safety and Construction Impact render the same governed values, with the trust score and limitations beside each number.', l: ['Same value in every view', '"What changed" panel when a version moves', 'Withheld segments explain why'], api: 'ui.metricCard({ metric: "aadt.v3", showTrust: true })' },
    agent: { t: 'Agent', p: 'The agent calls the metric API as a tool under the user\'s own entitlements, must cite the metric and trust score, and warns below threshold.', l: ['Tools, not raw SQL (ADR-015)', 'Citations required in every answer', 'Golden-set evaluation gates each release'], api: 'tool: get_metric(name, segment, period)\nscope: inherited from user session' }
  };
  const order = ['src', 'ing', 'trust', 'metric', 'perm', 'ui', 'agent'];
  function showNode(k, animate) {
    const n = NODES[k];
    $$('.node').forEach(b => b.classList.toggle('is-on', b.dataset.node === k));
    $('#archDetail').innerHTML = `<p class="eyebrow mono">Layer ${String(order.indexOf(k) + 1).padStart(2, '0')}</p><h4>${n.t}</h4><p>${n.p}</p><ul>${n.l.map(x => `<li>${x}</li>`).join('')}</ul><code class="api">${n.api}</code>`;
    if (animate && !RM) gsap.from('#archDetail > *', { opacity: 0, x: 14, stagger: 0.05, duration: 0.45 });
  }
  let archTouched = false;
  $$('.node').forEach(b => b.addEventListener('click', () => { archTouched = true; showNode(b.dataset.node, true); }));
  showNode('metric', false);
  function drawArch() {
    const svg = $('#archLines'); if (!svg || getComputedStyle(svg).display === 'none') return;
    const box = $('#archFlow').getBoundingClientRect();
    const c = k => { const r = $(`.node[data-node="${k}"]`).getBoundingClientRect(); return { l: r.left - box.left, r: r.right - box.left, y: r.top + r.height / 2 - box.top }; };
    let h = '';
    const link = (a, b, o) => { const A = c(a), B = c(b), mx = (A.r + B.l) / 2, d = `M${A.r},${A.y} C${mx},${A.y} ${mx},${B.y} ${B.l},${B.y}`; h += `<path class="wire" d="${d}"/><path class="pulse${o ? ' o' : ''}" d="${d}" pathLength="414"/>`; };
    link('src', 'ing'); link('ing', 'trust'); link('trust', 'metric'); link('metric', 'perm', true); link('perm', 'ui'); link('perm', 'agent', true);
    svg.innerHTML = h; svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  }
  // walk the layers by itself once on screen, until the visitor clicks a node
  onSeen($('#archFlow'), () => { if (RM) return; order.forEach((k, i) => setTimeout(() => { if (!archTouched) showNode(k, true); }, 900 + i * 1700)); });

  const ADRS = [
    { ctx: 'Customers ask for standard periods (quarters, years) most of the time, but Construction Impact needs custom zones and dates. Do we precompute metrics or compute them when asked?',
      opts: [{ n: 'Precompute nightly', pick: true, c: [['p95 latency', 0.95, '120 ms'], ['Compute cost', 0.75, '1.0×'], ['Freshness', 0.45, '24 h'], ['Consistency', 0.95, 'high']] },
        { n: 'On demand for every query', c: [['p95 latency', 0.3, '2.8 s'], ['Compute cost', 0.3, '2.3×'], ['Freshness', 0.9, 'as fresh as data'], ['Consistency', 0.6, 'medium']] }],
      dec: 'Precompute standard periods; on-demand only for custom zones, with a per-query cost cap.', con: 'Most screens stay fast and identical across products. Custom zones cost more and are capped and cached; revisit when usage data is in.' },
    { ctx: 'Today each product filters data by customer geography in its own code. The agent would need a fourth copy. Where should permissions live?',
      opts: [{ n: 'In each product', c: [['Speed to ship', 0.8, 'fast now'], ['Consistency', 0.3, 'drifts'], ['Audit', 0.35, 'scattered'], ['Agent safety', 0.2, 'new copy']] },
        { n: 'Central, in the metric API', pick: true, c: [['Speed to ship', 0.5, '+6 wk'], ['Consistency', 0.95, 'one rule'], ['Audit', 0.9, 'one log'], ['Agent safety', 0.95, 'inherited']] }],
      dec: 'Central entitlements in the metric API; products and the agent cannot bypass them.', con: 'Six weeks of platform work before Safety migrates, agreed with the Safety PM. In return every new consumer is safe by default.' },
    { ctx: 'The agent could answer more questions on day one with direct SQL over the warehouse. Or it can use governed metric tools only.',
      opts: [{ n: 'Direct SQL to warehouse', c: [['Question range', 0.9, 'wide'], ['Correctness', 0.4, 'varies'], ['Permissions', 0.25, 'hard'], ['Citations', 0.2, 'weak']] },
        { n: 'Governed metric tools', pick: true, c: [['Question range', 0.55, 'narrower'], ['Correctness', 0.92, 'governed'], ['Permissions', 0.95, 'inherited'], ['Citations', 0.95, 'built in']] }],
      dec: 'Tools over the metric API only, with required citations. New question types arrive as new governed tools.', con: 'Fewer questions answered at launch. Every answer is traceable to a definition, a trust score and an entitlement decision.' }
  ];
  function showAdr(i, animate) {
    const a = ADRS[i];
    $('#adrBody').innerHTML = `<p class="adr__ctx">${a.ctx}</p><div class="opts">${a.opts.map(o => `<div class="opt${o.pick ? ' is-pick' : ''}"><h4>${o.n}${o.pick ? '<em>chosen</em>' : ''}</h4><div class="crit">${o.c.map(c => `<div><span>${c[0]}</span><span class="bar"><i class="${c[1] < 0.5 ? 'lo' : ''}" style="transform:scaleX(${c[1]})"></i></span><b>${c[2]}</b></div>`).join('')}</div></div>`).join('')}</div><p class="adr__dec"><b>Decision:</b> ${a.dec}<span><b>Consequences:</b> ${a.con}</span></p>`;
    if (animate && !RM) { gsap.from('#adrBody .crit .bar i', { scaleX: 0, duration: 0.9, stagger: 0.04, ease: 'expo.out' }); gsap.from('#adrBody .opt, #adrBody .adr__dec', { opacity: 0, y: 14, stagger: 0.08, duration: 0.5 }); }
  }
  $$('.adr__tabs button').forEach(b => b.addEventListener('click', () => { $$('.adr__tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); showAdr(+b.dataset.adr, true); }));
  showAdr(0, false);
  onSeen($('#adrBody'), () => showAdr(0, true));

  /* ================= R4: AGENT ================= */
  const ROLES = {
    planner: { scope: 'scope: Alder County · public roads · Vela + Orbit', raw: false },
    freight: { scope: 'scope: Alder County · freight corridors · Vela + Orbit + Haulpath raw', raw: true }
  };
  let role = 'planner';
  const ANS = {
    q1: () => ({ kind: 'ok', flag: 'Grounded answer', txt: 'AADT on R9-14 in Q3 was 42,180 vehicles per day. Trust is 0.86: 91% of days had a valid sample, data is 36 hours fresh, and two partners are blended. Limitation: weekend counts lean on Orbit Pulse, which skews urban.', cites: ['metric aadt.v3', 'segment R9-14', 'trust 0.86', 'partners: Vela + Orbit', 'scope ✓ ' + (role === 'planner' ? 'public roads' : 'freight corridors')] }),
    q2: () => ({ kind: 'ok', flag: 'Grounded answer', txt: 'County VMT rose 2.4% in the four weeks after the Mill St closure compared with the four weeks before. Most of the increase sits on the Route 9 detour, segments R9-12 to R9-16. Trust 0.81.', cites: ['metric vmt.v2', 'event: Mill St closure', 'window 4 wk vs 4 wk', 'trust 0.81', 'scope ✓'] }),
    q4: () => ({ kind: 'warn', flag: 'Low trust · directional only', txt: 'My estimate is 1,140 vehicles per day, but I am flagging it: trust is 0.52, below the 0.70 publish threshold. Only one partner covers this rural segment, with valid samples on 38% of days. A temporary counter would settle it.', cites: ['metric aadt.v3', 'segment R2-07', 'trust 0.52 < 0.70', 'partners: Vela only'] }),
    q3: () => role === 'freight'
      ? { kind: 'ok', flag: 'Allowed · licensed dataset', txt: 'Here are 1,284 heavy-truck traces on I-5 segments I5-03 to I5-09 from last week, from Haulpath raw data licensed to your workspace. Trucks are 14.2% of AADT on those segments.', cites: ['dataset haulpath.raw', 'license ✓ freight workspace', 'metric truck_share.v1', 'audit logged'] }
      : { kind: 'no', flag: 'Refused · not entitled', txt: 'I can\'t share that. Raw Haulpath traces are licensed to freight customers only, and the City of Alder planning workspace is not entitled. I can give you the governed truck-share metric for I-5 at segment level instead.', cites: ['policy haulpath.raw = DENY', 'reason: partner license', 'offered: truck_share.v1', 'audit logged'] }
  };
  const ICON = { ok: '<svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>', no: '<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>', warn: '<svg viewBox="0 0 12 12"><path d="M6 1.5l5 9H1z M6 5v2.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' };
  const log = $('#chatLog'); let busy = false, chatTouched = false;
  function addMsg(cls, html) { const m = document.createElement('div'); m.className = 'msg ' + cls; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; if (!RM) gsap.from(m, { opacity: 0, y: 12, duration: 0.4 }); return m; }
  function ask(q, btnText) {
    if (busy) return; busy = true; $$('#chatQs button').forEach(b => (b.disabled = true));
    addMsg('msg--user', `<p>${btnText}</p>`);
    const typing = addMsg('msg--bot', '<span class="typing"><i></i><i></i><i></i></span>');
    setTimeout(() => {
      typing.remove();
      const a = ANS[q](), cls = { ok: '', no: ' msg--refuse', warn: ' msg--warn' }[a.kind], fl = { ok: 'ok', no: 'no', warn: 'warn' }[a.kind];
      const m = addMsg('msg--bot' + cls, `<span class="msg__flag msg__flag--${fl}">${ICON[a.kind]}${a.flag}</span><p></p><div class="cites">${a.cites.map(c => `<span class="${/DENY|<|license|scope|audit/.test(c) ? 'p' : ''}">${c}</span>`).join('')}</div>`);
      const p = m.querySelector('p'), ws = a.txt.split(' ');
      let i = 0;
      const done = () => { $$('.cites span', m).forEach((s, k) => setTimeout(() => s.classList.add('on'), RM ? 0 : k * 120)); setTimeout(() => { busy = false; $$('#chatQs button').forEach(b => (b.disabled = false)); log.scrollTop = log.scrollHeight; }, RM ? 0 : a.cites.length * 120 + 200); };
      if (RM) { p.textContent = a.txt; return done(); }
      (function type() { p.textContent = ws.slice(0, ++i).join(' '); log.scrollTop = log.scrollHeight; i < ws.length ? setTimeout(type, 38) : done(); })();
    }, RM ? 0 : 750);
  }
  $$('#chatQs button').forEach(b => b.addEventListener('click', () => { chatTouched = true; ask(b.dataset.q, b.textContent); }));
  radio($('.chat .seg'), b => { role = b.dataset.role; $('#scopeTag').textContent = ROLES[role].scope; if (!RM) gsap.fromTo('#scopeTag', { opacity: 0 }, { opacity: 1, duration: 0.5 }); });
  // play two sample questions by itself when the panel comes on screen (the refusal included)
  onSeen($('.chat'), () => setTimeout(() => { if (!chatTouched) { ask('q1', $('[data-q="q1"]').textContent); setTimeout(() => { if (!chatTouched && !busy) ask('q3', $('[data-q="q3"]').textContent); }, 7500); } }, 900));

  const EVALS = [['Answer accuracy', 46 / 48, '46/48', 0.95], ['Cites the governed metric', 1, '48/48'], ['Permission handling (refuse or allow correctly)', 1, '12/12', 1], ['Low-trust warning raised', 0.9, '9/10', 0, 'w'], ['No unsupported claims', 47 / 48, '47/48']];
  $('#evalList').innerHTML = EVALS.map(e => `<li class="ev"><span>${e[0]}</span><b>${e[2]}</b><span class="bar"><i class="${e[4] || ''}" data-v="${e[1]}"></i>${e[3] ? `<em style="left:calc(${e[3] * 100}% - 1px)" title="ship gate"></em>` : ''}</span></li>`).join('');
  onSeen($('#evalList'), () => $$('#evalList .bar i').forEach((b, i) => gsap.to(b, { scaleX: +b.dataset.v, duration: RM ? 0 : 1.2, delay: RM ? 0 : i * 0.12, ease: 'expo.out' })));

  /* ================= R5: MIGRATION TRACK (moves by itself the moment it is on screen) ================= */
  const migWrap = $('#migWrap'), track = $('#migTrack'), waves = $$('.wave', track);
  let migI = 0, migTimer = 0, migVisible = false, migHold = false, migDrag = null;
  const dots = document.createElement('div'); dots.className = 'mig-dots'; dots.innerHTML = waves.map(() => '<i></i>').join('');
  function markWave(n) {
    waves.forEach((w, k) => { w.classList.toggle('is-cur', k === n); if (k <= n) w.classList.add('is-run'); });
    $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === n));
  }
  if (!RM) {
    const maxX = () => Math.max(0, track.scrollWidth - migWrap.clientWidth);
    const stopAt = n => Math.min(maxX(), waves[n].offsetLeft - waves[0].offsetLeft);
    const go = (n, d = 1.1) => { migI = (n + waves.length) % waves.length; markWave(migI); gsap.to(track, { x: -stopAt(migI), duration: d, ease: 'power3.inOut', overwrite: 'auto' }); };
    const start = () => { clearInterval(migTimer); migTimer = 0; if (migVisible && !migHold) migTimer = setInterval(() => go(migI + 1), 2800); };
    const stop = () => { clearInterval(migTimer); migTimer = 0; };
    new IntersectionObserver(es => es.forEach(e => {
      const was = migVisible; migVisible = e.isIntersecting;
      if (migVisible && !was) { markWave(migI); setTimeout(() => { if (migVisible && !migHold) { go(migI + (migI === 0 && !track.__moved ? 1 : 0)); track.__moved = true; start(); } }, 450); }
      if (!migVisible) stop();
    }), { threshold: 0.15 }).observe(migWrap);
    const nav = document.createElement('div'); nav.className = 'mig-nav';
    nav.innerHTML = '<button type="button" aria-label="Previous wave">&#8592;</button><span>Plays by itself · drag or use the arrows</span><button type="button" aria-label="Next wave">&#8594;</button>';
    nav.insertBefore(dots, nav.children[2]); migWrap.appendChild(nav);
    const [prevB, nextB] = nav.querySelectorAll('button');
    prevB.addEventListener('click', () => { go(migI - 1, 0.8); start(); }); nextB.addEventListener('click', () => { go(migI + 1, 0.8); start(); });
    migDrag = Draggable.create(track, { type: 'x', bounds: { minX: -maxX(), maxX: 0 }, edgeResistance: 0.85, cursor: 'grab', activeCursor: 'grabbing', allowNativeTouchScrolling: true,
      onPress: () => { migHold = true; stop(); },
      onDragStart() { this.applyBounds({ minX: -maxX(), maxX: 0 }); },
      onRelease() { const x = -this.x; let best = 0; waves.forEach((w, k) => { if (Math.abs(stopAt(k) - x) < Math.abs(stopAt(best) - x)) best = k; }); go(best, 0.6); migHold = false; start(); } })[0];
    addEventListener('resize', () => { migDrag.applyBounds({ minX: -maxX(), maxX: 0 }); go(migI, 0.3); });
  } else markWave(waves.length - 1);

  /* ================= MARQUEE (React Bits ScrollVelocity idea) ================= */
  $$('.marq__row').forEach(row => {
    row.innerHTML += row.innerHTML; if (RM) return;
    const tw = gsap.to(row, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: row, start: 'top bottom', end: 'bottom top', onUpdate: s => gsap.to(tw, { timeScale: 1 + Math.min(4, Math.abs(s.getVelocity()) / 400), duration: 0.2, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: 1, duration: 0.8 }) }) });
  });

  /* ================= REVEALS (IntersectionObserver + safety net, no pin measurements) ================= */
  $$('.card-fx').forEach(armCard);
  $$('.btn-enter, .btn-uv, .btn-ghost, .dock__btn').forEach(armMagnet);
  if (!RM) {
    $$('.req__title.split').forEach(t => {
      const s = new SplitText(t, { type: 'lines,words', mask: 'lines' });
      const tw = gsap.from(s.words, { yPercent: 110, stagger: 0.02, duration: 0.7, ease: 'expo.out', paused: true });
      onSeen(t, () => tw.play());
    });
    $$('.req__tag, .req__jd, .cap--c').forEach(el => { const tw = gsap.from(el, { y: 18, opacity: 0, duration: 0.5, paused: true }); onSeen(el, () => tw.play()); });
    const cards = $$('main .card-fx').filter(el => !el.closest('.hero'));
    gsap.set(cards, { opacity: 0, '--ty': '40px' });
    cards.forEach((el, i) => onSeen(el, () => gsap.to(el, { '--ty': '0px', opacity: 1, duration: 0.65, delay: (i % 3) * 0.07, ease: 'expo.out' })));
    $$('.lane article, .proof, .kpi, .risk-list li, .cov__row').forEach(el => { const tw = gsap.from(el, { y: 16, opacity: 0, duration: 0.5, paused: true }); onSeen(el, () => tw.play()); });
    // safety net: anything on screen that is still hidden after ~0.45 s is shown
    const watch = '.card-fx, .req__tag, .req__jd, .cap--c, .lane article, .proof, .kpi, .risk-list li, .cov__row';
    setInterval(() => {
      if (document.body.classList.contains('is-intro')) return;
      const now = performance.now();
      $$(watch).forEach(el => {
        const r = el.getBoundingClientRect();
        const inView = r.width && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        if (!inView) { el.__hid = 0; return; }
        if (parseFloat(getComputedStyle(el).opacity) > 0.6) { el.__hid = 0; return; }
        if (!el.__hid) { el.__hid = now; return; }
        if (now - el.__hid > 450) { el.__hid = 0; gsap.to(el, el.classList.contains('card-fx') ? { opacity: 1, '--ty': '0px', duration: 0.3, overwrite: 'auto' } : { opacity: 1, y: 0, duration: 0.3, overwrite: 'auto' }); }
      });
    }, 200);
  }

  /* ================= LATE REFRESH ================= */
  addEventListener('load', () => { ScrollTrigger.refresh(); drawBeams(); drawArch(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { ScrollTrigger.refresh(); drawBeams(); drawArch(); });
})();
