const DEFAULT_KANJI = [
  ['がっき', '楽器', null],
  ['そうこ', '倉庫', null],
  ['す', '巣', null],
  ['さます', '覚ます', null],
  ['はたらく', '働く', null],
  ['しつれい', '失礼', null],
  ['つつまれる', '包まれる', null],
  ['たとえば', '例えば', null],
  ['めいあん', '名案', null],
  ['つづける', '続ける', null],

  ['へんか', '変化', null],
  ['つたわる', '伝わる', null],
  ['かりる', '借りる', null],
  ['ただちに', '直ちに', null],
  ['もとめる', '求める', null],
  ['きろく', '記録', null],
  ['みずから', '自ら', null],
  ['どりょく', '努力', null],
  ['しぜん', '自然', null],
  ['ぶんるい', '分類', null],

  ['ほうほう', '方法', null],
  ['べつ', '別', null],
  ['さんか', '参加', null],
  ['め', '芽', null],
  ['ししょ', '司書', null],
  ['じてん', '辞典', null],
  ['なりたち', '成り立ち', null],
  ['せつめい', '説明', null],
  ['れんきゅう', '連休', null],
  ['ひつじゅん', '筆順', null],

  ['くんよみ', '訓読み', null],
  ['さんしゅるい', '三種類', null],
  ['べんり', '便利', null],
  ['なおす', '治す', null],
  ['かんさつ', '観察', null],
  ['じっけん', '実験', null],
  ['こうぶつ', '好物', null],
  ['とびだす', '飛び出す', null],
  ['かんけい', '関係', null],
  ['はくぶつかん', '博物館', null],

  ['けっか', '結果', null],
  ['きかい', '機会', null],
  ['りょう', '量', null],
  ['ねっとう', '熱湯', null],
  ['せいしょ', '清書', null],
  ['ぎょせん', '漁船', null],
  ['がいちゅう', '害虫', null],
  ['ざいりょう', '材料', null],
  ['かんせい', '完成', null],
  ['やくそく', '約束', null],

  ['せき', '席', null],
  ['さんい', '三位', null],
  ['わらう', '笑う', null],
  ['とくじょう', '特上', null],
  ['やく', '焼く', null],
  ['きょうえい', '競泳', null],
  ['はじめて', '初めて', null],
  ['はた', '旗', null],
  ['もっとも', '最も', null],
  ['けんこう', '健康', null],

  ['じょうたつ', '上達', null],
  ['せいこう', '成功', null],
  ['しっぱい', '失敗', null],
  ['しつぼう', '失望', null],
  ['きょうかん', '共感', null],
  ['えいご', '英語', null],
  ['けつまつ', '結末', null],
  ['あいする', '愛する', null],
  ['あくてんこう', '悪天候', null],
  ['おる', '折る', null],

  ['もくてき', '目的', null],
  ['ひつよう', '必要', null],
  ['いんさつ', '印刷', null],
  ['えらぶ', '選ぶ', null],
  ['しゃ', '舎', null],
  ['おぼえる', '覚える', null],
  ['うしなう', '失う', null],
  ['ほうそうし', '包そう紙', null],
  ['れい', '例', null],
  ['じぞく', '持続', null],

  ['でんき', '伝記', null],
  ['しゃくよう', '借用', null],
  ['ただちに', '直ちに', null],
  ['ついきゅう', '追求', null],
  ['つとめる', '努める', null],
  ['たぐいまれ', '類まれ', null],
  ['まいる', '参る', null],
  ['はつが', '発芽', null],
  ['とく', '説く', null],
  ['つらなる', '連なる', null],

  ['たより', '便り', null],
  ['このみ', '好み', null],
  ['みょうちょう', '明朝', null],
  ['なかば', '半ば', null],
  ['かいが', '絵画', null],
  ['しきし', '色紙', null],
  ['こうだい', '広大', null],
  ['まと', '的', null],
  ['かならず', '必ず', null],
  ['せんしゅ', '選手', null]
];

const STORAGE_KEY = 'kanji-checker-list-v2';
const WEAK_KEY = 'kanji-checker-weak-v2';

const $ = (id) => document.getElementById(id);

const drawCanvas = $('drawCanvas');
const guideCanvas = $('guideCanvas');

const dctx = drawCanvas.getContext('2d', { willReadFrequently: true });
const gctx = guideCanvas.getContext('2d', { willReadFrequently: true });

let kanjiList = loadKanjiList();
let weakMap = loadWeakMap();
let current = 0;
let strokes = [];
let activeStroke = null;
let pointerId = null;

function normalizeItem(item) {
  if (Array.isArray(item)) {
    if (item.length >= 3) {
      return {
        question: item[0] || item[1] || '',
        char: item[1] || item[0] || '',
        strokes: Number.isFinite(Number(item[2])) && Number(item[2]) > 0 ? Number(item[2]) : null
      };
    }

    return {
      question: item[0] || '',
      char: item[0] || '',
      strokes: Number.isFinite(Number(item[1])) && Number(item[1]) > 0 ? Number(item[1]) : null
    };
  }

  return {
    question: item.question || item.char || '',
    char: item.char || item.question || '',
    strokes: Number.isFinite(Number(item.strokes)) && Number(item.strokes) > 0 ? Number(item.strokes) : null
  };
}

function loadKanjiList() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return DEFAULT_KANJI.map(normalizeItem);
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(normalizeItem).filter(item => item.char);
    }
  } catch (_) {}

  return DEFAULT_KANJI.map(normalizeItem);
}

function saveKanjiList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kanjiList));
}

function loadWeakMap() {
  try {
    return JSON.parse(localStorage.getItem(WEAK_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function resizeCanvasForDPR(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function setupCanvases() {
  resizeCanvasForDPR(drawCanvas);
  resizeCanvasForDPR(guideCanvas);
  redrawAll();
  drawGuide();
}

function currentItem() {
  return kanjiList[current] || kanjiList[0] || normalizeItem(DEFAULT_KANJI[0]);
}

function renderProblem() {
  const item = currentItem();

  $('currentKanji').textContent = item.question || item.char;
  $('currentIndex').textContent = `${current + 1} / ${kanjiList.length}`;
  $('expectedStrokes').textContent = item.strokes ? `目安画数：${item.strokes}` : '目安画数：未設定';

  drawGuide();
  resetResult();
}

function resetResult() {
  $('resultBadge').className = 'result-badge pending';
  $('resultBadge').textContent = 'まだ判定していません';
  $('scoreText').textContent = '書いたあと「判定する」を押してください。';
  $('feedbackList').innerHTML = '';
  renderWeakList();
}

function drawGuide() {
  resizeCanvasForDPR(guideCanvas);

  const w = guideCanvas.width;
  const h = guideCanvas.height;

  gctx.clearRect(0, 0, w, h);

  if (!$('showGuide').checked) return;

  const item = currentItem();

  gctx.save();
  gctx.fillStyle = 'rgba(184, 95, 77, 0.025)';
  gctx.textAlign = 'center';
  gctx.textBaseline = 'middle';

  const textLength = Array.from(item.char).length;
  const fontScale =
    textLength <= 1 ? 0.74 :
    textLength === 2 ? 0.42 :
    textLength === 3 ? 0.31 :
    0.24;

  const fontSize = Math.round(w * fontScale);

  gctx.font = `${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  gctx.fillText(item.char, w / 2, h / 2 + w * 0.03);

  gctx.restore();
}

function redrawAll() {
  resizeCanvasForDPR(drawCanvas);

  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  dctx.lineCap = 'round';
  dctx.lineJoin = 'round';
  dctx.strokeStyle = '#222';
  dctx.lineWidth = Math.max(7, drawCanvas.width * 0.018);

  for (const stroke of strokes) {
    drawStroke(stroke);
  }

  if (activeStroke) {
    drawStroke(activeStroke);
  }
}

function drawStroke(stroke) {
  if (!stroke || stroke.length < 2) return;

  dctx.beginPath();
  dctx.moveTo(stroke[0].x, stroke[0].y);

  for (let i = 1; i < stroke.length; i++) {
    dctx.lineTo(stroke[i].x, stroke[i].y);
  }

  dctx.stroke();
}

function canvasPoint(event) {
  const rect = drawCanvas.getBoundingClientRect();
  const sx = drawCanvas.width / rect.width;
  const sy = drawCanvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * sx,
    y: (event.clientY - rect.top) * sy,
    t: performance.now(),
    pressure: event.pressure || 0.5
  };
}

drawCanvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();

  pointerId = event.pointerId;
  drawCanvas.setPointerCapture(pointerId);
  activeStroke = [canvasPoint(event)];
});

drawCanvas.addEventListener('pointermove', (event) => {
  if (event.pointerId !== pointerId || !activeStroke) return;

  event.preventDefault();

  const p = canvasPoint(event);
  const last = activeStroke[activeStroke.length - 1];
  const dist = Math.hypot(p.x - last.x, p.y - last.y);

  if (dist > 2) {
    activeStroke.push(p);
    redrawAll();
  }
});

function endStroke(event) {
  if (event.pointerId !== pointerId || !activeStroke) return;

  if (activeStroke.length > 1) {
    strokes.push(activeStroke);
  }

  activeStroke = null;
  pointerId = null;

  redrawAll();
}

drawCanvas.addEventListener('pointerup', endStroke);
drawCanvas.addEventListener('pointercancel', endStroke);

function getBoundsFromImage(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (alpha > 20 && (r < 245 || g < 245 || b < 245)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        count++;
      }
    }
  }

  if (!count) return null;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    count
  };
}

function drawTemplateMask(char, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textLength = Array.from(char).length;
  const fontScale =
    textLength <= 1 ? 0.74 :
    textLength === 2 ? 0.42 :
    textLength === 3 ? 0.31 :
    0.24;

  ctx.font = `${Math.round(width * fontScale)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  ctx.fillText(char, width / 2, height / 2 + width * 0.03);

  return canvas;
}

function getDrawMask(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(7, width * 0.018);

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;

    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);

    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }

    ctx.stroke();
  }

  return canvas;
}

function overlapScore(drawCanvasMask, templateCanvas) {
  const w = drawCanvasMask.width;
  const h = drawCanvasMask.height;

  const dData = drawCanvasMask
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, w, h).data;

  const tData = templateCanvas
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, w, h).data;

  let intersection = 0;
  let union = 0;

  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      const d = dData[i] < 100;
      const t = tData[i] < 140;

      if (d && t) intersection++;
      if (d || t) union++;
    }
  }

  if (!union) return 0;

  return intersection / union;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function judge() {
  const item = currentItem();

  if (!strokes.length) {
    showResult(0, ['まだ何も書かれていません。'], 'bad');
    return;
  }

  const w = drawCanvas.width;
  const h = drawCanvas.height;

  const drawMask = getDrawMask(w, h);
  const templateMask = drawTemplateMask(item.char, w, h);

  const drawCtx = drawMask.getContext('2d', { willReadFrequently: true });
  const templateCtx = templateMask.getContext('2d', { willReadFrequently: true });

  const db = getBoundsFromImage(drawCtx, w, h);
  const tb = getBoundsFromImage(templateCtx, w, h);

  if (!db || !tb) {
    showResult(0, ['判定に必要な線が足りません。'], 'bad');
    return;
  }

  const strict = $('strictMode').checked;
  const drawnStrokes = strokes.length;
  const expected = item.strokes;

  let strokeScore = 20;

  if (expected) {
    const diff = Math.abs(drawnStrokes - expected);
    strokeScore = diff === 0 ? 20 : diff === 1 ? 13 : diff === 2 ? 7 : 0;
  }

  const cx = (db.minX + db.maxX) / 2;
  const cy = (db.minY + db.maxY) / 2;
  const centerDiff = Math.hypot(cx - w / 2, cy - h / 2) / w;
  const centerScore = clamp(20 - centerDiff * (strict ? 90 : 75), 0, 20);

  const sizeRatio = Math.min(db.width / tb.width, db.height / tb.height);
  const sizePenalty = Math.abs(1 - sizeRatio);
  const sizeScore = clamp(20 - sizePenalty * (strict ? 55 : 45), 0, 20);

  const margin = w * 0.04;
  const inside = db.minX > margin && db.minY > margin && db.maxX < w - margin && db.maxY < h - margin;
  const insideScore = inside ? 15 : 7;

  const ov = overlapScore(drawMask, templateMask);
  const shapeScore = clamp((ov - 0.05) * (strict ? 95 : 85), 0, 25);

  const total = Math.round(strokeScore + centerScore + sizeScore + insideScore + shapeScore);

  const feedback = [];

  if (expected && drawnStrokes !== expected) {
    feedback.push(`画数の目安は${expected}画です。今は${drawnStrokes}画として記録されています。`);
  } else if (expected) {
    feedback.push('画数は目安どおりです。');
  }

  if (centerDiff > 0.12) {
    feedback.push('字の中心が少しずれています。マスの真ん中を意識するとよさそうです。');
  } else {
    feedback.push('中心位置はよく収まっています。');
  }

  if (sizeRatio < 0.78) {
    feedback.push('字が少し小さめです。もう少し大きく書くと見やすいです。');
  } else if (sizeRatio > 1.2) {
    feedback.push('字が少し大きめです。マスからはみ出さない大きさにしましょう。');
  } else {
    feedback.push('字の大きさはちょうどよい範囲です。');
  }

  if (!inside) {
    feedback.push('線がマスの端に近いです。少し内側に収めると安定します。');
  }

  if (ov < (strict ? 0.16 : 0.12)) {
    feedback.push('お手本との重なりが少なめです。部品の位置を見直しましょう。');
  }

  const status =
    total >= (strict ? 82 : 78) ? 'good' :
    total >= (strict ? 62 : 58) ? 'warn' :
    'bad';

  showResult(total, feedback, status);

  if (status !== 'good') {
    weakMap[item.char] = (weakMap[item.char] || 0) + 1;
  } else {
    delete weakMap[item.char];
  }

  localStorage.setItem(WEAK_KEY, JSON.stringify(weakMap));
  renderWeakList();
}

function showResult(score, feedback, status) {
  const badge = $('resultBadge');

  badge.className = `result-badge ${status}`;
  badge.textContent =
    status === 'good' ? 'よく書けています' :
    status === 'warn' ? '惜しい' :
    'もう一度';

  $('scoreText').textContent = `${score}点 / 100点`;
  $('feedbackList').innerHTML = feedback.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function weakLabel(key) {
  const found = kanjiList.find(item => item.char === key);
  return found ? found.question || key : key;
}

function renderWeakList() {
  const entries = Object.entries(weakMap).sort((a, b) => b[1] - a[1]);

  $('weakList').innerHTML = entries.length
    ? entries.map(([char, count]) => `<span class="weak-chip">${escapeHtml(weakLabel(char))} ${count}</span>`).join('')
    : 'まだありません';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[s]));
}

function clearWriting() {
  strokes = [];
  activeStroke = null;

  redrawAll();
  resetResult();
}

function gotoIndex(index) {
  current = (index + kanjiList.length) % kanjiList.length;

  clearWriting();
  renderProblem();
}

$('prevBtn').addEventListener('click', () => gotoIndex(current - 1));
$('nextBtn').addEventListener('click', () => gotoIndex(current + 1));
$('randomBtn').addEventListener('click', () => gotoIndex(Math.floor(Math.random() * kanjiList.length)));

$('clearBtn').addEventListener('click', clearWriting);

$('undoBtn').addEventListener('click', () => {
  strokes.pop();
  redrawAll();
  resetResult();
});

$('judgeBtn').addEventListener('click', judge);
$('showGuide').addEventListener('change', drawGuide);
$('strictMode').addEventListener('change', resetResult);

$('settingsBtn').addEventListener('click', () => {
  $('kanjiInput').value = kanjiList
    .map(k => `${k.question || k.char},${k.char}${k.strokes ? ',' + k.strokes : ''}`)
    .join('\n');

  $('settingsDialog').showModal();
});

$('saveListBtn').addEventListener('click', () => {
  const rows = $('kanjiInput').value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const parsed = rows.map(line => {
    const parts = line.split(',').map(s => s.trim());

    const question = parts[0] || '';
    const char = parts[1] || parts[0] || '';
    const strokesNum = Number(parts[2]);

    return char
      ? {
          question,
          char,
          strokes: Number.isFinite(strokesNum) && strokesNum > 0 ? strokesNum : null
        }
      : null;
  }).filter(Boolean);

  if (!parsed.length) {
    alert('出題を1つ以上入力してください。');
    return;
  }

  kanjiList = parsed;
  current = 0;

  saveKanjiList();
  $('settingsDialog').close();

  clearWriting();
  renderProblem();
});

$('resetListBtn').addEventListener('click', () => {
  kanjiList = DEFAULT_KANJI.map(normalizeItem);
  weakMap = {};

  saveKanjiList();
  localStorage.setItem(WEAK_KEY, JSON.stringify(weakMap));

  $('kanjiInput').value = kanjiList
    .map(k => `${k.question || k.char},${k.char}${k.strokes ? ',' + k.strokes : ''}`)
    .join('\n');

  current = 0;
  clearWriting();
  renderProblem();
});

window.addEventListener('resize', setupCanvases);

$('showGuide').checked = false;

setupCanvases();
renderProblem();
renderWeakList();
