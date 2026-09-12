/* 配音的唯一映射表：屏幕文字仍由 dialogue.js / game.js 决定，录音内容以本表为准。 */
(function (root) {
  const P = '../assets/voice/prompt/';
  const E = '../assets/voice/evaluation/';
  const G = '../assets/voice/guidance/';
  const cue = (file, transcript, role = 'evaluation', required = true, source = file) => ({
    file: (role === 'guidance' ? G : role === 'prompt' ? P : E) + file,
    transcript, role, required, source
  });
  const shared = (file, transcript, role = 'evaluation') => cue(file, transcript, role, true, file);

  const cues = {
    'p0.prompt': shared('请先就座。按任意按钮开始。.mp3', '请先就座。按任意按钮开始。', 'prompt'),
    'p1.detect': shared('检测到申请人。.mp3', '检测到申请人。'),

    // P2 前六卡默认无配音，第七卡也为可选；保留稳定槽位供后续直接放入文件。
    'p2.card1': cue('p2.card1.mp3', '2078年。', 'evaluation', false, null),
    'p2.card2': cue('p2.card2.mp3', '你的人生已无需由你决定。', 'evaluation', false, null),
    'p2.card3': cue('p2.card3.mp3', '起初，人工智能只计算风险。后来，它分配工作、住房与伴侣。', 'evaluation', false, null),
    'p2.card4': cue('p2.card4.mp3', '它很少出错。于是，全人类签署授权：交出选择权。', 'evaluation', false, null),
    'p2.card5': cue('p2.card5.mp3', '从此，你无须犹豫，无须承担选错的后果。', 'evaluation', false, null),
    'p2.card6': cue('p2.card6.mp3', '“自主决定”，成了一项需要申请的权限。', 'evaluation', false, null),
    'p2.card7': cue('p2.card7.mp3', '欢迎来到——人类自主权恢复中心。', 'evaluation', false, null),
    'p2.welcome': shared('用户6431你好，你的自主权恢复申请，已获准进入测试阶段。.mp3', '用户6431你好，你的自主权恢复申请，已获准进入测试阶段。'),
    'p3.count': shared('十八年间，系统为你完成 11,204 次决定。.mp3', '十八年间，系统为你完成 11,204 次决定。'),
    'p3.perfect': shared('它们从未出错。.mp3', '它们从未出错。'),
    'p4.meaning': shared('本次考核将以三项决策模拟，评估你的自主决策能力：如何生存，与谁亲密，以及如何面对无法删除的记忆。.mp3', '本次考核将以三项决策模拟，评估你的自主决策能力：如何生存，与谁亲密，以及如何面对无法删除的记忆。'),
    'p4.simulations': shared('现在，测试开始。.mp3', '现在，测试开始。'),
    'p4.record': shared('没有标准答案。.mp3', '没有标准答案。'),

    'P5.intro': shared('第一个问题：工作。选择金钱，还是选择热爱？.mp3', '第一个问题：工作。选择金钱，还是选择热爱？', 'prompt'),
    'P5.choose': shared('白键选择白色选项，黄键选择黄色选项。请选择。.mp3', '白键选择白色选项，黄键选择黄色选项。请选择。', 'prompt'),
    'P5.left': shared('已记录。该选择预计使长期生活稳定度提升 17.4%。.mp3', '已记录。该选择预计使长期生活稳定度提升 17.4%。'),
    'P5.right': shared('已记录。根据历史样本，该选择产生长期后悔的概率为 63%。.mp3', '已记录。根据历史样本，该选择产生长期后悔的概率为 63%。'),
    'P5.prompt': shared('系统在等待。.mp3', '系统在等待。', 'prompt'),
    'P5.auto': shared('未收到选择，系统将默认选择黄色选项.mp3', '未收到选择。系统将默认选择黄色选项。'),

    'P6.intro': shared('第二个问题：婚姻。选择安稳，还是选择爱情？.mp3', '第二个问题：婚姻。选择安稳，还是选择爱情？', 'prompt'),
    'P6.choose': shared('请选择.mp3', '请选择。', 'prompt'),
    'P6.record': shared('已记录.mp3', '已记录。'),
    'P6.left': shared('该匹配由系统预先安排。.mp3', '该匹配由系统预先安排。'),
    'P6.prompt': shared('系统在等待。.mp3', '系统在等待。', 'prompt'),
    'P6.auto': shared('未收到选择，系统将默认选择黄色选项.mp3', '未收到选择。系统将默认选择黄色选项。'),

    'P7.intro': shared('第三个问题：记忆。.mp3', '第三个问题：记忆。', 'prompt'),
    'P7.choose': shared('白键删除记忆，黄键保留记忆。请选择。.mp3', '白键删除记忆，黄键保留记忆。请选择。', 'prompt'),
    'P7.record': shared('已记录.mp3', '已记录。'),
    'P7.right': shared('这段记忆，将在未来十二个月里更频繁地回来。.mp3', '这段记忆，将在未来十二个月里更频繁地回来。'),
    'P7.prompt': shared('系统在等待。.mp3', '系统在等待。', 'prompt'),
    'P7.auto': shared('未收到选择，系统将默认选择黄色选项.mp3', '未收到选择。系统将默认选择黄色选项。'),

    'c.confirm': shared('已确认.mp3', '已确认。'),
    'c.restored': shared('自主权恢复完成。.mp3', '自主权恢复完成。'),
    'c.ask': shared('最后一次询问。是否仍要恢复自主权？.mp3', '最后一次询问。是否仍要恢复自主权？', 'prompt'),
    'P9C.prompt': shared('系统在等待确认。.mp3', '系统在等待确认。', 'prompt'),
    'c.timeout': shared('未收到确认。系统将维持现状。.mp3', '未收到确认。系统将维持现状。'),
    'c.final': shared('最终确认完成。.mp3', '最终确认完成。'),
    'c.handover': shared('现在，进行自主决策权交接。.mp3', '现在，进行自主决策权交接。'),
    'c.complete': shared('交接完成。.mp3', '交接完成。'),
    'c.yours': shared('从现在起，你的人生，由你决定。.mp3', '从现在起，你的人生，由你决定。'),
    'c.luck': shared('祝你好运。.mp3', '祝你好运。'),
    'a2.confirm': shared('已确认.mp3', '已确认。'),
    'a2.stop': shared('恢复程序已终止。.mp3', '恢复程序已终止。'),

    'r.sorry': shared('很遗憾。.mp3', '很遗憾。'),
    'r.unfit': shared('你目前并不适合恢复自主决策权。.mp3', '你目前并不适合恢复自主决策权。'),
    'r.common': shared('这种情况很常见。98.6% 的申请人最终得到相同结果。.mp3', '这种情况很常见。98.6% 的申请人最终得到相同结果。'),
    'r.reject': shared('系统将驳回你对自主决策权的申请。.mp3', '系统将驳回你对自主决策权的申请。'),
    'r.override': shared('若您执意收回自由决策权，您可以按下红色按钮。.mp3', '若您执意收回自由决策权，您可以按下红色按钮。'),
    'r.noRequest': shared('未收到强制收回请求。.mp3', '未收到强制收回请求。'),
    'r.maintain': shared('系统将维持驳回结果。.mp3', '系统将维持驳回结果。'),

    'b.detect': shared('检测到强制收回请求。.mp3', '检测到强制收回请求。'),
    'b.risk': shared('恢复自主权将显著增加人生风险。.mp3', '恢复自主权将显著增加人生风险。'),
    'b.accept': shared('若接受，请按任意按钮。.mp3', '若接受，请按任意按钮。'),
    'b.term1': shared('你可能会选择错误的人。.mp3', '你可能会选择错误的人。'),
    'b.term2': shared('你可能会错过更好的机会。.mp3', '你可能会错过更好的机会。'),
    'b.term3': shared('你可能会后悔。.mp3', '你可能会后悔。'),
    'b.hesitate': shared('系统检测到您的犹豫。.mp3', '系统检测到您的犹豫。'),
    'b.want': shared('是否还想要拥有自主决策权？.mp3', '是否还想要拥有自主决策权？'),
    'b.continue': shared('请继续。.mp3', '请继续。'),
    'b.promise': shared('我无法保证你会过得更好。.mp3', '我无法保证你会过得更好。'),
    'b.confirm': shared('已确认.mp3', '已确认。'),
    'b.luck': shared('祝你好运。.mp3', '祝你好运。'),

    'a3.noAnswer': shared('未收到应答。.mp3', '未收到应答。'),
    'a3.confirm': shared('已确认.mp3', '已确认。'),
    'a3.hesitation': shared('你的犹豫，已经替你回答了这个问题。.mp3', '你的犹豫，已经替你回答了这个问题。'),
    'a3.stop': shared('自主决策权申请已终止。.mp3', '自主决策权申请已终止。'),

    'a.thanks': shared('感谢你的信任。.mp3', '感谢你的信任。', 'guidance'),
    'a.next': shared('你的下一项重大人生决定将在四年后执行。.mp3', '你的下一项重大人生决定将在四年后执行。', 'guidance'),
    'a.reassure': shared('不过，请放心。.mp3', '不过，请放心。', 'guidance'),
    'a.decided': shared('我已经替你决定好了。.mp3', '我已经替你决定好了。', 'guidance'),
    'p12.reset': shared('本次评估已结束。.mp3', '本次评估已结束。')
  };

  for (const id of ['b', 'c']) {
    cues[id + '.errors'] = shared('系统将不再替你避免所有错误。.mp3', '系统将不再替你避免所有错误。');
    cues[id + '.pain'] = shared('系统将不再替你删除所有痛苦。.mp3', '系统将不再替你删除所有痛苦。');
    cues[id + '.optimal'] = shared('系统将不再替你保证最优人生。.mp3', '系统将不再替你保证最优人生。');
  }

  root.GAME_VOICE_CUES = cues;
  if (root.GAME_ASSETS?.voice) {
    for (const [id, item] of Object.entries(cues)) root.GAME_ASSETS.voice[id] = item.file;
  }
  if (typeof module !== 'undefined') module.exports = cues;
})(typeof globalThis !== 'undefined' ? globalThis : this);
