/* 全站键位语言的唯一定义。增新键：在 DEFS 加一项，并在 keys.css 变量里补对应色。 */
(function (root) {
  const DEFS = {
    left: { id: 'left', color: 'white', label: '白键' },
    right: { id: 'right', color: 'yellow', label: '黄键' },
    third: { id: 'third', color: 'red', label: '红键' }
  };
  const ORDER = ['left', 'right', 'third'];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function icon(id, size = 'sm', state = 'idle') {
    const def = DEFS[id];
    if (!def) return '';
    const ready = state === 'active' || state === 'breathe';
    return `<span class="key key--${def.color} key--${size} is-${state}" data-key="${def.id}" aria-label="${def.label}${ready ? '可用' : '不可用'}"><span class="key-cap" aria-hidden="true"><i class="key-shine"></i></span><span class="key-name">${def.label}</span></span>`;
  }

  function bar(shown = [], state = 'breathe') {
    return ORDER.filter(id => shown.includes(id)).map(id => icon(id, 'sm', state)).join('');
  }

  function panel(id, title, state = 'breathe') {
    const def = DEFS[id];
    if (!def) return '';
    return `<div class="key-panel key-panel--${def.color}">${icon(id, 'lg', state)}<h2>${esc(title)}</h2></div>`;
  }

  function panels(titles, state = 'breathe') {
    return `<div class="choices key-panels">${panel('left', titles.left, state)}${panel('right', titles.right, state)}</div>`;
  }

  function press(id) {
    const doc = root.document;
    if (!doc || typeof doc.querySelectorAll !== 'function') return;
    doc.querySelectorAll(`[data-key="${id}"]`).forEach(el => {
      el.classList.remove('is-press');
      void el.offsetWidth;
      el.classList.add('is-press');
    });
  }

  root.GameKeys = { DEFS, ORDER, icon, bar, panel, panels, press };
  if (typeof module !== 'undefined') module.exports = root.GameKeys;
})(typeof globalThis !== 'undefined' ? globalThis : this);
