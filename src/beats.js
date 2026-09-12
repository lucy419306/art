/* 新增/调整分支时，唯一需要同步修改的文件：本表。
   新增拍→加一项；删分支→删对应项。 */
(function (root) {
  const beats = [
    { id: 'P0', label: 'P0 待机', group: '主线', state: {} },
    { id: 'P1', label: 'P1 启动', group: '主线', state: {} },
    { id: 'P2', label: 'P2 开场', group: '主线', state: {} },
    { id: 'P3', label: 'P3 数据公示', group: '主线', state: {} },
    { id: 'P4', label: 'P4 测试说明', group: '主线', state: {} },
    { id: 'P5', label: 'P5 Q1 工作', group: '主线', state: {} },
    { id: 'P6', label: 'P6 Q2 婚姻', group: '主线', state: { answers: ['left'] } },
    { id: 'P7', label: 'P7 Q3 记忆', group: '主线', state: { answers: ['left', 'left'] } },
    { id: 'P8', label: 'P8 判定', group: '主线', state: { answers: ['left', 'left', 'left'] } },
    { id: 'P9C', label: 'P9C 通过', group: '通过', state: { answers: ['left', 'left', 'left'] } },
    { id: 'P9R', label: 'P9R 驳回', group: '驳回', state: { answers: ['left', 'right', 'left'] } },
    { id: 'P10B', label: 'P10B 契约', group: '驳回', state: { answers: ['left', 'right', 'left'], contractCount: 0 } },
    { id: 'P11.A1', label: 'P11·A1（入口台词略）', group: '结局', state: { answers: ['left', 'right', 'left'], ending: 'A1' } },
    { id: 'P11.A2', label: 'P11·A2（入口台词略）', group: '结局', state: { answers: ['left', 'left', 'left'], ending: 'A2' } },
    { id: 'P11.A3', label: 'P11·A3（入口台词略）', group: '结局', state: { answers: ['left', 'right', 'left'], ending: 'A3' } },
    { id: 'B', label: '结局 B', group: '结局', state: { answers: ['left', 'right', 'left'], contractCount: 3 } },
    { id: 'C', label: '结局 C 证书', group: '结局', state: { answers: ['left', 'left', 'left'] } },
    { id: 'P12', label: 'P12 复位', group: '系统', state: {} }
  ];
  root.GAME_BEATS = beats;
  if (typeof module !== 'undefined') module.exports = beats;
})(globalThis);
