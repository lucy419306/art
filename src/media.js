// 无合成音、无 TTS。缺少文件不创建音频；损坏文件回退到静默计时。
class GameMedia {
  constructor(config) {
    this.config = config; this.inventory = new Set(); this.background = null;
    this.pending = new Set(); this.playing = new Set(); this.paused = false; this.rate = 1;
  }
  async init() { this.inventory = new Set(window.localAssets ? await window.localAssets.list() : []); }
  path(kind, id) {
    const override = this.config.assets[kind]?.[id];
    const path = override === undefined ? GAME_ASSETS[kind]?.[id] : override;
    if (path && this.inventory.has(path)) return path;
    if (kind === 'bgm' && id === 'standby') {
      for (const p of ['../assets/sfx/P0待机持续.mp3', '../assets/bgm/P0待机持续.mp3', '../assets/sfx/standby.mp3', '../assets/bgm/standby.mp3']) {
        if (this.inventory.has(p)) return p;
      }
    }
    if (kind === 'sfx' && (id === 'p1.start' || id === 'p1')) {
      for (const p of ['../assets/sfx/P1启动.mp3', '../assets/sfx/p1.start.mp3', '../assets/sfx/p1.mp3']) {
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
    for (const audio of this.playing) audio.playbackRate = this.rate;
    if (this.background) this.background.audio.playbackRate = this.rate;
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
    this.background?.audio.pause();
  }
  resumeClock() {
    if (!this.paused) return;
    this.paused = false;
    for (const job of this.pending) this._arm(job);
    for (const audio of this.playing) audio.play().catch(() => {});
    this.background?.audio.play().catch(() => {});
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
  async play(kind, id, fallback, signal, onDuration) {
    if (signal.aborted) throw new Error('reset');
    const path = this.path(kind, id);
    if (!path) return this.delay(fallback, signal);
    const completed = await new Promise((resolve, reject) => {
      const audio = new Audio(path);
      audio.playbackRate = this.rate;
      this.playing.add(audio);
      let done = false, watchdog;
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
        if (Number.isFinite(audio.duration)) onDuration?.(audio.duration * 1000);
      };
      let lastTime = -1;
      audio.onplaying = () => arm(this.config.mediaStallTimeout);
      audio.ontimeupdate = () => {
        if (audio.currentTime > lastTime) { lastTime = audio.currentTime; arm(this.config.mediaStallTimeout); }
      };
      arm(this.config.mediaLoadTimeout);
      if (!this.paused) audio.play().catch(() => finish(false));
    });
    if (!completed) await this.delay(fallback, signal);
  }
  stopBackground() {
    if (!this.background) return;
    this.background.audio.pause();
    this.background.signal.removeEventListener('abort', this.background.stop);
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
    const path = this.path('bgm', id);
    if (!path || signal.aborted) return;
    const audio = new Audio(path);
    audio.loop = true; audio.volume = volume; audio.playbackRate = this.rate;
    const stop = () => audio.pause();
    this.background = { audio, signal, stop };
    signal.addEventListener('abort', stop, { once: true });
    audio.onerror = stop;
    if (!this.paused) audio.play().catch(stop);
  }
}
window.GameMedia = GameMedia;
