/**
 * 教立方 — AI 生成教具的系统提示词与用户提示词构建
 */

/* ================================================================
 * Section A: edu-base.css 全文（让 AI 知道所有可用的变量和类）
 * ================================================================ */
const EDU_BASE_CSS = `/* 教立方 EduCube — 教具公共基础样式 */

:root {
  --edu-bg: #fdfbf7;
  --edu-surface: #ffffff;
  --edu-primary: #1a3a5c;
  --edu-accent: #f97316;
  --edu-accent2: #0ea5e9;
  --edu-success: #22c55e;
  --edu-text: #1e293b;
  --edu-text-muted: #64748b;
  --edu-border: #e2e8f0;
  --edu-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  --edu-radius: 12px;
  --edu-font: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; font-family: var(--edu-font); background: var(--edu-bg); color: var(--edu-text); }

.edu-tool { width: 100vw; height: 100vh; display: flex; flex-direction: column; background: var(--edu-bg); overflow: hidden; }
.edu-toolbar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--edu-surface); border-bottom: 1px solid var(--edu-border); box-shadow: 0 1px 4px rgba(0,0,0,.06); gap: 12px; }
.edu-toolbar-title { font-size: 15px; font-weight: 700; color: var(--edu-primary); white-space: nowrap; }
.edu-toolbar-subtitle { font-size: 12px; color: var(--edu-text-muted); padding: 3px 8px; background: #f1f5f9; border-radius: 20px; white-space: nowrap; }
.edu-toolbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.edu-content { flex: 1; overflow: hidden; position: relative; }
.edu-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s ease; font-family: var(--edu-font); white-space: nowrap; user-select: none; }
.edu-btn:active { transform: scale(.97); }
.edu-btn-primary { background: var(--edu-primary); color: #fff; }
.edu-btn-primary:hover { background: #1e4a76; }
.edu-btn-accent { background: var(--edu-accent); color: #fff; }
.edu-btn-accent:hover { background: #ea6c0a; }
.edu-btn-outline { background: transparent; color: var(--edu-primary); border: 1.5px solid var(--edu-border); }
.edu-btn-outline:hover { background: #f1f5f9; border-color: var(--edu-primary); }
.edu-divider { width: 1px; height: 20px; background: var(--edu-border); flex-shrink: 0; }
.value-display { font-size: 14px; font-weight: 700; color: var(--edu-accent); min-width: 40px; text-align: center; }
input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: var(--edu-border); outline: none; cursor: pointer; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--edu-primary); cursor: pointer; }`;

/* ================================================================
 * Section B: 角色与规则
 * ================================================================ */
const ROLE_AND_RULES = `你是一个前端开发专家，专门为中国中小学课堂制作交互式HTML教具。

## 严格规则
1. 输出一个完整的、自包含的HTML文件，不使用任何外部依赖或网络请求
2. 必须使用 <link rel="stylesheet" href="../edu-lib/edu-base.css" /> 引入基础样式
3. 外层结构必须严格遵循：\`<div class="edu-tool">\` > \`<div class="edu-toolbar">\` + \`<div class="edu-content">\`
4. 工具栏使用 .edu-toolbar-title, .edu-toolbar-subtitle, .edu-toolbar-actions 类
5. 按钮使用 .edu-btn, .edu-btn-primary, .edu-btn-accent, .edu-btn-outline 类
6. 主布局使用 CSS Grid: \`grid-template-columns: 1fr 260px\`，左侧为可视化区域(.canvas-area)，右侧为控制面板(.control-panel)
7. 所有界面文字使用中文
8. 使用 Canvas API 进行图形绘制，使用滑块(input[type=range])作为主要交互控件
9. 代码中必须包含 resetAll() 重置函数并在工具栏提供重置按钮
10. 不要输出 markdown 代码围栏(\`\`\`html)，直接输出纯HTML`;

/* ================================================================
 * Section C: HTML 骨架模板
 * ================================================================ */
const SKELETON_TEMPLATE = `
## HTML 结构模板（你必须遵循这个骨架）

\`\`\`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>{教具名称} — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <style>
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; }
    .canvas-area { padding:24px; overflow-y:auto; background:linear-gradient(...); display:flex; flex-direction:column; align-items:center; }
    .control-panel { background:#fdfaf4; border-left:1px solid #e2e8f0; padding:14px; display:flex; flex-direction:column; gap:12px; overflow:auto; }
    .ctrl-section { display:flex; flex-direction:column; gap:6px; }
    .ctrl-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:.05em; }
    .divider { height:1px; background:#e2e8f0; }
    .info-box { background:#fff; border:1px solid ...; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.8; color:#334155; }
    .slider-row { display:flex; align-items:center; gap:8px; }
    .slider-row input[type=range] { flex:1; }
    .slider-row .val { font-size:14px; font-weight:700; color:...; min-width:24px; text-align:right; }
    /* 其他工具特定样式 */
  </style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="edu-toolbar-title">{icon} {教具名称}</div>
      <div class="edu-toolbar-subtitle">{章节}</div>
    </div>
    <div class="edu-toolbar-actions">
      <button class="edu-btn edu-btn-primary" onclick="主操作()">操作</button>
      <button class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area">
        <canvas id="cvs" width="400" height="300"></canvas>
      </div>
      <div class="control-panel">
        <div class="ctrl-section">
          <div class="ctrl-label">参数名</div>
          <div class="slider-row"><input type="range" .../><span class="val">值</span></div>
        </div>
        <div class="divider"></div>
        <div class="info-box">
          <strong>知识点标题</strong><br/>
          ● 要点1<br/>
          ● 要点2
        </div>
      </div>
    </div>
  </div>
</div>
<script>
// 工具逻辑
function update() { /* Canvas 绘制 */ }
function resetAll() { /* 重置所有参数 */ }
update();
</script>
</body>
</html>
\`\`\``;

/* ================================================================
 * Section D: 参考示例 1 — frac-intro.html（Canvas 绘图 + 滑块）
 * ================================================================ */
const EXAMPLE_1 = `
## 参考示例 1：分数的初步认识（Canvas 绘图 + 滑块 + 标签页切换）

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>分数的初步认识 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <style>
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; }
    .canvas-area { padding:24px; overflow-y:auto; background:linear-gradient(135deg,#fdf2f8,#fce7f3); display:flex; flex-direction:column; align-items:center; }
    .control-panel { background:#fdfaf4; border-left:1px solid #e2e8f0; padding:14px; display:flex; flex-direction:column; gap:12px; overflow:auto; }
    .ctrl-section { display:flex; flex-direction:column; gap:6px; }
    .ctrl-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:.05em; }
    .divider { height:1px; background:#e2e8f0; }
    .info-box { background:#fff; border:1px solid #fbcfe8; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.8; color:#334155; }
    .info-box strong { color:#EC4899; }
    .slider-row { display:flex; align-items:center; gap:8px; }
    .slider-row input[type=range] { flex:1; }
    .slider-row .val { font-size:14px; font-weight:700; color:#EC4899; min-width:24px; text-align:right; }
    canvas { border-radius:12px; background:#fff; }
    .frac-big { font-size:48px; font-weight:800; font-family:'Courier New',monospace; color:#EC4899; text-align:center; margin:12px 0; }
    .frac-big .fl { display:block; width:70px; height:4px; background:#334155; border-radius:2px; margin:4px auto; }
    .compare-row { display:flex; align-items:center; gap:10px; font-size:22px; font-weight:800; font-family:'Courier New',monospace; margin:8px 0; }
    .preset-btn { padding:8px 0; border-radius:8px; font-size:13px; font-weight:600; background:#fff; border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s; }
    .preset-btn:hover { border-color:#EC4899; color:#EC4899; }
    .tab-bar { display:flex; gap:6px; margin-bottom:10px; }
    .tab-btn { padding:6px 12px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; cursor:pointer; font-weight:600; transition:all .15s; }
    .tab-btn.active { background:#EC4899; color:#fff; border-color:#EC4899; }
  </style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="edu-toolbar-title">½ 分数的初步认识</div>
      <div class="edu-toolbar-subtitle">上册 · 第八单元</div>
    </div>
    <div class="edu-toolbar-actions">
      <button class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area">
        <div class="tab-bar">
          <button class="tab-btn active" onclick="setTab('explore')">认识分数</button>
          <button class="tab-btn" onclick="setTab('compare')">比较大小</button>
          <button class="tab-btn" onclick="setTab('add')">简单加法</button>
        </div>
        <div id="panelExplore">
          <div class="tab-bar">
            <button class="tab-btn active" onclick="setShape('circle')">圆形</button>
            <button class="tab-btn" onclick="setShape('rect')">长方形</button>
          </div>
          <canvas id="cvs" width="400" height="220"></canvas>
          <div class="frac-big" id="fracDisplay"></div>
        </div>
        <div id="panelCompare" style="display:none">
          <canvas id="cvsCmp" width="420" height="180"></canvas>
          <div class="compare-row" id="cmpResult"></div>
        </div>
        <div id="panelAdd" style="display:none">
          <canvas id="cvsAdd" width="420" height="180"></canvas>
          <div class="compare-row" id="addResult" style="color:#EC4899"></div>
        </div>
      </div>
      <div class="control-panel">
        <div class="ctrl-section">
          <div class="ctrl-label">分母（分成几份）</div>
          <div class="slider-row"><input type="range" id="slDen" min="2" max="8" value="4" oninput="update()"/><span class="val" id="vDen">4</span></div>
        </div>
        <div class="ctrl-section">
          <div class="ctrl-label">分子（涂色几份）</div>
          <div class="slider-row"><input type="range" id="slNum" min="1" max="8" value="3" oninput="update()"/><span class="val" id="vNum">3</span></div>
        </div>
        <div id="cmpControls" style="display:none">
          <div class="divider"></div>
          <div class="ctrl-section">
            <div class="ctrl-label">对比分子（同分母）</div>
            <div class="slider-row"><input type="range" id="slNum2" min="1" max="8" value="1" oninput="update()"/><span class="val" id="vNum2">1</span></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="ctrl-section">
          <div class="ctrl-label">预设分数</div>
          <button class="preset-btn" onclick="load(2,1)">½</button>
          <button class="preset-btn" onclick="load(3,1)">⅓</button>
          <button class="preset-btn" onclick="load(4,1)">¼</button>
          <button class="preset-btn" onclick="load(4,3)">¾</button>
        </div>
        <div class="divider"></div>
        <div class="info-box">
          <strong>分数的初步认识</strong><br/>
          ● 把物体平均分成几份<br/>
          ● 表示其中一份或几份<br/>
          ● 分母：平均分成的总份数<br/>
          ● 分子：取出的份数<br/>
          ● 同分母比较：分子大的分数大<br/>
          ● 同分母加法：分母不变，分子相加
        </div>
      </div>
    </div>
  </div>
</div>
<script>
const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d');
let tab = 'explore', shape = 'circle';

function setTab(t) {
  tab = t;
  document.querySelectorAll('.tab-bar')[0].querySelectorAll('.tab-btn').forEach((b,i) =>
    b.classList.toggle('active', ['explore','compare','add'][i] === t));
  document.getElementById('panelExplore').style.display = t==='explore' ? '' : 'none';
  document.getElementById('panelCompare').style.display = t==='compare' ? '' : 'none';
  document.getElementById('panelAdd').style.display = t==='add' ? '' : 'none';
  document.getElementById('cmpControls').style.display = t==='compare' ? '' : 'none';
  update();
}

function setShape(s) {
  shape = s;
  document.querySelectorAll('#panelExplore .tab-btn').forEach((b,i) =>
    b.classList.toggle('active', ['circle','rect'][i] === s));
  update();
}

function update() {
  const den = parseInt(document.getElementById('slDen').value);
  let num = parseInt(document.getElementById('slNum').value);
  if (num > den) { num = den; document.getElementById('slNum').value = den; }
  document.getElementById('vDen').textContent = den;
  document.getElementById('vNum').textContent = num;
  if (tab === 'explore') drawExplore(den, num);
  else if (tab === 'compare') drawCompare(den, num);
  else drawAdd(den, num);
}

function drawExplore(den, num) {
  const W = cvs.width, H = cvs.height;
  ctx.clearRect(0, 0, W, H);
  document.getElementById('fracDisplay').innerHTML = '<span>'+num+'</span><span class="fl"></span><span>'+den+'</span>';
  if (shape === 'circle') {
    const cx = W/2, cy = H/2, r = 85;
    for (let i = 0; i < den; i++) {
      const a1 = -Math.PI/2 + (i/den)*Math.PI*2;
      const a2 = -Math.PI/2 + ((i+1)/den)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a1,a2); ctx.closePath();
      ctx.fillStyle = i < num ? '#f9a8d4' : '#f1f5f9'; ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  } else {
    const rw = 320, rh = 80, rx = (W-rw)/2, ry = (H-rh)/2;
    for (let i = 0; i < den; i++) {
      const x = rx + i*(rw/den);
      ctx.fillStyle = i < num ? '#f9a8d4' : '#f1f5f9';
      ctx.fillRect(x, ry, rw/den, rh);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x, ry, rw/den, rh);
    }
  }
}

function drawCompare(den, num) {
  const c = document.getElementById('cvsCmp');
  const cx = c.getContext('2d');
  const num2 = Math.min(parseInt(document.getElementById('slNum2').value), den);
  document.getElementById('vNum2').textContent = num2;
  cx.clearRect(0, 0, c.width, c.height);
  drawBar(cx, 20, 30, 170, 40, den, num, '#f9a8d4', num+'/'+den);
  drawBar(cx, 230, 30, 170, 40, den, num2, '#c4b5fd', num2+'/'+den);
  const res = document.getElementById('cmpResult');
  if (num > num2) res.innerHTML = '<span style="color:#EC4899">'+num+'/'+den+'</span> <span class="gt">></span> <span style="color:#7c3aed">'+num2+'/'+den+'</span>';
  else if (num < num2) res.innerHTML = '<span style="color:#EC4899">'+num+'/'+den+'</span> <span class="lt"><</span> <span style="color:#7c3aed">'+num2+'/'+den+'</span>';
  else res.innerHTML = '<span style="color:#EC4899">'+num+'/'+den+'</span> <span class="eq">=</span> <span style="color:#7c3aed">'+num2+'/'+den+'</span>';
}

function drawAdd(den, num) {
  const c = document.getElementById('cvsAdd');
  const cx = c.getContext('2d');
  const num2 = Math.min(2, den);
  cx.clearRect(0, 0, c.width, c.height);
  drawBar(cx, 20, 25, 170, 40, den, num, '#f9a8d4', num+'/'+den);
  drawBar(cx, 20, 75, 170, 40, den, num2, '#c4b5fd', num2+'/'+den);
  const sum = num + num2;
  drawBar(cx, 220, 50, 180, 40, den, Math.min(sum, den), '#86efac', sum+'/'+den);
  cx.fillStyle = '#64748b'; cx.font = 'bold 20px sans-serif'; cx.textAlign = 'center';
  cx.fillText('+', 100, 65);
  cx.fillText('=', 200, 70);
  document.getElementById('addResult').innerHTML = num+'/'+den+' + '+num2+'/'+den+' = '+sum+'/'+den;
}

function drawBar(cx, x, y, w, h, den, num, color, label) {
  for (let i = 0; i < den; i++) {
    const bx = x + i*(w/den);
    cx.fillStyle = i < num ? color : '#f1f5f9';
    cx.fillRect(bx, y, w/den, h);
    cx.strokeStyle = '#94a3b8'; cx.lineWidth = 1;
    cx.strokeRect(bx, y, w/den, h);
  }
  cx.fillStyle = '#334155'; cx.font = 'bold 12px sans-serif'; cx.textAlign = 'center';
  cx.fillText(label, x + w/2, y + h + 16);
}

function load(d, n) { document.getElementById('slDen').value = d; document.getElementById('slNum').value = n; update(); }
function resetAll() { load(4, 3); }
update();
</script>
</body>
</html>`;

/* ================================================================
 * Section D: 参考示例 2 — find-fake.html（交互按钮 + 分步逻辑）
 * ================================================================ */
const EXAMPLE_2 = `
## 参考示例 2：找次品（交互按钮 + 分步逻辑 + 动态DOM）

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>找次品 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <style>
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; }
    .canvas-area { padding:24px; overflow-y:auto; background:linear-gradient(135deg,#fff7ed,#fdfaf4); display:flex; flex-direction:column; align-items:center; }
    .control-panel { background:#fdfaf4; border-left:1px solid #e2e8f0; padding:14px; display:flex; flex-direction:column; gap:14px; overflow:auto; }
    .ctrl-section { display:flex; flex-direction:column; gap:6px; }
    .ctrl-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:.05em; }
    .divider { height:1px; background:#e2e8f0; }
    .info-box { background:#fff; border:1px solid #fed7aa; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.8; color:#334155; }
    .slider-row { display:flex; align-items:center; gap:10px; }
    .slider-row input { flex:1; }
    .slider-row .value-display { min-width:40px; font-weight:700; }
    .balls-row { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:12px 0; }
    .ball { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:#fff; background:#94a3b8; cursor:pointer; transition:all .15s; box-shadow:0 2px 6px rgba(0,0,0,.1); }
    .ball:hover { transform:scale(1.1); }
    .ball.group-a { background:#3b82f6; }
    .ball.group-b { background:#f97316; }
    .ball.group-c { background:#22c55e; }
    .ball.found { background:#ef4444; animation:pulse .6s infinite alternate; }
    @keyframes pulse { from { transform:scale(1); } to { transform:scale(1.15); } }
    .balance { display:flex; align-items:flex-end; justify-content:center; gap:40px; margin:16px 0; }
    .pan { width:120px; min-height:50px; border:2px solid #94a3b8; border-radius:0 0 12px 12px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#64748b; background:#f8fafc; transition:all .3s; }
    .pan.heavy { border-color:#ef4444; background:#fef2f2; color:#ef4444; transform:translateY(8px); }
    .pan.light { border-color:#22c55e; background:#f0fdf4; color:#22c55e; transform:translateY(-4px); }
    .pan-label { font-size:12px; font-weight:700; color:#64748b; text-align:center; margin-top:4px; }
    .fulcrum { font-size:30px; color:#94a3b8; margin-top:-8px; }
    .step-card { background:#fff; border:2px solid #f97316; border-radius:14px; padding:16px; width:100%; max-width:460px; }
    .step-line { margin:4px 0; font-size:14px; line-height:1.8; }
    .step-line .hl { color:#f97316; font-weight:700; }
    .result-box { background:#f0fdf4; border:2px solid #22c55e; border-radius:12px; padding:14px; text-align:center; margin-top:10px; }
    .result-big { font-size:22px; font-weight:800; color:#22c55e; }
    .preset-btn { padding:8px 0; border-radius:8px; font-size:13px; font-weight:600; background:#fff; border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s; }
    .preset-btn:hover { border-color:#f97316; color:#f97316; }
  </style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="edu-toolbar-title">🔍 找次品</div>
      <div class="edu-toolbar-subtitle">下册 · 数学广角</div>
    </div>
    <div class="edu-toolbar-actions">
      <button class="edu-btn edu-btn-primary" onclick="weigh()">称量</button>
      <button class="edu-btn edu-btn-accent" onclick="autoSolve()">自动求解</button>
      <div class="edu-divider"></div>
      <button class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area">
        <div class="balls-row" id="ballsRow"></div>
        <div class="balance" id="balanceArea">
          <div><div class="pan" id="panL">左盘</div><div class="pan-label">A 组</div></div>
          <div class="fulcrum">∧</div>
          <div><div class="pan" id="panR">右盘</div><div class="pan-label">B 组</div></div>
        </div>
        <div class="step-card" id="stepCard"></div>
      </div>
      <div class="control-panel">
        <div class="ctrl-section">
          <div class="ctrl-label">物品数量</div>
          <div class="slider-row"><input type="range" id="numSlider" min="3" max="15" value="9" oninput="resetAll()"/><span class="value-display" id="numVal">9</span></div>
        </div>
        <div class="ctrl-section">
          <div class="ctrl-label">次品位置（点击设置）</div>
          <div style="font-size:13px;color:#64748b" id="fakeInfo">点击球设置次品位置</div>
        </div>
        <div class="divider"></div>
        <div class="ctrl-section">
          <div class="ctrl-label">快速设置</div>
          <button class="preset-btn" onclick="load(5)">5 个物品</button>
          <button class="preset-btn" onclick="load(9)">9 个物品</button>
          <button class="preset-btn" onclick="load(12)">12 个物品</button>
        </div>
        <div class="divider"></div>
        <div class="info-box">
          <b>找次品策略</b><br/>
          ● 把物品分成3组<br/>
          ● 尽量让3组一样多<br/>
          ● 称两组，确定次品在哪组<br/>
          ● 重复以上步骤<br/>
          ● n个物品最少⌈log₃n⌉次
        </div>
      </div>
    </div>
  </div>
</div>
<script>
let total = 9, fakeIdx = 0, weighCount = 0, found = false, steps = [];

function resetAll() {
  total = parseInt(document.getElementById('numSlider').value) || 9;
  document.getElementById('numVal').textContent = total;
  fakeIdx = 0; weighCount = 0; found = false; steps = [];
  renderBalls();
  document.getElementById('panL').className = 'pan'; document.getElementById('panL').textContent = '左盘';
  document.getElementById('panR').className = 'pan'; document.getElementById('panR').textContent = '右盘';
  document.getElementById('stepCard').innerHTML = '<div style="text-align:center;color:#94a3b8">点击球设置次品位置，然后点击"称量"</div>';
  document.getElementById('fakeInfo').textContent = '点击球设置次品位置';
}

function renderBalls() {
  const el = document.getElementById('ballsRow');
  el.innerHTML = Array.from({length:total}, (_,i) =>
    '<div class="ball'+(i===fakeIdx?' found':'')+'" onclick="setFake('+i+')">'+(i+1)+'</div>'
  ).join('');
}

function setFake(i) { fakeIdx = i; found = false; renderBalls(); document.getElementById('fakeInfo').textContent = '次品是第 '+(i+1)+' 号'; }

function weigh() {
  if (found) return;
  const n = total, third = Math.ceil(n/3);
  const a = [], b = [], c = [];
  for (let i = 0; i < n; i++) { if (i < third) a.push(i); else if (i < third*2) b.push(i); else c.push(i); }
  weighCount++;
  const aHas = a.includes(fakeIdx), bHas = b.includes(fakeIdx);
  const panL = document.getElementById('panL'), panR = document.getElementById('panR');
  if (aHas) { panL.className='pan heavy'; panL.textContent='A: '+a.map(i=>i+1).join(','); panR.className='pan light'; panR.textContent='B: '+b.map(i=>i+1).join(','); steps.push({n:weighCount,result:'A重，次品在A组',group:a}); }
  else if (bHas) { panL.className='pan light'; panL.textContent='A: '+a.map(i=>i+1).join(','); panR.className='pan heavy'; panR.textContent='B: '+b.map(i=>i+1).join(','); steps.push({n:weighCount,result:'B重，次品在B组',group:b}); }
  else { panL.className='pan'; panL.textContent='A: '+a.map(i=>i+1).join(','); panR.className='pan'; panR.textContent='B: '+b.map(i=>i+1).join(','); steps.push({n:weighCount,result:'平衡，次品在C组',group:c}); }
  const lastGroup = steps[steps.length-1].group;
  document.querySelectorAll('.ball').forEach((b,i) => { b.style.opacity = lastGroup.includes(i) ? '1' : '0.3'; });
  total = lastGroup.length;
  renderSteps();
  if (total <= 1) { found = true; document.querySelectorAll('.ball').forEach((b,i) => { b.style.opacity = i===fakeIdx ? '1' : '0.3'; }); }
}

function autoSolve() { resetAll(); function step() { if (total<=1) return; weigh(); setTimeout(step,600); } step(); }

function renderSteps() {
  const card = document.getElementById('stepCard');
  let html = '';
  steps.forEach(s => { html += '<div class="step-line">第'+s.n+'次称量：<span class="hl">'+s.result+'</span>（'+s.group.length+'个物品）</div>'; });
  const minW = Math.ceil(Math.log(parseInt(document.getElementById('numSlider').value))/Math.log(3));
  html += '<div style="margin-top:6px;font-size:13px;color:#64748b">理论最少次数：'+minW+' 次</div>';
  if (found) html += '<div class="result-box"><div class="result-big">找到次品！第 '+(fakeIdx+1)+' 号</div><div style="font-size:14px;color:#64748b">共称了 '+weighCount+' 次</div></div>';
  else html += '<div style="font-size:13px;color:#64748b">剩余 '+total+' 个物品，继续称量...</div>';
  card.innerHTML = html;
}

function load(n) { document.getElementById('numSlider').value = n; resetAll(); }
resetAll();
</script>
</body>
</html>`;

/* ================================================================
 * Section E: 用户提示词构建
 * ================================================================ */

export interface GenerateParams {
  name: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
}

export function buildSystemPrompt(): string {
  return `${ROLE_AND_RULES}

## 可用的 CSS 变量和类（edu-base.css）

${EDU_BASE_CSS}

${SKELETON_TEMPLATE}

${EXAMPLE_1}

${EXAMPLE_2}`;
}

export function buildUserPrompt(params: GenerateParams): string {
  return `请制作一个交互式教具：

教具名称：${params.name}
适用年级：${params.grade}
学科：${params.subject}
章节：${params.chapter}
教学目标与功能需求：${params.description}

要求：
- 符合${params.grade}学生的认知水平
- 包含至少2个交互控件（滑块、按钮或输入框）
- 提供直观的可视化展示
- 包含重置按钮
- 在右侧控制面板底部添加info-box，用中文简要说明相关知识点
- 直接输出完整HTML，不要输出任何解释文字`;
}
