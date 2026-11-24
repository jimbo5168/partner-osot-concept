/* Sound for the Partner OSOT concept.
   Ambient music is synthesized live with the Web Audio API (no audio files).
   Narration is pre-recorded (Gemini TTS, warm female voice "Leda"). Both start only after a click. */
(function () {
  const Sound = { musicOn: false, voiceOn: false, ctx: null, master: null, started: false };
  let chordTimer = null, spoken = new Set();

  // A minor 9 -> F maj7 -> C add9 -> G sus  (calm, unresolved, "data hum")
  const CHORDS = [
    [110.0, 164.81, 196.0, 261.63, 246.94],
    [87.31, 130.81, 164.81, 220.0, 261.63],
    [130.81, 196.0, 246.94, 293.66, 329.63],
    [98.0, 146.83, 196.0, 261.63, 293.66]
  ];

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
    // slow filter sweep
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 420;
    lfo.connect(lfoGain).connect(lp.frequency); lfo.start();
    // feedback delay as a cheap reverb tail
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.42;
    const fb = ctx.createGain(); fb.gain.value = 0.42;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
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
        o.frequency.value = f; o.detune.value = (k ? 7 : -5) + n;
        const g = ctx.createGain(); g.gain.value = 0;
        const peak = (k ? 0.018 : 0.03) / (1 + n * 0.25);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 2.6);
        g.gain.linearRampToValueAtTime(peak * 0.7, t + 6);
        g.gain.linearRampToValueAtTime(0, t + 9.5);
        o.connect(g).connect(Sound.bus); o.start(t); o.stop(t + 10);
      });
    });
    // soft "data ping": a high sine blip, like a record being matched
    [0.8, 3.2, 5.6].forEach((d, j) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = notes[(j + 2) % notes.length] * 4;
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.012, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.4);
      o.connect(g).connect(Sound.bus); o.start(t + d); o.stop(t + d + 1.5);
    });
  }

  function startMusic() {
    if (!Sound.ctx && !build()) return;
    Sound.ctx.resume();
    const t = Sound.ctx.currentTime;
    Sound.master.gain.cancelScheduledValues(t);
    Sound.master.gain.setValueAtTime(Sound.master.gain.value, t);
    Sound.master.gain.linearRampToValueAtTime(0.9, t + 2.5);
    if (!chordTimer) { let i = 0; playChord(i++); chordTimer = setInterval(() => playChord(i++), 8000); }
    Sound.musicOn = true; sync();
  }
  function stopMusic() {
    Sound.musicOn = false; sync();
    if (!Sound.ctx) return;
    const t = Sound.ctx.currentTime;
    Sound.master.gain.cancelScheduledValues(t);
    Sound.master.gain.setValueAtTime(Sound.master.gain.value, t);
    Sound.master.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => { if (!Sound.musicOn) { clearInterval(chordTimer); chordTimer = null; Sound.ctx.suspend(); } }, 700);
  }

  // Narration: pre-recorded clips in a warm female voice (Gemini TTS, prebuilt voice "Leda"),
  // keyed by section. Plays only after a click, ducks the music, one clip at a time.
  const CLIPS = ['story', 'intro', 'r1', 'r2', 'r3', 'r4', 'r5', 'why'];
  const cache = {}; let cur = null;
  function clip(key) {
    if (!CLIPS.includes(key)) return null;
    if (!cache[key]) { const a = new Audio('assets/audio/' + key + '.mp3'); a.preload = 'auto'; cache[key] = a; }
    return cache[key];
  }
  function duck(on) {
    if (!Sound.musicOn || !Sound.ctx) return;
    const g = Sound.master.gain, t = Sound.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.3 : 0.9, t + (on ? 0.4 : 1.2));
  }
  let pending = null;   // the latest section asked for while another clip was still talking
  function stopClip() { pending = null; if (cur) { cur.pause(); cur.onended = null; cur = null; duck(false); } }
  function play(key) {
    const a = clip(key); if (!a) return null;
    spoken.add(key);
    if (cur && cur !== a) { cur.pause(); cur.onended = null; }
    cur = a; a.currentTime = 0; a.volume = 1; duck(true);
    a.onended = () => {
      if (cur === a) cur = null;
      // a section reached during this clip gets its narration right after, instead of cutting this one off
      if (pending && Sound.voiceOn) { const k = pending; pending = null; setTimeout(() => { if (!cur && !spoken.has(k)) play(k); else duck(false); }, 350); }
      else duck(false);
    };
    a.play().catch(() => { if (cur === a) cur = null; spoken.delete(key); duck(false); });
    return a;
  }
  // say(text, key, force): text is the on-page transcript; the key picks the recorded clip.
  // The opening story and intro play at once; a section clip waits for the clip in progress to finish.
  function say(text, key, force) {
    if (!Sound.voiceOn || !key || !CLIPS.includes(key)) return null;
    if (spoken.has(key) && !force) return null;
    const busy = cur && !cur.paused && !cur.ended;
    if (busy && !force && key !== 'story' && key !== 'intro') { pending = key; return null; }
    pending = null;
    return play(key);
  }
  function startVoice() { Sound.voiceOn = true; clip('story'); clip('intro'); sync(); }
  function stopVoice() { Sound.voiceOn = false; stopClip(); sync(); }

  function sync() {
    const m = document.getElementById('musicBtn'), v = document.getElementById('voiceBtn');
    if (m) { m.setAttribute('aria-pressed', Sound.musicOn); m.querySelector('b').textContent = Sound.musicOn ? 'on' : 'off'; }
    if (v) { v.setAttribute('aria-pressed', !!Sound.voiceOn); v.querySelector('b').textContent = Sound.voiceOn ? 'on' : 'off'; }
  }

  Sound.startAll = function () { startMusic(); startVoice(); };
  Sound.toggleMusic = function () { Sound.musicOn ? stopMusic() : startMusic(); };
  Sound.toggleVoice = function () { Sound.voiceOn ? stopVoice() : startVoice(); };
  Sound.say = say;
  Sound.stopClip = stopClip;
  Sound.resetSpoken = function () { spoken.clear(); };
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else if (Sound.musicOn) Sound.ctx.resume();
  });
  window.Sound = Sound;
})();
