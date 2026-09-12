// 无合成音、无 TTS。缺少文件不创建音频；损坏文件回退到静默计时。
class GameMedia {
  constructor(config) { this.config = config; this.inventory = new Set(); this.background = null; }
  async init() { this.inventory = new Set(window.localAssets ? await window.localAssets.list() : []); }
  path(kind, id) {
    const override = this.config.assets[kind]?.[id];
    const path = override === undefined ? GAME_ASSETS[kind]?.[id] : override;
    return path && this.inventory.has(path) ? path : null;
  }
  delay(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error('reset'));
      const abort = () => { clearTimeout(timer); reject(new Error('reset')); };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort); resolve();
      }, ms * this.config.speed);
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  async play(kind, id, fallback, signal, onDuration) {
    if (signal.aborted) throw new Error('reset');
    const path = this.path(kind, id);
    if (!path) return this.delay(fallback, signal);
    const completed = await new Promise((resolve, reject) => {
      const audio = new Audio(path);
      let done = false, watchdog;
      const clean = () => {
        clearTimeout(watchdog); signal.removeEventListener('abort', abort);
        audio.onended = audio.onerror = audio.onloadedmetadata = audio.ontimeupdate = audio.onplaying = null;
        audio.pause();
      };
      const finish = value => { if (done) return; done = true; clean(); resolve(value); };
      const abort = () => { if (done) return; done = true; clean(); reject(new Error('reset')); };
      const arm = ms => { clearTimeout(watchdog); watchdog = setTimeout(() => finish(false), ms); };
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
      audio.play().catch(() => finish(false));
    });
    if (!completed) await this.delay(fallback, signal);
  }
  stopBackground() {
    if (!this.background) return;
    this.background.audio.pause();
    this.background.signal.removeEventListener('abort', this.background.stop);
    this.background = null;
  }
  backgroundTrack(id, signal, volume = 0.2) {
    this.stopBackground();
    const path = this.path('bgm', id);
    if (!path || signal.aborted) return;
    const audio = new Audio(path);
    audio.loop = true; audio.volume = volume;
    const stop = () => audio.pause();
    this.background = { audio, signal, stop };
    signal.addEventListener('abort', stop, { once: true });
    audio.onerror = stop;
    audio.play().catch(stop);
  }
}
window.GameMedia = GameMedia;
