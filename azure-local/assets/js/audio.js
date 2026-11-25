/* Sound for the Fleet Pulse concept · product concept by Jim Chao · synthetic data.
   Same architecture as the StreetLight concept (music approach reused).
   Ambient music is synthesized live with the Web Audio API (no music files).
   Narration comes from pre-recorded MP3 clips in assets/audio/ (story, intro, r1 to r5, why).
   Nothing plays before a click. A missing or broken clip fails silently and the page keeps working. */
(function () {
  const Sound = { musicOn: false, voiceOn: false, ctx: null, master: null };
  let chordTimer = null;
  const spoken = new Set();

  // E lydian drift: Emaj9 -> C#m11 -> Aadd9 -> Bsus2. Bright, patient, "rack room at dawn".
  const CHORDS = [
    [82.41, 164.81, 207.65, 246.94, 369.99],
    [69.30, 138.59, 164.81, 246.94, 311.13],
    [55.00, 110.00, 164.81, 246.94, 277.18],
    [61.74, 123.47, 185.00, 277.18, 369.99]
  ];

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 500;
    lfo.connect(lfoGain).connect(lp.frequency); lfo.start();
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.375;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const wet = ctx.createGain(); wet.gain.value = 0.3;
    lp.connect(master); lp.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(master);
    master.connect(ctx.destination);
    Sound.ctx = ctx; Sound.master = master; Sound.bus = lp;
    return true;
  }

  function playChord(i) {
    const ctx = Sound.ctx, t = ctx.currentTime, notes = CHORDS[i % CHORDS.length];
    notes.forEach((f, n) => {
      ['sine', 'triangle'].forEach((type, k) => {
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.value = f; o.detune.value = (k ? 6 : -6) + n * 1.5;
        const g = ctx.createGain(); g.gain.value = 0;
        const peak = (k ? 0.016 : 0.028) / (1 + n * 0.3);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 2.8);
        g.gain.linearRampToValueAtTime(peak * 0.7, t + 6.5);
        g.gain.linearRampToValueAtTime(0, t + 10);
        o.connect(g).connect(Sound.bus); o.start(t); o.stop(t + 10.5);
      });
    });
    // "heartbeat pings": soft high pings, like cluster health checks reporting in
    [0.6, 2.1, 2.5, 4.8, 6.9].forEach((d, j) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = notes[(j + 1) % notes.length] * (j % 2 ? 4 : 3);
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.01, t + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.2);
      o.connect(g).connect(Sound.bus); o.start(t + d); o.stop(t + d + 1.3);
    });
  }

  function startMusic() {
    if (!Sound.ctx && !build()) return;
    Sound.ctx.resume();
    const t = Sound.ctx.currentTime, g = Sound.master.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(cur ? 0.28 : 0.85, t + 2.5);
    if (!chordTimer) { let i = 0; playChord(i++); chordTimer = setInterval(() => playChord(i++), 8500); }
    Sound.musicOn = true; sync();
  }
  function stopMusic() {
    Sound.musicOn = false; sync();
    if (!Sound.ctx) return;
    const t = Sound.ctx.currentTime, g = Sound.master.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => { if (!Sound.musicOn) { clearInterval(chordTimer); chordTimer = null; Sound.ctx.suspend(); } }, 700);
  }

  /* ---------- Narration queue ---------- */
  const CLIPS = ['story', 'intro', 'r1', 'r2', 'r3', 'r4', 'r5', 'why'];
  const cache = {}, missing = new Set();
  let cur = null, pending = null;
  function clip(key) {
    if (!CLIPS.includes(key) || missing.has(key)) return null;
    if (!cache[key]) {
      const a = new Audio(); a.preload = 'auto'; a.__key = key;
      a.addEventListener('error', () => {           // file not there yet: mark it and move on quietly
        missing.add(key);
        if (cur === a) { cur = null; next(); }
      });
      a.src = 'assets/audio/' + key + '.mp3';
      cache[key] = a;
    }
    return cache[key];
  }
  function duck(on) {
    if (!Sound.musicOn || !Sound.ctx) return;
    const g = Sound.master.gain, t = Sound.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.28 : 0.85, t + (on ? 0.4 : 1.2));
  }
  function next() {
    // a section reached while a clip was talking gets its narration right after, instead of cutting the clip off
    if (pending && Sound.voiceOn) {
      const k = pending; pending = null;
      setTimeout(() => { if (!cur && !spoken.has(k)) play(k); else if (!cur) duck(false); }, 350);
    } else duck(false);
  }
  function stopClip() { pending = null; if (cur) { cur.pause(); cur.onended = null; cur = null; } duck(false); }
  function play(key) {
    const a = clip(key); if (!a) { next(); return null; }
    spoken.add(key);
    if (cur && cur !== a) { cur.pause(); cur.onended = null; }
    cur = a; duck(true);
    try { a.currentTime = 0; } catch (e) { /* not loaded yet */ }
    a.onended = () => { if (cur === a) cur = null; next(); };
    const p = a.play();
    if (p && p.catch) p.catch(() => { if (cur === a) cur = null; next(); });
    return a;
  }
  // say(key, force): the opening story plays at once; a section clip waits for the clip in progress.
  function say(key, force) {
    if (!Sound.voiceOn || !key || !CLIPS.includes(key) || missing.has(key)) return null;
    if (spoken.has(key) && !force) return null;
    const busy = cur && !cur.paused && !cur.ended;
    if (busy && !force && key !== 'story' && cur.__key !== 'intro') { pending = key; return null; }
    if (busy && cur.__key === 'intro' && key !== 'story' && !force) { pending = key; return null; }
    pending = null;
    return play(key);
  }
  function startVoice() { Sound.voiceOn = true; CLIPS.forEach(clip); sync(); }
  function stopVoice() { Sound.voiceOn = false; stopClip(); sync(); }

  function sync() {
    const m = document.getElementById('musicBtn'), v = document.getElementById('voiceBtn');
    if (m) { m.setAttribute('aria-pressed', Sound.musicOn); m.querySelector('b').textContent = Sound.musicOn ? 'on' : 'off'; }
    if (v) { v.setAttribute('aria-pressed', !!Sound.voiceOn); v.querySelector('b').textContent = Sound.voiceOn ? 'on' : 'off'; }
    document.body.classList.toggle('music-on', Sound.musicOn);
  }

  Sound.startAll = function () { startMusic(); startVoice(); };
  Sound.toggleMusic = function () { Sound.musicOn ? stopMusic() : startMusic(); };
  Sound.toggleVoice = function () { Sound.voiceOn ? stopVoice() : startVoice(); };
  Sound.say = say;
  Sound.stopClip = stopClip;
  Sound.isMissing = k => missing.has(k);
  Sound.resetSpoken = function () { spoken.clear(); };
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else if (Sound.musicOn) Sound.ctx.resume();
  });
  window.Sound = Sound;
})();
