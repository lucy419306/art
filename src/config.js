// 毫秒。具体批注优先；没有标时的对白至少显示 3 秒，长句确保逐字显示完毕。
window.GAME_CONFIG = {
  speed: 1, typeMs: 48, lineFallback: 3000, pause: 1000, longPause: 5000,
  startupPause: 2000, introDurations: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
  questionPrompt: 10000, questionTimeout: 15000,
  finalPrompt: 30000, finalTimeout: 90000,
  rejectionTimeout: 10000, hesitationTimeout: 5000, hesitationAnswerTimeout: 15000,
  resetTimeout: 90000, mediaLoadTimeout: 10000, mediaStallTimeout: 15000,
  certificate: { fade: 1800, border: 2200, section: 1800, sign: 1000, light: 1400, stamp: 1600 },
  assets: { voice: {}, sfx: {}, bgm: {}, video: {} }
};
// dialogue.js 列出每句默认 MP3 文件名，放入对应目录、重启即可自动识别。
// 自定义文件名示例：GAME_CONFIG.assets.voice['p1.detect'] = '../assets/voice/evaluation/my-detect.mp3';
