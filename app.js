const DEFAULT_KANJI = [
  ['楽器', null],
  ['倉庫', null],
  ['巣', null],
  ['覚ます', null],
  ['働く', null],
  ['失礼', null],
  ['包まれる', null],
  ['例えば', null],
  ['名案', null],
  ['続ける', null],

  ['変化', null],
  ['伝わる', null],
  ['借りる', null],
  ['直ちに', null],
  ['求める', null],
  ['記録', null],
  ['自ら', null],
  ['努力', null],
  ['自然', null],
  ['分類', null],

  ['方法', null],
  ['別', null],
  ['参加', null],
  ['芽', null],
  ['司書', null],
  ['辞典', null],
  ['成り立ち', null],
  ['説明', null],
  ['連休', null],
  ['筆順', null],

  ['訓読み', null],
  ['三種類', null],
  ['便利', null],
  ['治す', null],
  ['観察', null],
  ['実験', null],
  ['好物', null],
  ['飛び出す', null],
  ['関係', null],
  ['博物館', null],

  ['結果', null],
  ['機会', null],
  ['量', null],
  ['熱湯', null],
  ['清書', null],
  ['漁船', null],
  ['害虫', null],
  ['材料', null],
  ['完成', null],
  ['約束', null],

  ['席', null],
  ['三位', null],
  ['笑う', null],
  ['特上', null],
  ['焼く', null],
  ['競泳', null],
  ['初めて', null],
  ['旗', null],
  ['最も', null],
  ['健康', null],

  ['上達', null],
  ['成功', null],
  ['失敗', null],
  ['失望', null],
  ['共感', null],
  ['英語', null],
  ['結末', null],
  ['愛する', null],
  ['悪天候', null],
  ['折る', null],

  ['目的', null],
  ['必要', null],
  ['印刷', null],
  ['選ぶ', null],
  ['舎', null],
  ['覚える', null],
  ['失う', null],
  ['包そう紙', null],
  ['例', null],
  ['持続', null],

  ['伝記', null],
  ['借用', null],
  ['直ちに', null],
  ['追求', null],
  ['努める', null],
  ['類まれ', null],
  ['参る', null],
  ['発芽', null],
  ['説く', null],
  ['連なる', null],

  ['便り', null],
  ['好み', null],
  ['明朝', null],
  ['半ば', null],
  ['絵画', null],
  ['色紙', null],
  ['広大', null],
  ['的', null],
  ['必ず', null],
  ['選手', null]
];

const STORAGE_KEY = 'kanji-checker-list-v1';
const WEAK_KEY = 'kanji-checker-weak-v1';

const $ = (id) => document.getElementById(id);
const drawCanvas = $('drawCanvas');
const guideCanvas = $('guideCanvas');
const dctx = drawCanvas.getContext('2d', { willReadFrequently: true });
const gctx = guideCanvas.getContext('2d', { willReadFrequently: true });

let kanjiList = loadKanjiList();
let weakMap = JSON.parse(localStorage.getItem(WEAK_KEY) || '{}');
let current = 0;
let strokes = [];
let activeStroke = null;
let pointerId = null;

function loadKanjiList() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_KANJI.map(([char, strokes]) => ({ char, strokes }));

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (_) {}

  return DEFAULT_KANJI.map(([char, strokes]) => ({ char, strokes }));
}

function saveKanjiList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kanjiList));
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
  return kanjiList[current] || kanjiList[0];
}

function renderProblem() {
  const item = currentItem();

  $('currentKanji').textContent = item.char;
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

  gctx.save();
  gctx.fillStyle = 'rgba(184, 95, 77, 0.025)';
  gctx.textAlign = 'center';
  gctx.textBaseline = 'middle';

  const textLength = Array.from(currentItem().char).length;
  const fontScale =
    textLength <= 1 ? 0.74 :
    textLength === 2 ? 0.42 :
    textLength === 3 ? 0.31 :
    0.24;

  const fontSize = Math.round(w * fontScale);

  gctx.font = `${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  gctx.fillText(currentItem().char, w / 2, h / 2 + w * 0.03);

  gctx.restore();
}

function redrawAll() {
  resizeCanvasForDPR(drawCanvas);

  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  dctx.lineCap = 'round';
  dctx.lineJoin = 'round';
  dctx.strokeStyle = '#222';
  dctx.lineWidth = Math.max(7, drawCanvas.width * 0.018);

  for (const stroke of strokes) drawStroke(stroke);
  if (activeStroke) drawStroke(activeStroke);
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

  if (activeStroke.length > 1) strokes.push(activeStroke);

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

  const dData = drawCanvasMask.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const tData = templateCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;

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

  const status = total >= (strict ? 82 : 78) ? 'good' : total >= (strict ? 62 : 58) ? 'warn' : 'bad';

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

function renderWeakList() {
  const entries = Object.entries(weakMap).sort((a, b) => b[1] - a[1]);

  $('weakList').innerHTML = entries.length
    ? entries.map(([char, count]) => `<span class="weak-chip">${escapeHtml(char)} ${count}</span>`).join('')
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
  $('kanjiInput').value = kanjiList.map(k => `${k.char}${k.strokes ? ',' + k.strokes : ''}`).join('\n');
  $('settingsDialog').showModal();
});

$('saveListBtn').addEventListener('click', () => {
  const rows = $('kanjiInput').value.split('\n').map(line => line.trim()).filter(Boolean);

  const parsed = rows.map(line => {
    const [charPart, strokePart] = line.split(',').map(s => s.trim());
    const char = charPart || '';
    const strokesNum = Number(strokePart);

    return char
      ? { char, strokes: Number.isFinite(strokesNum) && strokesNum > 0 ? strokesNum : null }
      : null;
  }).filter(Boolean);

  if (!parsed.length) {
    alert('漢字を1つ以上入力してください。');
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
  kanjiList = DEFAULT_KANJI.map(([char, strokes]) => ({ char, strokes }));
  saveKanjiList();

  $('kanjiInput').value = kanjiList.map(k => `${k.char}${k.strokes ? ',' + k.strokes : ''}`).join('\n');
});

window.addEventListener('resize', setupCanvases);

setupCanvases();
renderProblem();
renderWeakList();
