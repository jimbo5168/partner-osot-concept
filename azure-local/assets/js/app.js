/* Fleet Pulse · Azure Local deployment & lifecycle health · product concept by Jim Chao · synthetic data.
   Libraries (CDN with self-hosted fallback): GSAP 3.13 (ScrollTrigger, SplitText, Flip), anime.js 3.2.2, Motion 11, Lenis.
   Hand-ported patterns: React Bits CountUp / DecryptedText / ShinyText / SplitText reveal, Aceternity card spotlight +
   border glow + Animated Beam, Uiverse conic button / segmented radio / range, Motion spring magnetic buttons. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  document.documentElement.classList.add('js');
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
  gsap.defaults({ ease: 'power3.out', duration: 0.7 });
  const C = { ice: '#69c3ff', ice2: '#3a8fd9', ice3: '#1d4f80', ember: '#ffa24c', ok: '#3ddc97', warn: '#ffc857', bad: '#ff6b6b', muted: '#9db0c4' };
  const svg = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  /* ---------------- seeded random, seen-once observer ---------------- */
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const seenIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; seenIO.unobserve(e.target); const fns = e.target.__onSeen || []; e.target.__onSeen = null; fns.forEach(fn => fn());
  }), { threshold: 0, rootMargin: '0px 0px -6% 0px' }) : null;
  function onSeen(el, fn) { if (!el) return; if (!seenIO) return fn(); (el.__onSeen = el.__onSeen || []).push(fn); seenIO.observe(el); }

  /* ---------------- React Bits: CountUp ---------------- */
  function fmtNum(el, v) {
    const dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    let s = v.toFixed(dec); if (!dec) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return pre + s + suf;
  }
  function countUp(el, dur = 1.6, from = 0) {
    const to = parseFloat(el.dataset.count);
    if (RM) { el.textContent = fmtNum(el, to); return; }
    const o = { v: from };
    gsap.to(o, { v: to, duration: dur, ease: 'expo.out', onUpdate: () => (el.textContent = fmtNum(el, o.v)) });
  }
  $$('[data-count]').forEach(el => { if (!el.closest('.hero')) onSeen(el, () => countUp(el)); });

  /* ---------------- React Bits: DecryptedText ---------------- */
  function decrypt(el, final, dur = 900) {
    if (RM) { el.textContent = final; return; }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';
    const start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur), keep = Math.floor(final.length * p);
      el.textContent = final.split('').map((c, i) => (i < keep || ' ,.%/→-'.includes(c) ? c : chars[(Math.random() * chars.length) | 0])).join('');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ================= SYNTHETIC FLEET (1,240 clusters, six made-up partners A to F) ================= */
  const N = 1240, PARTNERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  function makeFleet(w, h, rk = 0.3) {
    const cols = Math.max(20, Math.round(Math.sqrt(N * w / h))), rows = Math.ceil(N / cols);
    const gx = w / (cols + 0.5), gy = h / (rows + 0.5), r = Math.max(1.3, Math.min(gx, gy) * rk);
    const pts = []; seed = 11;
    for (let i = 0; i < N; i++) {
      const c = i % cols, rr = (i / cols) | 0;
      const band = Math.min(5, Math.floor(c / cols * 6));
      const x = gx * (c + 0.5 + (rr % 2 ? 0.5 : 0)) + gx * 0.25, y = gy * (rr + 0.75);
      const q = rnd();
      // story: step-7 failures (41 in Partner C's band at the left edge, 9 elsewhere); hero: lifecycle state
      const fail = band === 0 ? q < 0.2 : q < 0.009;
      const life = q < 0.039 ? 'bad' : q < 0.178 ? 'warn' : 'ok';
      pts.push({ x, y, band, fail, life, ph: rnd() * 6.28 });
    }
    // ST-214 sits in Partner C's band, clear of the story text
    let focus = 0, best = 1e9;
    pts.forEach((p, i) => { const d = Math.abs(p.x - w * 0.1) + Math.abs(p.y - h * 0.5); if (p.band === 0 && d < best) { best = d; focus = i; } });
    pts[focus].fail = true;
    return { pts, r, cols, focus, w, h, gx };
  }
  function lerpC(a, b, t) { // hex lerp
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = ((pa >> 16) + (((pb >> 16) - (pa >> 16)) * t)) | 0, g = (((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t)) | 0, bl = ((pa & 255) + (((pb & 255) - (pa & 255)) * t)) | 0;
    return `rgb(${r},${g},${bl})`;
  }
  // mode 'story': lit / fail / fix / focus drive the opening; mode 'life': lifecycle colours for the hero
  function drawFleet(ctx, F, s, t, mode) {
    const { pts, r, w, h } = F;
    ctx.clearRect(0, 0, w, h);
    const waveX = ((t * 0.12) % 1.4 - 0.2) * w;
    if (mode === 'story' && s.fail > 0) { // Partner C band glow + label
      const x0 = 0, bw = w / 6;
      ctx.fillStyle = `rgba(255,107,107,${0.07 * s.fail * (1 - s.fix)})`; ctx.fillRect(x0, 0, bw, h);
      ctx.strokeStyle = `rgba(255,107,107,${0.35 * s.fail * (1 - s.fix)})`; ctx.setLineDash([4, 6]); ctx.strokeRect(x0 + 0.5, 0.5, bw - 1, h - 1); ctx.setLineDash([]);
      ctx.font = '500 11px JetBrains Mono, monospace'; ctx.fillStyle = `rgba(255,170,170,${0.9 * s.fail * (1 - s.fix)})`; ctx.fillText('PARTNER C HARDWARE', x0 + 8, 18);
    }
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const wave = Math.exp(-((p.x - waveX) ** 2) / (2 * (w * 0.06) ** 2));
      const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + p.ph);
      let col = C.ice, a;
      if (mode === 'story') {
        a = (0.12 + 0.55 * s.lit) * (0.6 + 0.4 * tw) + wave * 0.35 * s.lit;
        if (p.fail && s.fail > 0) { col = lerpC(C.ice, C.bad, s.fail); if (s.fix > 0) col = lerpC(C.bad, C.ok, s.fix); a = Math.max(a, 0.6 + 0.4 * tw); }
      } else {
        col = p.life === 'bad' ? C.bad : p.life === 'warn' ? C.warn : C.ice;
        a = (p.life === 'ok' ? 0.32 : 0.75) * (0.65 + 0.35 * tw) + wave * 0.5;
      }
      ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = col;
      if (mode === 'life' && p.life === 'bad') ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      else if (mode === 'life' && p.life === 'warn') { ctx.beginPath(); ctx.moveTo(p.x, p.y - r * 1.2); ctx.lineTo(p.x + r * 1.1, p.y + r * 0.9); ctx.lineTo(p.x - r * 1.1, p.y + r * 0.9); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (mode === 'story' && s.focus > 0) { // ST-214 ping
      const p = pts[F.focus], k = (t * 0.9) % 1;
      ctx.strokeStyle = s.fail > 0.5 && s.fix < 0.5 ? C.bad : C.ember; ctx.lineWidth = 1.5;
      ctx.globalAlpha = s.focus * (1 - k); ctx.beginPath(); ctx.arc(p.x, p.y, r + 4 + k * 26, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = s.focus; ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, 6.283); ctx.stroke();
      ctx.font = '600 12px JetBrains Mono, monospace'; ctx.fillStyle = C.ember; ctx.fillText('ST-214', p.x + 12, p.y - 10);
      ctx.globalAlpha = 1;
    }
  }
  function sizeCanvas(c) { const d = Math.min(2, devicePixelRatio || 1); c.width = c.clientWidth * d; c.height = c.clientHeight * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); }

  /* ================= OPENING ================= */
  const intro = $('#intro'), cv = $('#introCanvas'), cx = cv.getContext('2d');
  sizeCanvas(cv);
  let IF = makeFleet(cv.clientWidth, cv.clientHeight, 0.2);
  const S = { lit: 0.25, fail: 0, fix: 0, focus: 0 };
  let introRAF = 0;
  function introFrame(now) { drawFleet(cx, IF, S, now / 1000, 'story'); introRAF = requestAnimationFrame(introFrame); }
  if (RM) drawFleet(cx, IF, S, 0, 'story'); else introRAF = requestAnimationFrame(introFrame);

  const CHIPS = [['cluster', 'ST-214'], ['step', '7 / 12'], ['partner', 'C'], ['driver', 'v2.1'], ['fleet', '1,240'], ['partner', 'A'], ['step', 'validate network'], ['success', '91.4%'], ['partner', 'E'], ['pre-check', 'driver + firmware']];
  const chipWrap = $('#introChips');
  const chipEls = CHIPS.map(([k, v]) => { const d = document.createElement('div'); d.className = 'chip'; d.innerHTML = `<b>${k}</b>${v}`; chipWrap.appendChild(d); return d; });
  function placeChips() {
    const w = innerWidth, h = innerHeight;
    chipEls.forEach((el, i) => {
      const a = (i / chipEls.length) * Math.PI * 2 + 0.3;
      el.__x = Math.cos(a) * w * 0.41 + w / 2 - 60; el.__y = Math.sin(a) * h * 0.4 + h / 2 - 12;
      gsap.set(el, { x: el.__x, y: el.__y });
    });
  }
  placeChips();

  if (!RM) {
    ['.intro__kicker', '.intro__line', '.btn-enter', '.intro__hint', '.intro__skip'].forEach(s => $$(s).forEach(e => (e.style.opacity = 0)));
    chipEls.forEach(e => (e.style.opacity = 0));
    gsap.to(S, { lit: 0.55, duration: 2.4, ease: 'sine.inOut', delay: 0.2 });
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: chipEls, opacity: [0, 0.85], delay: anime.stagger(80), duration: 900 }, 300)
      .add({ targets: '.intro__kicker', opacity: [0, 1], translateY: [12, 0], duration: 700 }, 450)
      .add({ targets: '.intro__line', opacity: [0, 1], translateY: [28, 0], filter: ['blur(12px)', 'blur(0px)'], delay: anime.stagger(380), duration: 1000 }, 700)
      .add({ targets: ['.btn-enter', '.intro__hint', '.intro__skip'], opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(90), duration: 800 }, 2100);
    $$('.intro__line[data-scramble]').forEach((el, i) => setTimeout(() => decrypt(el, el.dataset.scramble, 850), 700 + i * 380));
    chipEls.forEach((el, i) => gsap.to(el, { x: el.__x + (i % 2 ? 18 : -18), y: el.__y + (i % 3 ? -12 : 12), duration: 3 + i * 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }

  /* ---- Opening story (~30 s placeholder). Words type in sync with narration clip "story".
     RETIME HERE once story.mp3 exists: t = when the phrase starts, e = when it ends (seconds from clip start).
     While the clip plays the page follows the clip's own clock (audio.currentTime), so only these marks need editing. ---- */
  const STORY = [
    { t: 0.2, e: 5.3, txt: 'Friday, 6 p.m. A retailer deploys a new two-node cluster in store 214.' },
    { t: 5.5, e: 10.0, txt: 'Two hours later, it stops at step 7 of 12: network validation.', hl: true },
    { t: 10.2, e: 13.8, txt: 'The network adapter driver is not the validated version.' },
    { t: 14.0, e: 20.2, txt: "Across 1,240 clusters in this synthetic fleet, the same failure hides in one hardware partner's corner." },
    { t: 20.4, e: 24.4, txt: 'A fleet view makes it visible: first-attempt deployment success, 91 percent.' },
    { t: 24.6, e: 29.8, txt: 'One fix, a driver and firmware pre-check before step 7, lifts it toward 96.', hl: true }
  ];
  const STORY_END = 30.4;
  // Visual cues, in seconds of the same clip. Move them with the phrases above.
  const CUE = { focus: 3.6, card0: 5.6, steps: 5.9, stepFail: 8.8, card1: 10.6, lit: 14.3, fail: 17.0, card2: 18.4, merge: 20.9, id: 22.6, fix: 26.6 };
  const storyEl = $('#story'), storyText = $('#storyText');
  const words = [];
  STORY.forEach(seg => {
    const ws = seg.txt.split(' '), span = (seg.e - seg.t) * 0.88;
    ws.forEach((w, i) => {
      const el = document.createElement('span'); el.className = 'w' + (seg.hl ? ' hl' : ''); el.textContent = w;
      storyText.appendChild(el); storyText.appendChild(document.createTextNode(' '));
      words.push({ el, at: seg.t + (span * i) / ws.length });
    });
  });
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
  storyText.appendChild(caret);
  const ansEls = $$('.ans');
  const stepsWrap = $('#ansSteps');
  const stepEls = Array.from({ length: 12 }, () => { const i = document.createElement('i'); stepsWrap.appendChild(i); return i; });

  let entered = false, storyDone = false, storyRAF = 0;
  function enter(withSound) {
    if (entered) return; entered = true;
    let audio = null;
    if (withSound && window.Sound) { Sound.startAll(); audio = Sound.say('story'); }
    const center = $('.intro__center');
    const show = () => { center.style.display = 'none'; $('#skipBtn').style.display = 'none'; storyEl.hidden = false; $('#storySkip').focus({ preventScroll: true }); };
    if (RM) show();
    else anime({ targets: [center, '#skipBtn'], opacity: [1, 0], translateY: [0, -14], duration: 500, easing: 'easeInQuad', complete: show });
    gsap.killTweensOf(chipEls); gsap.to(chipEls, { opacity: 0.16, duration: 0.8 });
    gsap.to(S, { lit: 0.3, duration: 1 });
    const fired = {}, once = (k, fn) => { if (!fired[k]) { fired[k] = 1; fn(); } };
    const w = innerWidth, h = innerHeight, mob = w < 1180;
    // desktop: cards in the margins beside the story column; phone: above and below it
    // phone: two slots above the story; card 3 takes card 1's slot, the gold card takes the left slot
    const spots = mob ? [[0.03, 0.025], [0.51, 0.025], [0.03, 0.025], [0.03, 0.025]] : [[0.03, 0.14], [0.79, 0.14], [0.03, 0.64], [0.79, 0.62]];
    const pop = (el, i, d = 0) => { gsap.set(el, { x: w * spots[i][0], y: h * spots[i][1] }); gsap.fromTo(el, { opacity: 0, scale: 0.82, rotate: i % 2 ? 3 : -3 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.8, delay: d, ease: 'back.out(1.6)' }); };
    let t0 = performance.now() + (RM ? 0 : 500);
    function tick(now) {
      let t;
      if (audio && !audio.paused && audio.currentTime > 0) { t = audio.currentTime; t0 = now - t * 1000; }
      else t = Math.max(0, (now - t0) / 1000);
      words.forEach(x => { if (t >= x.at) x.el.classList.add('on'); });
      if (t >= CUE.focus) once('focus', () => gsap.to(S, { focus: 1, lit: 0.42, duration: 0.8 }));
      if (t >= CUE.card0) once('card0', () => pop(ansEls[0], 0));
      if (t >= CUE.steps) { // steps 1..7 fill
        const n = Math.min(7, 1 + Math.floor((t - CUE.steps) / 0.42));
        stepEls.forEach((s, i) => s.classList.toggle('on', i < n)); $('#ansStep').textContent = n;
      }
      if (t >= CUE.stepFail) once('stepFail', () => { stepEls[6].classList.add('bad'); ansEls[0].classList.add('is-bad'); $('#ansNote').textContent = 'Validate network · failed'; gsap.fromTo(ansEls[0], { x: '+=6' }, { x: '-=6', duration: 0.08, repeat: 5, yoyo: true, ease: 'none' }); });
      if (t >= CUE.card1) once('card1', () => pop(ansEls[1], 1));
      if (t >= CUE.lit) once('lit', () => gsap.to(S, { lit: 1, duration: 1.4, ease: 'sine.inOut' }));
      if (t >= CUE.fail) once('fail', () => { gsap.to(S, { fail: 1, duration: 1.2 }); gsap.to(chipEls.filter((_, i) => i === 2 || i === 3), { opacity: 0.95, duration: 0.6 }); });
      if (t >= CUE.card2) once('card2', () => { if (mob) gsap.to(ansEls[0], { opacity: 0, scale: 0.9, duration: 0.4 }); pop(ansEls[2], 2, mob ? 0.3 : 0); });
      if (t >= CUE.merge) once('merge', () => {
        ansEls.slice(0, 3).forEach((el, i) => gsap.to(el, { x: w * spots[3][0], y: h * spots[3][1], opacity: 0, scale: 0.7, duration: 1.1, delay: i * 0.1, ease: 'expo.inOut' }));
        const g = ansEls[3]; gsap.set(g, { x: w * spots[3][0], y: h * spots[3][1] });
        gsap.fromTo(g, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.08, duration: 1, delay: 0.7, ease: 'back.out(1.7)' });
        gsap.to(chipEls, { opacity: 0.06, duration: 0.8 });
      });
      if (t >= CUE.id) once('id', () => { $('#storyId').classList.add('on'); decrypt($('#storyCluster'), 'ST-214', 800); decrypt($('#storyStep'), '7/12', 900); decrypt($('#storyRate'), '91% → 96%', 1100); });
      if (t >= CUE.fix) once('fix', () => {
        gsap.to(S, { fix: 1, duration: 1.6, ease: 'sine.inOut' });
        const el = $('#ansRate'); el.dataset.count = '96.0'; el.dataset.dec = '1'; el.dataset.suffix = '%'; countUp(el, 2.2, 91.4);
        $('#ansRateNote').textContent = 'projected with the pre-check';
      });
      if (t >= STORY_END) once('end', () => { caret.remove(); setTimeout(() => exitIntro(withSound), 1400); });
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
      ScrollTrigger.refresh(); heroIn(); $('#main').focus({ preventScroll: true }); drawBeams();
      if (withSound && window.Sound) setTimeout(() => Sound.say('intro'), 400);
    };
    if (RM) return finish();
    const tl = anime.timeline({ easing: 'easeInOutExpo', complete: finish });
    tl.add({ targets: [...chipEls, ...ansEls], opacity: 0, duration: 600 })
      .add({ targets: '#story', scale: [1, 0.94], opacity: [1, 0], duration: 600 }, 150)
      .add({ targets: '.intro__bar--top', translateY: ['-100%', '0%'], duration: 650 }, 500)
      .add({ targets: '.intro__bar--bot', translateY: ['100%', '0%'], duration: 650 }, 500)
      .add({ targets: intro, opacity: [1, 0], duration: 600 }, 1100);
  }
  $('#enterBtn').addEventListener('click', () => enter(true));
  $('#skipBtn').addEventListener('click', () => enter(false));
  $('#main').setAttribute('tabindex', '-1');
  $('#musicBtn').addEventListener('click', () => Sound.toggleMusic());
  $('#voiceBtn').addEventListener('click', () => { Sound.toggleVoice(); if (Sound.voiceOn) { Sound.resetSpoken(); const cur = currentSection(); if (cur && cur.dataset.narrate) Sound.say(cur.dataset.narrate); } });
  $('#replayIntro').addEventListener('click', () => location.reload());
  addEventListener('resize', () => { if (!entered) { sizeCanvas(cv); IF = makeFleet(cv.clientWidth, cv.clientHeight, 0.2); placeChips(); } });

  /* ================= LENIS + SCROLL ================= */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    lenis.stop(); // the page behind the opening stays put until the opening hands over
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

  /* ================= CARD FX: tilt + spotlight + border glow + magnetic + cursor glow ================= */
  function armCard(el) {
    if (!FINE || RM || el.__armed) return; el.__armed = true;
    const noTilt = el.hasAttribute('data-notilt');
    const rx = gsap.quickTo(el, '--rx', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, '--ry', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      const big = noTilt ? 1.6 : r.width > 560 ? 3 : 8;
      rx((0.5 - y) * big); ry((x - 0.5) * big);
    });
    el.addEventListener('pointerenter', () => el.classList.add('is-hot'));
    el.addEventListener('pointerleave', () => { el.classList.remove('is-hot'); rx(0); ry(0); });
  }
  $$('.card-fx').forEach(armCard);
  function armMagnet(b) {
    const { animate } = window.Motion || {};
    if (!animate || !FINE || RM) return;
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3 }, { type: 'spring', stiffness: 260, damping: 18 }); });
    b.addEventListener('pointerleave', () => animate(b, { x: 0, y: 0 }, { type: 'spring', stiffness: 200, damping: 14 }));
  }
  $$('.btn-enter, .btn-uv, .btn-ghost, .dock__btn').forEach(armMagnet);
  if (FINE && !RM) {
    const glow = $('#cursorGlow'), gx = gsap.quickTo(glow, 'x', { duration: 0.6 }), gy = gsap.quickTo(glow, 'y', { duration: 0.6 });
    addEventListener('pointermove', e => { gx(e.clientX); gy(e.clientY); });
  }
  // idle glow: on touch screens, cards light their border once as they arrive
  const idleGlow = el => { if (FINE || RM) return; el.classList.add('idle-glow'); setTimeout(() => el.classList.remove('idle-glow'), 1400); };

  /* ================= REVEALS (visible the moment they enter view) ================= */
  const titleEls = [];
  const revealEls = $$('main .sec .card-fx, main .sec .sec__num, main .sec .sec__jd, main .sec .why__role, main .sec .why__gap');
  function reveal(el) {
    if (el.__shown) return; el.__shown = true;
    const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    const d = Math.min(0.3, Math.max(0, sib) * 0.06);
    if (el.classList.contains('card-fx')) gsap.to(el, { opacity: 1, '--ty': '0px', duration: 0.65, delay: d, ease: 'power3.out', onComplete: () => idleGlow(el) });
    else gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: d });
  }
  if (!RM) {
    revealEls.forEach(el => { if (el.classList.contains('card-fx')) gsap.set(el, { opacity: 0, '--ty': '28px' }); else gsap.set(el, { opacity: 0, y: 18 }); onSeen(el, () => reveal(el)); });
    // safety net: anything on screen that is still hidden gets shown at once
    setInterval(() => {
      if (!document.body.classList.contains('is-in')) return;
      const vis = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
      revealEls.forEach(el => { if (!el.__shown && vis(el)) reveal(el); });
      titleEls.forEach(h => { if (!h.__shown && vis(h)) h.__go(); });
    }, 250);
    // section titles: SplitText line + word rise
    $$('.sec__title').forEach(h => {
      const split = new SplitText(h, { type: 'words' });
      split.words.forEach(wd => { const ln = document.createElement('span'); ln.className = 'ln'; ln.style.display = 'inline-block'; wd.parentNode.insertBefore(ln, wd); ln.appendChild(wd); });
      gsap.set(split.words, { yPercent: 110 });
      const go = () => { if (h.__shown) return; h.__shown = true; gsap.to(split.words, { yPercent: 0, duration: 0.8, stagger: 0.04, ease: 'expo.out' }); };
      h.__go = go; titleEls.push(h); onSeen(h, go);
    });
  }

  /* ================= HERO ================= */
  function heroIn() {
    if (lenis) lenis.start();
    if (RM) { $$('.hero [data-count]').forEach(el => countUp(el)); return; }
    $$('.hero [data-count]').forEach((el, i) => setTimeout(() => countUp(el, 1.8), 500 + i * 90));
    const split = new SplitText('#heroTitle', { type: 'words,chars' });
    gsap.from(split.chars, { yPercent: 60, opacity: 0, filter: 'blur(8px)', stagger: 0.014, duration: 0.9, ease: 'expo.out', onComplete: () => split.revert() });
    gsap.from(['.label-pill', '.hero__lede', '.hero__cta'], { y: 24, opacity: 0, stagger: 0.08, delay: 0.3, duration: 0.9, clearProps: 'transform' });
    gsap.from('.hero__viz', { opacity: 0, '--ty': '40px', duration: 1, delay: 0.25 });
    gsap.from('.hero__stats .stat', { opacity: 0, '--ty': '30px', stagger: 0.08, delay: 0.45, duration: 0.8 });
  }
  const hf = $('#heroFleet'), hx = hf.getContext('2d');
  sizeCanvas(hf);
  let HF = makeFleet(hf.clientWidth, hf.clientHeight), heroOn = false, heroRAF = 0;
  function heroFrame(now) { drawFleet(hx, HF, null, now / 1000, 'life'); if (heroOn) heroRAF = requestAnimationFrame(heroFrame); }
  if (RM) drawFleet(hx, HF, null, 0, 'life');
  else new IntersectionObserver(es => es.forEach(e => { heroOn = e.isIntersecting; cancelAnimationFrame(heroRAF); if (heroOn) heroRAF = requestAnimationFrame(heroFrame); })).observe(hf);
  addEventListener('resize', () => { sizeCanvas(hf); HF = makeFleet(hf.clientWidth, hf.clientHeight); if (RM) drawFleet(hx, HF, null, 0, 'life'); });

  // simulated event stream (ST = retail store, FA = factory, CL = clinic; all IDs made up)
  const EV = [
    ['ok', 'ST-031', 'update R-26.11 completed'], ['bad', 'ST-214', 'deployment step 7 failed · driver v2.1'], ['ok', 'FA-118', 'pre-check passed · 12/12 steps'],
    ['warn', 'CL-207', 'update waiting · free capacity 8%'], ['ok', 'ST-090', 'first workload running · 3.9 h'], ['warn', 'FA-044', 'firmware below validated version'],
    ['ok', 'CL-012', 'health check passed'], ['bad', 'ST-377', 'registration failed · permission missing'], ['ok', 'FA-260', 'update R-26.11 completed']
  ];
  const tl_ = $('#tickerList'); let evI = 0, evPaused = RM;
  function pushEv() {
    const [k, id, msg] = EV[evI++ % EV.length];
    const li = document.createElement('li'); li.className = k; li.innerHTML = `<b>${id}</b><span>${msg}</span>`;
    tl_.prepend(li); if (!RM) gsap.from(li, { opacity: 0, y: -14, duration: 0.45 });
    while (tl_.children.length > 5) tl_.lastChild.remove();
  }
  for (let i = 0; i < 4; i++) pushEv();
  setInterval(() => { if (!evPaused && heroOn && !document.hidden) pushEv(); }, 1700);
  $('#tickerPause').addEventListener('click', e => { evPaused = !evPaused; e.currentTarget.textContent = evPaused ? 'Resume' : 'Pause'; e.currentTarget.setAttribute('aria-pressed', evPaused); });
  if (RM) $('#tickerPause').textContent = 'Resume';
  if (!RM) gsap.to('.marq__row', { xPercent: -50, duration: 40, repeat: -1, ease: 'none' });
  $('.marq__row').innerHTML += $('.marq__row').innerHTML;

  /* ================= Uiverse segmented radio with sliding thumb ================= */
  function radio(group, cb) {
    const thumb = document.createElement('span'); thumb.className = 'seg__thumb'; group.prepend(thumb);
    const btns = $$('button', group);
    const place = (b, anim) => { const gr = group.getBoundingClientRect(), r = b.getBoundingClientRect(); gsap.to(thumb, { x: r.left - gr.left, width: r.width, duration: anim && !RM ? 0.45 : 0, ease: 'power3.out' }); };
    btns.forEach(b => b.addEventListener('click', e => { select(b, true); cb(b, e.isTrusted); }));
    function select(b, anim) { btns.forEach(x => x.setAttribute('aria-checked', x === b)); place(b, anim); }
    requestAnimationFrame(() => place(btns.find(b => b.getAttribute('aria-checked') === 'true') || btns[0], false));
    addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-checked') === 'true'), false));
    document.fonts && document.fonts.ready.then(() => place(btns.find(b => b.getAttribute('aria-checked') === 'true'), false));
    return { select: (i, anim = true) => { select(btns[i], anim); cb(btns[i], false); }, btns };
  }

  /* ================= R1 · DEPLOYMENT FUNNEL ================= */
  const STAGES = [
    { n: 'Hardware ready', s: 'steps 1-2', txt: 'Parts arrive, are racked and cabled, and BIOS settings are checked against the guide.', why: [['BIOS setting not as documented', 43], ['Part missing or wrong', 29], ['Cabling error', 28]], med: 38 },
    { n: 'Register with cloud', s: 'steps 3-4', txt: 'Each node registers with the customer\'s cloud subscription so it can be managed from one place.', why: [['Permission missing on the subscription', 47], ['Proxy or firewall blocks outbound calls', 35], ['Clock not in sync', 18]], med: 22 },
    { n: 'Validate environment', s: 'steps 5-6', txt: 'Checks firmware, drives and memory against the validated configuration.', why: [['Firmware below validated version', 46], ['Not enough drives', 31], ['Memory mismatch between nodes', 23]], med: 18 },
    { n: 'Validate network', s: 'step 7', txt: 'Step 7 checks adapters, drivers, VLANs and switch settings. It is where most first deployments stop.', why: [['Adapter driver not the validated version', 82], ['VLAN mismatch', 12], ['Switch MTU setting', 6]], med: 41 },
    { n: 'Create cluster', s: 'steps 8-10', txt: 'Forms the cluster and its storage pool, then sets up the quorum witness.', why: [['Storage pool creation timed out', 57], ['Quorum witness unreachable', 43]], med: 64 },
    { n: 'First workload running', s: 'steps 11-12', txt: 'The first virtual machine starts: the moment the customer gets value.', why: [['VM image download too slow', 50], ['Network policy blocks the VM', 50]], med: 35 }
  ];
  const SEGS = { all: { total: 1240, loss: [14, 17, 13, 50, 7, 6] }, retail: { total: 520, loss: [5, 6, 4, 31, 3, 2] }, factory: { total: 430, loss: [6, 7, 5, 12, 3, 2] }, clinic: { total: 290, loss: [3, 4, 4, 7, 1, 2] } };
  const funnel = $('#funnel');
  const flEls = STAGES.map((st, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="fl" type="button" aria-pressed="false"><span class="fl__name">${st.n}<small>${st.s}</small></span><span class="fl__track"><i class="fl__fill"></i><i class="fl__loss"></i></span><span class="fl__n"><span class="v">0</span><small></small></span></button>`;
    funnel.appendChild(li); const b = $('.fl', li);
    b.addEventListener('click', () => { stopDemo('r1'); selStage(i); });
    return b;
  });
  let segKey = 'all', stageI = 3, r1Shown = false;
  function paintFunnel(anim) {
    const sg = SEGS[segKey]; let left = sg.total; const worst = sg.loss.indexOf(Math.max(...sg.loss));
    flEls.forEach((b, i) => {
      const before = left; left -= sg.loss[i];
      const fill = $('.fl__fill', b), loss = $('.fl__loss', b), v = $('.v', b);
      // zoomed axis: bars start at 80% of clusters so the losses are readable (noted under the chart)
      const z = v => Math.max(0, (v / sg.total - 0.8) / 0.2), pAfter = z(left), pBefore = z(before);
      b.classList.toggle('is-worst', i === worst);
      gsap.to(fill, { scaleX: r1Shown ? pAfter : 0, duration: anim && !RM ? 0.9 : 0, delay: anim ? i * 0.07 : 0, ease: 'expo.out' });
      gsap.set(loss, { left: (pAfter * 100) + '%', width: ((pBefore - pAfter) * 100) + '%', opacity: r1Shown ? 1 : 0 });
      const o = { v: +v.textContent.replace(/,/g, '') || 0 };
      gsap.to(o, { v: left, duration: anim && !RM ? 0.9 : 0, onUpdate: () => (v.textContent = Math.round(o.v).toLocaleString('en-US')) });
      $('.fl__n small', b).textContent = '-' + sg.loss[i];
    });
    const pct = (left / sg.total * 100).toFixed(1);
    $('#funnelFoot').innerHTML = `${left.toLocaleString('en-US')} of ${sg.total.toLocaleString('en-US')} clusters reach a running workload on the first attempt: <b>${pct}%</b>. Biggest drop: ${STAGES[worst].n.toLowerCase()} (${STAGES[worst].s}). Bar axis starts at 80%.`;
    selStage(stageI, false);
  }
  function selStage(i, anim = true) {
    stageI = i; const st = STAGES[i], sg = SEGS[segKey];
    flEls.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i); });
    $('#sdK').textContent = 'Stage ' + (i + 1) + ' of 6 · ' + st.s;
    $('#sdTitle').textContent = st.n; $('#sdText').textContent = st.txt;
    const bars = $('#sdBars'); bars.innerHTML = '';
    st.why.forEach(([lab, p]) => {
      const d = document.createElement('div'); d.className = 'bar';
      d.innerHTML = `<div><span>${lab}</span><div class="bar__t"><i></i></div></div><b>${p}%</b>`; bars.appendChild(d);
      gsap.fromTo($('i', d), { scaleX: 0 }, { scaleX: p / 100, duration: anim && !RM ? 0.8 : 0, ease: 'expo.out' });
    });
    const med = $('#sdMed'), lost = $('#sdLost');
    med.dataset.count = st.med; lost.dataset.count = sg.loss[i]; countUp(med, anim ? 0.9 : 0.01); countUp(lost, anim ? 0.9 : 0.01);
    if (anim && !RM) gsap.fromTo('#stageDetail', { '--ty': '8px' }, { '--ty': '0px', duration: 0.5 });
  }
  const segR = radio($('#segBtns'), (b, user) => { if (user) stopDemo('r1'); segKey = b.dataset.seg; paintFunnel(true); });
  // time-to-value curve (log-normal shape, synthetic): x = hours 0..20
  (function ttv() {
    const X = h => h * 16, mu = Math.log(4.6), sd = 0.55, pts = [];
    for (let h = 0.2; h <= 20; h += 0.2) { const y = Math.exp(-((Math.log(h) - mu) ** 2) / (2 * sd * sd)) / (h * sd); pts.push([X(h), y]); }
    const mx = Math.max(...pts.map(p => p[1]));
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + (78 - p[1] / mx * 58).toFixed(1)).join(' ');
    $('#ttvLine').setAttribute('d', line); $('#ttvArea').setAttribute('d', line + ' L320 78 L3 78 Z');
    const m = $$('.ttv__mark'), t = $$('.ttv__t');
    m[0].setAttribute('x1', X(4.6)); m[0].setAttribute('x2', X(4.6)); t[0].setAttribute('x', X(4.6) + 4);
    m[1].setAttribute('x1', X(11.2)); m[1].setAttribute('x2', X(11.2)); t[1].setAttribute('x', X(11.2) + 4);
    const L = $('#ttvLine'), len = L.getTotalLength();
    if (!RM) { gsap.set(L, { strokeDasharray: len, strokeDashoffset: len }); gsap.set('#ttvArea', { opacity: 0 }); onSeen($('.ttv'), () => { gsap.to(L, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }); gsap.to('#ttvArea', { opacity: 1, duration: 1, delay: 0.8 }); }); }
  })();

  /* auto-demos: each widget plays itself once when it comes on screen; any click stops it */
  const demos = {};
  function stopDemo(k) { if (demos[k]) { demos[k].forEach(clearTimeout); demos[k] = null; } }
  function runDemo(k, steps) { demos[k] = steps.map(([ms, fn]) => setTimeout(fn, RM ? 0 : ms)); }

  paintFunnel(false);
  onSeen($('#funnel'), () => {
    r1Shown = true; stageI = 0; paintFunnel(true);
    runDemo('r1', [[1300, () => selStage(1)], [2400, () => selStage(2)], [3500, () => selStage(3)], [6500, () => segR.select(1)], [9000, () => segR.select(0)]]);
  });

  /* ================= R2 · LIFECYCLE ================= */
  const RINGS = [{ n: 'Canary', k: '2%', c: 25, r: 62, done: 100, col: C.ok }, { n: 'Early', k: '10%', c: 124, r: 94, done: 72, col: C.ice }, { n: 'Broad', k: '88%', c: 1091, r: 126, done: 0, col: C.ember }];
  const ringSvg = $('#ringSvg');
  const tracks = [];
  const arcs = RINGS.map((R, i) => {
    tracks.push(svg('circle', { class: 'rtrack', cx: 150, cy: 150, r: R.r, 'stroke-width': 16 }, ringSvg));
    const a = svg('circle', { class: 'rarc', cx: 150, cy: 150, r: R.r, 'stroke-width': 16, stroke: R.col, pathLength: 100, 'stroke-dasharray': '0 100', transform: 'rotate(-90 150 150)' }, ringSvg);
    const lab = svg('text', { x: 150, y: 150 - R.r + 4, 'text-anchor': 'middle', class: 'rlab', fill: '#e8f0f8', stroke: '#060a10', 'stroke-width': 3, 'paint-order': 'stroke' }, ringSvg); lab.textContent = R.n.toUpperCase() + ' ' + R.k;
    return a;
  });
  const core = svg('text', { x: 150, y: 150, 'text-anchor': 'middle', class: 'rcore' }, ringSvg); core.textContent = 'R-26.11';
  const coreSub = svg('text', { x: 150, y: 172, 'text-anchor': 'middle' }, ringSvg); coreSub.textContent = '1,240 clusters';
  const EARLY_RATE = 2.2; // 2 failures in 89 updated Early-ring clusters (synthetic)
  function gate(v, anim) {
    const g = $('#gate'); g.value = v; g.style.setProperty('--p', ((v - 0.5) / 4.5 * 100) + '%');
    $('#gateVal').textContent = (+v).toFixed(1) + '%';
    const pause = EARLY_RATE > v, st = $('#gateState');
    st.textContent = pause ? 'Paused at Early ring' : 'Proceeding'; st.classList.toggle('is-pause', pause);
    $('#gateText').innerHTML = pause
      ? `Early ring shows <b>${EARLY_RATE}%</b> failures (2 of 89 updated), above the gate. Broad ring (1,091 clusters) waits; logs from the 2 failures go to engineering and the readiness owner gets a decision by noon.`
      : `Early ring shows <b>${EARLY_RATE}%</b> failures (2 of 89 updated), under the gate. Broad ring starts when Early reaches 100%; clusters that fail readiness checks are held back automatically.`;
    gsap.to(tracks[2], { attr: { stroke: pause ? 'rgba(255,107,107,.45)' : 'rgba(140,190,240,.1)', 'stroke-dasharray': pause ? '3 4' : '0 0' }, duration: anim && !RM ? 0.4 : 0 });
    coreSub.textContent = pause ? 'Broad on hold' : '1,240 clusters';
  }
  $('#gate').addEventListener('input', e => { stopDemo('r2'); gate(e.target.value, true); });
  gate(2.5, false);
  onSeen(ringSvg, () => {
    arcs.forEach((a, i) => { if (i < 2) gsap.to(a, { attr: { 'stroke-dasharray': RINGS[i].done + ' 100' }, duration: RM ? 0 : 1.6, delay: i * 0.3, ease: 'power2.inOut' }); });
    if (!RM) gsap.to(arcs[1], { opacity: 0.65, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
    const o = { v: 2.5 };
    runDemo('r2', [[2600, () => gsap.to(o, { v: 1.8, duration: 1.4, ease: 'power2.inOut', onUpdate: () => gate(o.v.toFixed(1), true) })], [6600, () => gsap.to(o, { v: 2.5, duration: 1.2, ease: 'power2.inOut', onUpdate: () => gate(o.v.toFixed(1), true) })]]);
  });
  // release distribution
  const VER = [['R-26.11 (latest)', 38, C.ice], ['R-26.10', 34, C.ice2], ['R-26.09', 19, '#2c6aa8'], ['Outside support window', 9, C.ember]];
  const stack = $('#verStack'), vleg = $('#verLegend');
  VER.forEach(([n, p, c]) => {
    const i = document.createElement('i'); i.style.flex = p; i.style.background = c; i.textContent = p + '%'; stack.appendChild(i);
    const s = document.createElement('span'); s.style.setProperty('--c', c); s.textContent = n; vleg.appendChild(s);
  });
  if (!RM) { gsap.set('#verStack i', { scaleX: 0 }); onSeen(stack, () => gsap.to('#verStack i', { scaleX: 1, duration: 0.9, stagger: 0.12, ease: 'expo.out' })); }
  // readiness heatmap: 60 sample clusters x 5 checks
  const heat = $('#heat'); seed = 29; let ready = 0, act = 0, blk = 0;
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div'); c.className = 'hc'; let worst = 0; const lab = [];
    ['Firmware', 'Drivers', 'Storage health', 'Free capacity', 'Support window'].forEach(n => {
      const q = rnd(), k = q < 0.008 ? 'b' : q < 0.038 ? 'w' : ''; const e = document.createElement('i'); if (k) e.className = k; c.appendChild(e);
      if (k === 'b') worst = 2; else if (k === 'w' && worst < 1) worst = 1; if (k) lab.push(n + (k === 'b' ? ' blocked' : ' needs action'));
    });
    worst === 2 ? blk++ : worst === 1 ? act++ : ready++;
    c.title = 'Sample cluster ' + (i + 1) + ': ' + (lab.join(', ') || 'all checks pass'); heat.appendChild(c);
  }
  $('#readySum').textContent = `${ready} ready · ${act} need action · ${blk} blocked`;
  if (!RM) { gsap.set('.hc', { opacity: 0, scale: 0.4 }); onSeen(heat, () => gsap.to('.hc', { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.012, grid: 'auto', from: 'start' }, ease: 'back.out(2)' })); }

  /* ================= R3 · PARTNERS ================= */
  const COMP = ['Network adapter', 'Storage controller', 'Drives', 'GPU', 'BMC firmware', 'TPM'];
  // v = validated, i = in validation, g = gap; columns follow COMP
  const MX = { A: 'vvvvvv', B: 'vvvivv', C: 'vvvgvv', D: ['v', 'v', 'i', 'v', 'i', 'v'].join(''), E: 'vivgvv', F: 'vvvivv' };
  const PD = {
    A: { share: 24, drift: 3, days: 21, note: 'Fully validated and little drift. Use as the reference for the pre-check rules.' },
    B: { share: 19, drift: 5, days: 26, note: 'GPU in validation for AI inference at the edge. Target: validated before the next release.' },
    C: { share: 21, drift: 18, days: 38, note: 'Adapter validated at driver v2.3, but factory images still ship v2.1: that is the step-7 story. Ask: update the factory image. Meanwhile the fleet pre-check blocks the deployment and links the right driver.' },
    D: { share: 15, drift: 7, days: 30, note: 'Drives and BMC firmware in validation. Two sizes are not yet on the list, so retail sites are steered to validated sizes.' },
    E: { share: 12, drift: 9, days: 44, note: 'Slowest to validate (44 days). Offer a shared test plan and early access to the validation suite.' },
    F: { share: 9, drift: 4, days: 24, note: 'Small share, clean record. GPU in validation; good candidate for a co-launch.' }
  };
  const mx = $('#mx');
  const h0 = document.createElement('span'); h0.className = 'mx__h'; h0.textContent = 'Partner'; mx.appendChild(h0);
  COMP.forEach(c => { const h = document.createElement('span'); h.className = 'mx__h'; h.textContent = c; mx.appendChild(h); });
  const rowBtns = {}, cells = {};
  PARTNERS.forEach(p => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mx__p'; b.textContent = 'Partner ' + p; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { stopDemo('r3'); selPartner(p); }); mx.appendChild(b); rowBtns[p] = b; cells[p] = [];
    MX[p].split('').forEach((s, j) => {
      const c = document.createElement('span'); c.className = 'mx__c'; c.setAttribute('role', 'gridcell');
      const lab = s === 'v' ? 'validated' : s === 'i' ? 'in validation' : 'gap';
      c.innerHTML = `<i class="sh sh--${s === 'v' ? 'ok' : s === 'i' ? 'warn' : 'bad'}"></i>` + (p === 'C' && j === 0 ? '<em>v2.3</em>' : '');
      c.title = `Partner ${p} · ${COMP[j]}: ${lab}` + (p === 'C' && j === 0 ? ' (field runs v2.1)' : ''); c.setAttribute('aria-label', c.title);
      mx.appendChild(c); cells[p].push(c);
    });
  });
  const driftBars = $('#driftBars');
  const dbEls = PARTNERS.map(p => { const d = document.createElement('div'); d.className = 'db' + (p === 'C' ? ' hot' : ''); d.innerHTML = `<span>Partner ${p}</span><div class="db__t"><i></i></div><b>${PD[p].drift}%</b>`; driftBars.appendChild(d); return d; });
  function selPartner(p) {
    PARTNERS.forEach(q => { rowBtns[q].classList.toggle('is-on', q === p); rowBtns[q].setAttribute('aria-pressed', q === p); cells[q].forEach(c => c.classList.toggle('row-on', q === p)); });
    $('#pName').textContent = 'Partner ' + p + ' (made up)';
    [['#pShare', PD[p].share, '%'], ['#pDrift', PD[p].drift, '%'], ['#pDays', PD[p].days, '']].forEach(([s, v, suf]) => { const el = $(s); el.dataset.count = v; el.dataset.suffix = suf; countUp(el, 0.8); });
    $('#pNote').textContent = PD[p].note;
    if (!RM) gsap.fromTo(cells[p], { scale: 0.85 }, { scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(2.5)', clearProps: 'transform' });
  }
  selPartner('C');
  if (!RM) {
    gsap.set('.mx__c, .mx__p', { opacity: 0, y: 10 });
    onSeen(mx, () => {
      gsap.to('.mx__c, .mx__p', { opacity: 1, y: 0, duration: 0.45, stagger: 0.015, clearProps: 'transform' });
      runDemo('r3', [[1500, () => selPartner('A')], [3000, () => selPartner('E')], [4500, () => selPartner('C')]]);
    });
    gsap.set('.db__t i', { scaleX: 0 });
    onSeen(driftBars, () => dbEls.forEach((d, i) => gsap.to($('i', d), { scaleX: PD[PARTNERS[i]].drift / 20, duration: 1, delay: i * 0.08, ease: 'expo.out' })));
  } else dbEls.forEach((d, i) => gsap.set($('i', d), { scaleX: PD[PARTNERS[i]].drift / 20 }));
  // validation loop pipeline with travelling pulses
  (function pipe() {
    const ps = $('#pipeSvg'); ps.setAttribute('viewBox', '0 0 1000 20'); ps.setAttribute('preserveAspectRatio', 'none');
    svg('path', { d: 'M0 10 H1000', stroke: 'rgba(140,190,240,.24)', 'stroke-width': 2 }, ps);
    const nodes = $$('.pipe__nodes span');
    if (RM) return;
    [C.ice, C.ember].forEach((col, k) => {
      const p = svg('path', { d: 'M0 10 H1000', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '60 1000', 'stroke-dashoffset': 60 }, ps);
      gsap.to(p, { attr: { 'stroke-dashoffset': -1000 }, duration: 4, delay: k * 2, repeat: -1, ease: 'none',
        onUpdate: function () { const x = this.progress() * 1060 - 30; nodes.forEach((n, i) => n.classList.toggle('is-hit', Math.abs(x - i * 250) < 40)); } });
    });
  })();

  /* ================= R4 · SIGNALS → REQUIREMENTS ================= */
  const SRC_COL = [C.ice, C.ember, C.warn, C.ok];
  const PAINS = [
    { t: 'Driver and firmware drift fails network validation (step 7)', ev: [41, 63, 9, 5], s: 92,
      req: 'Pre-check drivers and firmware before deployment starts', story: 'As an IT admin deploying a new site, I want to know before step 1 that my adapters, drivers and firmware match the validated list, so a deployment never stops halfway at step 7.',
      ac: ['Pre-check runs in under 2 minutes, offline-capable', 'Every mismatch names the part, the installed and the validated version, and links the fix', 'Partner sees the same report for their factory image'], m: 'First-attempt deployment success from 91.4% to 96%; step-7 support cases down 60%.' },
    { t: 'Updates stall on clusters low on free capacity', ev: [36, 48, 6, 4], s: 81,
      req: 'Forecast capacity before every update', story: 'As an operator of many sites, I want to see which clusters lack the free capacity an update needs, a week before the update, so nothing stalls mid-way.',
      ac: ['Forecast per cluster, 7 days ahead', 'Clusters under the threshold are held out of the ring automatically', 'One-click export for the field team'], m: 'Stalled updates per release from 4.1% to under 1%.' },
    { t: "Registration errors don't say which permission is missing", ev: [23, 71, 7, 6], s: 74,
      req: 'Registration errors that name the missing permission', story: 'As an admin registering nodes, I want the error to tell me exactly which permission is missing and who can grant it, so I fix it in minutes, not a support case.',
      ac: ['Error text names the role and scope', 'Copyable command to grant it', 'Docs page linked from the error'], m: 'Registration support cases down 50%; median stage time from 22 to 10 minutes.' },
    { t: 'Planning VM moves from an existing hypervisor takes weeks', ev: [0, 29, 14, 9], s: 66,
      req: 'VM migration planner', story: 'As a customer moving workloads onto new clusters, I want an inventory and wave plan for my existing virtual machines, so I can move them with predictable downtime.',
      ac: ['Imports an inventory file', 'Suggests waves with rollback points', 'Estimates downtime per wave'], m: 'Time from purchase to first migrated production workload down 40%.' },
    { t: 'Hard to check the validated catalog before buying hardware', ev: [0, 18, 11, 7], s: 58,
      req: 'Search the validated catalog by workload', story: 'As a buyer planning a new site, I want to search validated hardware by workload and site size, so I only buy combinations that will deploy cleanly.',
      ac: ['Filter by workload, node count, GPU need', 'Shows validation status per component', 'Shareable link for the partner quote'], m: 'Share of new clusters on fully validated combinations from 88% to 97%.' }
  ];
  const painsEl = $('#pains');
  const painEls = PAINS.map((p, i) => {
    const li = document.createElement('li'); const tot = p.ev.reduce((a, b) => a + b, 0);
    li.innerHTML = `<button class="pain" type="button" aria-pressed="false"><span class="pain__i">${String(i + 1).padStart(2, '0')}</span><span><span class="pain__t">${p.t}</span><span class="pain__ev">${p.ev.map((v, k) => `<i style="flex:${v};background:${SRC_COL[k]}"></i>`).join('')}</span></span><span class="pain__s">${p.s}</span></button>`;
    painsEl.appendChild(li); const b = $('.pain', li); b.title = `Evidence: ${p.ev[0]} telemetry clusters, ${p.ev[1]} support cases, ${p.ev[2]} field notes, ${p.ev[3]} interviews (${tot} signals)`;
    b.addEventListener('click', () => { stopDemo('r4'); selPain(i); });
    return b;
  });
  let typeTimer = 0;
  function typeInto(el, text, ms = 14) {
    if (RM) { el.textContent = text; return; }
    el.textContent = ''; el.classList.add('typing'); let i = 0;
    (function step() { el.textContent = text.slice(0, i += 2); if (i < text.length) typeTimer = setTimeout(step, ms); else el.classList.remove('typing'); })();
  }
  function selPain(i) {
    const p = PAINS[i]; clearTimeout(typeTimer); $$('.typing').forEach(e => e.classList.remove('typing'));
    painEls.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i); });
    $('#reqK').textContent = 'Requirement draft · from pain point ' + String(i + 1).padStart(2, '0');
    $('#reqScore').textContent = 'score ' + p.s;
    decrypt($('#reqTitle'), p.req, 700);
    typeInto($('#reqStory'), p.story);
    const ul = $('#reqAC'); ul.innerHTML = p.ac.map(a => `<li>${a}</li>`).join('');
    if (!RM) gsap.from($$('li', ul), { opacity: 0, x: -10, stagger: 0.12, duration: 0.4, delay: 0.3 });
    $('#reqMetric').textContent = p.m;
    if (!RM) gsap.fromTo('#reqMetric', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.6 });
    pulseBeams(i);
  }
  // Aceternity Animated Beam: curved paths sources → fusion → pain points
  const beamSvg = $('#beams'), box = $('#r4box'); let beamPaths = [];
  function anchor(el, side) { const b = box.getBoundingClientRect(), r = el.getBoundingClientRect(); return [side === 'r' ? r.right - b.left : r.left - b.left, r.top - b.top + r.height / 2]; }
  function drawBeams() {
    if (getComputedStyle(beamSvg).display === 'none') return;
    beamSvg.innerHTML = ''; beamPaths = [];
    const b = box.getBoundingClientRect(); beamSvg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    const fuse = $('#fuse');
    const add = (a, z, col, group, idx) => {
      const mx = (a[0] + z[0]) / 2, d = `M${a[0]} ${a[1]} C${mx} ${a[1]} ${mx} ${z[1]} ${z[0]} ${z[1]}`;
      svg('path', { d, stroke: 'rgba(140,190,240,.16)', 'stroke-width': 1.5 }, beamSvg);
      const p = svg('path', { d, stroke: col, 'stroke-width': 2.5, 'stroke-linecap': 'round', pathLength: 1000, 'stroke-dasharray': '90 1000', 'stroke-dashoffset': 90, opacity: 0.9 }, beamSvg);
      beamPaths.push({ p, group, idx });
      if (!RM) gsap.to(p, { attr: { 'stroke-dashoffset': -1000 }, duration: 2.6 + idx * 0.25, delay: idx * 0.4 + (group === 'out' ? 1 : 0), repeat: -1, ease: 'power1.inOut' });
    };
    $$('.src__n').forEach((n, i) => add(anchor(n, 'r'), anchor(fuse, 'l'), SRC_COL[i], 'in', i));
    painEls.forEach((pe, i) => add(anchor(fuse, 'r'), anchor(pe, 'l'), C.ember, 'out', i));
    const on = painEls.findIndex(b => b.classList.contains('is-on')); if (on >= 0) pulseBeams(on);
  }
  function pulseBeams(i) { beamPaths.forEach(b => { if (b.group === 'out') gsap.to(b.p, { opacity: b.idx === i ? 1 : 0.15, attr: { 'stroke-width': b.idx === i ? 3.5 : 2 }, duration: 0.4 }); }); }
  selPain(0);
  addEventListener('resize', () => { clearTimeout(drawBeams.t); drawBeams.t = setTimeout(drawBeams, 150); });
  onSeen(box, () => {
    drawBeams(); runDemo('r4', [[3800, () => selPain(1)], [7600, () => selPain(2)], [11400, () => selPain(0)]]);
    if (!RM) gsap.from('.pain', { opacity: 0, x: 30, stagger: 0.08, duration: 0.6, clearProps: 'transform,opacity' });
  });
  document.fonts && document.fonts.ready.then(drawBeams);

  /* ================= R5 · ROADMAP (GSAP Flip) ================= */
  const ITEMS = [
    { id: 'A', t: 'Driver & firmware pre-check before deployment', p: 'pain 01', w: 6, val: 9, fea: 8, biz: 8 },
    { id: 'B', t: 'Rollout health gates with auto-pause', p: 'lifecycle', w: 8, val: 8, fea: 6, biz: 7 },
    { id: 'C', t: 'Registration errors that name the missing permission', p: 'pain 03', w: 3, val: 7, fea: 9, biz: 5 },
    { id: 'D', t: 'VM migration planner', p: 'pain 04', w: 12, val: 7, fea: 4, biz: 9 },
    { id: 'E', t: 'Validated catalog search by workload', p: 'pain 05', w: 5, val: 6, fea: 8, biz: 7 },
    { id: 'F', t: 'Capacity forecast before each update', p: 'pain 02', w: 5, val: 8, fea: 7, biz: 6 },
    { id: 'G', t: 'Fleet health API for hardware partners', p: 'partners', w: 9, val: 5, fea: 6, biz: 8 }
  ];
  const CAP = 30;
  const TRADE = {
    bal: '<b>Balanced</b> (value 40%, feasibility 30%, impact 30%): five items fit in 30 weeks. The VM migration planner, the biggest business lever, waits because it alone needs 12 weeks. I would say that out loud and cover the gap with a field-written migration guide.',
    val: '<b>Customer value first:</b> fix what hurts today. The pre-check, capacity forecast, health gates and clearer errors fit; the migration planner drops below the line, which slows new-customer adoption this half.',
    fea: '<b>Feasibility first:</b> five quick wins ship early and lift deployment success fast, but the migration planner and the partner API slip, and those are what open new revenue.',
    biz: '<b>Business impact first:</b> the migration planner, the pre-check and the partner API take 27 of 30 weeks. Health gates and clearer registration errors wait, so update stalls and registration tickets keep coming another half.'
  };
  const road = $('#road');
  const rdEls = {};
  ITEMS.forEach(it => {
    const li = document.createElement('li'); li.className = 'rd'; li.dataset.flipId = it.id;
    li.innerHTML = `<span class="rd__i"></span><span class="rd__t">${it.t}<small>${it.p} · value ${it.val} · feasibility ${it.fea} · impact ${it.biz}</small></span><span class="rd__sc"><i></i></span><span class="rd__w">${it.w} wks</span><span class="rd__tag"></span>`;
    rdEls[it.id] = li;
  });
  const capLine = document.createElement('li'); capLine.className = 'capline'; capLine.dataset.flipId = 'cap'; capLine.textContent = 'capacity · 30 engineering weeks';
  const score = (it, lens) => lens === 'val' ? it.val : lens === 'fea' ? it.fea : lens === 'biz' ? it.biz : it.val * 0.4 + it.fea * 0.3 + it.biz * 0.3;
  let lens = 'bal';
  function setLens(l, anim) {
    lens = l;
    const order = ITEMS.slice().sort((a, b) => score(b, l) - score(a, l) || a.w - b.w);
    const state = anim && !RM ? Flip.getState($$('.rd, .capline', road)) : null;
    road.innerHTML = ''; let cum = 0, over = false, nextCount = 0;
    order.forEach((it, i) => {
      const li = rdEls[it.id]; cum += it.w;
      if (!over && cum > CAP) { over = true; road.appendChild(capLine); }
      const tag = $('.rd__tag', li);
      if (!over) { tag.className = 'rd__tag now'; tag.textContent = 'NOW'; } else if (nextCount++ < 2) { tag.className = 'rd__tag next'; tag.textContent = 'NEXT'; } else { tag.className = 'rd__tag'; tag.textContent = 'LATER'; }
      li.classList.toggle('is-out', over);
      $('.rd__i', li).textContent = i + 1;
      $('.rd__sc i', li).style.transform = `scaleX(${score(it, l) / 10})`;
      road.appendChild(li);
    });
    if (!over) road.appendChild(capLine);
    if (state) Flip.from(state, { duration: 0.75, ease: 'expo.inOut', stagger: 0.03, absolute: false });
    const tr = $('#trade'); tr.innerHTML = TRADE[l]; if (anim && !RM) gsap.fromTo(tr, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
  }
  setLens('bal', false);
  const lensR = radio($('#lensBtns'), (b, user) => { if (user) stopDemo('r5'); setLens(b.dataset.lens, true); });
  onSeen(road, () => runDemo('r5', [[2600, () => lensR.select(2)], [6200, () => lensR.select(3)], [9800, () => lensR.select(0)]]));
  // launch readiness rings
  const LR = [['Docs', 'troubleshooting page', 80], ['Support', 'playbook + macros', 65], ['Field', 'enablement deck', 50], ['Partners', 'factory-image notice', 90]];
  const lg = $('#launch');
  LR.forEach(([n, d, p]) => {
    const el = document.createElement('div'); el.className = 'lr';
    el.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="bg" cx="22" cy="22" r="18"/><circle class="fg" cx="22" cy="22" r="18" pathLength="100" stroke-dasharray="0 100"/></svg><div><b><span data-count="${p}" data-suffix="%">0</span> ${n}</b><span>${d}</span></div>`;
    lg.appendChild(el);
    onSeen(el, () => { gsap.to($('.fg', el), { attr: { 'stroke-dasharray': p + ' 100' }, duration: RM ? 0 : 1.4, ease: 'power2.inOut' }); countUp($('[data-count]', el), 1.4); });
  });
})();
