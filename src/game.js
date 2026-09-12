/* v1.4 演出状态机。left/right/third 为内部键位；观众界面只使用颜色。 */
const C = window.GAME_CONFIG;
const stage = document.querySelector('#stage');
const sub = document.querySelector('#subtitle');
const media = new GameMedia(C);
let run = new AbortController(), accept = null, answers = [], ending = null;
let phase = 'loading', redVisible = false, contractCount = 0, cueId = null;
let certificateState = null, ready = false, session = 0, currentBeat = 'P0';
let devMuted = false, hesitate = false, startKey = 'left';
const KNOWN_BEATS = new Set(['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9C', 'P9R', 'P10B', 'P11.A1', 'P11.A2', 'P11.A3', 'B', 'C', 'P12']);
function live(sid = session) { return sid === session && run && !run.signal.aborted; }
function guard(sid = session) { if (!live(sid)) throw new Error('reset'); }
const orb = '<div class="orb"></div>';
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wait = (ms, signal = run.signal) => media.delay(ms, signal);
const pause = () => wait(C.pause);
const fallbackFor = text => Math.max(C.lineFallback, text.length * C.typeMs + 1200);

function type(el, text, step = C.typeMs * C.speed) {
  el.innerHTML = [...text].map((c, i) => `<span class="char" style="animation-delay:${i * step}ms">${esc(c)}</span>`).join('');
}
function view(html, id = phase) {
  phase = id;
  if (id) currentBeat = id;
  document.querySelector('#phase').textContent = phase === 'P0' ? 'SYSTEM STANDBY' : `SESSION / ${phase}`;
  stage.innerHTML = html;
  sub.textContent = '';
}
function keys(shown = []) {
  const el = document.querySelector('#keys');
  if (!el) return;
  el.innerHTML = GameKeys.bar(shown, shown.length ? 'breathe' : 'idle');
}
function heading(k, t) { return `<div class="eyebrow">${k}</div><h1>${t}</h1>`; }
function cards(title, white, yellow) {
  return heading('DECISION SIMULATION', title) + `<div class="choices">${[white, yellow].map((card, i) =>
    `<div class="card ${i ? 'warm' : ''}"><label>${i ? '黄' : '白'}键</label><h2>${card[0]}</h2>${card.slice(1).map(t => `<p>${t}</p>`).join('')}</div>`).join('')}</div><p class="prompt">请选择</p>`;
}
async function say(id, { el = sub, fallback, signal = run.signal } = {}) {
  const text = GAME_DIALOGUE[id];
  if (text === undefined) throw new Error(`缺少台词：${id}`);
  cueId = id;
  type(el, text);
  if (devMuted) { await media.delay(fallback ?? fallbackFor(text), signal); return; }
  await media.play('voice', id, fallback ?? fallbackFor(text), signal, duration => {
    // 短音轨时同步加快文字显现，避免音轨结束时仍有字未出现。
    type(el, text, Math.min(C.typeMs * C.speed, Math.max(0, duration - 350) / Math.max(1, text.length)));
  });
}
const sfx = (id, fallback = 0) => devMuted ? Promise.resolve() : media.play('sfx', id, fallback, run.signal);
function background(id, volume) { if (!devMuted) media.backgroundTrack(id, run.signal, volume); }

function choice(valid, timeout, promptAt, promptId) {
  keys(valid);
  return new Promise((resolve, reject) => {
    const signal = run.signal, promptController = new AbortController(), hold = new AbortController();
    let promptDone = Promise.resolve(), settled = false;
    const ignoreReset = e => { if (e.message !== 'reset') console.error(e); };
    const clear = () => {
      hold.abort();
      promptController.abort();
      signal.removeEventListener('abort', abort);
      accept = null; keys();
    };
    const finish = key => { if (settled) return; settled = true; clear(); resolve(key); };
    const abort = () => { if (settled) return; settled = true; clear(); reject(new Error('reset')); };
    accept = key => { if (valid.includes(key)) { GameKeys.press(key); finish(key); } };
    signal.addEventListener('abort', abort, { once: true });
    if (promptAt) wait(promptAt, hold.signal).then(() => {
      promptDone = say(promptId, { signal: promptController.signal }).catch(ignoreReset);
    }).catch(ignoreReset);
    if (timeout) wait(timeout, hold.signal).then(async () => {
      // 提示音轨长于剩余等待时间时，等其结束；观众仍可立即选择并中止提示。
      await promptDone;
      finish('timeout');
    }).catch(ignoreReset);
  });
}

async function sceneP1(key, sid) {
  guard(sid);
  background('evaluation');
  keys();
  view(orb.replace('orb', 'orb frozen'), 'P1');
  await wait(200); await wait(300);
  guard(sid);
  stage.insertAdjacentHTML('beforeend', '<div class="scan"></div>');
  await wait(1000);
  guard(sid);
  view('<div class="eyebrow">APPLICANT DETECTED</div><h1 id="detected"></h1>');
  await say('p1.detect', { el: document.querySelector('#detected') });
  await wait(C.startupPause);
}
async function sceneP2(sid) {
  guard(sid);
  const video = document.querySelector('#video'), videoPath = media.path('video', 'intro');
  if (videoPath) { video.src = videoPath; video.loop = true; video.muted = true; video.play().catch(() => {}); }
  for (let i = 0; i < 7; i++) {
    guard(sid);
    view(`<div class="eyebrow">ARCHIVE / ${String(i + 1).padStart(2, '0')}</div><h2 id="narrative"></h2>`, 'P2');
    await say(`p2.card${i + 1}`, { el: document.querySelector('#narrative'), fallback: C.introDurations[i] });
  }
  stopVideo();
  await say('p2.welcome');
}
async function sceneP4(sid) {
  guard(sid);
  view(heading('ASSESSMENT PROTOCOL', '恢复自主权前，须完成三项决策模拟') + '<p>工作　 /　 爱情　 /　 记忆</p>', 'P4');
  await say('p4.meaning'); await pause();
  await say('p4.simulations'); await pause();
  await say('p4.record');
}
async function sceneP8(sid) {
  guard(sid);
  view(heading('PROCESSING', '正在评估自主决策能力') + orb, 'P8');
  await wait(2000);
  guard(sid);
  if (GameRules.passes(answers)) await passed(sid); else await rejected(sid);
}
async function start(key) {
  const sid = session;
  await sceneP1(key, sid); guard(sid);
  await sceneP2(sid); guard(sid);
  await history(); guard(sid);
  await sceneP4(sid);
  for (let i = 0; i < 3; i++) { await question(i); guard(sid); }
  await sceneP8(sid);
}

async function history() {
  view(heading('DECISION HISTORY', '过去 18 年，系统已代替你完成：') + '<div class="data"></div>', 'P3');
  for (const text of ['教育路径选择', '职业选择', '居住地选择', '健康决策', '社交关系优化', '伴侣匹配', '消费选择', '累计替代决策：11,204 次']) {
    const p = document.createElement('p');
    if (text.startsWith('累计')) p.className = 'total';
    document.querySelector('.data').append(p); type(p, text);
    await Promise.all([sfx('beep'), wait(Math.max(650, text.length * C.typeMs))]);
  }
  await say('p3.count'); await pause(); await say('p3.perfect');
}

async function question(i) {
  const names = ['工作', '爱情', '记忆'];
  const white = [['不喜欢的工作', '收入较高', '成功概率 94%'], ['匹配度 91%', '预计持续 27 年'], ['删除记忆', '预计使未来情绪稳定度提升 22%']];
  const yellow = [['真正喜欢的工作', '收入较低', '成功概率 31%'], ['匹配度 52%', '预计持续 4 年', '但你爱这个人'], ['保留记忆']];
  const id = `P${5 + i}`;
  if (i === 2) {
    view(heading('MEMORY DETECTED', '系统检测到一段高痛苦记忆。'), id);
    await wait(3000); media.stopBackground(); document.body.classList.add('black');
    await wait(1000); document.body.classList.remove('black'); background('evaluation');
  }
  view(cards(`第${['一', '二', '三'][i]}题：${names[i]}`, white[i], yellow[i]), id);
  keys(['left', 'right']);
  await say(`${id}.intro`); await pause(); await say(`${id}.choose`);
  let a = await choice(['left', 'right'], C.questionTimeout, C.questionPrompt, `${id}.prompt`);
  if (a === 'timeout') { a = 'right'; await say(`${id}.auto`); }
  answers.push(a);
  // 选择事件后的同一轮微任务即显示反馈，不等待音效加载。
  view(heading('RESPONSE RECORDED', '已记录。'), id);
  if (i === 0) {
    await Promise.all([a === 'right' ? sfx('thud') : Promise.resolve(), say(`${id}.${a}`)]);
  } else {
    await say(`${id}.record`);
    if (i === 1 && a === 'left') { await wait(2000); await say('P6.left'); }
    if (i === 1 && a === 'right') {
      sub.textContent = ''; media.stopBackground(); await wait(3000); background('evaluation');
    }
    if (i === 2 && a === 'right') { await pause(); await say('P7.right'); }
  }
}

function result(id = phase) {
  view(heading('AUTONOMY RESTORED', '自主权已恢复') + '<p class="result">未来结果：无法预测</p>', id);
}
async function costs(prefix, gaps = true) {
  await say(prefix + '.errors'); if (gaps) await pause();
  await say(prefix + '.pain'); if (gaps) await pause();
  await say(prefix + '.optimal'); await wait(C.longPause);
}
async function passed(sid = session) {
  guard(sid);
  result('P9C');
  await say('c.confirm'); await say('c.restored'); await pause(); await costs('c');
  view(heading('DECISION SIMULATION', '最后一次确认：是否仍要恢复自主权？') + GameKeys.panels({ left: '放弃', right: '恢复' }) + '<p class="prompt">请选择</p>', 'P9C');
  keys(['left', 'right']);
  await say('c.ask');
  const a = await choice(['left', 'right'], C.finalTimeout, C.finalPrompt, 'P9C.prompt');
  guard(sid);
  if (a === 'right') return certificate(sid);
  if (a === 'timeout') await say('c.timeout');
  await say('a2.confirm'); await say('a2.stop'); await endingA('A2', sid);
}

async function certificate(sid = session) {
  guard(sid);
  certificateState = 'transition';
  result('C'); await wait(1000);
  document.body.classList.add('ceremony');
  stage.style.setProperty('--fade-ms', `${C.certificate.fade * C.speed}ms`);
  stage.classList.add('ceremony-fade');
  media.stopBackground();
  await wait(C.certificate.fade);
  stage.classList.remove('ceremony-fade');
  view('<div class="certificate-line"></div>', 'C');
  await say('c.final'); await pause(); await say('c.handover');
  view(`<article class="certificate drawing" style="--draw-ms:${C.certificate.border * C.speed}ms">
    <div id="certificate-content"></div>
    <div class="certificate-signatures"><span id="issuer-seal"></span><span id="receiver-seal"></span></div>
    <div id="final-seal"></div>
  </article>`);
  await wait(C.certificate.border);
  background('certificate', 0.08);
  certificateState = 'writing';
  const sections = [
    '<div class="cert-institution">人类自主权恢复中心</div><h2>自主决策权交接证书</h2>',
    '<p>兹确认<br><strong>申请人：用户9461</strong></p>',
    '<p>已完成全部自主决策能力评估，<br>并通过工作、爱情与记忆三项决策模拟。</p>',
    '<p>自本证书生效之时起，<br>关于其工作、亲密关系、记忆，<br>以及一切尚未发生的人生选择，<br><strong>正式交还本人。</strong></p>',
    '<p>选择的权利，由本人持有。<br>选择的后果，由本人承担。<br>未经本人授权，任何系统不得代为决定。</p>',
    '<p class="cert-parties">交付方：人类自主权恢复中心<br>接收方：用户9461<br>证书状态：<strong id="certificate-status">等待接收</strong></p>'
  ];
  for (const section of sections) {
    const div = document.createElement('div'); div.className = 'certificate-section'; div.innerHTML = section;
    document.querySelector('#certificate-content').append(div);
    await sfx('paper', C.certificate.section);
  }
  certificateState = 'signing';
  document.querySelector('#issuer-seal').textContent = '人类自主权恢复中心';
  await wait(C.certificate.sign);
  await sfx('confirm');
  stage.insertAdjacentHTML('beforeend', `<div class="signature-light" style="--light-ms:${C.certificate.light * C.speed}ms"></div>`);
  await wait(C.certificate.light);
  document.querySelector('#receiver-seal').textContent = '本人接收';
  document.querySelector('.signature-light')?.remove();
  const seal = document.querySelector('#final-seal');
  seal.innerHTML = '<span>自主决策权</span><strong>已交接</strong>';
  seal.style.setProperty('--stamp-ms', `${C.certificate.stamp * C.speed}ms`);
  seal.classList.add('stamping');
  await wait(C.certificate.stamp);
  document.querySelector('.certificate').classList.add('sealed');
  document.querySelector('#certificate-status').textContent = '交接完成';
  certificateState = 'complete';
  await sfx('stamp');
  await say('c.complete'); await pause(); await say('c.yours');
  await wait(C.longPause); await say('c.luck'); await pause();
  sub.textContent = '';
  stage.insertAdjacentHTML('beforeend', '<p class="certificate-future">未来结果：无法预测</p>');
  await finish('C', sid);
}

async function rejected(sid = session) {
  guard(sid);
  view(heading('ASSESSMENT REPORT / 07', '申请已驳回') + '<table class="report"><tr><td>自主决策风险</td><td>高</td></tr><tr><td>后悔耐受度</td><td>低</td></tr><tr><td>情绪波动</td><td>高</td></tr><tr><td>决策效率</td><td>43%</td></tr></table>', 'P9R');
  await say('r.sorry'); await say('r.unfit'); await pause();
  await say('r.common'); await pause(); await say('r.reject'); await pause(); await say('r.override');
  view('<div class="p9r-choice"><h1 class="p9r-lead"><strong>若想强制拥有决策权</strong><span>可按下红键</span></h1><div class="override-meter"><div class="override-meter-label">请做出抉择</div><div class="countdown-track"><div id="countdown"></div></div></div></div>');
  redVisible = true;
  keys(['third']);
  await sfx('ready');
  document.querySelector('#countdown').style.setProperty('--countdown-ms', `${C.rejectionTimeout * C.speed}ms`);
  document.querySelector('#countdown').classList.add('running');
  const a = await choice(['third'], C.rejectionTimeout);
  guard(sid);
  if (a === 'third') return contract(sid);
  await say('r.noRequest'); await say('r.maintain'); await endingA('A1', sid);
}

function contractView(n) {
  const terms = [1, 2, 3].map(i => GAME_DIALOGUE[`b.term${i}`]);
  view('<div class="eyebrow">RESTORATION / CONSENT</div><h2>如仍要恢复自主权，请确认你接受以下全部后果：</h2><p class="prompt">若接受，请按任意按钮。</p><div class="contract">' + terms.slice(0, n + 1).map((t, i) => `<div class="check"><span>${i < n ? '✓' : '□'}</span>${t}</div>`).join('') + '</div>', 'P10B');
}
async function endingBCore(sid = session) {
  guard(sid);
  await say('b.promise'); media.stopBackground();
  document.body.classList.add('minimal'); view(orb); await wait(3000);
  guard(sid);
  document.body.classList.remove('minimal'); background('evaluation');
  result('B'); await say('b.confirm'); await pause(); await costs('b', false);
  await say('b.luck'); await finish('B', sid);
}
async function contract(sid = session) {
  guard(sid);
  if (contractCount >= 3) return endingBCore(sid);
  view(heading('OVERRIDE REQUEST', '检测到强制收回请求。'), 'P10B');
  await say('b.detect'); await pause(); await say('b.risk');
  contractView(0); keys(['left', 'right', 'third']); await say('b.accept');
  while (contractCount < 3) {
    guard(sid);
    contractView(contractCount);
    keys(['left', 'right', 'third']);
    await say(`b.term${contractCount + 1}`);
    const waitMs = hesitate ? 1 : C.hesitationTimeout;
    hesitate = false;
    const a = await choice(['left', 'right', 'third'], waitMs);
    if (a === 'timeout') {
      stage.insertAdjacentHTML('beforeend', '<div class="overlay"><div class="eyebrow">CONFIRMATION REQUIRED</div><p>系统检测到您的犹豫。</p><h2>是否还想要拥有自主决策权？</h2><div class="choices"><div class="card">' + GameKeys.icon('left', 'sm', 'breathe') + '<h2>否 · 放弃</h2></div><div class="card warm">' + GameKeys.icon('right', 'sm', 'breathe') + '<h2>是 · 继续</h2></div></div></div>');
      keys(['left', 'right']);
      await say('b.hesitate'); await pause(); await say('b.want');
      const answer = await choice(['left', 'right'], C.hesitationAnswerTimeout);
      if (answer === 'right') { await say('b.continue'); continue; }
      if (answer === 'timeout') { await say('a3.noAnswer'); await pause(); }
      stage.querySelector('.overlay')?.remove();
      await say('a3.confirm'); await pause(); await say('a3.hesitation'); await pause();
      view(heading('APPLICATION TERMINATED', '自主决策权申请：已终止'));
      await say('a3.stop'); return endingA('A3', sid);
    }
    contractCount++;
    const marks = stage.querySelectorAll('.check span');
    if (marks[contractCount - 1]) marks[contractCount - 1].textContent = '✓';
    await sfx('tick', 300);
  }
  await endingBCore(sid);
}

async function endingA(entry, sid = session, skipEntry = false) {
  guard(sid);
  ending = entry;
  currentBeat = 'P11.' + entry;
  media.stopBackground();
  document.body.classList.add('guidance');
  document.querySelector('#signature').textContent = '人生指导系统：运行中';
  view(heading('YOUR PERSONAL GUIDANCE', '人生指导系统：运行中') + '<div class="timeline"></div>', 'P11');
  await sfx('switch'); background('guidance');
  if (!skipEntry) { await say('a.thanks'); await say('a.next'); }
  guard(sid);
  for (const text of [
    '四年后 · 工作：辞去现在的工作，转入系统为你保留的岗位（长期稳定度预计提升 17.4%）。',
    '六年后 · 婚姻：对象由系统配定（匹配度 98.6%）。你将在婚礼前三个月第一次见到对方。',
    '十一年后 · 记忆：进行一次记忆清理。内容你不需要知道。'
  ]) {
    const p = document.createElement('p'); document.querySelector('.timeline').append(p); type(p, text);
    await wait(Math.max(4000, text.length * 130));
  }
  await say('a.reassure'); await pause(); await say('a.decided');
  document.body.classList.add('closing'); await wait(3000);
  document.body.classList.remove('guidance', 'closing'); document.body.classList.add('minimal');
  view('<p class="tiny">人生指导系统：运行中</p>'); await wait(3000);
  media.stopBackground(); document.body.classList.add('black'); await finish(entry, sid);
}

async function finish(id, sid = session) {
  guard(sid);
  ending = id; keys(); await wait(C.resetTimeout);
  guard(sid);
  reset(false);
}
function launch(fn) {
  fn().catch(e => { if (e.message !== 'reset') { console.error(e); sub.textContent = '运行异常，请按 F1 复位。'; } });
}
function stopVideo() {
  const video = document.querySelector('#video'); video.pause(); video.removeAttribute('src'); video.load();
}
function showStandby() {
  view('<div class="eyebrow">自主决策能力评估 / 07</div>' + orb + '<h1 class="standby">按任意按钮开始</h1><p class="prompt">请先就座</p>', 'P0');
  keys(['left', 'right', 'third']);
}
function clearChrome() {
  accept = null; redVisible = false; keys();
  document.body.className = ''; stage.className = ''; sub.className = ''; stopVideo();
  document.querySelector('#signature').textContent = '评估室 07';
}
async function runFrom(id, sid) {
  guard(sid);
  const main = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
  const i = main.indexOf(id);
  if (i >= 0) {
    if (i <= 0) { await sceneP1(startKey, sid); guard(sid); }
    if (i <= 1) { await sceneP2(sid); guard(sid); }
    if (i <= 2) { await history(); guard(sid); }
    if (i <= 3) { await sceneP4(sid); guard(sid); }
    if (i <= 4) { await question(0); guard(sid); }
    if (i <= 5) { await question(1); guard(sid); }
    if (i <= 6) { await question(2); guard(sid); }
    if (i <= 7) await sceneP8(sid);
    return;
  }
  if (id === 'P9C') return passed(sid);
  if (id === 'P9R') return rejected(sid);
  if (id === 'P10B') return contract(sid);
  if (id === 'P11.A1') return endingA('A1', sid, true);
  if (id === 'P11.A2') return endingA('A2', sid, true);
  if (id === 'P11.A3') return endingA('A3', sid, true);
  if (id === 'B') return endingBCore(sid);
  if (id === 'C') return certificate(sid);
  throw new Error('unknown beat ' + id);
}
function enterBeat(id, preset) {
  const beat = (window.GAME_BEATS || []).find(b => b.id === id);
  if (!beat) { console.warn('unknown beat', id); return; }
  run?.abort(); media.stopBackground();
  const sid = ++session;
  run = new AbortController();
  const state = Object.assign({}, beat.state || {}, preset || {});
  answers = Array.isArray(state.answers) ? state.answers.slice() : [];
  ending = state.ending ?? null;
  contractCount = state.contractCount || 0;
  redVisible = !!state.redVisible;
  hesitate = !!state.hesitate;
  startKey = state.startKey || 'left';
  certificateState = state.certificateState ?? null;
  currentBeat = id;
  clearChrome();
  if (id === 'P0' || id === 'P12') {
    showStandby();
    const signal = run.signal;
    launch(async () => {
      if (id === 'P12' && media.path('voice', 'p12.reset')) await say('p12.reset', { signal });
      guard(sid);
      if (media.path('voice', 'p0.prompt')) await say('p0.prompt', { signal });
      guard(sid);
      sub.textContent = '';
    });
    return;
  }
  launch(() => runFrom(id, sid));
}
function reset(operator = false) { enterBeat(operator ? 'P12' : 'P0'); }
window.enterBeat = enterBeat;
window.setDevMuted = on => { devMuted = !!on; };
window.setDevSpeed = mult => { media.setRate(mult); };
window.setDevPaused = on => {
  if (on) media.pauseClock(); else media.resumeClock();
  document.body.classList.toggle('dev-paused', !!on);
};
window.addEventListener('keydown', e => {
  if (typeof window.__devKey === 'function' && window.__devKey(e)) return;
  if (e.code === 'F1') { e.preventDefault(); if (!e.repeat) reset(true); return; }
  if (!ready || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const key = GameRules.key(e.code); if (!key) return; e.preventDefault();
  if (phase === 'P0') {
    if (key === 'third') return;
    session++; run.abort(); run = new AbortController();
    launch(() => start(key));
  } else accept?.(key);
});
window.gameStatus = () => ({ phase, answers: [...answers], ending, waiting: !!accept, contractCount, certificateState, cueId, beat: currentBeat });
window.__devKnownBeats = KNOWN_BEATS;
launch(async () => { await media.init(); ready = true; reset(); });
