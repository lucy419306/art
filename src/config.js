// 毫秒。具体批注优先；没有标时的对白至少显示 3 秒，长句确保逐字显示完毕。
window.GAME_CONFIG = {
  speed: 1, typeMs: 48, lineFallback: 3000, pause: 1000, longPause: 5000,
  startupPause: 2000, introDurations: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
  questionPrompt: 10000, questionTimeout: 15000,
  finalPrompt: 30000, finalTimeout: 90000,
  rejectionTimeout: 15000, hesitationTimeout: 5000, hesitationAnswerTimeout: 15000,
  resetTimeout: 30000, mediaLoadTimeout: 10000, mediaStallTimeout: 15000,
  guidanceEnter: 2400, guidanceClose: 2400,
  certificate: { fade: 1800, expand: 2800, border: 1600, section: 1800, sign: 800, light: 1400, stamp: 1600, accept: 15000 },
  // P7 留白四拍（可调）。fragment 仅 PI 可填；默认空字符串＝干扰段不出字。
  p7Glitch: {
    dip: 300,        // P7_GLITCH_DIP：压黑
    noise: 1200,     // P7_GLITCH_NOISE：干扰
    blank: 400,      // P7_GLITCH_BLANK：纯净留白
    restore: 400,    // P7_GLITCH_RESTORE：回场
    band: 700,       // P7_GLITCH_BAND：干扰带一轮（≥500，默认 0.6–0.8s）
    fragment: '',    // P7_GLITCH_FRAGMENT：残句，仅 PI 提供
    fragmentMs: 700, // P7_GLITCH_FRAGMENT_MS
    sfxVolume: 0.12  // P7_GLITCH_SFX：有 glitch.mp3 时很轻
  },
  assets: { voice: {}, sfx: {}, bgm: {}, video: {} }
};
// dialogue.js 列出每句默认 MP3 文件名，放入对应目录、重启即可自动识别。
// 自定义文件名示例：GAME_CONFIG.assets.voice['p1.detect'] = '../assets/voice/evaluation/my-detect.mp3';
