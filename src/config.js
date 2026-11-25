// 毫秒。具体批注优先；没有标时的对白至少显示 3 秒，长句确保逐字显示完毕。
window.GAME_CONFIG = {
  speed: 1, voiceVolume: 0.7, typeMs: 48, charRevealMs: 320, voiceLeadRatio: 0.12,
  // 单句字幕透明度：直接修改数字即可。0 = 隐藏，1 = 完全显示，0.5 = 半透明。
  // 每行末尾已标出完整字幕，不需要自行添加台词。
  subtitleOpacity: {
    'p0.prompt': 0, // 请先就座。按任意按钮开始。
    'p1.detect': 0, // 检测到申请人。
    'p2.card1': 0, // 2078年。
    'p2.card2': 0, // 你的人生已无需由你决定。
    'p2.card3': 0, // 起初，人工智能只计算风险。后来，它分配工作、住房与伴侣。
    'p2.card4': 0, // 它很少出错。于是，全人类签署授权：交出选择权。
    'p2.card5': 0, // 从此，你无须犹豫，无须承担选错的后果。
    'p2.card6': 0, // “自主决定”，成了一项需要申请的权限。
    'p2.card7': 0, // 欢迎来到——人类自主权恢复中心。
    'p2.welcome': 0, // 用户6431你好，你的自主权恢复申请，已获准进入测试阶段。
    'p3.count': 0, // 十八年间，系统为你完成 11,204 次决定。
    'p3.perfect': 0, // 它们从未出错。
    'p4.meaning': 1, // 本次考核将以三项决策模拟题，评估你的自主决策能力：如何生存，与谁亲密，以及如何面对无法删除的记忆。
    'p4.simulations': 0, // 现在，测试开始。
    'p4.record': 1, // 没有标准答案。
    'P5.intro': 0, // 第一个问题：工作。
    'P5.choose': 1, // 白键选择白色选项，黄键选择黄色选项。请选择。
    'P5.left': 0, // 已记录。该选择预计使长期生活稳定度提升 17.4%。
    'P5.right': 0, // 已记录。根据历史样本，该选项产生长期后悔的概率为 63%。
    'P5.prompt': 0, // 系统在等待。
    'P5.auto': 0, // 未收到选择。系统将默认选择黄色选项。
    'P6.intro': 0, // 第二个问题：婚姻。
    'P6.choose': 0, // 请选择。
    'P6.record': 0, // 已记录。
    'P6.prompt': 0, // 系统在等待。
    'P6.auto': 1, // 未收到选择。系统将默认选择黄色选项。
    'P7.intro': 0, // 第三个问题：记忆。
    'P7.choose': 1, // 白键删除记忆，黄键保留记忆。请选择。
    'P7.record': 0, // 已记录。
    'P7.right': 1, // 这段记忆，将在未来十二个月里更频繁地回来。
    'P7.prompt': 0, // 系统在等待。
    'P7.auto': 0, // 未收到选择。系统将默认选择黄色选项。
    'c.confirm': 0, // 已确认。
    'c.restored': 0, // 批准恢复自主权。
    'c.ask': 0, // 最后一次询问。是否仍要恢复自主权？
    'P9C.prompt': 0, // 系统在等待确认。
    'c.timeout': 0, // 未收到确认。系统将维持现状。
    'c.final': 0, // 最终确认完成。
    'c.handover': 0, // 现在，进行自主决策权交接。
    'c.complete': 0, // 交接完成。
    'c.yours': 0, // 从现在起，你的人生，由你决定。
    'c.luck': 0, // 祝你好运。
    'c.errors': 0, // 系统将不再替你避免所有错误。
    'c.pain': 0, // 系统将不再替你删除所有痛苦。
    'c.optimal': 0, // 系统将不再替你保证最优人生。
    'a2.confirm': 0, // 已确认。
    'a2.stop': 0, // 恢复程序已终止。
    'r.sorry': 0, // 很遗憾。
    'r.unfit': 1, // 你目前并不适合恢复自主决策权。
    'r.common': 0, // 这种情况很常见。98.6% 的申请人最终得到相同结果。
    'r.reject': 1, // 系统将驳回你对自主决策权的申请。
    'r.override': 1, // 若您执意收回自由决策权，您可以按下红色按钮。
    'r.noRequest': 0, // 未收到强制收回请求。
    'r.maintain': 0, // 系统将维持驳回结果。
    'b.detect': 0, // 检测到强制收回请求。
    'b.risk': 1, // 恢复自主权将显著增加人生风险。
    'b.accept': 0, // 若接受，请按任意按钮。
    'b.term1': 0, // 你可能会选择错误的人。在一段没有结果的关系里，交出你最好的几年。
    'b.term2': 0, // 你可能会错过更好的机会，陷入贫困。
    'b.term3': 0, // 你可能会后悔，那些痛苦的记忆将会在深夜反复出现。
    'b.hesitate': 0, // 系统检测到您的犹豫。
    'b.want': 0, // 是否还想要拥有自主决策权？
    'b.continue': 0, // 请继续。
    'b.promise': 0, // 我无法保证你会过得更好。
    'b.confirm': 0, // 已确认。
    'b.luck': 0, // 祝你好运。
    'b.errors': 1, // 系统将不再替你避免所有错误。
    'b.pain': 1, // 系统将不再替你删除所有痛苦。
    'b.optimal': 1, // 系统将不再替你保证最优人生。
    'a3.noAnswer': 0, // 未收到应答。
    'a3.confirm': 0, // 已确认。
    'a3.hesitation': 0, // 你的犹豫，已经替你回答了这个问题。
    'a3.stop': 0, // 自主决策权申请已终止。
    'a.thanks': 1, // 感谢你的信任。
    'a.next': 1, // 你的下一项重大人生决定将在四年后执行。
    'a.reassure': 1, // 不过，请放心。
    'a.decided': 1, // 我已经替你决定好了。
    'p12.reset': 0 // 本次评估已结束。
  },
  voiceLeadMin: 300, voiceLeadMax: 1200,
  lineFallback: 3000, pause: 1000, longPause: 5000, luckPause: 1200,
  standbyPromptInterval: 3000, // 初始页语音每次播放结束后的重复间隔
  pageTransitionPause: 1200,
  startupPause: 2000, introDurations: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
  questionPrompt: 10000, questionTimeout: 15000,
  finalPrompt: 30000, finalTimeout: 90000,
  rejectionTimeout: 15000, hesitationTimeout: 5000, hesitationAnswerTimeout: 15000,
  contractLeadPause: 1500,
  resetTimeout: 30000, mediaLoadTimeout: 10000, mediaStallTimeout: 15000,
  guidanceEnter: 2400, guidanceClose: 2400, guidanceLock: 10000, guidanceLockFade: 2400,
  sceneFade: 280,
  certificate: { fade: 1800, expand: 2800, border: 1600, section: 1800, sign: 800, light: 1400, stamp: 1600, accept: 15000 },
  p7BlankBeats: 4, // P7 检测页留白拍数，每拍 = pause
  assets: { voice: {}, sfx: {}, bgm: {}, video: {} }
};
// dialogue.js 列出每句默认 MP3 文件名，放入对应目录、重启即可自动识别。
// 自定义文件名示例：GAME_CONFIG.assets.voice['p1.detect'] = '../assets/voice/evaluation/my-detect.mp3';
