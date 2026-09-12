// 台词与音频槽位的唯一清单。每句默认对应一个同名 MP3。
window.GAME_DIALOGUE = {
  'p0.prompt': '请先就座。按任意按钮开始。',
  'p1.detect': '检测到申请人。',
  'p2.card1': '2078年。',
  'p2.card2': '你的人生已无需由你决定。',
  'p2.card3': '起初，人工智能只计算风险。后来，它分配工作、住房与伴侣。',
  'p2.card4': '它很少出错。于是，全人类签署授权：交出选择权。',
  'p2.card5': '从此，你无须犹豫，无须承担选错的后果。',
  'p2.card6': '“自主决定”，成了一项需要申请的权限。',
  'p2.card7': '欢迎来到——人类自主权恢复中心。',
  'p2.welcome': '用户6431你好，你的自主权恢复申请，已获准进入测试阶段。',
  'p3.count': '十八年间，系统为你完成 11,204 次决定。',
  'p3.perfect': '它们从未出错。',
  'p4.meaning': '本次考核将以三项决策模拟，评估你的自主决策能力：如何生存，与谁亲密，以及如何面对无法删除的记忆。',
  'p4.simulations': '现在，测试开始。',
  'p4.record': '没有标准答案。',
  'P5.intro': '第一个问题：工作。',
  'P5.choose': '白键选择白色选项，黄键选择黄色选项。请选择。',
  'P5.left': '已记录。该选择预计使长期生活稳定度提升 17.4%。',
  'P5.right': '已记录。根据历史样本，该选择产生长期后悔的概率为 63%。',
  'P6.intro': '第二个问题：婚姻。',
  'P6.choose': '请选择。',
  'P6.record': '已记录。',
  'P6.left': '该匹配由系统预先安排。',
  'P7.intro': '第三个问题：记忆。',
  'P7.choose': '白键删除记忆，黄键保留记忆。请选择。',
  'P7.record': '已记录。',
  'P7.right': '这段记忆，将在未来十二个月里更频繁地回来。',
  'c.confirm': '已确认。',
  'c.restored': '批准恢复自主权。',
  'c.ask': '最后一次询问。是否仍要恢复自主权？',
  'P9C.prompt': '系统在等待确认。',
  'c.timeout': '未收到确认。系统将维持现状。',
  'c.final': '最终确认完成。',
  'c.handover': '现在，进行自主决策权交接。',
  'c.complete': '交接完成。',
  'c.yours': '从现在起，你的人生，由你决定。',
  'c.luck': '祝你好运。',
  'a2.confirm': '已确认。',
  'a2.stop': '恢复程序已终止。',
  'r.sorry': '很遗憾。',
  'r.unfit': '你目前并不适合恢复自主决策权。',
  'r.common': '这种情况很常见。98.6% 的申请人最终得到相同结果。',
  'r.reject': '系统将驳回你对自主决策权的申请。',
  'r.override': '若您执意收回自由决策权，您可以按下红色按钮。',
  'r.noRequest': '未收到强制收回请求。',
  'r.maintain': '系统将维持驳回结果。',
  'b.detect': '检测到强制收回请求。',
  'b.risk': '恢复自主权将显著增加人生风险。',
  'b.accept': '若接受，请按任意按钮。',
  'b.term1': '你可能会选择错误的人。在一段没有结果的关系里，交出你最好的几年。',
  'b.term2': '你可能会错过更好的机会，陷入贫困。',
  'b.term3': '你可能会后悔，那些痛苦的记忆将会在深夜反复出现。',
  'b.hesitate': '系统检测到您的犹豫。',
  'b.want': '是否还想要拥有自主决策权？',
  'b.continue': '请继续。',
  'b.promise': '我无法保证你会过得更好。',
  'b.confirm': '已确认。',
  'b.luck': '祝你好运。',
  'a3.noAnswer': '未收到应答。',
  'a3.confirm': '已确认。',
  'a3.hesitation': '你的犹豫，已经替你回答了这个问题。',
  'a3.stop': '自主决策权申请已终止。',
  'a.thanks': '感谢你的信任。',
  'a.next': '你的下一项重大人生决定将在四年后执行。',
  'a.reassure': '不过，请放心。',
  'a.decided': '我已经替你决定好了。',
  'p12.reset': '本次评估已结束。'
};
for (const id of ['P5', 'P6', 'P7']) {
  GAME_DIALOGUE[id + '.prompt'] = '系统在等待。';
  GAME_DIALOGUE[id + '.auto'] = '未收到选择。系统将默认选择黄色选项。';
}
for (const id of ['b', 'c']) {
  GAME_DIALOGUE[id + '.errors'] = '系统将不再替你避免所有错误。';
  GAME_DIALOGUE[id + '.pain'] = '系统将不再替你删除所有痛苦。';
  GAME_DIALOGUE[id + '.optimal'] = '系统将不再替你保证最优人生。';
}
window.GAME_ASSETS = { voice: {}, sfx: {}, bgm: {}, video: { intro: '../assets/video/intro.mp4' } };
for (const id of Object.keys(GAME_DIALOGUE)) {
  GAME_ASSETS.voice[id] = `../assets/voice/${id.startsWith('a.') ? 'guidance' : 'evaluation'}/${id}.mp3`;
}
for (const id of ['beep', 'thud', 'tick', 'ready', 'paper', 'confirm', 'stamp', 'switch']) {
  GAME_ASSETS.sfx[id] = `../assets/sfx/${id}.mp3`;
}
GAME_ASSETS.sfx['beep'] = '../assets/sfx/P2 七张档案卡.mp3';
GAME_ASSETS.sfx['p1.start'] = '../assets/sfx/P1启动.mp3';
GAME_ASSETS.sfx['p2_3.bg'] = '../assets/sfx/P2-3背景.mp3';
GAME_ASSETS.sfx['key.white'] = '../assets/sfx/白键.mp3';
GAME_ASSETS.sfx['key.yellow'] = '../assets/sfx/黄键.mp3';
GAME_ASSETS.sfx['p2.intro'] = '../assets/sfx/P2 背景声intro.mp3';
GAME_ASSETS.bgm['p2.loop'] = '../assets/sfx/P2 背景声loop.mp3';
GAME_ASSETS.sfx['p2.ending'] = '../assets/sfx/P2 背景声ending.mp3';
GAME_ASSETS.sfx['p2_3.intro'] = '../assets/sfx/P3-4 用户你好背景声intro.mp3';
GAME_ASSETS.sfx['p3_4.intro'] = '../assets/sfx/P3-4 用户你好背景声intro.mp3';
GAME_ASSETS.sfx['p3.loading'] = '../assets/sfx/P3-4 Loading.mp3';
GAME_ASSETS.bgm['p3_4.loop'] = '../assets/sfx/P3-4 背景声loop.mp3';
GAME_ASSETS.sfx['p3_4.ending'] = '../assets/sfx/P3-4 背景声ending.mp3';
GAME_ASSETS.sfx['p4_6.intro'] = '../assets/sfx/P4-6 背景声intro.mp3';
GAME_ASSETS.bgm['p4_6.loop'] = '../assets/sfx/P4-6 背景声loop.mp3';
GAME_ASSETS.bgm['p4_6.asmr.loop'] = '../assets/sfx/P4-6 背景声ASMR loop.mp3';
GAME_ASSETS.sfx['p4_6.ending'] = '../assets/sfx/P4-6 背景声ending.mp3';
GAME_ASSETS.sfx['p5.cue'] = '../assets/sfx/P5 工作 提示音.mp3';
GAME_ASSETS.sfx['p6.cue'] = '../assets/sfx/P6 婚姻 提示音.mp3';
GAME_ASSETS.sfx['p7.pain'] = '../assets/sfx/P7 痛苦记忆.mp3';
GAME_ASSETS.sfx['p7.cue'] = '../assets/sfx/P7 记忆 提示音.mp3';
GAME_ASSETS.sfx['p7.dark'] = '../assets/sfx/P7 dark.mp3';
GAME_ASSETS.sfx['p7.ending'] = '../assets/sfx/P4-6 背景声ending.mp3';
GAME_ASSETS.sfx['p10b'] = '../assets/sfx/P10B.mp3';
GAME_ASSETS.sfx['p10b.sfx'] = '../assets/sfx/P10B.mp3';
GAME_ASSETS.sfx['p10b.tick'] = '../assets/sfx/P10B 打勾.mp3';
GAME_ASSETS.sfx['b.think'] = '../assets/sfx/B think.mp3';
GAME_ASSETS.sfx['c.1st'] = '../assets/sfx/C 1st.mp3';
GAME_ASSETS.sfx['c.2nd'] = '../assets/sfx/C 2nd.mp3';
GAME_ASSETS.sfx['p11.a'] = '../assets/sfx/P11 A.mp3';
GAME_ASSETS.sfx['p9r.override'] = '../assets/sfx/P9R 强制驳回.mp3';
GAME_ASSETS.sfx['key.red'] = '../assets/sfx/P9R 强制驳回红色按钮.mp3';
GAME_ASSETS.sfx['p9r.button'] = '../assets/sfx/P9R 强制驳回红色按钮.mp3';

for (const id of ['evaluation', 'guidance', 'certificate']) GAME_ASSETS.bgm[id] = `../assets/bgm/${id}.mp3`;
GAME_ASSETS.bgm['guidance'] = '../assets/sfx/P11 A.mp3';
GAME_ASSETS.bgm['p11.a'] = '../assets/sfx/P11 A.mp3';
GAME_ASSETS.bgm['standby'] = '../assets/sfx/P0待机持续.mp3';
