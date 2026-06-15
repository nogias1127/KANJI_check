const DEFAULT_KANJI = [
  ['一',1],['二',2],['三',3],['四',5],['五',4],['六',4],['七',2],['八',2],['九',2],['十',2],
  ['百',6],['千',3],['日',4],['月',4],['火',4],['水',4],['木',4],['金',8],['土',3],['人',2],
  ['子',3],['女',3],['男',7],['目',5],['口',3],['耳',6],['手',4],['足',7],['力',2],['気',6],
  ['山',3],['川',3],['田',5],['林',8],['森',12],['空',8],['雨',8],['花',7],['草',9],['虫',6],
  ['犬',4],['貝',7],['石',5],['竹',6],['糸',6],['車',7],['町',7],['村',7],['字',6],['文',4],
  ['名',6],['年',6],['先',6],['生',5],['学',8],['校',10],['本',5],['休',6],['見',7],['入',2],
  ['出',5],['立',5],['正',5],['早',6],['夕',3],['赤',7],['青',8],['白',5],['大',3],['小',3],
  ['中',4],['上',3],['下',3],['左',5],['右',5],['円',4],['王',4],['玉',5],['音',9],['名',6],
  ['春',9],['夏',10],['秋',9],['冬',5],['時',10],['分',4],['今',4],['毎',6],['週',11],['曜',18],
  ['書',10],['読',14],['話',13],['聞',14],['計',9],['算',14],['答',12],['作',7],['考',6],['歩',8]
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

function currentItem() { return kanjiList[current] || kanjiList[0]; }

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
  gctx.save();
  gctx.fillStyle = 'rgba(184, 95, 77, 0.12)';
  gctx.textAlign = 'center';
  gctx.textBaseline = 'middle';
  const fontSize = Math.round(w * 0.74);
  gctx.font = `${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  if ($('showGuide').checked) gctx.fillText(currentItem().char, w / 2, h / 2 + w * 0.03);
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
  for (let i = 1; i < stroke.length; i++) dctx.lineTo(stroke[i].x, stroke[i].y);
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
  let minX = width, minY = height, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (alpha > 20 && (r < 245 || g < 245 || b < 245)) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        count++;
      }
    }
  }
  if (!count) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, count };
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
  ctx.font = `${Math.round(width * 0.74)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
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
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
  return canvas;
}

function overlapScore(drawCanvasMask, templateCanvas) {
  const w = drawCanvasMask.width, h = drawCanvasMask.height;
  const dData = drawCanvasMask.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,h).data;
  const tData = templateCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,h).data;
  let intersection = 0, union = 0;
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

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function judge() {
  const item = currentItem();
  if (!strokes.length) {
    showResult(0, ['まだ何も書かれていません。'], 'bad');
    return;
  }

  const w = drawCanvas.width, h = drawCanvas.height;
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

  if (expected && drawnStrokes !== expected) feedback.push(`画数の目安は${expected}画です。今は${drawnStrokes}画として記録されています。`);
  else if (expected) feedback.push('画数は目安どおりです。');

  if (centerDiff > 0.12) feedback.push('字の中心が少しずれています。マスの真ん中を意識するとよさそうです。');
  else feedback.push('中心位置はよく収まっています。');

  if (sizeRatio < 0.78) feedback.push('字が少し小さめです。もう少し大きく書くと見やすいです。');
  else if (sizeRatio > 1.2) feedback.push('字が少し大きめです。マスからはみ出さない大きさにしましょう。');
  else feedback.push('字の大きさはちょうどよい範囲です。');

  if (!inside) feedback.push('線がマスの端に近いです。少し内側に収めると安定します。');
  if (ov < (strict ? 0.16 : 0.12)) feedback.push('お手本との重なりが少なめです。部品の位置を見直しましょう。');

  const status = total >= (strict ? 82 : 78) ? 'good' : total >= (strict ? 62 : 58) ? 'warn' : 'bad';
  showResult(total, feedback, status);

  if (status !== 'good') weakMap[item.char] = (weakMap[item.char] || 0) + 1;
  else delete weakMap[item.char];
  localStorage.setItem(WEAK_KEY, JSON.stringify(weakMap));
  renderWeakList();
}

function showResult(score, feedback, status) {
  const badge = $('resultBadge');
  badge.className = `result-badge ${status}`;
  badge.textContent = status === 'good' ? 'よく書けています' : status === 'warn' ? '惜しい' : 'もう一度';
  $('scoreText').textContent = `${score}点 / 100点`;
  $('feedbackList').innerHTML = feedback.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderWeakList() {
  const entries = Object.entries(weakMap).sort((a,b) => b[1] - a[1]);
  $('weakList').innerHTML = entries.length
    ? entries.map(([char, count]) => `<span class="weak-chip">${escapeHtml(char)} ${count}</span>`).join('')
    : 'まだありません';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));
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
$('undoBtn').addEventListener('click', () => { strokes.pop(); redrawAll(); resetResult(); });
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
    const char = Array.from(charPart || '')[0];
    const strokesNum = Number(strokePart);
    return char ? { char, strokes: Number.isFinite(strokesNum) && strokesNum > 0 ? strokesNum : null } : null;
  }).filter(Boolean);
  if (!parsed.length) return alert('漢字を1つ以上入力してください。');
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
  $('kanjiInput').value = kanjiList.map(k => `${k.char},${k.strokes}`).join('\n');
});

window.addEventListener('resize', setupCanvases);
setupCanvases();
renderProblem();
renderWeakList();
