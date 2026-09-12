(function () {
  if (typeof location === 'undefined' || !new URLSearchParams(location.search).has('dev')) return;
  document.title = '最后一次选择 · 管理者模式';
  const beats = window.GAME_BEATS || [];
  const known = window.__devKnownBeats;
  beats.forEach(b => { if (known && !known.has(b.id)) console.warn('dev: beat has no handler', b.id); });

  const style = document.createElement('style');
  style.textContent = '#dev-panel{position:fixed;top:12px;right:12px;bottom:12px;width:228px;z-index:20;display:flex;flex-direction:column;background:#0b1216e6;border:1px solid #3a5058;color:#c5d4d8;font:11px/1.45 "Microsoft YaHei",sans-serif;letter-spacing:.4px;padding:10px;pointer-events:auto;cursor:default;box-shadow:0 8px 28px #0008}#dev-panel.hidden{display:none}#dev-panel h3{margin:0 0 8px;font-size:11px;font-weight:400;letter-spacing:2px;color:#8fb4bb}#dev-panel .dev-row{display:flex;gap:4px;margin-bottom:8px}#dev-panel button{flex:1;background:#182328;color:#d5e2e5;border:1px solid #3d555c;padding:5px 4px;font:10px sans-serif;cursor:pointer}#dev-panel button:hover{border-color:#7aa3ab}#dev-panel button.on,#dev-panel .dev-item.on{border-color:#c9b27a;color:#f0e2b8;background:#2a2214}#dev-panel .dev-list{overflow:auto;flex:1;min-height:0}#dev-panel .dev-g{color:#6f8b91;margin:8px 0 4px;font-size:10px}#dev-panel .dev-item{display:block;width:100%;text-align:left;margin:0 0 3px;padding:5px 6px}#dev-panel .note{color:#6d7f84;margin-top:6px;font-size:10px}body.dev-paused,body.dev-paused *{animation-play-state:paused!important}';
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  let muted = false, open = true, rate = 1, paused = false;

  function groups() {
    const map = new Map();
    for (const b of beats) {
      if (!map.has(b.group)) map.set(b.group, []);
      map.get(b.group).push(b);
    }
    return map;
  }
  function currentId() {
    const s = window.gameStatus ? window.gameStatus() : {};
    if (s.ending === 'A1' || s.ending === 'A2' || s.ending === 'A3') return 'P11.' + s.ending;
    if (s.ending === 'B' || s.phase === 'B') return 'B';
    if (s.ending === 'C' || s.phase === 'C' || s.certificateState) return 'C';
    return s.beat || s.phase;
  }
  function highlight() {
    const id = currentId();
    panel.querySelectorAll('.dev-item[data-id]').forEach(el => el.classList.toggle('on', el.dataset.id === id));
  }
  function jump(id, preset) {
    if (typeof window.enterBeat === 'function') window.enterBeat(id, preset);
    setTimeout(highlight, 50);
  }
  function setSpeed(n) {
    rate = n === 2 || n === 4 ? n : 1;
    if (window.setDevSpeed) window.setDevSpeed(rate);
    panel.querySelectorAll('[data-act="speed"]').forEach(b => b.classList.toggle('on', Number(b.dataset.rate) === rate));
  }
  function setPaused(on) {
    paused = !!on;
    if (window.setDevPaused) window.setDevPaused(paused);
    const btn = panel.querySelector('[data-act="pause"]');
    if (btn) { btn.textContent = paused ? '继续' : '暂停'; btn.classList.toggle('on', paused); }
  }
  function step(dir) {
    const i = beats.findIndex(b => b.id === currentId());
    const j = Math.max(0, Math.min(beats.length - 1, (i < 0 ? 0 : i) + dir));
    jump(beats[j].id);
  }
  function render() {
    const parts = ['<h3>DEV · 拍跳转</h3><div class="dev-row"><button type="button" data-act="prev">上一拍</button><button type="button" data-act="next">下一拍</button><button type="button" data-act="mute">静音</button></div><div class="dev-row"><button type="button" data-act="speed" data-rate="1" class="on">×1</button><button type="button" data-act="speed" data-rate="2">×2</button><button type="button" data-act="speed" data-rate="4">×4</button><button type="button" data-act="pause">暂停</button></div><div class="dev-list">'];
    for (const [g, list] of groups()) {
      parts.push('<div class="dev-g">' + g + '</div>');
      for (const b of list) parts.push('<button type="button" class="dev-item" data-id="' + b.id + '">' + b.label + '</button>');
    }
    parts.push('</div><button type="button" class="dev-item" data-act="hesitate">P10B+犹豫</button><div class="note">Ctrl+Shift+D 开关 · ←/→ 相邻拍<br>Ctrl+Shift+P 暂停 · 1/2/4 变速</div>');
    panel.innerHTML = parts.join('');
    highlight();
  }

  panel.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (t.dataset.act === 'prev') return step(-1);
    if (t.dataset.act === 'next') return step(1);
    if (t.dataset.act === 'mute') {
      muted = !muted;
      if (window.setDevMuted) window.setDevMuted(muted);
      t.textContent = muted ? '已静音' : '静音';
      return;
    }
    if (t.dataset.act === 'speed') { setSpeed(Number(t.dataset.rate)); return; }
    if (t.dataset.act === 'pause') { setPaused(!paused); return; }
    if (t.dataset.act === 'hesitate') return jump('P10B', { hesitate: true });
    if (t.dataset.id) jump(t.dataset.id);
  });

  document.body.appendChild(panel);
  render();
  setInterval(highlight, 400);

  window.__devKey = e => {
    if (!(e.ctrlKey && e.shiftKey)) return false;
    if (e.code === 'KeyD') { e.preventDefault(); e.stopPropagation(); open = !open; panel.classList.toggle('hidden', !open); return true; }
    if (e.code === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); if (open) step(-1); return true; }
    if (e.code === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); if (open) step(1); return true; }
    if (e.code === 'KeyP') { e.preventDefault(); e.stopPropagation(); setPaused(!paused); return true; }
    if (e.code === 'Digit1' || e.code === 'Numpad1') { e.preventDefault(); e.stopPropagation(); setSpeed(1); return true; }
    if (e.code === 'Digit2' || e.code === 'Numpad2') { e.preventDefault(); e.stopPropagation(); setSpeed(2); return true; }
    if (e.code === 'Digit4' || e.code === 'Numpad4') { e.preventDefault(); e.stopPropagation(); setSpeed(4); return true; }
    return false;
  };
})();
