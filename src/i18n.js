/* English display text only. Audio IDs, files, volume and timing stay shared. */
(function (root) {
  const enabled = new URLSearchParams(root.location.search).get('lang') === 'en';
  const lines = {
    'p0.prompt': 'Please take a seat. Press any button to begin.',
    'p1.detect': 'Applicant detected.',
    'p2.card1': 'The year is 2078.',
    'p2.card2': 'You no longer need to decide how to live.',
    'p2.card3': 'At first, AI only calculated risks. Then it assigned jobs, homes, and partners.',
    'p2.card4': 'It was rarely wrong. So humanity signed away the right to choose.',
    'p2.card5': 'From then on, you no longer had to hesitate or bear the cost of a wrong choice.',
    'p2.card6': 'Making your own decisions became a privilege you had to apply for.',
    'p2.card7': 'Welcome to the Human Autonomy Restoration Center.',
    'p2.welcome': 'Hello, User 6431. Your application to restore autonomy has been approved for testing.',
    'p3.count': 'Over eighteen years, the system made 11,204 decisions for you.',
    'p3.perfect': 'It was never wrong.',
    'p4.meaning': 'Three simulated decisions will assess your ability to choose for yourself: how to live, whom to love, and how to face a memory that cannot be erased.',
    'p4.simulations': 'The test begins now.',
    'p4.record': 'There are no correct answers.',
    'P5.intro': 'First question: work. Money or passion?',
    'P5.choose': 'Press white for the white option, or yellow for the yellow option. Please choose.',
    'P5.left': 'Recorded. This choice is expected to improve long-term life stability by 17.4%.',
    'P5.right': 'Recorded. Historical data puts the chance of long-term regret at 63%.',
    'P6.intro': 'Second question: marriage. Security or love?',
    'P6.choose': 'Please choose.',
    'P6.record': 'Recorded.',
    'P7.intro': 'Third question: memory.',
    'P7.choose': 'Press white to erase the memory, or yellow to keep it. Please choose.',
    'P7.record': 'Recorded.',
    'P7.right': 'This memory will return more often over the next twelve months.',
    'c.confirm': 'Confirmed.',
    'c.restored': 'Autonomy restoration approved.',
    'c.ask': 'One final question. Do you still want your autonomy restored?',
    'P9C.prompt': 'The system is waiting for confirmation.',
    'c.timeout': 'No confirmation received. The system will maintain the current state.',
    'c.final': 'Final confirmation complete.',
    'c.handover': 'Transferring decision-making authority now.',
    'c.complete': 'Transfer complete.',
    'c.yours': 'From now on, your life is yours to decide.',
    'c.luck': 'Good luck.',
    'a2.confirm': 'Confirmed.',
    'a2.stop': 'Restoration process terminated.',
    'r.sorry': 'I am sorry.',
    'r.unfit': 'You are currently unfit to regain decision-making authority.',
    'r.common': 'This is common. 98.6% of applicants receive the same result.',
    'r.reject': 'The system will deny your application for decision-making authority.',
    'r.override': 'If you insist on reclaiming it, press the red button.',
    'r.noRequest': 'No forced-reclamation request received.',
    'r.maintain': 'The system will uphold the denial.',
    'b.detect': 'Forced-reclamation request detected.',
    'b.risk': 'Restoring autonomy will significantly increase the risks in your life.',
    'b.accept': 'If you accept, press any button.',
    'b.term1': 'You may choose the wrong person.',
    'b.term2': 'You may miss a better opportunity.',
    'b.term3': 'You may regret it.',
    'b.hesitate': 'The system has detected your hesitation.',
    'b.want': 'Do you still want the right to make your own decisions?',
    'b.continue': 'Please continue.',
    'b.promise': 'I cannot promise you a better life.',
    'b.confirm': 'Confirmed.',
    'b.luck': 'Good luck.',
    'a3.noAnswer': 'No response received.',
    'a3.confirm': 'Confirmed.',
    'a3.hesitation': 'Your hesitation has answered for you.',
    'a3.stop': 'Application for decision-making authority terminated.',
    'a.thanks': 'Thank you for your trust.',
    'a.next': 'Your next major life decision will be carried out in four years.',
    'a.reassure': 'But do not worry.',
    'a.decided': 'I have already made the decision for you.',
    'p12.reset': 'This assessment has ended.'
  };
  for (const id of ['P5', 'P6', 'P7']) {
    lines[id + '.prompt'] = 'The system is waiting.';
    lines[id + '.auto'] = 'No choice received. The system will select the yellow option by default.';
  }
  for (const id of ['b', 'c']) {
    lines[id + '.errors'] = 'The system will no longer shield you from every mistake.';
    lines[id + '.pain'] = 'The system will no longer erase all your pain.';
    lines[id + '.optimal'] = 'The system will no longer guarantee the best possible life.';
  }
  const ui = {
    '最后一次选择': 'Human Autonomy Restoration Center',
    '人类自主权恢复中心': 'Human Autonomy Restoration Center',
    '评估室 07': 'Assessment Room 07',
    '自主决策能力评估 / 07': 'AUTONOMY ASSESSMENT / 07',
    '按任意按钮开始': 'PRESS ANY BUTTON TO BEGIN',
    '请先就座': 'Please take a seat',
    '请佩戴耳机': 'Please wear headphones',
    '恢复自主权前，须完成三项决策模拟': 'Complete three decision simulations to restore autonomy',
    '工作　 /　 爱情　 /　 记忆': 'WORK / LOVE / MEMORY',
    '正在评估自主决策能力': 'Assessing independent decision-making ability',
    '过去 18 年，系统已代替你完成：': 'Over the past 18 years, the system has made:',
    '教育路径选择': 'Education decisions',
    '职业选择': 'Career decisions',
    '居住地选择': 'Housing decisions',
    '健康决策': 'Health decisions',
    '社交关系优化': 'Social relationship decisions',
    '伴侣匹配': 'Partner matches',
    '消费选择': 'Spending decisions',
    '累计替代决策：11,204 次': 'Total decisions made for you: 11,204',
    '工作': 'Work', '婚姻': 'Marriage', '记忆': 'Memory',
    '白键': 'White button', '黄键': 'Yellow button', '红键': 'Red button',
    '请选择': 'Please choose',
    '第一题：工作': 'Question 1: Work',
    '第二题：婚姻': 'Question 2: Marriage',
    '第三题：记忆': 'Question 3: Memory',
    '不喜欢的工作': 'A job you dislike',
    '收入较高': 'Higher income',
    '成功概率 94%': '94% chance of success',
    '真正喜欢的工作': 'A job you truly love',
    '收入较低': 'Lower income',
    '成功概率 31%': '31% chance of success',
    '婚姻匹配度 91%': '91% compatibility',
    '预计持续 70 年': 'Expected to last 70 years',
    '婚姻匹配度 52%': '52% compatibility',
    '预计持续 4 年': 'Expected to last 4 years',
    '但你爱这个人': 'But you love this person',
    '删除痛苦记忆': 'Erase the painful memory',
    '预计使未来情绪稳定度提升 22%': 'Expected to improve emotional stability by 22%',
    '保留痛苦记忆': 'Keep the painful memory',
    '系统检测到一段高痛苦记忆。': 'A highly painful memory has been detected.',
    '已记录': 'Recorded',
    '自主权已恢复': 'Autonomy restored',
    '未来结果：无法预测': 'Future outcome: unpredictable',
    '批准恢复自主权': 'Autonomy restoration approved',
    '最后一次确认：是否仍要恢复自主权？': 'Final confirmation: do you still want your autonomy restored?',
    '放弃': 'Give up', '恢复': 'Restore',
    '申请已驳回': 'Application denied',
    '自主决策风险': 'Decision-making risk',
    '高': 'High', '低': 'Low',
    '后悔耐受度': 'Tolerance for regret',
    '情绪波动': 'Emotional volatility',
    '决策效率': 'Decision efficiency',
    '若想强制拥有决策权': 'To reclaim decision-making authority',
    '可按下红键': 'press the red button',
    '请做出抉择': 'Make your choice',
    '如仍要恢复自主权，请确认你接受以下全部后果：': 'To regain autonomy, confirm that you accept all of the following consequences:',
    '你可能会选择错误的人。在一段没有结果的关系里，交出你最好的几年。': 'You may choose the wrong person and spend your best years in a relationship that goes nowhere.',
    '你可能会错过更好的机会，陷入贫困。': 'You may miss a better opportunity and fall into poverty.',
    '你可能会后悔，那些痛苦的记忆将会在深夜反复出现。': 'You may regret it. Painful memories may return night after night.',
    '检测到强制收回请求。': 'Forced-reclamation request detected.',
    '系统检测到您的犹豫。': 'The system has detected your hesitation.',
    '是否还想要拥有自主决策权？': 'Do you still want the right to make your own decisions?',
    '否 · 放弃': 'No · Give up', '是 · 继续': 'Yes · Continue',
    '自主决策权申请：已终止': 'Application for decision-making authority: terminated',
    '人生指导系统：运行中': 'Life Guidance System: Active',
    '人生指导系统': 'Life Guidance System',
    '运行中': 'Active',
    '四年后 · 工作：辞去现在的工作，转入系统为你保留的岗位（长期稳定度预计提升 17.4%）。': 'In four years · Work: Leave your current job for a position reserved by the system (expected long-term stability: +17.4%).',
    '六年后 · 婚姻：对象由系统配定（匹配度 98.6%）。你将在婚礼前三个月第一次见到对方。': 'In six years · Marriage: The system will choose your partner (98.6% compatibility). You will first meet three months before the wedding.',
    '十一年后 · 记忆：进行一次记忆清理。内容你不需要知道。': 'In eleven years · Memory: One memory will be erased. You do not need to know which one.',
    '自主决策权强制收回确认书': 'Confirmation of Forced Reclamation of Decision-Making Authority',
    '自主决策权交接证书': 'Certificate of Transfer of Decision-Making Authority',
    '兹确认': 'This certifies that',
    '申请人：用户6431': 'Applicant: User 6431',
    '评估结论为不适合恢复自主决策权。': 'The applicant was found unfit to regain decision-making authority.',
    '申请人已提出强制收回请求，': 'The applicant requested forced reclamation',
    '并确认接受全部后果。': 'and accepts all consequences.',
    '已完成全部自主决策能力评估，': 'The applicant completed the autonomy assessment',
    '并通过工作、爱情与记忆三项决策模拟。': 'and passed the work, love, and memory simulations.',
    '自本文件生效之时起，': 'From the effective date of this document,',
    '自本证书生效之时起，': 'From the effective date of this certificate,',
    '关于其工作、亲密关系、记忆，': 'decisions concerning work, relationships, memory,',
    '以及一切尚未发生的人生选择，': 'and all future life choices',
    '由本人强制收回。': 'are reclaimed by the applicant.',
    '正式交还本人。': 'are formally returned to the applicant.',
    '选择的权利，由本人持有。': 'The applicant holds the right to choose.',
    '选择的后果，由本人承担。': 'The applicant bears the consequences.',
    '系统不再代为决定，亦不保证更优人生。': 'The system will no longer decide for the applicant or guarantee a better life.',
    '未经本人授权，任何系统不得代为决定。': 'No system may decide on the applicant’s behalf without consent.',
    '记录方：人类自主权恢复中心': 'Recorded by: Human Autonomy Restoration Center',
    '收回方：用户6431': 'Reclaimed by: User 6431',
    '文件状态：': 'Document status: ',
    '交付方：人类自主权恢复中心': 'Issued by: Human Autonomy Restoration Center',
    '接收方：用户6431': 'Received by: User 6431',
    '证书状态：': 'Certificate status: ',
    '等待接收': 'Awaiting acceptance',
    '按任意键接受证书': 'Press any button to accept the certificate',
    '本人接收': 'Accepted by applicant',
    '自主决策权': 'Decision-making authority',
    '已收回': 'Reclaimed', '已交接': 'Transferred',
    '收回完成': 'Reclamation complete',
    '交接完成': 'Transfer complete',
    '运行异常，请按数字键 1 复位。': 'An error occurred. Press 1 to reset.'
  };
  function translate(value) { return enabled ? (ui[value] ?? value) : value; }
  function translateTree(node) {
    if (!enabled || !node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentElement?.closest('.char')) return;
      const value = node.nodeValue;
      const match = value.match(/^(\s*)(.*?)(\s*)$/s);
      if (match && ui[match[2]]) node.nodeValue = match[1] + ui[match[2]] + match[3];
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttribute('aria-label')) {
        const label = node.getAttribute('aria-label');
        node.setAttribute('aria-label', translate(label).replace('白键可用', 'White button available').replace('黄键可用', 'Yellow button available').replace('红键可用', 'Red button available').replace('白键不可用', 'White button unavailable').replace('黄键不可用', 'Yellow button unavailable').replace('红键不可用', 'Red button unavailable'));
      }
      for (const child of node.childNodes) translateTree(child);
    }
  }
  if (enabled) {
    root.document.documentElement.lang = 'en';
    root.document.title = 'Human Autonomy Restoration Center';
    translateTree(root.document.body);
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) translateTree(node);
    }).observe(root.document.body, { childList: true, subtree: true });
  }
  root.GameI18n = { enabled, line: (id, original) => enabled ? (lines[id] ?? original) : original, ui: translate, lines, uiMap: ui };
})(window);
