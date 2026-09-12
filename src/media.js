// 无合成音、无 TTS。缺少文件不创建音频；损坏文件回退到静默计时。
class GameMedia {
  constructor(config) {
    this.config = config; this.inventory = new Set(); this.background = null;
    this.pending = new Set(); this.playing = new Set(); this.paused = false; this.rate = 1;
    this.audioCtx = null; this.bufferCache = new Map();
  }
  async init() {
    this.inventory = new Set(window.localAssets ? await window.localAssets.list() : []);
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtx();
      } catch (_) {}
    }
    this.bufferCache = new Map();
  }
  path(kind, id) {
    const override = this.config.assets[kind]?.[id];
    const path = override === undefined ? GAME_ASSETS[kind]?.[id] : override;
    if (path && this.inventory.has(path)) return path;
    if (kind === 'voice') {
      const text = window.GAME_DIALOGUE?.[id];
      if (text) {
        for (const candidate of [
          `../assets/voice/${text}.mp3`,
          `../assets/voice/${text.replace(/[。？！]/g, '')}.mp3`,
          `../assets/voice/${text}。.mp3`
        ]) {
          if (this.inventory.has(candidate)) return candidate;
        }
      }
    }
    if (kind === 'sfx' && (id === 'beep' || id === 'card')) {
      for (const p of ['../assets/sfx/P2 七张档案卡.mp3', '../assets/sfx/beep.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if ((kind === 'bgm' || kind === 'sfx') && id === 'standby') {
      for (const p of ['../assets/sfx/P0待机持续.mp3', '../assets/bgm/P0待机持续.mp3', '../assets/sfx/standby.mp3', '../assets/bgm/standby.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'p1.start' || id === 'p1')) {
      for (const p of ['../assets/sfx/P1启动.mp3', '../assets/sfx/p1.start.mp3', '../assets/sfx/p1.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'p2_3.bg' || id === 'p2_3' || id === 'p2.bg')) {
      for (const p of ['../assets/sfx/P2-3背景.mp3', '../assets/sfx/p2-3背景.mp3', '../assets/sfx/P2-3背景声.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'key.white' || id === 'white.key' || id === 'key_white')) {
      for (const p of ['../assets/sfx/白键.mp3', '../assets/sfx/white.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'key.yellow' || id === 'yellow.key' || id === 'key_yellow')) {
      for (const p of ['../assets/sfx/黄键.mp3', '../assets/sfx/yellow.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'p3_4.intro' || id === 'p2_3.intro')) {
      for (const p of ['../assets/sfx/P3-4 用户你好背景声intro.mp3', '../assets/sfx/P2-3 用户你好背景声intro.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if ((kind === 'sfx' || kind === 'bgm') && (id === 'p4_6.ending' || id === 'p7.ending')) {
      for (const p of ['../assets/sfx/P4-6 背景声ending.mp3', '../assets/sfx/P7 背景声ending.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if ((kind === 'bgm' || kind === 'sfx') && id === 'p4_6.loop') {
      for (const p of ['../assets/sfx/P4-6 背景声loop.mp3', '../assets/bgm/P4-6 背景声loop.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if ((kind === 'bgm' || kind === 'sfx') && id === 'p4_6.asmr.loop') {
      for (const p of ['../assets/sfx/P4-6 背景声ASMR loop.mp3', '../assets/bgm/P4-6 背景声ASMR loop.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    return null;
  }
  _arm(job) {
    job.started = Date.now();
    job.timer = setTimeout(() => {
      job.timer = null;
      this.pending.delete(job);
      job.signal.removeEventListener('abort', job.abort);
      job.resolve();
    }, Math.max(0, job.remaining));
  }
  _stopJob(job) {
    if (job.timer) { clearTimeout(job.timer); job.timer = null; }
    this.pending.delete(job);
    job.signal.removeEventListener('abort', job.abort);
  }
  setRate(mult) {
    const next = 1 / (mult || 1);
    const factor = next / (this.config.speed || 1);
    this.rate = mult || 1;
    this.config.speed = next;
    for (const job of this.pending) {
      const elapsed = job.timer ? Date.now() - job.started : 0;
      job.remaining = Math.max(0, job.remaining - elapsed) * factor;
      if (job.timer) { clearTimeout(job.timer); job.timer = null; }
      if (!this.paused) this._arm(job);
    }
    // 开发者倍速只缩短演出计时。所有音频始终保持原速；快速走查请配合静音。
  }
  pauseClock() {
    if (this.paused) return;
    this.paused = true;
    for (const job of this.pending) {
      if (!job.timer) continue;
      clearTimeout(job.timer);
      job.timer = null;
      job.remaining = Math.max(0, job.remaining - (Date.now() - job.started));
    }
    for (const audio of this.playing) audio.pause();
    this.background?.audio?.pause?.();
    if (this.background?.audios) {
      for (const a of this.background.audios) a.pause?.();
    }
    if (this.background?.webNode?.gainNode) {
      this.background.webNode.gainNode.gain.value = 0;
    }
    if (this.background?.webNodes) {
      for (const wn of this.background.webNodes) wn.gainNode.gain.value = 0;
    }
  }
  resumeClock() {
    if (!this.paused) return;
    this.paused = false;
    for (const job of this.pending) this._arm(job);
    for (const audio of this.playing) audio.play().catch(() => {});
    this.background?.audio?.play?.().catch(() => {});
    if (this.background?.audios) {
      for (const a of this.background.audios) a.play?.().catch(() => {});
    }
    if (this.background?.webNode?.gainNode) {
      this.background.webNode.gainNode.gain.value = this.background.volume ?? 0.2;
    }
    if (this.background?.webNodes) {
      for (const wn of this.background.webNodes) wn.gainNode.gain.value = wn.targetVolume ?? this.background.volume ?? 0.2;
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }
  delay(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error('reset'));
      const job = { remaining: ms * this.config.speed, resolve, reject, signal };
      const abort = () => { this._stopJob(job); reject(new Error('reset')); };
      job.abort = abort;
      signal.addEventListener('abort', abort, { once: true });
      this.pending.add(job);
      if (!this.paused) this._arm(job);
    });
  }
  async play(kind, id, fallback, signal, hooks = {}, volume = 1) {
    if (typeof hooks === 'number') { volume = hooks; hooks = {}; }
    const onStart = typeof hooks === 'function' ? hooks : hooks?.onStart;
    const onFallback = hooks?.onFallback;
    if (signal.aborted) throw new Error('reset');
    const path = this.path(kind, id);
    if (!path) { onFallback?.(); return this.delay(fallback, signal); }
    const completed = await new Promise((resolve, reject) => {
      const audio = new Audio(path);
      audio.playbackRate = 1;
      if (typeof volume === 'number') audio.volume = volume;
      this.playing.add(audio);
      let done = false, watchdog, duration = null, started = false;
      const clean = () => {
        clearTimeout(watchdog); signal.removeEventListener('abort', abort);
        audio.onended = audio.onerror = audio.onloadedmetadata = audio.ontimeupdate = audio.onplaying = null;
        this.playing.delete(audio);
        audio.pause();
      };
      const finish = value => { if (done) return; done = true; clean(); resolve(value); };
      const abort = () => { if (done) return; done = true; clean(); reject(new Error('reset')); };
      const arm = ms => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => { if (this.paused) arm(ms); else finish(false); }, ms);
      };
      signal.addEventListener('abort', abort, { once: true });
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration)) {
          duration = audio.duration * 1000;
          if (typeof hooks === 'function') hooks(duration);
        }
      };
      let lastTime = -1;
      audio.onplaying = () => {
        if (!started) { started = true; onStart?.(duration ?? fallback); }
        arm(this.config.mediaStallTimeout);
      };
      audio.ontimeupdate = () => {
        if (audio.currentTime > lastTime) { lastTime = audio.currentTime; arm(this.config.mediaStallTimeout); }
      };
      arm(this.config.mediaLoadTimeout);
      if (!this.paused) audio.play().catch(() => finish(false));
    });
    if (!completed) { onFallback?.(); await this.delay(fallback, signal); }
  }
  async getAudioBuffer(path) {
    if (!this.audioCtx) return null;
    if (this.bufferCache.has(path)) return this.bufferCache.get(path);
    try {
      let arrayBuffer = null;
      if (typeof window !== 'undefined' && window.localAssets?.read) {
        arrayBuffer = await window.localAssets.read(path);
      }
      if (!arrayBuffer && typeof fetch === 'function') {
        const res = await fetch(path);
        if (res.ok) arrayBuffer = await res.arrayBuffer();
      }
      if (!arrayBuffer) return null;
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(path, audioBuffer);
      return audioBuffer;
    } catch (_) {
      return null;
    }
  }
  _detectLoopRange(buffer, threshold = 0.0015) {
    const channels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const data0 = buffer.getChannelData(0);

    let start = 0;
    for (let i = 0; i < length; i++) {
      let maxVal = 0;
      for (let c = 0; c < channels; c++) {
        const val = Math.abs(buffer.getChannelData(c)[i]);
        if (val > maxVal) maxVal = val;
      }
      if (maxVal > threshold) { start = i; break; }
    }

    let end = length - 1;
    for (let i = length - 1; i >= 0; i--) {
      let maxVal = 0;
      for (let c = 0; c < channels; c++) {
        const val = Math.abs(buffer.getChannelData(c)[i]);
        if (val > maxVal) maxVal = val;
      }
      if (maxVal > threshold) { end = i; break; }
    }

    while (start < length - 1 && data0[start] * data0[start + 1] > 0) start++;
    while (end > 0 && data0[end] * data0[end - 1] > 0) end--;

    if (end <= start || (end - start) < sampleRate * 0.5) {
      return { loopStart: 0, loopEnd: buffer.duration };
    }
    return {
      loopStart: start / sampleRate,
      loopEnd: Math.min(buffer.duration, (end + 1) / sampleRate)
    };
  }
  stopBackground() {
    if (!this.background) return;
    this.background.stop();
    this.background = null;
  }
  rebindBackground(newSignal) {
    if (!this.background) return;
    this.background.signal.removeEventListener('abort', this.background.stop);
    this.background.signal = newSignal;
    newSignal.addEventListener('abort', this.background.stop, { once: true });
  }
  backgroundTrack(id, signal, volume = 0.2) {
    this.stopBackground();
    const path = this.path('bgm', id) || this.path('sfx', id);
    if (!path || signal.aborted) return;
    const audio = new Audio(path);
    audio.loop = true; audio.volume = volume; audio.playbackRate = 1;

    let stopped = false;
    let webNode = null;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      audio.pause();
      if (webNode) {
        try { webNode.source.stop(); } catch (_) {}
        try { webNode.source.disconnect(); webNode.gainNode.disconnect(); } catch (_) {}
      }
      signal.removeEventListener('abort', stop);
    };

    this.background = { audio, signal, stop, webNode: null, volume };
    signal.addEventListener('abort', stop, { once: true });
    audio.onerror = stop;

    if (!this.paused) {
      audio.play().catch(stop);
    }

    if (this.audioCtx) {
      this.getAudioBuffer(path).then(buffer => {
        if (stopped || signal.aborted || !buffer) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(() => {});
        const range = this._detectLoopRange(buffer);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = range.loopStart;
        source.loopEnd = range.loopEnd;
        source.playbackRate.value = 1;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = this.paused ? 0 : volume;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        source.start(0, range.loopStart);

        audio.muted = true;
        webNode = { source, gainNode };
        if (this.background) this.background.webNode = webNode;
      }).catch(() => {});
    }
  }
  playChain({ intro, loop, volume = 0.2 }, signal) {
    this.stopBackground();
    if (signal.aborted) return;
    const introPath = intro ? (this.path('sfx', intro) || this.path('bgm', intro)) : null;
    const loopIds = Array.isArray(loop) ? loop : (loop ? [loop] : []);
    const loopItems = loopIds.map(id => {
      const p = this.path('bgm', id) || this.path('sfx', id);
      if (!p) return null;
      // ASMR 录音电平远低于主背景，为保障在 P4-P6 演奏中能清晰可辨，赋予其充沛增益
      const trackVolume = (id === 'p4_6.asmr.loop' || p.includes('ASMR')) ? 0.95 : volume;
      return { id, path: p, volume: trackVolume };
    }).filter(Boolean);
    const loopPaths = loopItems.map(item => item.path);
    let introAudio = null;
    const activeAudios = [];
    const webNodes = [];
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      if (introAudio) introAudio.pause();
      for (const a of activeAudios) a.pause();
      for (const wn of webNodes) {
        try { wn.source.stop(); } catch (_) {}
        try { wn.source.disconnect(); wn.gainNode.disconnect(); } catch (_) {}
      }
      signal.removeEventListener('abort', stop);
    };

    const startLoop = () => {
      if (!loopPaths.length || signal.aborted || cancelled) return;
      for (const item of loopItems) {
        const loopPath = item.path;
        const trackVolume = item.volume;
        const loopAudio = new Audio(loopPath);
        loopAudio.loop = true; loopAudio.volume = trackVolume; loopAudio.playbackRate = 1;
        activeAudios.push(loopAudio);
        if (this.background) {
          this.background.audio = activeAudios[0];
          this.background.audios = activeAudios;
        }
        loopAudio.onerror = stop;
        if (!this.paused) loopAudio.play().catch(stop);

        if (this.audioCtx) {
          this.getAudioBuffer(loopPath).then(buffer => {
            if (cancelled || signal.aborted || !buffer) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(() => {});
            const range = this._detectLoopRange(buffer);
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.loopStart = range.loopStart;
            source.loopEnd = range.loopEnd;
            source.playbackRate.value = 1;

            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = this.paused ? 0 : trackVolume;

            source.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            source.start(0, range.loopStart);

            loopAudio.muted = true;
            const wn = { source, gainNode, targetVolume: trackVolume };
            webNodes.push(wn);
            if (this.background) this.background.webNodes = webNodes;
          }).catch(() => {});
        }
      }
    };

    if (introPath) {
      introAudio = new Audio(introPath);
      introAudio.volume = volume; introAudio.playbackRate = 1;
      introAudio.onended = () => {
        if (!signal.aborted && !cancelled) startLoop();
      };
      introAudio.onerror = () => {
        if (!signal.aborted && !cancelled) startLoop();
      };
      this.background = { audio: introAudio, audios: [], signal, stop, webNodes: [], volume };
      signal.addEventListener('abort', stop, { once: true });
      if (!this.paused) introAudio.play().catch(stop);
    } else if (loopPaths.length) {
      this.background = { audio: null, audios: [], signal, stop, webNodes: [], volume };
      signal.addEventListener('abort', stop, { once: true });
      startLoop();
    }
  }
}
if (typeof module !== 'undefined') module.exports = GameMedia;
