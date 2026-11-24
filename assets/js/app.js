/* Partner OSOT concept v2 · Independent concept by Jim Chao · synthetic data · not affiliated with or endorsed by Microsoft.
   Libraries: GSAP 3.13 (ScrollTrigger, SplitText, Flip, Draggable), anime.js 3.2.2, Motion 11 (motion.dev), Lenis.
   Ports: Aceternity Spotlight + card spotlight, 21st.dev Animated Beam Integration, React Bits BlurText / CountUp /
   DecryptedText / ShinyText, Uiverse animated-border button, slide toggle and range. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable);
  gsap.defaults({ ease: 'power3.out', duration: 0.7 });
  const C = { amber: '#f5a524', amber2: '#ffcf7a', blue: '#3b82f6', blue2: '#8ab4ff', mint: '#34d399', red: '#f87171', faint: '#6b7483' };

  /* ---------------- React Bits: CountUp ---------------- */
  function countUp(el, dur = 1.6) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = v => pre + v.toFixed(dec) + suf;
    if (RM) { el.textContent = fmt(to); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: dur, ease: 'expo.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  }
  function armCounts(root = document) {
    $$('[data-count]', root).forEach(el => {
      if (el.closest('.intro')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
    });
  }

  /* ---------------- React Bits: DecryptedText ---------------- */
  function decrypt(el, final, dur = 900) {
    if (RM) { el.textContent = final; return Promise.resolve(); }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&_';
    return new Promise(res => {
      const start = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur), keep = Math.floor(final.length * p);
        el.textContent = final.split('').map((c, i) => (i < keep || c === ' ' ? c : chars[(Math.random() * chars.length) | 0])).join('');
        p < 1 ? requestAnimationFrame(tick) : res();
      })(start);
    });
  }

  /* ================= INTRO ================= */
  const intro = $('#intro');
  const RECORDS = [
    ['CRM', 'Aster & Vale Ltd'], ['Billing', 'ASTER AND VALE LIMITED'], ['Incentives', 'Aster+Vale'], ['Programs', 'A&V Holdings (EMEA)'],
    ['CRM', 'Kestrel Cloud Inc.'], ['Referrals', 'kestrel-cloud'], ['Billing', 'KESTREL CLOUD'], ['Identity', 'tenant 7f3a…e21'],
    ['Programs', 'Brightline Systems'], ['Incentives', 'Brightline Sys.'], ['Referrals', 'Halden Analytics'], ['CRM', 'Halden Analytics GmbH'],
    ['Identity', 'tenant 19c0…4b8'], ['Billing', 'HALDEN ANALYTICS'], ['Programs', 'Northbeam Partners'], ['Incentives', 'Northbeam'],
  ];
  const recWrap = $('#introRecords');
  const recEls = RECORDS.map(([src, name], i) => {
    const d = document.createElement('div'); d.className = 'rec'; d.innerHTML = `<i>${src}</i>${name}`; recWrap.appendChild(d); return d;
  });
  function placeRecords() {
    const w = innerWidth, h = innerHeight;
    recEls.forEach((el, i) => {
      const a = (i / recEls.length) * Math.PI * 2 + (i % 2) * 0.3;
      const rx = w * (0.40 + (i % 3) * 0.03), ry = h * (0.37 + (i % 2) * 0.04);
      el.dataset.x = Math.cos(a) * rx + w / 2 - 70; el.dataset.y = Math.sin(a) * ry + h / 2 - 14;
      el.style.transform = `translate(${el.dataset.x}px,${el.dataset.y}px)`;
    });
  }
  placeRecords();

  // intro canvas: flowing particles that drift toward the centre (data converging)
  const cv = $('#introCanvas'), cx = cv.getContext('2d');
  let parts = [], introRAF = 0, converge = 0;
  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = innerWidth < 760 ? 70 : 150;
    parts = Array.from({ length: n }, () => ({ a: Math.random() * Math.PI * 2, r: 80 + Math.random() * Math.max(innerWidth, innerHeight) * 0.7, s: 0.0006 + Math.random() * 0.0016, z: Math.random(), c: Math.random() < 0.18 ? C.amber : Math.random() < 0.5 ? C.blue : '#9aa3b2' }));
  }
  function drawIntro() {
    const w = innerWidth, h = innerHeight;
    cx.fillStyle = 'rgba(4,5,7,0.22)'; cx.fillRect(0, 0, w, h);
    parts.forEach(p => {
      p.a += p.s * (1 + converge * 6);
      p.r -= 0.08 + converge * 9 * (0.4 + p.z);
      if (p.r < 6) p.r = 120 + Math.random() * Math.max(w, h) * 0.7;
      const x = w / 2 + Math.cos(p.a) * p.r, y = h / 2 + Math.sin(p.a) * p.r * 0.62;
      cx.beginPath(); cx.arc(x, y, 0.6 + p.z * 1.4, 0, 6.283); cx.fillStyle = p.c; cx.globalAlpha = 0.25 + p.z * 0.6; cx.fill();
    });
    cx.globalAlpha = 1;
    introRAF = requestAnimationFrame(drawIntro);
  }
  sizeCanvas();
  if (!RM) drawIntro();

  // intro opening (Anime.js timeline + DecryptedText), like a film title card
  function playIntroOpening() {
    if (RM) { recEls.forEach(e => (e.style.opacity = 0.6)); return; }
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: '.intro__bar--top', translateY: ['-100%', 0], duration: 900 })
      .add({ targets: '.intro__bar--bot', translateY: ['100%', 0], duration: 900 }, 0)
      .add({ targets: recEls, opacity: [0, 0.55], scale: [0.6, 1], delay: anime.stagger(55, { from: 'center' }), duration: 900 }, 300)
      .add({ targets: '.intro__kicker', opacity: [0, 1], translateY: [12, 0], duration: 700 }, 500)
      .add({ targets: '.intro__line', opacity: [0, 1], translateY: [24, 0], filter: ['blur(10px)', 'blur(0px)'], delay: anime.stagger(380), duration: 1000 }, 700)
      .add({ targets: '.intro__id', opacity: [0, 1], scale: [0.9, 1], duration: 700 }, 2000)
      .add({ targets: ['.btn-enter', '.intro__hint', '.intro__legal', '.intro__skip'], opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(90), duration: 800 }, 2250);
    $$('.intro__line[data-scramble]').forEach((el, i) => setTimeout(() => decrypt(el, el.dataset.scramble, 800), 700 + i * 380));
    setTimeout(() => decrypt($('#goldenId'), 'PTR-00428', 900), 2000);
    // records drift gently
    recEls.forEach((el, i) => anime({ targets: el, translateX: [+el.dataset.x, +el.dataset.x + (i % 2 ? 14 : -14)], translateY: [+el.dataset.y, +el.dataset.y + (i % 3 ? -10 : 10)], direction: 'alternate', loop: true, duration: 3200 + i * 140, easing: 'easeInOutSine' }));
  }
  ['.intro__kicker', '.intro__line', '.intro__id', '.btn-enter', '.intro__hint', '.intro__legal', '.intro__skip'].forEach(s => $$(s).forEach(e => !RM && (e.style.opacity = 0)));
  playIntroOpening();

  let entered = false;
  function enter(withSound) {
    if (entered) return; entered = true;
    if (withSound && window.Sound) {
      Sound.startAll();
      setTimeout(() => Sound.say('Welcome. This is Partner O S O T, an independent concept by Jim Chao, built with synthetic data. It is not affiliated with or endorsed by Microsoft. Five requirements, five working demos. Scroll to begin.', 'intro'), 500);
    }
    const finish = () => {
      cancelAnimationFrame(introRAF); intro.style.display = 'none';
      document.body.classList.remove('is-intro'); document.body.classList.add('is-in');
      ScrollTrigger.refresh(); heroIn(); $('#main').focus({ preventScroll: true });
    };
    if (RM) return finish();
    anime.remove(recEls);
    converge = 1;
    const tl = anime.timeline({ easing: 'easeInOutExpo', complete: finish });
    tl.add({ targets: recEls, translateX: innerWidth / 2 - 70, translateY: innerHeight / 2 - 14, scale: 0.3, opacity: 0, delay: anime.stagger(25), duration: 900 })
      .add({ targets: '.intro__center', scale: [1, 0.92], opacity: [1, 0], duration: 600 }, 200)
      .add({ targets: '.intro__bar--top', translateY: '-100%', duration: 700 }, 700)
      .add({ targets: '.intro__bar--bot', translateY: '100%', duration: 700 }, 700)
      .add({ targets: intro, opacity: [1, 0], duration: 600 }, 950);
  }
  $('#enterBtn').addEventListener('click', () => enter(true));
  $('#skipBtn').addEventListener('click', () => enter(false));
  $('#main').setAttribute('tabindex', '-1');
  $('#musicBtn').addEventListener('click', () => Sound.toggleMusic());
  $('#voiceBtn').addEventListener('click', () => { Sound.toggleVoice(); if (Sound.voiceOn) { Sound.resetSpoken(); const cur = currentSection(); if (cur && cur.dataset.narrate) Sound.say(cur.dataset.narrate, cur.id); } });
  $('#replayIntro').addEventListener('click', () => location.reload());
  addEventListener('resize', () => { if (!entered) { sizeCanvas(); placeRecords(); } });

  /* ================= LENIS + SCROLL ================= */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));
  // progress + active rail
  gsap.to('#navProgress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  const sections = $$('section[id]');
  function currentSection() { const y = innerHeight * 0.4; return sections.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); }
  sections.forEach(s => ScrollTrigger.create({
    trigger: s, start: 'top 45%', end: 'bottom 45%',
    onToggle: self => { const a = $(`[data-rail="${s.id}"]`); if (a) a.classList.toggle('is-on', self.isActive); if (self.isActive && s.dataset.narrate && window.Sound) Sound.say(s.dataset.narrate, s.id); }
  }));

  /* ================= CARD FX: tilt + spotlight + magnetic ================= */
  $$('.card-fx').forEach((el, i) => el.style.setProperty('--i', i % 7));
  if (FINE && !RM) {
    $$('.card-fx').forEach(el => {
      const noTilt = el.hasAttribute('data-notilt');
      const rx = gsap.quickTo(el, '--rx', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(el, '--ry', { duration: 0.5, ease: 'power3.out' });
      const big = el.offsetWidth > 560 ? 2.5 : 6;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
        if (noTilt) return;
        rx((0.5 - y) * big); ry((x - 0.5) * big);
      });
      el.addEventListener('pointerenter', () => el.classList.add('is-hot'));
      el.addEventListener('pointerleave', () => { el.classList.remove('is-hot'); rx(0); ry(0); });
    });
    // Motion (motion.dev) springs for magnetic buttons
    const { animate } = window.Motion || {};
    if (animate) $$('.btn-enter, .btn-uv, .btn-run, .dock__btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35 }, { type: 'spring', stiffness: 260, damping: 18 }); });
      b.addEventListener('pointerleave', () => animate(b, { x: 0, y: 0 }, { type: 'spring', stiffness: 200, damping: 14 }));
    });
  }

  /* ================= REVEALS ================= */
  function heroIn() {
    if (RM) return;
    const split = new SplitText('#heroTitle', { type: 'words,chars' });
    gsap.from(split.chars, { yPercent: 60, opacity: 0, filter: 'blur(8px)', stagger: 0.018, duration: 0.9, ease: 'expo.out' });
    gsap.from(['.label-pill', '.hero__lede', '.hero__stats .stat', '.btn-uv', '.beam-stage'], { y: 24, opacity: 0, stagger: 0.08, delay: 0.3, duration: 0.9, clearProps: 'transform' });
  }
  if (!RM) {
    $$('.req__title.split').forEach(t => {
      const s = new SplitText(t, { type: 'lines,words', mask: 'lines' });
      gsap.from(s.words, { yPercent: 110, stagger: 0.025, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 85%' } });
    });
    $$('.req__tag, .req__jd').forEach(el => gsap.from(el, { y: 18, opacity: 0, scrollTrigger: { trigger: el, start: 'top 90%' } }));
    ScrollTrigger.batch('.req .card-fx, .why .card-fx', {
      start: 'top 90%', once: true,
      onEnter: b => gsap.fromTo(b, { '--ty': '48px', opacity: 0 }, { '--ty': '0px', opacity: 1, stagger: 0.08, duration: 0.9, ease: 'expo.out' })
    });
    gsap.set('.req .card-fx, .why .card-fx', { opacity: 0, '--ty': '48px' });
    // re-check above-fold batches after refresh
  }
  armCounts();

  /* ================= HERO BEAMS (21st.dev Animated Beam port, animated with anime.js) ================= */
  const stage = $('#beamStage'), svg = $('#beamSvg'), hub = $('#hub');
  function center(el, base) { const r = el.getBoundingClientRect(); return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, r }; }
  function drawBeams() {
    const base = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
    svg.innerHTML = `<defs>
      <linearGradient id="gIn" gradientUnits="userSpaceOnUse" x1="0" x2="${base.width / 2}"><stop offset="0" stop-color="${C.blue}" stop-opacity="0"/><stop offset=".3" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>
      <linearGradient id="gOut" gradientUnits="userSpaceOnUse" x1="${base.width / 2}" x2="${base.width}"><stop offset="0" stop-color="${C.amber}"/><stop offset=".7" stop-color="${C.mint}"/><stop offset="1" stop-color="${C.mint}" stop-opacity="0"/></linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    const h = center(hub, base), paths = [];
    const mk = (a, b, grad) => {
      const mx = (a.x + b.x) / 2, d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
      const base1 = document.createElementNS(NS, 'path'); base1.setAttribute('d', d); base1.setAttribute('stroke', '#edeff3'); base1.setAttribute('stroke-opacity', '.08'); base1.setAttribute('stroke-width', '1.5'); base1.setAttribute('fill', 'none'); svg.appendChild(base1);
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('stroke', `url(#${grad})`); p.setAttribute('stroke-width', '2.6'); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('filter', 'url(#glow)');
      const L = p.getTotalLength(); p.setAttribute('stroke-dasharray', `${L * 0.22} ${L}`); p.setAttribute('stroke-dashoffset', L * 1.22); svg.appendChild(p); paths.push([p, L]);
    };
    $$('[data-src]', stage).forEach(n => { const c = center(n, base); mk({ x: c.r.right - base.left, y: c.y }, { x: h.r.left - base.left, y: h.y }, 'gIn'); });
    $$('[data-out]', stage).forEach(n => { const c = center(n, base); mk({ x: h.r.right - base.left, y: h.y }, { x: c.r.left - base.left, y: c.y }, 'gOut'); });
    if (RM) { paths.forEach(([p, L]) => p.setAttribute('stroke-dashoffset', L * 0.6)); return; }
    paths.forEach(([p, L], i) => anime({ targets: p, strokeDashoffset: [L * 1.22, 0], duration: 2400 + (i % 3) * 300, delay: i * 180, loop: true, easing: 'cubicBezier(.45,.05,.55,.95)' }));
  }
  let beamT; drawBeams(); addEventListener('resize', () => { clearTimeout(beamT); beamT = setTimeout(drawBeams, 150); });
  if (document.fonts) document.fonts.ready.then(drawBeams);
  let matched = 0; const tick = $('#beamTicker');
  setInterval(() => { if (document.hidden) return; matched += 37 + ((Math.random() * 60) | 0); tick.textContent = `matched ${matched.toLocaleString()} records → 1 golden ID`; }, RM ? 4000 : 900);

  /* ================= R1: PRIORITIZATION MATRIX ================= */
  const CAT = { cap: ['New capability', C.blue2], dq: ['Data quality', C.mint], health: ['Platform health', C.amber2], debt: ['Tech debt', '#c4a6ff'], biz: ['Partner-business need', '#fb7185'] };
  const ITEMS = [
    { id: 'gid', t: 'Golden partner ID v1', c: 'dq', v: .9, e: .45, why: 'Every other item depends on one partner identity. Unblocks BI cut-over and AI grounding.',
      ac: [['Given', 'an audited sample of 2,000 partners, match precision is at least 98%'], ['When', 'a source record changes, the golden ID updates within 6 hours'], ['Then', 'two named consumers read only the golden ID, and report disagreement drops below 5%']] },
    { id: 'fresh', t: 'Freshness SLO on revenue feed', c: 'health', v: .75, e: .25, why: 'Analysts lose trust when numbers are late and nobody says so.',
      ac: [['Given', 'the revenue feed', 'is later than 6 hours, consumers see a "delayed" flag'], ['When', 'the SLO is missed twice in a week, an incident review is opened'], ['Then', 'freshness SLO is met 97% of days for a quarter']] },
    { id: 'self', t: 'Self-serve access requests', c: 'cap', v: .6, e: .35, why: 'Access tickets take days; stewards approve in one click with expiry.',
      ac: [['Given', 'a consumer requests a data product, the steward gets one approval task'], ['When', 'approved, access expires in 90 days unless renewed'], ['Then', 'median time to access falls from 5 days to under 1 day']] },
    { id: 'legacy', t: 'Retire legacy referral extract', c: 'debt', v: .45, e: .3, why: 'Two copies of the truth is no truth. Retiring it removes a known mismatch source.',
      ac: [['Given', 'all 4 known consumers are migrated, the extract is switched off'], ['When', 'switched off, no consumer reports a broken dashboard for 2 weeks'], ['Then', 'run cost of the extract goes to zero']] },
    { id: 'ai', t: 'AI-ready semantic layer', c: 'cap', v: .8, e: .85, why: 'High value, but it needs the golden ID and governed fields first. Plan it, do not start it.',
      ac: [['Given', 'an AI agent asks for partner revenue, it uses governed definitions only'], ['When', 'a field is sensitive, it is masked for agent roles'], ['Then', 'grounded answers cite the data product and its freshness']] },
    { id: 'recon', t: 'Incentive reconciliation view', c: 'biz', v: .65, e: .6, why: 'Partner operations asked for it at quarter close; valuable once revenue is trusted.',
      ac: [['Given', 'incentive payouts and earnings, the view shows differences per partner'], ['When', 'a difference exceeds 2%, it is flagged to the owner'], ['Then', 'quarter-close reconciliation time drops by half']] },
    { id: 'dash', t: 'Executive vanity dashboard', c: 'biz', v: .25, e: .55, why: 'Requested, but no decision depends on it. Explicitly not now, with the reason shared.',
      ac: [['Given', 'no decision depends on it, it stays out of this half'], ['When', 'a decision owner appears, it is re-scored'], ['Then', 'the request and its reason stay visible in the backlog']] },
  ];
  const LENS = { balanced: {}, trust: { dq: 1.35, health: 1.3, debt: 1.15 }, growth: { cap: 1.35, biz: 1.3 } };
  let lens = 'balanced', sel = 'gid';
  const plane = $('#plane'), bl = $('#backlog');
  ITEMS.forEach(it => {
    const ch = document.createElement('div'); ch.className = 'chip'; ch.dataset.id = it.id; ch.tabIndex = 0;
    ch.setAttribute('role', 'button'); ch.setAttribute('aria-label', `${it.t}, ${CAT[it.c][0]}. Drag to change value and effort, or press Enter to see acceptance criteria.`);
    ch.innerHTML = `<i style="background:${CAT[it.c][1]}"></i>${it.t}`; plane.appendChild(ch); it.el = ch;
    const li = document.createElement('li'); li.className = 'bl'; li.dataset.id = it.id; li.dataset.flipId = it.id; li.tabIndex = 0;
    li.innerHTML = `<span class="bl__n"></span><span class="bl__t">${it.t}<small>${CAT[it.c][0]}</small></span><span class="bl__s"></span>`; bl.appendChild(li); it.li = li;
    [ch, li].forEach(n => { n.addEventListener('click', () => select(it.id)); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(it.id); } }); });
  });
  function placeChips() {
    const W = plane.clientWidth, H = plane.clientHeight;
    ITEMS.forEach(it => { const cw = it.el.offsetWidth, chh = it.el.offsetHeight; gsap.set(it.el, { x: it.e * (W - cw), y: (1 - it.v) * (H - chh) }); });
  }
  const score = it => (it.v / (it.e + 0.25)) * (LENS[lens][it.c] || 1);
  function rank(animate = true) {
    const state = Flip.getState('.bl');
    const sorted = [...ITEMS].sort((a, b) => score(b) - score(a));
    sorted.forEach((it, i) => { bl.appendChild(it.li); it.li.querySelector('.bl__n').textContent = String(i + 1).padStart(2, '0'); it.li.querySelector('.bl__s').textContent = score(it).toFixed(2); });
    if (animate && !RM) Flip.from(state, { duration: 0.6, ease: 'power3.inOut', stagger: 0.02 });
  }
  function select(id) {
    sel = id; const it = ITEMS.find(i => i.id === id);
    ITEMS.forEach(i => { i.el.classList.toggle('is-sel', i.id === id); i.li.classList.toggle('is-sel', i.id === id); });
    $('#acTitle').textContent = it.t; $('#acWhy').textContent = it.why;
    const ul = $('#acList'); ul.innerHTML = '';
    it.ac.forEach(a => { const li = document.createElement('li'); li.innerHTML = `<span class="ck"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3"/></svg></span><span><b>${a[0]}</b>${a.slice(1).join(' ')}</span>`; ul.appendChild(li); });
    if (!RM) anime({ targets: '#acList li', opacity: [0, 1], translateX: [-14, 0], delay: anime.stagger(70), duration: 600, easing: 'easeOutExpo' });
  }
  $('#runChecks').addEventListener('click', () => {
    const cks = $$('#acList .ck'); cks.forEach(c => { c.classList.remove('is-pass'); c.querySelector('svg').style.strokeDashoffset = 20; });
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    cks.forEach((c, i) => tl.add({ targets: c, scale: [0.6, 1.15, 1], duration: 420, begin: () => c.classList.add('is-pass') }, i * 380).add({ targets: c.querySelector('svg'), strokeDashoffset: [20, 0], duration: 380 }, i * 380 + 120));
    tl.add({ targets: '#acDone', color: ['#6b7483', '#34d399'], duration: 500 });
  });
  $$('.seg button').forEach(b => b.addEventListener('click', () => { $$('.seg button').forEach(x => x.classList.toggle('is-on', x === b)); lens = b.dataset.lens; rank(); }));
  requestAnimationFrame(() => {
    placeChips(); rank(false); select('gid');
    ITEMS.forEach(it => Draggable.create(it.el, {
      bounds: plane, type: 'x,y', inertia: false, zIndexBoost: true,
      onPress() { it.el.classList.add('is-drag'); },
      onDrag() { const W = plane.clientWidth - it.el.offsetWidth, H = plane.clientHeight - it.el.offsetHeight; it.e = Math.max(0, Math.min(1, this.x / W)); it.v = Math.max(0, Math.min(1, 1 - this.y / H)); it.li.querySelector('.bl__s').textContent = score(it).toFixed(2); },
      onRelease() { it.el.classList.remove('is-drag'); rank(); select(it.id); if (window.Sound && Sound.musicOn) {} },
    }));
    if (!RM) gsap.from('.chip', { scale: 0, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: '#matrix', start: 'top 75%' } });
  });
  addEventListener('resize', () => placeChips());

  /* ================= R2: DATA MODEL + API ================= */
  const ENT = {
    partner: { path: '/v1/partners/{golden_id}', lat: 'p95 120 ms', body: { golden_id: 'PTR-00428', legal_name: 'Aster & Vale Ltd', aliases: ['ASTER AND VALE LIMITED', 'Aster+Vale', 'A&V Holdings (EMEA)'], tier: 'Gold', region: 'EMEA', match_confidence: 0.991, sources: ['crm', 'billing', 'incentives', 'programs'], freshness: { as_of: '2026-11-24T06:00Z', slo_hours: 6 } }, meta: ['OAuth 2.0 · scope partner.read', 'ETag + If-None-Match', 'rate limit 600/min', 'PII: none'], links: ['identity', 'program', 'opportunity', 'incentive', 'enrollment'] },
    identity: { path: '/v1/partners/{golden_id}/identities', lat: 'p95 90 ms', body: { golden_id: 'PTR-00428', identities: [{ system: 'crm', key: 'ACC-55102', rule: 'tax_id exact' }, { system: 'billing', key: 'BL-9932', rule: 'domain + name fuzzy 0.97' }, { system: 'identity', key: 'tenant 7f3a…e21', rule: 'verified domain' }], steward_overrides: 1 }, meta: ['scope identity.read', 'audit log on every override', 'survivorship rules v3'], links: ['partner'] },
    program: { path: '/v1/programs/{program_id}', lat: 'p95 70 ms', body: { program_id: 'PRG-CLOUD-24', name: 'Cloud Solutions Track', owner_team: 'Partner Programs', tiers: ['Member', 'Silver', 'Gold'], effective: { from: '2026-07-01', to: '2027-06-30' } }, meta: ['public reference data', 'cache 24 h'], links: ['enrollment', 'partner'] },
    enrollment: { path: '/v1/partners/{golden_id}/enrollments', lat: 'p95 110 ms', body: { golden_id: 'PTR-00428', enrollments: [{ program_id: 'PRG-CLOUD-24', tier: 'Gold', status: 'active', since: '2025-09-12' }] }, meta: ['scope partner.read', 'event: enrollment.changed'], links: ['partner', 'program'] },
    incentive: { path: '/v1/partners/{golden_id}/incentives?quarter=FY27Q2', lat: 'p95 180 ms', body: { golden_id: 'PTR-00428', quarter: 'FY27Q2', earned: 182400.0, paid: 176950.0, currency: 'USD', variance_pct: 3.0, flag: 'reconcile' }, meta: ['scope incentive.read (restricted)', 'masked for AI agent role', 'definition v2 · steward signed'], links: ['partner'] },
    opportunity: { path: '/v1/partners/{golden_id}/opportunities?status=open', lat: 'p95 210 ms', body: { golden_id: 'PTR-00428', open: 14, pipeline_usd: 2310000, attribution: 'co-sell', stale_over_30d: 2 }, meta: ['scope pipeline.read', 'paged · cursor', 'freshness SLO 12 h'], links: ['partner'] },
  };
  const erd = $('#erd'), erdSvg = $('#erdLines');
  function hl(obj) {
    return JSON.stringify(obj, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:').replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>').replace(/: (-?[\d.]+)/g, ': <span class="n">$1</span>')
      .replace(/^(\s+)"([^"]*)"(,?)$/gm, '$1<span class="s">"$2"</span>$3');
  }
  let typeTimer;
  function showEnt(key) {
    const e = ENT[key];
    $$('.ent').forEach(b => b.classList.toggle('is-on', b.dataset.ent === key));
    $('#apiPath').textContent = e.path; $('#apiLat').textContent = e.lat;
    $('#apiMeta').innerHTML = e.meta.map(m => `<span>${m}</span>`).join('');
    if (!RM) anime({ targets: '#apiMeta span', opacity: [0, 1], translateY: [8, 0], delay: anime.stagger(60), easing: 'easeOutExpo' });
    const html = hl(e.body), body = $('#apiBody'); clearInterval(typeTimer);
    if (RM) { body.innerHTML = html; } else {
      const plain = JSON.stringify(e.body, null, 2); let i = 0;
      typeTimer = setInterval(() => { i += 9; if (i >= plain.length) { clearInterval(typeTimer); body.innerHTML = html; } else body.textContent = plain.slice(0, i) + '▍'; }, 16);
    }
    drawErd(key);
  }
  function drawErd(key) {
    const base = erd.getBoundingClientRect(); erdSvg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`); erdSvg.innerHTML = '';
    const pos = k => { const b = $(`.ent[data-ent="${k}"]`).getBoundingClientRect(); return [b.left - base.left + b.width / 2, b.top - base.top + b.height / 2]; };
    const pairs = [['partner', 'identity'], ['partner', 'program'], ['partner', 'enrollment'], ['partner', 'incentive'], ['partner', 'opportunity'], ['program', 'enrollment']];
    pairs.forEach(([a, b]) => {
      const [x1, y1] = pos(a), [x2, y2] = pos(b), on = a === key || b === key;
      const l = document.createElementNS(NS, 'path'); l.setAttribute('d', `M${x1},${y1} L${x2},${y2}`);
      l.setAttribute('stroke', on ? C.amber : '#edeff3'); l.setAttribute('stroke-opacity', on ? '.9' : '.12'); l.setAttribute('stroke-width', on ? 1.6 : 1); l.setAttribute('fill', 'none');
      if (on) l.setAttribute('stroke-dasharray', '4 6'); erdSvg.appendChild(l);
      if (on && !RM) anime({ targets: l, strokeDashoffset: [0, -40], duration: 1200, loop: true, easing: 'linear' });
    });
  }
  $$('.ent').forEach(b => b.addEventListener('click', () => showEnt(b.dataset.ent)));
  ScrollTrigger.create({ trigger: '#r2', start: 'top 70%', once: true, onEnter: () => showEnt('partner') });
  if (window.ResizeObserver) new ResizeObserver(() => drawErd($('.ent.is-on').dataset.ent)).observe(erd); else addEventListener('resize', () => drawErd($('.ent.is-on').dataset.ent));

  const TRADE = {
    det: { bars: [['Match precision', 99, '99%'], ['Match recall', 72, '72%'], ['Explainability to stewards', 95, 'high'], ['Run cost', 30, 'low'], ['Time to first value', 85, '6 weeks']], adr: 'Decision (synthetic): start deterministic for Phase 1. Partners and stewards can audit every match, and precision is what consumers asked for. Accept lower recall; route unmatched records to a steward queue.' },
    prob: { bars: [['Match precision', 94, '94%'], ['Match recall', 91, '91%'], ['Explainability to stewards', 45, 'medium'], ['Run cost', 70, 'higher'], ['Time to first value', 45, '14 weeks']], adr: 'Option held for Phase 3: probabilistic matching lifts recall on the long tail, but needs a labeled truth set, model monitoring and a steward review loop before consumers will trust it.' },
  };
  const tb = $('#tradeBars');
  TRADE.det.bars.forEach(b => { const d = document.createElement('div'); d.innerHTML = `<div class="bar__top"><span>${b[0]}</span><b></b></div><div class="bar__track"><div class="bar__fill"></div></div>`; tb.appendChild(d); });
  function setTrade(k) {
    const t = TRADE[k]; $('.toggle-uv').classList.toggle('is-b', k === 'prob');
    $$('.toggle-uv button').forEach(b => { const on = b.dataset.trade === k; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
    $$('#tradeBars > div').forEach((d, i) => { d.querySelector('b').textContent = t.bars[i][2]; d.querySelector('.bar__fill').style.transform = `scaleX(${t.bars[i][1] / 100})`; });
    const a = $('#tradeAdr'); a.textContent = t.adr; if (!RM) gsap.fromTo(a, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5 });
  }
  $$('.toggle-uv button').forEach(b => b.addEventListener('click', () => setTrade(b.dataset.trade)));
  ScrollTrigger.create({ trigger: '.trade', start: 'top 85%', once: true, onEnter: () => setTrade('det') });

  /* ================= R3: SCOREBOARD + LINEAGE + ACCESS ================= */
  const PRODUCTS = [
    { id: 'profile', n: 'Partner Profile', owner: 'steward: Partner Data', fresh: 42, slo: 360, q: 98.6, comp: 99.2, cons: 41, def: 'One row per golden partner ID. Legal name, aliases, tier, region and the source keys behind each match.', src: ['CRM', 'Identity', 'Programs'], out: ['BI', 'Partner apps', 'AI agents'] },
    { id: 'enroll', n: 'Program Enrollment', owner: 'steward: Partner Programs', fresh: 95, slo: 720, q: 97.9, comp: 98.1, cons: 18, def: 'Active and historical enrollments per partner and program tier, effective-dated.', src: ['Programs', 'CRM', 'Identity'], out: ['BI', 'Reporting', 'Partner apps'] },
    { id: 'incent', n: 'Incentive Earnings', owner: 'steward: Partner Ops', fresh: 540, slo: 360, q: 93.4, comp: 96.0, cons: 12, def: 'Earned vs paid incentives per partner and quarter, one definition of "earned", signed by the steward.', src: ['Incentives', 'Billing', 'Programs'], out: ['Reporting', 'BI', 'Partner apps'] },
    { id: 'pipe', n: 'Pipeline Attribution', owner: 'steward: Partner Sales', fresh: 210, slo: 720, q: 95.8, comp: 94.7, cons: 23, def: 'Open co-sell opportunities attributed to partners, with attribution rule and staleness.', src: ['CRM', 'Referrals', 'Identity'], out: ['BI', 'Reporting', 'AI agents'] },
  ];
  const board = $('#board'); let selP = 'profile';
  const R = 15, CIRC = 2 * Math.PI * R;
  PRODUCTS.forEach(p => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'prow'; b.setAttribute('role', 'listitem'); b.dataset.id = p.id;
    b.innerHTML = `<span class="prow__name">${p.n}<small>${p.owner}</small></span>
      <span class="prow__m"><b class="fr"></b>freshness</span>
      <span class="prow__q"><svg class="ring" viewBox="0 0 38 38"><circle class="bg" cx="19" cy="19" r="${R}"/><circle class="fg" cx="19" cy="19" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/></svg><span class="prow__m"><b class="qq"></b>quality</span></span>
      <span class="prow__m"><b class="cc"></b>consumers</span>`;
    b.addEventListener('click', () => selectP(p.id)); board.appendChild(b); p.el = b;
  });
  function fmtAge(m) { return m < 60 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`; }
  function paintBoard() {
    PRODUCTS.forEach(p => {
      const fr = p.el.querySelector('.fr'); fr.textContent = fmtAge(p.fresh); fr.className = 'fr ' + (p.fresh > p.slo ? 'bad' : p.fresh > p.slo * 0.7 ? 'warn' : 'ok');
      p.el.querySelector('.qq').textContent = p.q.toFixed(1) + '%'; p.el.querySelector('.cc').textContent = p.cons;
      const fg = p.el.querySelector('.fg'); fg.style.strokeDashoffset = CIRC * (1 - (p.q - 80) / 20); fg.style.stroke = p.q < 95 ? C.amber : C.mint;
    });
  }
  let boardLive = false;
  ScrollTrigger.create({ trigger: '.board', start: 'top 85%', end: 'bottom top', onToggle: s => (boardLive = s.isActive), onEnter: () => { paintBoard(); selectP('profile'); }, once: false });
  paintBoard();
  setInterval(() => {
    if (!boardLive || document.hidden) return;
    PRODUCTS.forEach(p => {
      p.fresh += 3; if (p.fresh > p.slo * 1.6 || (p.id !== 'incent' && p.fresh > p.slo * 0.8)) p.fresh = 4 + Math.random() * 10; // refresh lands
      p.q = Math.max(90, Math.min(99.6, p.q + (Math.random() - 0.48) * 0.3));
      if (Math.random() < 0.2) p.cons += 1;
    });
    paintBoard();
  }, 2000);

  const lin = $('#linSvg');
  function selectP(id) {
    selP = id; const p = PRODUCTS.find(x => x.id === id);
    PRODUCTS.forEach(x => x.el.classList.toggle('is-sel', x.id === id));
    $('#linName').textContent = p.n; $('#linDef').textContent = `Definition: ${p.def} Freshness promise: ${fmtAge(p.slo)}.`;
    const nodes = { src: p.src.map((s, i) => [62, 50 + i * 80, s]), stg: [[208, 130, 'staging + checks']], cur: [[352, 130, 'curated model']], prod: [[474, 130, p.n.split(' ')[0]]], out: p.out.map((s, i) => [596, 50 + i * 80, s]) };
    let h = `<text class="lbl" x="20" y="16">SOURCES</text><text class="lbl" x="190" y="16">PIPELINE</text><text class="lbl" x="440" y="16">PRODUCT</text><text class="lbl" x="550" y="16">CONSUMERS</text>`;
    const links = []; nodes.src.forEach(s => links.push([s, nodes.stg[0], C.blue])); links.push([nodes.stg[0], nodes.cur[0], C.blue2]); links.push([nodes.cur[0], nodes.prod[0], C.amber]); nodes.out.forEach(o => links.push([nodes.prod[0], o, C.mint]));
    links.forEach(([a, b, col], i) => { const mx = (a[0] + b[0]) / 2; h += `<path class="lk" d="M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}" stroke="${col}" stroke-opacity=".7" stroke-width="1.6" fill="none"/>`; });
    const box = ([x, y, t], cls) => { const w = Math.max(56, t.length * 7.9 + 18); return `<g class="nd ${cls}"><rect x="${x - w / 2}" y="${y - 14}" width="${w}" height="28" rx="8" fill="#151a23" stroke="${cls === 'pr' ? C.amber : 'rgba(237,239,243,.2)'}"/><text x="${x}" y="${y + 4}" text-anchor="middle">${t}</text></g>`; };
    nodes.src.forEach(n => (h += box(n, 's'))); h += box(nodes.stg[0], 'p') + box(nodes.cur[0], 'p') + box(nodes.prod[0], 'pr'); nodes.out.forEach(n => (h += box(n, 'o')));
    h += `<circle id="linDot" r="4" fill="${C.amber2}"/>`;
    lin.innerHTML = h;
    const lks = $$('.lk', lin);
    if (RM) return;
    lks.forEach(l => { const L = l.getTotalLength(); l.style.strokeDasharray = L; l.style.strokeDashoffset = L; });
    const tl = anime.timeline({ easing: 'easeInOutQuad' });
    tl.add({ targets: $$('.nd', lin), opacity: [0, 1], delay: anime.stagger(40), duration: 500 })
      .add({ targets: lks, strokeDashoffset: el => [el.getTotalLength(), 0], delay: anime.stagger(70), duration: 700 }, 150);
    const dotPaths = [lks[0], lks[3], lks[4], lks[5]].filter(Boolean);
    let k = 0; const dot = $('#linDot', lin);
    (function run() { if (selP !== id || !dot.isConnected) return; const pth = dotPaths[k % dotPaths.length], L = pth.getTotalLength(), o = { t: 0 };
      anime({ targets: o, t: 1, duration: 900, easing: 'easeInOutSine', update: () => { const pt = pth.getPointAtLength(o.t * L); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); }, complete: () => { k++; run(); } }); })();
  }

  const ROLES = ['Partner manager', 'Finance analyst', 'Data steward', 'AI agent', 'External partner'];
  const FIELDS = ['Profile', 'Enrollment', 'Incentives', 'Pipeline', 'Tax ID'];
  const ACC = [['y', 'y', 'm', 'y', 'x'], ['y', 'y', 'y', 'm', 'm'], ['y', 'y', 'y', 'y', 'y'], ['y', 'y', 'm', 'm', 'x'], ['m', 'y', 'm', 'x', 'x']];
  const accEl = $('#access'), SYM = { y: 'read', m: 'masked', x: 'none' };
  accEl.innerHTML = `<div class="h rl">Role</div>` + FIELDS.map(f => `<div class="h">${f}</div>`).join('') + ROLES.map((r, i) => `<div class="rl">${r}</div>` + ACC[i].map(a => `<div class="${a}">${SYM[a]}</div>`).join('')).join('');
  if (!RM) ScrollTrigger.create({ trigger: accEl, start: 'top 85%', once: true, onEnter: () => anime({ targets: '#access > div', opacity: [0, 1], scale: [0.85, 1], delay: anime.stagger(22, { grid: [6, 6], from: 'first' }), duration: 500, easing: 'easeOutExpo' }) });

  /* ================= R4: PINNED HORIZONTAL STORY (GSAP ScrollTrigger) ================= */
  const mm = gsap.matchMedia();
  const phaseFill = () => $$('.phase i').forEach((p, i) => setTimeout(() => p.style.setProperty('--p', 1), i * 250));
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('#r4track');
    const dist = () => track.scrollWidth - innerWidth + 40;
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#r4pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: s => { if (s.progress > 0.85) phaseFill(); } } });
    $$('.stage').forEach(st => gsap.from(st.querySelectorAll('h3, p, li, .chips, .phase'), { y: 30, opacity: 0, stagger: 0.05, scrollTrigger: { trigger: st, containerAnimation: tw, start: 'left 85%' } }));
    return () => {};
  });
  mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', () => {
    ScrollTrigger.create({ trigger: '.stage--plan', start: 'top 85%', once: true, onEnter: phaseFill });
  });

  /* ================= R5: INCIDENT + HEALTH + COST ================= */
  const METERS = [['Consumer trust', 'trust'], ['Reliability', 'rel'], ['Cost to fix', 'cost'], ['Compliance risk', 'comp'], ['Time to recover', 'ttr']];
  const OPTS = {
    hold: { v: { trust: 70, rel: 55, cost: 15, comp: 10, ttr: 60 }, t: '<b>Hold publish.</b> Nobody quotes a wrong number at quarter close, and the banner keeps trust. Cost is low, but recovery waits on the normal pipeline fix. Good default when the data is used for payouts.' },
    snap: { v: { trust: 55, rel: 80, cost: 10, comp: 35, ttr: 25 }, t: '<b>Serve last good snapshot.</b> Reports stay up and fast, but numbers are 1 day old. Acceptable only if every view shows the "as of" date; risky for incentive payouts, so payout views stay held.' },
    fix: { v: { trust: 80, rel: 45, cost: 75, comp: 25, ttr: 15 }, t: '<b>Hotfix and backfill.</b> Fastest path to fresh data, but an emergency change under pressure risks a second incident and burns on-call time. Choose it with engineering lead sign-off and a rollback plan.' },
  };
  const met = $('#meters');
  met.innerHTML = METERS.map(([l, k]) => `<div class="meter" data-k="${k}"><div class="meter__v"><div class="meter__fill"></div><span class="meter__num">–</span></div><span>${l}</span></div>`).join('');
  $$('.sim__opts button').forEach(b => b.addEventListener('click', () => {
    $$('.sim__opts button').forEach(x => x.setAttribute('aria-checked', x === b));
    const o = OPTS[b.dataset.opt];
    $$('.meter', met).forEach(m => {
      const k = m.dataset.k, v = o.v[k], bad = (k === 'cost' || k === 'comp' || k === 'ttr') ? v > 50 : v < 50;
      const f = m.querySelector('.meter__fill'); f.style.transform = `scaleY(${v / 100})`; f.style.background = bad ? `linear-gradient(0deg,#b91c1c,${C.red})` : `linear-gradient(0deg,${C.blue},${C.mint})`;
      const num = m.querySelector('.meter__num'), from = parseInt(num.textContent) || 0, obj = { v: from };
      gsap.to(obj, { v, duration: RM ? 0 : 0.9, onUpdate: () => (num.textContent = Math.round(obj.v)) });
    });
    const vd = $('#verdict'); vd.innerHTML = o.t; if (!RM) gsap.fromTo(vd, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
    if (window.Sound && Sound.voiceOn) Sound.say(vd.textContent);
  }));
  const hb = $('#healthBars'); const BAD = { 8: 'w', 9: 'b', 19: 'w', 24: 'b' };
  hb.innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${BAD[i] || ''}" style="height:${BAD[i] ? (BAD[i] === 'b' ? 55 : 75) : 88 + ((i * 7) % 12)}%" title="Day ${i + 1}"></i>`).join('');
  if (!RM) ScrollTrigger.create({ trigger: hb, start: 'top 90%', once: true, onEnter: () => anime({ targets: '#healthBars i', scaleY: [0, 1], delay: anime.stagger(25), duration: 700, easing: 'easeOutElastic(1, .7)' }) });

  const range = $('#costRange');
  const money = v => '$' + Math.round(v).toLocaleString();
  let lastCost = { m: 0, q: 0 };
  function cost() {
    const d = +range.value, TB = 48, hotRate = 23, coldRate = 4; // synthetic $/TB-month, 48 TB/yr of raw history
    const hotTB = TB * (d / 365), coldTB = TB - hotTB, monthly = hotTB * hotRate * 12 + coldTB * coldRate * 12 / 1;
    const q = d >= 180 ? 1.2 : d >= 90 ? 1.8 : d >= 30 ? 6.5 : 14;
    range.style.setProperty('--pct', ((d - 7) / (180 - 7)) * 100 + '%'); $('#costDays').textContent = d;
    const o = { ...lastCost }; gsap.to(o, { m: monthly, q, duration: RM ? 0 : 0.5, onUpdate: () => { $('#costMonthly').textContent = money(o.m); $('#costQuery').textContent = o.q.toFixed(1) + ' s'; } });
    lastCost = { m: monthly, q };
    $('#costNote').textContent = d < 30 ? 'Cheapest, but quarter-over-quarter analysis hits the cold tier. Analysts would feel it at close.' : d <= 100 ? 'Balanced: covers a full quarter plus close in the hot tier. Recommended starting point, review with consumers each half.' : 'Fast for everyone, but most of the extra spend serves queries nobody runs. Needs usage evidence first.';
  }
  range.addEventListener('input', cost); cost();

  /* ================= MARQUEE (React Bits ScrollVelocity idea, GSAP) ================= */
  $$('.marq__row').forEach((row, i) => {
    row.innerHTML += row.innerHTML; if (RM) return;
    const tw = gsap.fromTo(row, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: row, start: 'top bottom', end: 'bottom top', onUpdate: s => gsap.to(tw, { timeScale: 1 + Math.min(4, Math.abs(s.getVelocity()) / 400), duration: 0.2, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: 1, duration: 0.8 }) }) });
  });

  /* ================= LATE REFRESH ================= */
  addEventListener('load', () => { ScrollTrigger.refresh(); drawBeams(); placeChips(); });
})();
