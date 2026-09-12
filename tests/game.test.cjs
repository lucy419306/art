const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function harness(audioFiles = {}) {
  let now = 0, serial = 0, keyboard;
  const timers = new Map(), elements = new Map(), audios = [], errors = [];
  const schedule = (f, ms) => { timers.set(++serial, { f, at: now + ms }); return serial; };
  function el() {
    return {
      innerHTML: '', textContent: '', className: '', children: [], values: {},
      style: { setProperty() {} },
      classList: { add() {}, remove() {} },
      append(child) { this.children.push(child); }, insertAdjacentHTML() {},
      querySelector() { return el(); }, querySelectorAll() { return [el(), el(), el()]; },
      remove() {}, pause() {}, load() {}, removeAttribute() {}
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
    setTimeout: schedule, clearTimeout: id => timers.delete(id)
  };
  ctx.window = ctx; ctx.addEventListener = (_, f) => { keyboard = f; };
  vm.createContext(ctx);
  for (const f of ['config.js', 'dialogue.js', 'rules.js', 'media.js', 'beats.js', 'keys.js', 'game.js']) vm.runInContext(fs.readFileSync('src/' + f, 'utf8'), ctx);
  async function flush() { for (let i = 0; i < 25; i++) await Promise.resolve(); }
  async function step() {
    await flush();
    const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    assert.ok(next, 'expected timer'); timers.delete(next[0]); now = next[1].at; next[1].f(); await flush();
  }
  return {
    ctx, audios, errors, elements, flush, step,
    async key(code, repeat = false) { await flush(); keyboard({ code, repeat, preventDefault() {} }); await flush(); },
    async until(pred) { for (let i = 0; i < 2000; i++) { await flush(); if (pred(ctx.gameStatus())) return; await step(); } throw Error('condition not reached'); },
    get now() { return now; }
  };
}
const voice = id => `../assets/voice/evaluation/${id}.mp3`;
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
  const t = h.now; await h.step(); assert.equal(h.now - t, 30000); assert.equal(h.ctx.gameStatus().phase, 'P0');
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
test('standby accepts any of three keys; held keys cannot start; F1 cancels opening', async () => {
  const h = harness();
  await h.key('ArrowLeft', true); assert.equal(h.ctx.gameStatus().phase, 'P0');
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.match(h.elements.get('#keys').innerHTML, /红键/);
  await h.key('Space'); assert.equal(h.ctx.gameStatus().phase, 'P1');
  await h.key('F1'); assert.equal(h.ctx.gameStatus().phase, 'P0');
  await h.key('ArrowLeft'); await h.key('ArrowRight'); assert.equal(h.ctx.gameStatus().phase, 'P1');
  await h.key('F1'); assert.equal(h.ctx.gameStatus().phase, 'P0');
  await h.key('ArrowLeft'); await reach(h, 'P5'); assert.equal(h.ctx.gameStatus().answers.length, 0);
  assert.match(h.elements.get('#keys').innerHTML, /白键/);
  assert.match(h.elements.get('#keys').innerHTML, /黄键/);
  assert.doesNotMatch(h.elements.get('#keys').innerHTML, /红键/);
});
test('P1 adds 2 seconds after narration; P2 absent MP3 cards each last 3 seconds', async () => {
  const h = harness(); await h.key('ArrowLeft'); await h.until(s => s.cueId === 'p1.detect');
  const t = h.now; await h.until(s => s.cueId === 'p2.card1'); assert.equal(h.now - t, 5000);
  for (let i = 1; i <= 7; i++) {
    const start = h.now; await h.until(s => s.cueId === (i === 7 ? 'p2.welcome' : `p2.card${i + 1}`));
    assert.equal(h.now - start, 3000);
  }
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
  await h.until(s => s.cueId === 'p2.card2'); assert.equal(h.now - t, 500);
});
test('contract five-second timer starts after MP3; one-time accept prompt is not repeated', async () => {
  const h = harness({ [voice('b.term1')]: 11000, [voice('b.accept')]: 1000 }); await toContract(h);
  await h.until(s => s.cueId === 'b.term1'); const t = h.now;
  await reach(h, 'P10B'); assert.equal(h.now - t, 11000); await h.step(); assert.equal(h.now - t, 16000);
  await reach(h, 'P10B'); await h.key('ArrowRight'); await reach(h, 'P10B');
  assert.equal(h.audios.filter(a => a.path === voice('b.accept')).length, 1);
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
test('F1 stops long narration, reminder and background; certificate reset leaves no old continuation', async () => {
  const h = harness({ [voice('P5.choose')]: 20000, '../assets/bgm/evaluation.mp3': 60000 });
  await h.key('ArrowLeft'); await h.until(s => s.cueId === 'P5.choose'); await h.key('F1');
  assert.ok(h.audios.every(a => a.paused)); assert.equal(h.ctx.gameStatus().phase, 'P0');
  const c = harness(); await questions(c, ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']);
  await reach(c, 'P9C'); await c.key('ArrowRight'); await c.until(s => s.certificateState === 'awaiting' || s.certificateState === 'signing');
  await c.key('F1'); await c.key('ArrowLeft'); await reach(c, 'P5');
  assert.equal(c.ctx.gameStatus().certificateState, null); assert.equal(c.ctx.gameStatus().answers.length, 0);
});
