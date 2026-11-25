(function () {
  const codes = { left: 'ArrowLeft', right: 'ArrowRight', third: 'Space' };
  const labels = { left: '白键', right: '黄键', third: '红键' };
  const dock = document.createElement('div');
  dock.id = 'web-controls';
  dock.setAttribute('aria-label', '互动控制');
  dock.innerHTML = '<span class="web-controls-label">点击按钮进行选择</span>' +
    Object.keys(codes).map(id => `<button type="button" data-choice="${id}" aria-label="${labels[id]}">${labels[id]}</button>`).join('') +
    '<button type="button" id="web-reset" title="重新开始">重来</button>';
  document.body.appendChild(dock);

  function send(code) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  }
  dock.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'web-reset') send('Digit1');
    else if (!button.disabled) send(codes[button.dataset.choice]);
  });

  function update() {
    const status = window.gameStatus?.();
    const idle = status?.phase === 'P0';
    const enabled = new Set([...document.querySelectorAll('#keys .key.is-breathe, #keys .key.is-active')]
      .map(el => el.dataset.key));
    for (const button of dock.querySelectorAll('[data-choice]')) {
      button.disabled = !idle && !enabled.has(button.dataset.choice);
    }
    dock.classList.toggle('is-idle', !!idle);
  }
  new MutationObserver(update).observe(document.querySelector('#keys'), { childList: true, subtree: true });
  setInterval(update, 300);
  update();
})();
