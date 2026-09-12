const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function harness(audioFiles = {}) {
  let now = 0, serial = 0, keyboard;
  const timers = new Map(), elements = new Map(), audios = [], errors = [];
  const fullScreen = [];
  const schedule = (f, ms) => { timers.set(++serial, { f, at: now + ms }); return serial; };
  function el() {
    return {
      innerHTML: '', textContent: '', className: '', children: [], values: {},
      style: { setProperty() {} },
      classList: {
        _n: new Set(),
        add(...xs) { xs.forEach(x => this._n.add(x)); },
        remove(...xs) { xs.forEach(x => this._n.delete(x)); },
        contains(x) { return this._n.has(x); }
      },
      append(child) { this.children.push(child); }, insertAdjacentHTML() {},
      querySelector() { return el(); }, querySelectorAll() { return [el(), el(), el()]; },
      remove() {}, pause() {}, load() {}, getAttribute() { return null; }, removeAttribute() {}, setAttribute() {}
    };
  }
  const doc = { body: el(), querySelector: s => {
    if (!elements.has(s)) elements.set(s, el()); return elements.get(s);
  }, querySelectorAll: () => [], createElement: el };
  class FakeAudio {
    constructor(path) { this.path = path; this.currentTime = 0; this.paused = true; this.pending = []; audios.push(this); }
    play() {
      this.paused = false;
      const duration = audioFiles[this.path];
      if (duration === 'error') {
        this.pending.push(schedule(() => { this.onerror?.(); this.onerror?.(); }, 0));
      } else if (duration !== 'stalled') {
        this.duration = duration / 1000;
        this.pending.push(schedule(() => { this.onloadedmetadata?.(); this.onplaying?.(); }, 0));
        for (let t = 1000; t < duration; t += 1000) this.pending.push(schedule(() => { this.currentTime = t / 1000; this.ontimeupdate?.(); }, t));
        if (!this.loop) this.pending.push(schedule(() => { this.paused = true; this.onended?.(); }, duration));
      }
      return Promise.resolve();
    }
    pause() { this.paused = true; this.pending.forEach(i => timers.delete(i)); }
  }
  const ctx = {
    document: doc, AbortController, Audio: FakeAudio,
    console: { error: (...args) => errors.push(args) },
    localAssets: { list: async () => Object.keys(audioFiles) },
    windowControls: { setFullScreen: on => fullScreen.push(on) },
    setTimeout: schedule, clearTimeout: id => timers.delete(id)
  };
  ctx.window = ctx; ctx.addEventListener = (_, f) => { keyboard = f; };
  vm.createContext(ctx);
  for (const f of ['config.js', 'dialogue.js', 'voice-cues.js', 'rules.js', 'media.js', 'beats.js', 'keys.js', 'game.js']) vm.runInContext(fs.readFileSync('src/' + f, 'utf8'), ctx);
  async function flush() { for (let i = 0; i < 25; i++) await Promise.resolve(); }
  async function step() {
    await flush();
    const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    assert.ok(next, 'expected timer'); timers.delete(next[0]); now = next[1].at; next[1].f(); await flush();
  }
  return {
    ctx, audios, errors, elements, fullScreen, flush, step,
    async key(code, repeat = false) { await flush(); keyboard({ code, repeat, preventDefault() {} }); await flush(); },
    async until(pred) { for (let i = 0; i < 2000; i++) { await flush(); if (pred(ctx.gameStatus())) return; await step(); } throw Error('condition not reached'); },
    get now() { return now; }
  };
}
const voiceCues = require('../src/voice-cues.js');
const voice = id => voiceCues[id].file;
test('P4 narration subtitle includes the missing 题 character', () => {
  const expected = '本次考核将以三项决策模拟题，评估你的自主决策能力：如何生存，与谁亲密，以及如何面对无法删除的记忆。';
  assert.equal(voiceCues['p4.meaning'].transcript, expected);
  assert.equal(harness().ctx.GAME_DIALOGUE['p4.meaning'], expected);
});
test('main keeps subtitles visible through the configurable opacity interface', () => {
  const css = fs.readFileSync('src/style.css', 'utf8');
  assert.match(css, /:root\{--subtitle-opacity:1\}/);
  assert.match(css, /#subtitle\{opacity:var\(--subtitle-opacity,1\)\}/);
});
test('P0 asks the participant to wear headphones and the notice flashes', async () => {
  const h = harness();
  await h.flush();
  assert.match(h.elements.get('#stage').innerHTML, /请佩戴耳机/);
  const css = fs.readFileSync('src/v1.4.css', 'utf8');
  assert.match(css, /\.headphone-notice[\s\S]*animation:\s*headphoneBlink/);
  assert.match(css, /@keyframes headphoneBlink/);
});
test('P6 first marriage choice lasts 70 years', () => {
  const source = fs.readFileSync('src/game.js', 'utf8');
  assert.match(source, /婚姻匹配度 91%', '预计持续 70 年/);
  assert.doesNotMatch(source, /预计持续 27 年/);
});
test('P5 regret result refers to the option rather than the choice', () => {
  const expected = '已记录。根据历史样本，该选项产生长期后悔的概率为 63%。';
  assert.equal(voiceCues['P5.right'].transcript, expected);
  assert.equal(harness().ctx.GAME_DIALOGUE['P5.right'], expected);
});
const reach = (h, phase) => h.until(s => s.phase === phase && s.waiting);
async function questions(h, choices) {
  await h.key('ArrowLeft');
  for (let i = 0; i < 3; i++) {
    await reach(h, 'P' + (i + 5));
    if (choices[i]) await h.key(choices[i]);
    else await h.until(s => s.answers.length === i + 1);
  }
}
async function toContract(h) {
  await questions(h, ['ArrowRight', 'ArrowLeft', 'ArrowLeft']); await reach(h, 'P9R'); await h.key('Space');
}

test('key language renders labeled hollow caps and omits unrequested colors', () => {
  const keys = require('../src/keys.js');
  const p57 = keys.bar(['left', 'right']);
  assert.match(p57, /白键/);
  assert.match(p57, /黄键/);
  assert.doesNotMatch(p57, /红键/);
  assert.doesNotMatch(p57, /arrow|←|→/i);
  const p9r = keys.bar(['third']);
  assert.match(p9r, /红键/);
  assert.doesNotMatch(p9r, /白键/);
  assert.doesNotMatch(p9r, /黄键/);
  assert.match(keys.panels({ left: '放弃', right: '恢复' }), /放弃[\s\S]*恢复/);
  assert.match(keys.bar(['left', 'right'], 'idle'), /is-idle/);
  assert.match(keys.bar(['left', 'right'], 'breathe'), /is-breathe/);
});
test('P7 detect page uses four pause beats and no glitch config', () => {
  const h = harness();
  assert.equal(h.ctx.GAME_CONFIG.p7BlankBeats, 4);
  assert.equal(h.ctx.GAME_CONFIG.p7Glitch, undefined);
  assert.equal(h.ctx.GAME_CONFIG.luckPause, 1200);
});
test('all eight combinations: only all-white answers pass', () => {
  const { passes } = require('../src/rules.js');
  for (let mask = 0; mask < 8; mask++) assert.equal(passes([0, 1, 2].map(i => mask & (1 << i) ? 'right' : 'left')), mask === 0);
});
test('C: yellow final choice unfolds certificate; any key accepts then resets after 30s', async () => {
  const h = harness(); await questions(h, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(h, 'P9C');
  assert.match(h.elements.get('#stage').innerHTML, /放弃/);
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.doesNotMatch(h.elements.get('#keys').innerHTML, /红键/);
  await h.key('ArrowRight');
  await h.until(s => s.certificateState === 'awaiting');
  assert.equal(h.ctx.gameStatus().waiting, true);
  await h.key('Space');
  await h.until(s => s.certificateState === 'signing'); assert.equal(h.ctx.gameStatus().waiting, false);
  await h.until(s => s.ending === 'C'); assert.equal(h.ctx.gameStatus().certificateState, 'complete');
  const fade = h.ctx.GAME_CONFIG.sceneFade;
  const t = h.now; await h.until(s => s.phase === 'P0'); assert.equal(h.now - t, 30000 + fade);
  assert.equal(h.audios.length, 0); assert.deepEqual(h.errors, []);
});
test('C: certificate auto-accepts after 15s if no key', async () => {
  const h = harness(); await questions(h, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(h, 'P9C'); await h.key('ArrowRight');
  await h.until(s => s.certificateState === 'awaiting');
  const t = h.now;
  await h.until(s => s.certificateState === 'signing');
  assert.equal(h.now - t, 15000);
  await h.until(s => s.ending === 'C');
});
test('C: final good-luck line follows the preceding voice after a 1.2-second gap', async () => {
  const h = harness({ [voice('c.yours')]: 1000 });
  await questions(h, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(h, 'P9C'); await h.key('ArrowRight');
  await h.until(s => s.certificateState === 'awaiting'); await h.key('Space');
  await h.until(s => s.cueId === 'c.yours');
  const t = h.now;
  await h.until(s => s.cueId === 'c.luck');
  assert.equal(h.now - t, 1000 + h.ctx.GAME_CONFIG.luckPause);
});
test('A2: white final choice abandons, no certificate', async () => {
  const h = harness(); await questions(h, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(h, 'P9C'); await h.key('ArrowLeft'); await h.until(s => s.ending === 'A2');
  await h.until(() => (h.elements.get('.timeline')?.children || []).length === 3);
  assert.match(h.elements.get('.timeline').children[0].className, /plan-card/);
  assert.equal(h.ctx.gameStatus().certificateState, null);
});
test('A2: final confirmation timeout retains prior 30/90-second fallback', async () => {
  const h = harness(); await questions(h, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(h, 'P9C'); const t = h.now;
  await h.until(s => !s.waiting); assert.equal(h.now - t, 90000);
  await h.until(s => s.ending === 'A2');
});
test('A1: all three timeouts choose yellow; rejection waits exactly 15s and ignores white/yellow', async () => {
  const h = harness(); await questions(h, [null, null, null]);   await reach(h, 'P9R');
  assert.match(h.elements.get('#stage').innerHTML, /若想强制拥有决策权/);
  assert.match(h.elements.get('#stage').innerHTML, /可按下红键/);
  assert.match(h.elements.get('#stage').innerHTML, /请做出抉择/);
  assert.doesNotMatch(h.elements.get('#stage').innerHTML, /请保持原位|强制收回决策权（红色按钮）|申请已驳回/);
  assert.match(h.elements.get('#keys').innerHTML, /红键/);
  assert.doesNotMatch(h.elements.get('#keys').innerHTML, /白键|黄键/);
  assert.deepEqual(Array.from(h.ctx.gameStatus().answers), ['right', 'right', 'right']);
  const t = h.now; await h.key('ArrowLeft'); await h.key('ArrowRight');
  assert.equal(h.ctx.gameStatus().waiting, true); await h.step(); assert.equal(h.now - t, 15000);
  await h.until(s => s.ending === 'A1');
});
test('B: any of three colors confirms each clause; no synthetic audio across full ending', async () => {
  const h = harness(); await toContract(h);
  await reach(h, 'P10B');
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.match(h.elements.get('#keys').innerHTML, /红键/);
  for (const code of ['ArrowLeft', 'Space', 'ArrowRight']) { await reach(h, 'P10B'); await h.key(code); }
  await h.until(s => s.certificateState === 'awaiting' || s.certificateState === 'complete');
  const certBody = [...(h.elements.get('#certificate-content')?.children || [])].map(el => el.innerHTML).join('');
  assert.match(certBody, /强制收回/);
  assert.doesNotMatch(certBody, /正式交还本人/);
  await h.until(s => s.ending === 'B'); assert.equal(h.ctx.gameStatus().contractCount, 3);
  assert.equal(h.audios.length, 0); assert.deepEqual(h.errors, []);
});
test('A3: preserve checked clause, repeat hesitation after continue; red ignored in overlay', async () => {
  const h = harness(); await toContract(h); await reach(h, 'P10B'); await h.key('ArrowLeft');
  await reach(h, 'P10B'); const t = h.now; await h.step(); assert.equal(h.now - t, 5000);
  await reach(h, 'P10B'); await h.key('Space'); assert.equal(h.ctx.gameStatus().waiting, true);
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.doesNotMatch(h.elements.get('#keys').innerHTML, /红键/);
  await h.key('ArrowRight'); await reach(h, 'P10B'); assert.equal(h.ctx.gameStatus().contractCount, 1);
  await h.step(); await reach(h, 'P10B'); await h.key('ArrowLeft'); await h.until(s => s.ending === 'A3');
});
test('A3: hesitation unanswered for 15 seconds terminates', async () => {
  const h = harness(); await toContract(h); await reach(h, 'P10B'); await h.step(); await reach(h, 'P10B');
  const t = h.now; await h.step(); assert.equal(h.now - t, 15000); await h.until(s => s.ending === 'A3');
});
test('standby accepts any of three keys; held keys cannot start; 1 cancels opening', async () => {
  const h = harness();
  await h.key('ArrowLeft', true); assert.equal(h.ctx.gameStatus().phase, 'P0');
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.match(h.elements.get('#keys').innerHTML, /红键/);
  await h.key('Space'); assert.equal(h.ctx.gameStatus().phase, 'P1');
  await h.key('F1'); assert.equal(h.ctx.gameStatus().phase, 'P1');
  await h.key('Digit1'); assert.equal(h.ctx.gameStatus().phase, 'P0');
  await h.key('ArrowLeft'); await h.key('ArrowRight'); assert.equal(h.ctx.gameStatus().phase, 'P1');
  await h.key('Numpad1'); assert.equal(h.ctx.gameStatus().phase, 'P0');
  await h.key('ArrowLeft'); await reach(h, 'P5'); assert.equal(h.ctx.gameStatus().answers.length, 0);
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.doesNotMatch(h.elements.get('#keys').innerHTML, /红键/);
});
test('9 enters fullscreen and 0 exits; held keys do not retrigger either action', async () => {
  const h = harness();
  await h.key('Digit9'); await h.key('Digit9', true); await h.key('Digit0');
  await h.key('Numpad9'); await h.key('Numpad0');
  assert.deepEqual(h.fullScreen, [true, false, true, false]);
});
test('P1 adds 2 seconds after narration; P2 absent MP3 cards each last 3 seconds', async () => {
  const h = harness(); await h.key('ArrowLeft'); await h.until(s => s.cueId === 'p1.detect');
  const fade = h.ctx.GAME_CONFIG.sceneFade;
  const t = h.now; await h.until(s => s.cueId === 'p2.card1'); assert.equal(h.now - t, 5000 + fade);
  for (let i = 1; i <= 7; i++) {
    const start = h.now; await h.until(s => s.cueId === (i === 7 ? 'p2.welcome' : `p2.card${i + 1}`));
    assert.equal(h.now - start, 3000 + (i === 7 ? 1000 : fade));
  }
});
test('P3 perfect and P4 no-standard-answer each hold 1.2 seconds before the next page', async () => {
  const h = harness({ [voice('p3.perfect')]: 1000, [voice('p4.record')]: 800 });
  await h.key('ArrowLeft');
  await h.until(s => s.cueId === 'p3.perfect');
  let t = h.now;
  await h.until(s => s.phase === 'P4');
  assert.equal(h.now - t, 1000 + h.ctx.GAME_CONFIG.pageTransitionPause);
  await h.until(s => s.cueId === 'p4.record');
  t = h.now;
  await h.until(s => s.phase === 'P5');
  assert.equal(h.now - t, 800 + h.ctx.GAME_CONFIG.pageTransitionPause);
});
test('long MP3 replaces fallback; question countdown starts after voice ends', async () => {
  const h = harness({ [voice('P5.choose')]: 19000 });
  await h.key('ArrowLeft'); await h.until(s => s.cueId === 'P5.choose'); const t = h.now;
  await reach(h, 'P5'); assert.equal(h.now - t, 19000);
  await h.until(s => !s.waiting); assert.equal(h.now - t, 34000);
});
test('short MP3 also replaces fallback instead of imposing a three-second minimum', async () => {
  const h = harness({ [voice('p2.card1')]: 500 }); await h.key('ArrowLeft');
  await h.until(s => s.cueId === 'p2.card1'); const t = h.now;
  await h.until(s => s.cueId === 'p2.card2'); assert.equal(h.now - t, 500 + h.ctx.GAME_CONFIG.sceneFade);
});
test('contract accept prompt plays once; five-second timer starts after first term MP3', async () => {
  const h = harness({ [voice('b.term1')]: 11000, [voice('b.accept')]: 1000 }); await toContract(h);
  await h.until(s => s.cueId === 'b.term1'); const t = h.now;
  await reach(h, 'P10B'); assert.equal(h.now - t, 11000); await h.step(); assert.equal(h.now - t, 16000);
  await reach(h, 'P10B'); await h.key('ArrowRight'); await reach(h, 'P10B');
  assert.equal(h.audios.filter(a => a.path === voice('b.accept')).length, 1);
});
test('P10B waits 1.5 seconds after accept prompt and reveals term one only when its voice starts', async () => {
  const h = harness({ [voice('b.accept')]: 1000, [voice('b.term1')]: 1000 });
  await toContract(h);
  await h.until(s => s.cueId === 'b.accept');
  const acceptStart = h.now;
  assert.doesNotMatch(h.elements.get('#stage').innerHTML, /你可能会选择错误的人/);

  await h.until(s => s.cueId === 'b.term1');
  assert.equal(h.now - acceptStart, 1000 + h.ctx.GAME_CONFIG.contractLeadPause);
  assert.equal(h.ctx.GAME_CONFIG.contractLeadPause, 1500);
  assert.doesNotMatch(h.elements.get('#stage').innerHTML, /你可能会选择错误的人/);

  await h.until(() => /你可能会选择错误的人/.test(h.elements.get('#stage').innerHTML));
  assert.equal(h.now - acceptStart, 2500, 'Term text and voice must begin together after the 1.5-second pause');
});
test('voice starts subtitle reveal and finishes it 0-2 seconds before audio ends', async () => {
  const duration = 5232;
  const h = harness({ [voice('P5.choose')]: duration });
  await h.key('ArrowLeft'); await h.until(s => s.cueId === 'P5.choose'); await h.step();
  const html = h.elements.get('#subtitle').innerHTML;
  const delays = [...html.matchAll(/animation-delay:([\d.]+)ms/g)].map(match => Number(match[1]));
  assert.ok(delays.length > 1);
  const finishAt = Math.max(...delays) + h.ctx.GAME_CONFIG.charRevealMs;
  assert.ok(finishAt <= duration);
  assert.ok(finishAt >= duration - 2000);
});
test('a pending recording still shows its extraction-table subtitle through the reserved cue', async () => {
  const h = harness();
  await h.key('ArrowLeft'); await reach(h, 'P5'); await h.key('ArrowLeft');
  await reach(h, 'P6'); await h.key('ArrowLeft');
  await h.until(s => s.cueId === 'P6.left');
  const subtitle = h.elements.get('#subtitle').innerHTML.replace(/<[^>]+>/g, '');
  assert.equal(subtitle, '该匹配由系统预先安排。');
  assert.equal(h.audios.some(audio => audio.path === voice('P6.left')), false);
});
test('developer speed changes timers but never changes voice, sfx, or background playback rate', async () => {
  const h = harness({ [voice('P5.choose')]: 8000, '../assets/bgm/evaluation.mp3': 60000 });
  await h.key('ArrowLeft'); await h.until(s => s.cueId === 'P5.choose'); await h.step();
  h.ctx.setDevSpeed(4);
  assert.ok(h.audios.length > 0);
  assert.ok(h.audios.every(audio => audio.playbackRate === 1));
});
test('voice manifest has no unexpected missing required cues', () => {
  const missing = Object.entries(voiceCues)
    .filter(([, cue]) => cue.required)
    .filter(([, cue]) => !fs.existsSync(require('node:path').resolve(__dirname, '../src', cue.file)))
    .map(([id]) => id)
    .sort();
  const pending = new Set(['P6.left', 'b.pain', 'c.pain']);
  assert.ok(missing.every(id => pending.has(id)), `unexpected missing cues: ${missing.join(', ')}`);
});
test('supplemental recordings keep their source files and receive per-cue level matching', () => {
  assert.equal(voiceCues['P6.left'].file, '../assets/voice/evaluation/该匹配由系统预先安排。.mp3');
  assert.equal(voiceCues['P6.left'].volume, 0.72);
  assert.equal(voiceCues['b.pain'].file, '../assets/voice/evaluation/系统将不再替你删除所有痛苦。.mp3');
  assert.equal(voiceCues['b.pain'].volume, 0.84);
  assert.equal(voiceCues['c.pain'].volume, 0.84);
});
test('long reminder finishes before automatic choice; manual choice interrupts it immediately', async () => {
  for (const manual of [false, true]) {
    const h = harness({ [voice('P5.prompt')]: 9000 }); await h.key('ArrowLeft'); await reach(h, 'P5');
    const t = h.now; await h.until(s => s.cueId === 'P5.prompt');
    if (manual) { await h.key('ArrowRight'); assert.equal(h.now - t, 10000); }
    else { await h.until(s => !s.waiting); assert.equal(h.now - t, 19000); }
    assert.ok(h.audios.every(a => a.paused));
  }
});
test('invalid and stalled MP3 recover to fallback instead of hanging', async () => {
  for (const value of ['error', 'stalled']) {
    const h = harness({ [voice('p1.detect')]: value }); await h.key('ArrowLeft');
    await h.until(s => s.cueId === 'p2.card1'); assert.deepEqual(h.errors, []);
  }
});
test('1 stops long narration, reminder and background; certificate reset leaves no old continuation', async () => {
  const h = harness({ [voice('P5.choose')]: 20000, '../assets/bgm/evaluation.mp3': 60000 });
  await h.key('ArrowLeft'); await h.until(s => s.cueId === 'P5.choose'); await h.key('Digit1');
  assert.ok(h.audios.every(a => a.paused)); assert.equal(h.ctx.gameStatus().phase, 'P0');
  const c = harness(); await questions(c, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(c, 'P9C'); await c.key('ArrowRight'); await c.until(s => s.certificateState === 'awaiting' || s.certificateState === 'signing');
  await c.key('Digit1'); await c.key('ArrowLeft'); await reach(c, 'P5');
  assert.equal(c.ctx.gameStatus().certificateState, null); assert.equal(c.ctx.gameStatus().answers.length, 0);
});
test('P0 standby loops across P1 and stops upon reaching P2; P1 start sfx plays', async () => {
  const standbyPath = '../assets/sfx/P0待机持续.mp3';
  const p1Path = '../assets/sfx/P1启动.mp3';
  const h = harness({
    [standbyPath]: 8000,
    [p1Path]: 2660,
    [voice('p1.detect')]: 1000
  });
  // 刚启动在 P0，待机持续音已在循环播放
  await h.flush();
  const standbyAudio = h.audios.find(a => a.path === standbyPath);
  assert.ok(standbyAudio, 'standby audio should be loaded');
  assert.equal(standbyAudio.paused, false, 'standby audio should be playing in P0');
  assert.equal(standbyAudio.loop, true, 'standby audio should loop');

  // 按键进入 P1，P0 待机持续音必须继续播放，且延迟 0.1 秒（100ms）触发 P1 启动音效
  const keyTime = h.now;
  await h.key('ArrowLeft');
  assert.equal(h.ctx.gameStatus().phase, 'P1');
  assert.equal(standbyAudio.paused, false, 'standby audio must keep playing during P1');
  await h.until(() => h.audios.some(a => a.path === p1Path));
  const fade = h.ctx.GAME_CONFIG.sceneFade;
  assert.equal(h.now - keyTime, 100 + fade, 'P1 start audio should be delayed by exactly 100ms after view transition');
  const p1Audio = h.audios.find(a => a.path === p1Path);
  assert.equal(p1Audio.paused, false, 'P1 start audio should be playing');

  // 等待直到进入 P2，待机持续音必须停止
  await h.until(s => s.cueId === 'p2.card1');
  assert.equal(standbyAudio.paused, true, 'standby audio must stop once P2 starts');
});

test('P2 audio chain: intro -> loop, 7 card beeps, ending & P2-3 intro paired before welcome', async () => {
  const p2Intro = '../assets/sfx/P2 背景声intro.mp3';
  const p2Loop = '../assets/sfx/P2 背景声loop.mp3';
  const p2Ending = '../assets/sfx/P2 背景声ending.mp3';
  const p3_4Intro = '../assets/sfx/P3-4 用户你好背景声intro.mp3';
  const p3_4Loop = '../assets/sfx/P3-4 背景声loop.mp3';
  const beepPath = '../assets/sfx/P2 七张档案卡.mp3';

  const audioFiles = {
    ['../assets/sfx/P1启动.mp3']: 500,
    [voice('p1.detect')]: 100,
    [p2Intro]: 2000,
    [p2Loop]: 10000,
    [p2Ending]: 4320,
    [p3_4Intro]: 4320,
    [p3_4Loop]: 15000,
    [beepPath]: 2090
  };
  for (let i = 1; i <= 7; i++) audioFiles[voice(`p2.card${i}`)] = 500;
  audioFiles[voice('p2.welcome')] = 6000;

  const h = harness(audioFiles);
  // P0 启动不应触发 beep
  await h.key('ArrowLeft');
  assert.equal(h.audios.filter(a => a.path === beepPath).length, 0, 'P0 start should not trigger beep');

  // 进入 P2：开始播放 P2 intro
  await h.until(s => s.cueId === 'p2.card1');
  const introAudio = h.audios.find(a => a.path === p2Intro);
  assert.ok(introAudio, 'P2 intro audio should be created');
  assert.equal(introAudio.paused, false, 'P2 intro audio should play at P2 start');

  // P2 intro 播完（2000ms 后），应无缝切入 P2 loop
  await h.until(() => h.audios.some(a => a.path === p2Loop && !a.paused));
  const loopAudio = h.audios.find(a => a.path === p2Loop);
  assert.ok(loopAudio, 'P2 loop audio should be started after intro ends');
  assert.equal(loopAudio.loop, true, 'P2 loop audio should have loop=true');

  // 7 张卡切卡时各触发一次 beep
  await h.until(s => s.cueId === 'p2.card7');
  const beepsAtCard7 = h.audios.filter(a => a.path === beepPath).length;
  assert.equal(beepsAtCard7, 7, 'Each of the 7 archive cards should trigger a beep');

  // 底下小字 p2.welcome 出现前 1 秒：loop 停止，ending 与 P3-4 intro 同步触发
  await h.until(s => s.cueId === 'p2.welcome');
  assert.equal(loopAudio.paused, true, 'P2 loop must be stopped before welcome text');
  const endingAudio = h.audios.find(a => a.path === p2Ending);
  const p3_4Audio = h.audios.find(a => a.path === p3_4Intro);
  assert.ok(endingAudio && !endingAudio.paused, 'P2 ending audio should play before welcome');
  assert.ok(p3_4Audio && !p3_4Audio.paused, 'P3-4 intro audio should play concurrently with ending');

  // P3-4 intro (4.32s) 播完后，P3-4 loop 自动切入播放
  await h.until(() => h.audios.some(a => a.path === p3_4Loop && !a.paused));
  const p3_4LoopAudio = h.audios.find(a => a.path === p3_4Loop);
  assert.ok(p3_4LoopAudio && !p3_4LoopAudio.paused, 'P3-4 loop must play after P3-4 intro ends');
  assert.equal(h.audios.some(a => a.path.includes('/p3-loading/')), false, 'P3 line audio must not start early during welcome');
});

test('P3 binds one 1.008-second audio segment to each appearing line; valid button still triggers feedback', async () => {
  const beepPath = '../assets/sfx/P2 七张档案卡.mp3';
  const p3_4Loop = '../assets/sfx/P3-4 背景声loop.mp3';
  const linePaths = Array.from({ length: 8 }, (_, i) => `../assets/sfx/p3-loading/line-${String(i).padStart(2, '0')}.mp3`);
  const audioFiles = {
    [beepPath]: 500,
    [p3_4Loop]: 10000,
    [voice('p1.detect')]: 200,
    [voice('p2.welcome')]: 200,
    [voice('p3.count')]: 200,
    [voice('p3.perfect')]: 200,
    [voice('p4.meaning')]: 200,
    [voice('p4.simulations')]: 200,
    [voice('p4.record')]: 200,
    [voice('P5.intro')]: 200,
    [voice('P5.choose')]: 200
  };
  for (const path of linePaths) audioFiles[path] = 1008;
  for (let i = 1; i <= 7; i++) audioFiles[voice(`p2.card${i}`)] = 200;

  const h = harness(audioFiles);
  await h.key('ArrowLeft');

  // 走到 P3
  await h.until(s => s.phase === 'P3');
  const loopAudio = h.audios.find(a => a.path === p3_4Loop);
  assert.ok(loopAudio && !loopAudio.paused, 'P3-4 loop audio should play during history');

  const beepsBeforeHistory = h.audios.filter(a => a.path === beepPath).length;
  for (let n = 1; n <= 8; n++) {
    await h.until(() => h.elements.get('.data').children.length === n);
    const started = h.audios.filter(a => linePaths.includes(a.path));
    assert.equal(started.length, n, `History line ${n} must start exactly one matching audio segment`);
    assert.equal(started[n - 1].path, linePaths[n - 1]);
    assert.equal(started[n - 1].paused, false, `History line ${n} audio must begin with its text`);
  }
  const beepsAfter8thLine = h.audios.filter(a => a.path === beepPath).length;
  assert.equal(beepsAfter8thLine, beepsBeforeHistory, 'History line audio must not fall back to the archive beep');

  // 到达第一题等待用户按键阶段
  await reach(h, 'P5');
  assert.equal(h.ctx.gameStatus().waiting, true);
  const beepsBeforeChoice = h.audios.filter(a => a.path === beepPath).length;

  // 用户按下有效按键 ArrowLeft，必须触发按键 beep 反馈
  await h.key('ArrowLeft');
  const beepsAfterChoice = h.audios.filter(a => a.path === beepPath).length;
  assert.equal(beepsAfterChoice, beepsBeforeChoice + 1, 'Pressing valid button must trigger key beep feedback');
});

test('P4 to P7 audio transitions: ending+intro crossfade, cues, pain memory solo & silence, P7 ending before P8', async () => {
  const p3_4Ending = '../assets/sfx/P3-4 背景声ending.mp3';
  const p4_6Intro = '../assets/sfx/P4-6 背景声intro.mp3';
  const p4_6Loop = '../assets/sfx/P4-6 背景声loop.mp3';
  const asmrLoop = '../assets/sfx/P4-6 背景声ASMR loop.mp3';
  const p5Cue = '../assets/sfx/P5 工作 提示音.mp3';
  const p6Cue = '../assets/sfx/P6 婚姻 提示音.mp3';
  const p7Pain = '../assets/sfx/P7 痛苦记忆.mp3';
  const p7Cue = '../assets/sfx/P7 记忆 提示音.mp3';
  const p4_6Ending = '../assets/sfx/P4-6 背景声ending.mp3';

  const audioFiles = {
    [p3_4Ending]: 3740,
    [p4_6Intro]: 2060,
    [p4_6Loop]: 17300,
    [asmrLoop]: 36000,
    [p5Cue]: 10180,
    [p6Cue]: 8710,
    [p7Pain]: 3240,
    [p7Cue]: 9360,
    [p4_6Ending]: 2930,
    [voice('p1.detect')]: 100,
    [voice('p2.welcome')]: 100,
    [voice('p3.count')]: 100,
    [voice('p3.perfect')]: 100,
    [voice('p4.meaning')]: 100,
    [voice('p4.simulations')]: 100,
    [voice('p4.record')]: 100
  };
  for (let i = 1; i <= 7; i++) {
    const key = `p2.card${i}`;
    if (voiceCues[key]) audioFiles[voice(key)] = 100;
  }
  for (const id of ['P5', 'P6', 'P7']) {
    for (const action of ['intro', 'choose', 'record', 'left', 'right']) {
      const key = `${id}.${action}`;
      if (voiceCues[key]) audioFiles[voice(key)] = 100;
    }
  }

  const h = harness(audioFiles);
  await h.key('ArrowLeft');

  // P4 播完后，第一题卡片出现前 1.8 秒，P3-4 ending 与 P4-6 intro 同步播放
  await h.until(s => s.cueId === 'p4.record');
  await h.until(() => h.audios.some(a => a.path === p3_4Ending));
  const endingAudio = h.audios.find(a => a.path === p3_4Ending);
  const p4_6IntroAudio = h.audios.find(a => a.path === p4_6Intro);
  assert.ok(endingAudio && !endingAudio.paused, 'P3-4 ending should play before question 1');
  assert.ok(p4_6IntroAudio && !p4_6IntroAudio.paused, 'P4-6 intro should play synchronously with ending');

  // 进入 P5：P4-6 loop 与 ASMR loop 双轨同步启动，P5 工作 提示音播放
  await reach(h, 'P5');
  const loopBg = h.audios.find(a => a.path === p4_6Loop);
  const asmrBg = h.audios.find(a => a.path === asmrLoop);
  const p5CueAudio = h.audios.find(a => a.path === p5Cue);
  assert.ok(loopBg && !loopBg.paused, 'P4-6 loop should be playing in P5');
  assert.ok(asmrBg && !asmrBg.paused, 'P4-6 ASMR loop should be playing in P5');
  assert.ok(p5CueAudio && !p5CueAudio.paused, 'P5 cue should play when P5 card appears');

  // 第一题作答并进入 P6：播放 P6 提示音
  await h.key('ArrowLeft');
  await reach(h, 'P6');
  const p6CueAudio = h.audios.find(a => a.path === p6Cue);
  assert.ok(p6CueAudio && !p6CueAudio.paused, 'P6 cue should play when P6 card appears');

  // 第二题作答并进入 P7
  await h.key('ArrowLeft');
  // 系统检测到高痛苦记忆：双轨背景全部停止，独奏 P7 痛苦记忆，其余全静音
  await h.until(() => h.audios.some(a => a.path === p7Pain));
  const painAudio = h.audios.find(a => a.path === p7Pain);
  assert.ok(painAudio && !painAudio.paused, 'P7 pain memory sfx should play');
  assert.equal(loopBg.paused, true, 'P4-6 loop must be silenced during pain memory');
  assert.equal(asmrBg.paused, true, 'P4-6 ASMR loop must be silenced during pain memory');

  // 随后的留白与题卡呈现：P7 卡片呈现后恢复双轨 loop 并播放 P7 记忆 提示音
  await reach(h, 'P7');
  const p7CueAudio = h.audios.find(a => a.path === p7Cue);
  assert.ok(p7CueAudio && !p7CueAudio.paused, 'P7 cue should play when P7 card appears');
  const loopResumed = h.audios.filter(a => a.path === p4_6Loop).pop();
  const asmrResumed = h.audios.filter(a => a.path === asmrLoop).pop();
  assert.ok(loopResumed && !loopResumed.paused, 'P4-6 loop should resume when P7 card appears');
  assert.ok(asmrResumed && !asmrResumed.paused, 'P4-6 ASMR loop should resume when P7 card appears');

  // 第三题作答后，进入 P8 评估前：播放 P4-6 背景声 ending，停止双轨背景 loop
  await h.key('ArrowLeft');
  await h.until(s => s.phase === 'P8');
  assert.equal(loopResumed.paused, true, 'P4-6 loop must stop before P8 evaluation');
  assert.equal(asmrResumed.paused, true, 'P4-6 ASMR loop must stop before P8 evaluation');
  const p4_6EndingAudio = h.audios.find(a => a.path === p4_6Ending);
  assert.ok(p4_6EndingAudio && !p4_6EndingAudio.paused, 'P4-6 ending sfx should play before P8');
});

test('P2-3 background sfx: plays once at P2 start without looping', async () => {
  const p2_3Bg = '../assets/sfx/P2-3背景.mp3';
  const beepPath = '../assets/sfx/P2 七张档案卡.mp3';
  const audioFiles = {
    ['../assets/sfx/P1启动.mp3']: 500,
    [voice('p1.detect')]: 100,
    [p2_3Bg]: 29300,
    [beepPath]: 2090
  };
  for (let i = 1; i <= 7; i++) audioFiles[voice(`p2.card${i}`)] = 300;
  audioFiles[voice('p2.welcome')] = 500;

  const h = harness(audioFiles);
  await h.key('ArrowLeft');

  // 进入 P2：开始播放 P2-3 背景 sfx，且只播放一次（不 loop）
  await h.until(s => s.cueId === 'p2.card1');
  const bgAudio = h.audios.find(a => a.path === p2_3Bg);
  assert.ok(bgAudio, 'P2-3 bg audio should be created');
  assert.equal(bgAudio.paused, false, 'P2-3 bg audio should play at P2 start');
  assert.equal(!bgAudio.loop, true, 'P2-3 bg sfx must NOT loop (plays once)');
});

test('white and yellow key press audio triggers: plays corresponding white / yellow sfx', async () => {
  const whiteKeyAudio = '../assets/sfx/白键.mp3';
  const yellowKeyAudio = '../assets/sfx/黄键.mp3';
  const audioFiles = {
    [whiteKeyAudio]: 2060,
    [yellowKeyAudio]: 2060,
    ['../assets/sfx/P1启动.mp3']: 100,
    [voice('p1.detect')]: 100,
    [voice('p2.welcome')]: 100,
    [voice('p3.count')]: 100,
    [voice('p3.perfect')]: 100,
    [voice('p4.meaning')]: 100,
    [voice('p4.simulations')]: 100,
    [voice('p4.record')]: 100
  };
  for (let i = 1; i <= 7; i++) audioFiles[voice(`p2.card${i}`)] = 100;
  for (const id of ['P5', 'P6', 'P7']) {
    for (const action of ['intro', 'choose', 'record', 'left', 'right']) {
      const key = `${id}.${action}`;
      if (voiceCues[key]) audioFiles[voice(key)] = 100;
    }
  }

  const h = harness(audioFiles);
  await h.key('ArrowLeft');

  // 达到 P5
  await reach(h, 'P5');
  assert.equal(h.ctx.gameStatus().waiting, true);

  // 按白键（ArrowLeft）：触发白键.mp3
  await h.key('ArrowLeft');
  const playedWhite = h.audios.find(a => a.path === whiteKeyAudio);
  assert.ok(playedWhite && !playedWhite.paused, 'Pressing white key must trigger 白键.mp3');

  // 达到 P6
  await reach(h, 'P6');
  assert.equal(h.ctx.gameStatus().waiting, true);

  // 按黄键（ArrowRight）：触发黄键.mp3
  await h.key('ArrowRight');
  const playedYellow = h.audios.find(a => a.path === yellowKeyAudio);
  assert.ok(playedYellow && !playedYellow.paused, 'Pressing yellow key must trigger 黄键.mp3');
});

test('P7 dark plays once at P7 start and P8 assessment plays P0 standby audio', async () => {
  const p7Dark = '../assets/sfx/P7 dark.mp3';
  const p7Pain = '../assets/sfx/P7 痛苦记忆.mp3';
  const p0Standby = '../assets/sfx/P0待机持续.mp3';
  const audioFiles = {
    [p7Dark]: 11184,
    [p7Pain]: 3240,
    [p0Standby]: 5000,
    ['../assets/sfx/P1启动.mp3']: 100,
    [voice('p1.detect')]: 100,
    [voice('p2.welcome')]: 100,
    [voice('p3.count')]: 100,
    [voice('p3.perfect')]: 100,
    [voice('p4.meaning')]: 100,
    [voice('p4.simulations')]: 100,
    [voice('p4.record')]: 100
  };
  for (let i = 1; i <= 7; i++) audioFiles[voice(`p2.card${i}`)] = 100;
  for (const id of ['P5', 'P6', 'P7']) {
    for (const action of ['intro', 'choose', 'record', 'left', 'right']) {
      const key = `${id}.${action}`;
      if (voiceCues[key]) audioFiles[voice(key)] = 100;
    }
  }

  const h = harness(audioFiles);
  await h.key('ArrowLeft');

  // 作答 P5 和 P6
  await reach(h, 'P5');
  await h.key('ArrowLeft');
  await reach(h, 'P6');
  await h.key('ArrowLeft');

  // 进入 P7：系统检测到痛苦记忆，同时触发 P7 dark 播放一次
  await h.until(() => h.audios.some(a => a.path === p7Dark));
  const darkAudio = h.audios.find(a => a.path === p7Dark);
  assert.ok(darkAudio, 'P7 dark sfx must be triggered at P7 start');
  assert.equal(darkAudio.loop, undefined, 'P7 dark must play once without loop');

  // 到达 P7 题卡并作答
  await reach(h, 'P7');
  await h.key('ArrowLeft');

  // 进入 P8 判定：正在评估自主决策能力时播放 P0待机持续.mp3
  await h.until(s => s.phase === 'P8');
  const standbyInP8 = h.audios.filter(a => a.path === p0Standby).pop();
  assert.ok(standbyInP8 && !standbyInP8.paused, 'P0 standby audio must play during P8 assessment');

  // 判定 5 秒结束后进入 P9C，P0待机持续声应当停止
  await reach(h, 'P9C');
  assert.equal(standbyInP8.paused, true, 'P0 standby audio must stop after P8 assessment finishes');
});

test('P11 A plays at the start of 11A ending', async () => {
  const p11AAudio = '../assets/sfx/P11 A.mp3';
  const audioFiles = {
    [p11AAudio]: 45576,
    [voice('a2.confirm')]: 100,
    [voice('a2.stop')]: 100,
    [voice('a.thanks')]: 100,
    [voice('a.next')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  // 直接触发 P11.A2 结局
  h.ctx.enterBeat('P11.A2');
  await h.until(() => h.audios.some(a => a.path === p11AAudio));

  const p11Audio = h.audios.find(a => a.path === p11AAudio);
  assert.ok(p11Audio && !p11Audio.paused, 'P11 A.mp3 must play when entering ending A');
  assert.equal(p11Audio.loop, undefined, 'P11 A.mp3 must be played as non-loop sfx');

  // 也验证 P11.A1 也会播放 P11 A.mp3
  const h2 = harness(audioFiles);
  await h2.flush();
  h2.ctx.enterBeat('P11.A1');
  await h2.until(() => h2.audios.some(a => a.path === p11AAudio));
  const p11Audio2 = h2.audios.find(a => a.path === p11AAudio);
  assert.ok(p11Audio2 && !p11Audio2.paused, 'P11 A.mp3 must play when entering ending A1');
});

test('P9C and P9R play beep sfx once when starting', async () => {
  const beepPath = '../assets/sfx/P2 七张档案卡.mp3';
  const audioFiles = {
    [beepPath]: 100,
    [voice('c.confirm')]: 100,
    [voice('r.sorry')]: 100
  };

  // 测试 P9C 开始播放 Beep
  const hC = harness(audioFiles);
  await hC.flush();
  hC.ctx.enterBeat('P9C');
  await hC.until(s => s.phase === 'P9C');
  const beepsInP9C = hC.audios.filter(a => a.path === beepPath);
  assert.ok(beepsInP9C.length >= 1, 'P9C must play beep when starting');

  // 测试 P9R 开始播放 Beep
  const hR = harness(audioFiles);
  await hR.flush();
  hR.ctx.enterBeat('P9R');
  await hR.until(s => s.phase === 'P9R');
  const beepsInP9R = hR.audios.filter(a => a.path === beepPath);
  assert.ok(beepsInP9R.length >= 1, 'P9R must play beep when starting');
});

test('P10B plays P10B sfx once then starts ASMR loop; hesitation triggers P10B sfx again', async () => {
  const p10bAudio = '../assets/sfx/P10B.mp3';
  const asmrLoop = '../assets/sfx/P4-6 背景声ASMR loop.mp3';
  const audioFiles = {
    [p10bAudio]: 2064,
    [asmrLoop]: 36000,
    [voice('b.detect')]: 100,
    [voice('b.risk')]: 100,
    [voice('b.accept')]: 100,
    [voice('b.term1')]: 100,
    [voice('b.hesitate')]: 100,
    [voice('b.want')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  // 进入 P10B 拍
  h.ctx.enterBeat('P10B');
  await h.until(() => h.audios.some(a => a.path === p10bAudio));

  const firstP10b = h.audios.find(a => a.path === p10bAudio);
  assert.ok(firstP10b && !firstP10b.paused, 'P10B sfx must play at P10B start');
  assert.equal(firstP10b.loop, undefined, 'P10B sfx must play once without loop');

  // 当 P10B 播完后，接上 P4-6 背景声 ASMR loop
  await h.until(() => h.audios.some(a => a.path === asmrLoop));
  const asmrAudio = h.audios.find(a => a.path === asmrLoop);
  assert.ok(asmrAudio && !asmrAudio.paused, 'ASMR loop must start after P10B sfx finishes');
  assert.equal(asmrAudio.loop, true, 'ASMR must be looped');

  // 等待并触发犹豫（超时）
  await h.until(s => s.cueId === 'b.term1');
  await reach(h, 'P10B');
  const countBeforeHesitate = h.audios.filter(a => a.path === p10bAudio).length;

  // 步进让条款超时，触发犹豫
  await h.step();
  await h.until(() => h.audios.filter(a => a.path === p10bAudio).length > countBeforeHesitate);
  const p10bHesitate = h.audios.filter(a => a.path === p10bAudio).pop();
  assert.ok(p10bHesitate && !p10bHesitate.paused, 'P10B sfx must play when hesitation is detected');
});

test('P10B tick plays during terms narration', async () => {
  const p10bTickAudio = '../assets/sfx/P10B 打勾.mp3';
  const audioFiles = {
    [p10bTickAudio]: 2184,
    [voice('b.detect')]: 100,
    [voice('b.risk')]: 100,
    [voice('b.accept')]: 100,
    [voice('b.term1')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  h.ctx.enterBeat('P10B');
  await h.until(s => s.cueId === 'b.term1');
  await h.until(() => h.audios.some(a => a.path === p10bTickAudio));

  const tickAudio = h.audios.find(a => a.path === p10bTickAudio);
  assert.ok(tickAudio && !tickAudio.paused, 'P10B tick sfx must play during term narration');
});

test('any key confirmation uses beep sfx regardless of white or yellow key pressed', async () => {
  const beepAudio = '../assets/sfx/P2 七张档案卡.mp3';
  const whiteKeyAudio = '../assets/sfx/白键.mp3';
  const yellowKeyAudio = '../assets/sfx/黄键.mp3';

  const audioFiles = {
    [beepAudio]: 500,
    [whiteKeyAudio]: 500,
    [yellowKeyAudio]: 500,
    [voice('b.detect')]: 100,
    [voice('b.risk')]: 100,
    [voice('b.accept')]: 100,
    [voice('b.term1')]: 100,
    [voice('b.term2')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  h.ctx.enterBeat('P10B');
  await reach(h, 'P10B');

  // 第一条条款：按 ArrowLeft（白键）确认，必须触发 beep 音效，而非白键音效
  const beepsBefore = h.audios.filter(a => a.path === beepAudio).length;
  await h.key('ArrowLeft');
  const beepsAfterWhite = h.audios.filter(a => a.path === beepAudio).length;
  const whiteAudios = h.audios.filter(a => a.path === whiteKeyAudio).length;
  assert.equal(beepsAfterWhite, beepsBefore + 1, 'Pressing white key in any-key mode must trigger beep sfx');
  assert.equal(whiteAudios, 0, 'Pressing white key in any-key mode must NOT trigger white key sfx');

  // 第二条条款：按 ArrowRight（黄键）确认，也必须触发 beep 音效，而非黄键音效
  await reach(h, 'P10B');
  await h.key('ArrowRight');
  const beepsAfterYellow = h.audios.filter(a => a.path === beepAudio).length;
  const yellowAudios = h.audios.filter(a => a.path === yellowKeyAudio).length;
  assert.equal(beepsAfterYellow, beepsAfterWhite + 1, 'Pressing yellow key in any-key mode must trigger beep sfx');
  assert.equal(yellowAudios, 0, 'Pressing yellow key in any-key mode must NOT trigger yellow key sfx');
});

test('ending B plays B think sfx when the central point/orb appears', async () => {
  const bThinkAudio = '../assets/sfx/B think.mp3';
  const audioFiles = {
    [bThinkAudio]: 3432,
    [voice('b.promise')]: 100,
    [voice('b.confirm')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  // 直接触发结局 B
  h.ctx.enterBeat('B');
  await h.until(() => h.audios.some(a => a.path === bThinkAudio));

  const thinkAudio = h.audios.find(a => a.path === bThinkAudio);
  assert.ok(thinkAudio && !thinkAudio.paused, 'B think sfx must play when central point appears in ending B');
  assert.equal(thinkAudio.loop, undefined, 'B think sfx must play as non-loop sfx');
});

test('ending C plays C 1st sfx when c.final starts speaking and voices are at 70% volume', async () => {
  const c1stAudio = '../assets/sfx/C 1st.mp3';
  const audioFiles = {
    [c1stAudio]: 27048,
    [voice('c.final')]: 100,
    [voice('c.handover')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  // 直接触发结局 C
  h.ctx.enterBeat('C');
  // 刚进入转场展示评估结果阶段时，c.1st 尚未播放
  assert.equal(h.audios.some(a => a.path === c1stAudio), false, 'C 1st sfx should not play during transition/result display');

  // 等待“最终确认完成。”（c.final）开始讲
  await h.until(() => h.audios.some(a => a.path === c1stAudio));

  const c1st = h.audios.find(a => a.path === c1stAudio);
  assert.ok(c1st && !c1st.paused, 'C 1st sfx must play when c.final starts speaking');
  assert.equal(c1st.loop, undefined, 'C 1st sfx must play as non-loop sfx');

  const cFinalVoice = h.audios.find(a => a.path === voice('c.final'));
  assert.ok(cFinalVoice, 'c.final voice audio should exist');
  assert.equal(Math.round(cFinalVoice.volume * 100) / 100, 0.7, 'Voice volume must be reduced by 30% to 0.7');
});

test('ending C plays C 2nd sfx 1 second before sealing the certificate', async () => {
  const c2ndAudio = '../assets/sfx/C 2nd.mp3';
  const audioFiles = {
    [c2ndAudio]: 28056,
    [voice('c.final')]: 100,
    [voice('c.handover')]: 100,
    [voice('c.complete')]: 100,
    [voice('c.yours')]: 100,
    [voice('c.luck')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  // 直接触发结局 C
  h.ctx.enterBeat('C');
  await h.until(s => s.certificateState === 'awaiting');

  // 按任意键接受证书
  await h.key('Space');

  // 等待触发 C 2nd.mp3
  await h.until(() => h.audios.some(a => a.path === c2ndAudio));

  const c2nd = h.audios.find(a => a.path === c2ndAudio);
  assert.ok(c2nd && !c2nd.paused, 'C 2nd sfx must start playing before seal is complete');
  assert.equal(c2nd.loop, undefined, 'C 2nd sfx must play as non-loop sfx');

  // 此时处于盖印前倒计时阶段（状态仍为 signing，尚未 complete）
  assert.equal(h.ctx.gameStatus().certificateState, 'signing', 'C 2nd sfx must start before certificateState becomes complete');

  // 步进直至印章彻底盖定（1秒后完成）
  await h.until(s => s.certificateState === 'complete');
  assert.equal(h.ctx.gameStatus().certificateState, 'complete', 'certificate state completes after stamp lead time');
});

test('P9R plays override sfx 0.1s before countdown bar appears and red button sfx when overriding', async () => {
  const p9rOverrideAudio = '../assets/sfx/P9R 强制驳回.mp3';
  const p9rRedButtonAudio = '../assets/sfx/P9R 强制驳回红色按钮.mp3';
  const audioFiles = {
    [p9rOverrideAudio]: 18048,
    [p9rRedButtonAudio]: 1344,
    [voice('r.sorry')]: 100,
    [voice('r.unfit')]: 100,
    [voice('r.common')]: 100,
    [voice('r.reject')]: 100,
    [voice('r.override')]: 100,
    [voice('b.detect')]: 100,
    [voice('b.risk')]: 100,
    [voice('b.accept')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  h.ctx.enterBeat('P9R');

  // 等待播放到 P9R 强制驳回.mp3
  await h.until(() => h.audios.some(a => a.path === p9rOverrideAudio));
  const overrideAudio = h.audios.find(a => a.path === p9rOverrideAudio);
  assert.ok(overrideAudio && !overrideAudio.paused, 'P9R override sfx must play');

  // 此时刚好处于 0.1s 前，倒计时进度条尚未挂载到 DOM
  assert.equal(h.elements.has('#countdown'), false, 'Countdown element must not appear immediately before 0.1s gap');

  // 步进直至倒计时进度条出来并且处于 waiting 状态
  await h.until(s => s.waiting && h.elements.has('#countdown'));
  assert.ok(h.elements.has('#countdown'), 'Countdown element should appear after 0.1s lead');

  // 按红色按钮进行强制驳回
  await h.key('Space');

  // 验证触发了 P9R 强制驳回红色按钮.mp3
  await h.until(() => h.audios.some(a => a.path === p9rRedButtonAudio));
  const redAudio = h.audios.find(a => a.path === p9rRedButtonAudio);
  assert.ok(redAudio && !redAudio.paused, 'P9R red button sfx must play when pressing red key');
  assert.equal(redAudio.loop, undefined, 'Red button sfx must be non-loop');
  assert.equal(overrideAudio.paused, true, 'P9R countdown sfx must stop immediately after pressing the red key');
});

test('ending B plays same audio as ending C across certificate ceremony', async () => {
  const c1stAudio = '../assets/sfx/C 1st.mp3';
  const c2ndAudio = '../assets/sfx/C 2nd.mp3';
  const bThinkAudio = '../assets/sfx/B think.mp3';
  const audioFiles = {
    [c1stAudio]: 27048,
    [c2ndAudio]: 28056,
    [bThinkAudio]: 3432,
    [voice('b.promise')]: 100,
    [voice('b.confirm')]: 100,
    [voice('b.luck')]: 100,
    [voice('b.errors')]: 100,
    [voice('b.pain')]: 100,
    [voice('b.optimal')]: 100,
    [voice('c.final')]: 100,
    [voice('c.handover')]: 100,
    [voice('c.complete')]: 100,
    [voice('c.yours')]: 100,
    [voice('c.luck')]: 100
  };

  const h = harness(audioFiles);
  await h.flush();

  h.ctx.enterBeat('B');

  // 等待进入证书仪式并展开证书，播放 c.1st 及 c.final
  await h.until(() => h.audios.some(a => a.path === c1stAudio));
  const c1st = h.audios.find(a => a.path === c1stAudio);
  assert.ok(c1st && !c1st.paused, 'C 1st sfx must play in ending B certificate');

  const cFinal = h.audios.find(a => a.path === voice('c.final'));
  assert.ok(cFinal, 'c.final voice must play in ending B certificate');

  // 等待证书进入 awaiting 状态
  await h.until(s => s.certificateState === 'awaiting');

  // 按任意键接受收回确认书
  await h.key('Space');

  // 盖印前 1 秒播放 C 2nd
  await h.until(() => h.audios.some(a => a.path === c2ndAudio));
  const c2nd = h.audios.find(a => a.path === c2ndAudio);
  assert.ok(c2nd && !c2nd.paused, 'C 2nd sfx must play before sealing certificate in ending B');

  // 印章盖定后播放 c.complete, c.yours, c.luck
  await h.until(s => s.certificateState === 'complete');
  await h.until(() => h.audios.some(a => a.path === voice('c.complete')));
  assert.ok(h.audios.some(a => a.path === voice('c.complete')), 'c.complete must play after sealing in ending B');

  await h.until(() => h.audios.some(a => a.path === voice('c.yours')));
  assert.ok(h.audios.some(a => a.path === voice('c.yours')), 'c.yours must play after sealing in ending B');

  await h.until(() => h.audios.some(a => a.path === voice('c.luck')));
  assert.ok(h.audios.some(a => a.path === voice('c.luck')), 'c.luck must play after sealing in ending B');
});
