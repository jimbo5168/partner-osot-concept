/* Sound for the Partner OSOT concept.
   Ambient music is synthesized live with the Web Audio API (no audio files).
   Narration uses the browser's speechSynthesis. Both start only after a click. */
(function () {
  const Sound = { musicOn: false, voiceOn: false, ctx: null, master: null, started: false };
  let chordTimer = null, voices = [], spoken = new Set();

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

  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    voices = speechSynthesis.getVoices();
    const pref = ['Samantha', 'Google US English', 'Microsoft Aria', 'Alex', 'Daniel'];
    for (const p of pref) { const v = voices.find(v => v.name.includes(p)); if (v) return v; }
    return voices.find(v => /^en(-|_)US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voices = speechSynthesis.getVoices(); };

  function say(text, key) {
    if (!Sound.voiceOn || !('speechSynthesis' in window)) return;
    if (key) { if (spoken.has(key)) return; spoken.add(key); }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = 0.98; u.pitch = 1; u.volume = 1;
    // duck the music under the voice
    if (Sound.musicOn && Sound.ctx) {
      const g = Sound.master.gain, t = Sound.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.35, t + 0.4);
      u.onend = () => { if (!Sound.musicOn) return; const t2 = Sound.ctx.currentTime; g.cancelScheduledValues(t2); g.setValueAtTime(g.value, t2); g.linearRampToValueAtTime(0.9, t2 + 1.2); };
    }
    speechSynthesis.speak(u);
  }
  function startVoice() { Sound.voiceOn = 'speechSynthesis' in window; sync(); }
  function stopVoice() { Sound.voiceOn = false; if ('speechSynthesis' in window) speechSynthesis.cancel(); sync(); }

  function sync() {
    const m = document.getElementById('musicBtn'), v = document.getElementById('voiceBtn');
    if (m) { m.setAttribute('aria-pressed', Sound.musicOn); m.querySelector('b').textContent = Sound.musicOn ? 'on' : 'off'; }
    if (v) { v.setAttribute('aria-pressed', !!Sound.voiceOn); v.querySelector('b').textContent = Sound.voiceOn ? 'on' : 'off'; }
  }

  Sound.startAll = function () { startMusic(); startVoice(); };
  Sound.toggleMusic = function () { Sound.musicOn ? stopMusic() : startMusic(); };
  Sound.toggleVoice = function () { Sound.voiceOn ? stopVoice() : startVoice(); };
  Sound.say = say;
  Sound.resetSpoken = function () { spoken.clear(); };
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else if (Sound.musicOn) Sound.ctx.resume();
  });
  window.Sound = Sound;
})();
