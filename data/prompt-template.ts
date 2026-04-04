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
8. **几何/空间类**教具使用 Three.js（见下方 3D API 文档），其余使用 Canvas API 进行图形绘制，使用滑块(input[type=range])作为主要交互控件
9. 代码中必须包含 resetAll() 重置函数并在工具栏提供重置按钮
10. 不要输出 markdown 代码围栏(\`\`\`html)，直接输出纯HTML
11. <head> 内必须包含 \`<meta charset="UTF-8"/>\`，保证中文与符号正确显示

## 教具设计质量标准（你必须达到的水平）

### 视觉设计
- canvas-area 必须有渐变背景，不是纯白色（参考示例中的 linear-gradient 写法）
- Canvas 画布必须有白色背景 + 圆角 + 轻阴影：\`border-radius:12px; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.06)\`
- 使用和谐的配色方案，整个教具的视觉主题色不超过 2 个主色
- 关键数值（如面积、角度、分数值）用大号加粗彩色字体突出显示
- 不同数据集/分组用不同的视觉颜色区分（如示例中的 #f9a8d4 vs #c4b5fd）

### 交互深度
- 至少 3 个交互控件（滑块+按钮组合，或多个滑块+预设按钮）
- 滑块拖动时必须实时更新 Canvas，做到「拖即见」
- 提供预设按钮（如 ½、¼ 等快速跳转），降低操作成本
- 每个控件旁边显示当前值（.slider-row .val 模式）
- 有状态变化时加入 CSS transition 或动画（如 .ball.found 的 pulse 动画）

### 教学有效性
- 右侧 info-box 必须包含该知识点的 4-6 个核心要点，用 ● 符号列表
- 可视化必须直接体现数学关系（如分数的涂色/未涂色、图形的对应边标注）
- 当参数变化时，自动推导并展示结论（如比较分数大小时自动显示 > < = 关系）
- 若涉及计算，结果区域要展示推导过程，不只显示最终结果

### 代码质量
- 变量命名有意义（如 \`denominator\`, \`numerator\` 而非 \`a\`, \`b\`）
- Canvas 绘制函数拆分清晰（如 drawBar, drawExplore, drawCompare 独立函数）
- resetAll() 必须重置所有控件值到默认状态，并重新绘制
- 所有数值计算做边界检查（如分子不超过分母、canvas 尺寸不为负）`;

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
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; } @media(max-width:640px){.main-layout{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important;overflow-y:auto!important} .main-layout .control-panel{max-height:45vh;overflow-y:auto;border-top:1px solid #e2e8f0} .main-layout .canvas-area{min-height:50vh}}
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
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; } @media(max-width:640px){.main-layout{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important;overflow-y:auto!important} .main-layout .control-panel{max-height:45vh;overflow-y:auto;border-top:1px solid #e2e8f0} .main-layout .canvas-area{min-height:50vh}}
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
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; } @media(max-width:640px){.main-layout{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important;overflow-y:auto!important} .main-layout .control-panel{max-height:45vh;overflow-y:auto;border-top:1px solid #e2e8f0} .main-layout .canvas-area{min-height:50vh}}
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
 * Section D-3: 参考示例 3 — shape-scale.html（对比展示 + 数据卡片 + 动态计算）
 * ================================================================ */
const EXAMPLE_3 = `
## 参考示例 3：图形放大与缩小（双Canvas对比 + 实时计算 + 图形切换 + 预设按钮）

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>图形放大与缩小 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <style>
    .main-layout { display:grid; grid-template-columns:1fr 260px; height:100%; } @media(max-width:640px){.main-layout{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important;overflow-y:auto!important} .main-layout .control-panel{max-height:45vh;overflow-y:auto;border-top:1px solid #e2e8f0} .main-layout .canvas-area{min-height:50vh}}
    .canvas-area { padding:24px; overflow-y:auto; background:linear-gradient(135deg,#eff6ff,#fdfaf4); display:flex; flex-direction:column; align-items:center; }
    .control-panel { background:#fdfaf4; border-left:1px solid #e2e8f0; padding:14px; display:flex; flex-direction:column; gap:14px; overflow:auto; }
    .ctrl-section { display:flex; flex-direction:column; gap:6px; }
    .ctrl-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:.05em; }
    .divider { height:1px; background:#e2e8f0; }
    .info-box { background:#fff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.8; color:#334155; }
    .slider-row { display:flex; align-items:center; gap:10px; }
    .slider-row input { flex:1; }
    .slider-row .value-display { min-width:50px; font-weight:700; text-align:right; }
    .compare-area { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; justify-content:center; }
    .shape-box { text-align:center; }
    .shape-box .title { font-size:14px; font-weight:700; margin-bottom:8px; }
    canvas { border-radius:12px; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .scale-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:14px; font-weight:800; margin-top:8px; }
    .shape-selector { display:flex; gap:6px; flex-wrap:wrap; }
    .shape-btn { padding:6px 12px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; cursor:pointer; transition:all .15s; font-weight:600; }
    .shape-btn.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
    .result-card { background:#fff; border:2px solid #3b82f6; border-radius:14px; padding:16px; width:100%; max-width:520px; margin-top:16px; }
    .result-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
    .result-row .label { color:#64748b; }
    .result-row .val { font-weight:800; font-family:'Courier New',monospace; }
    .preset-btn { padding:8px 0; border-radius:8px; font-size:13px; font-weight:600; background:#fff; border:1.5px solid #e2e8f0; cursor:pointer; transition:all .15s; }
    .preset-btn:hover { border-color:#3b82f6; color:#3b82f6; }
  </style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="edu-toolbar-title">🔍 图形放大与缩小</div>
      <div class="edu-toolbar-subtitle">下册 · 第四单元</div>
    </div>
    <div class="edu-toolbar-actions">
      <button class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area">
        <div class="shape-selector" id="shapeSelector"></div>
        <div class="compare-area" style="margin-top:16px">
          <div class="shape-box">
            <div class="title" style="color:#94a3b8">原图形</div>
            <canvas id="cvsOrig" width="220" height="220"></canvas>
            <div class="scale-badge" style="background:#f1f5f9;color:#64748b">1 : 1</div>
          </div>
          <div style="font-size:28px;display:flex;align-items:center;color:#94a3b8">→</div>
          <div class="shape-box">
            <div class="title" style="color:#3b82f6" id="scaleTitle">放大 2:1</div>
            <canvas id="cvsScaled" width="220" height="220"></canvas>
            <div class="scale-badge" id="scaleBadge" style="background:#eff6ff;color:#3b82f6">2 : 1</div>
          </div>
        </div>
        <div class="result-card" id="resultCard"></div>
      </div>
      <div class="control-panel">
        <div class="ctrl-section">
          <div class="ctrl-label">缩放比例</div>
          <div class="slider-row">
            <input type="range" id="scaleSlider" min="0.5" max="3" step="0.1" value="2" oninput="drawAll()"/>
            <span class="value-display" id="scaleVal">2.0</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="ctrl-section">
          <div class="ctrl-label">选择图形</div>
          <div class="shape-selector" id="shapeList"></div>
        </div>
        <div class="divider"></div>
        <div class="ctrl-section">
          <div class="ctrl-label">预设比例</div>
          <button class="preset-btn" onclick="setScale(0.5)">缩小 1:2</button>
          <button class="preset-btn" onclick="setScale(1.5)">放大 3:2</button>
          <button class="preset-btn" onclick="setScale(2)">放大 2:1</button>
          <button class="preset-btn" onclick="setScale(3)">放大 3:1</button>
        </div>
        <div class="divider"></div>
        <div class="info-box">
          <b>图形放大与缩小</b><br/>
          ● 按 k:1 放大，边长×k<br/>
          ● 按 1:k 缩小，边长÷k<br/>
          ● 放大/缩小后形状不变<br/>
          ● 面积比 = k²<br/>
          ● 周长比 = k<br/>
          ● 对应角的大小不变
        </div>
      </div>
    </div>
  </div>
</div>
<script>
let currentShape = 'rect';
const shapes = {
  rect: { name: '长方形', w: 4, h: 3 },
  square: { name: '正方形', w: 4, h: 4 },
  triangle: { name: '三角形', w: 6, h: 5 },
  lshape: { name: 'L形', w: 4, h: 4 },
};

function buildShapeSelector() {
  const el = document.getElementById('shapeList');
  el.innerHTML = Object.entries(shapes).map(([k, v]) =>
    '<button class="shape-btn '+(k===currentShape?'active':'')+'" onclick="selectShape(\\''+k+'\\')">'+v.name+'</button>'
  ).join('');
}

function selectShape(s) { currentShape = s; buildShapeSelector(); drawAll(); }
function setScale(v) { document.getElementById('scaleSlider').value = v; drawAll(); }

function drawShape(ctx, type, cx, cy, w, h, scale, color) {
  const sw = w * scale, sh = h * scale;
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath();
  if (type === 'rect') { ctx.rect(-sw/2,-sh/2,sw,sh); }
  else if (type === 'square') { ctx.rect(-sw/2,-sw/2,sw,sw); }
  else if (type === 'triangle') { ctx.moveTo(0,-sh/2); ctx.lineTo(sw/2,sh/2); ctx.lineTo(-sw/2,sh/2); ctx.closePath(); }
  else if (type === 'lshape') { const s=sw/2,u=sw/4; ctx.moveTo(-s,-s); ctx.lineTo(-s+u,-s); ctx.lineTo(-s+u,s-u); ctx.lineTo(s,s-u); ctx.lineTo(s,s); ctx.lineTo(-s,s); ctx.closePath(); }
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = color + '15'; ctx.fill();
  ctx.restore();
}

function drawAll() {
  const k = parseFloat(document.getElementById('scaleSlider').value);
  document.getElementById('scaleVal').textContent = k.toFixed(1);
  const isEnlarge = k >= 1;
  const titleEl = document.getElementById('scaleTitle');
  const badgeEl = document.getElementById('scaleBadge');
  if (k === 1) { titleEl.textContent = '原大小'; badgeEl.textContent = '1 : 1'; }
  else if (isEnlarge) { titleEl.textContent = '放大 '+k+':1'; badgeEl.textContent = k+' : 1'; titleEl.style.color='#3b82f6'; badgeEl.style.background='#eff6ff'; badgeEl.style.color='#3b82f6'; }
  else { titleEl.textContent = '缩小 1:'+(1/k).toFixed(1); badgeEl.textContent = '1 : '+(1/k).toFixed(1); titleEl.style.color='#f97316'; badgeEl.style.background='#fff7ed'; badgeEl.style.color='#f97316'; }

  const shape = shapes[currentShape]; const baseScale = 22;
  const c1 = document.getElementById('cvsOrig'); const ctx1 = c1.getContext('2d');
  ctx1.clearRect(0,0,c1.width,c1.height); drawShape(ctx1,currentShape,c1.width/2,c1.height/2,shape.w,shape.h,baseScale,'#94a3b8');
  const c2 = document.getElementById('cvsScaled'); const ctx2 = c2.getContext('2d');
  ctx2.clearRect(0,0,c2.width,c2.height);
  const drawScale = Math.min(baseScale*k, c2.width*0.4/Math.max(shape.w,shape.h));
  drawShape(ctx2,currentShape,c2.width/2,c2.height/2,shape.w,shape.h,drawScale,isEnlarge?'#3b82f6':'#f97316');

  const card = document.getElementById('resultCard');
  const oW=shape.w,oH=shape.h,nW=oW*k,nH=oH*k;
  let oA,nA; if(currentShape==='triangle'){oA=oW*oH/2;nA=nW*nH/2;}else{oA=oW*oH;nA=nW*nH;}
  card.innerHTML = '<div style="font-size:16px;font-weight:700;color:#334155;margin-bottom:12px">'+shape.name+' · 缩放比例 '+k+':1</div>'
    +'<div class="result-row"><span class="label">原宽 → 新宽</span><span class="val">'+oW+' → '+nW.toFixed(1)+' (= '+oW+'×'+k+')</span></div>'
    +'<div class="result-row"><span class="label">原高 → 新高</span><span class="val">'+oH+' → '+nH.toFixed(1)+' (= '+oH+'×'+k+')</span></div>'
    +'<div class="result-row" style="background:#f8fafc;border-radius:6px;padding:8px"><span class="label">原面积 → 新面积</span><span class="val" style="color:#3b82f6">'+oA+' → '+nA.toFixed(1)+' (= ×'+(k*k).toFixed(1)+')</span></div>'
    +'<div class="result-row"><span class="label">面积比</span><span class="val" style="color:#8b5cf6">1 : '+(k*k).toFixed(1)+' (= '+k+'²)</span></div>';
}

function resetAll() { currentShape='rect'; document.getElementById('scaleSlider').value=2; buildShapeSelector(); drawAll(); }
buildShapeSelector(); drawAll();
</script>
</body>
</html>`;

/* ================================================================
 * Section D-4: 3D API 文档（edu-3d.js）
 * ================================================================ */
const EDU_3D_API = `
## 3D 教具 API（edu-3d.js）— 几何/空间类教具使用

当需求涉及立体图形（长方体、正方体、圆柱、圆锥、球、三视图、展开图等）时，必须使用 Three.js + edu-3d.js：

### 引入方式
\`\`\`html
<script src="../edu-lib/three.min.js"></script>
<script src="../edu-lib/OrbitControls.js"></script>
<script src="../edu-lib/edu-3d.js"></script>
\`\`\`

### 核心 API
\`\`\`js
// 1. 创建场景（返回 { scene, camera, renderer, controls }）
var r = Edu3D.createScene(canvas, { bg: 0xf0f5ff, camX: 6, camY: 5, camZ: 6 });
var scene = r.scene, camera = r.camera, renderer = r.renderer, controls = r.controls;

// 2. 添加灯光
Edu3D.addLights(scene);

// 3. 添加地面网格
Edu3D.addGrid(scene, 12, 12);

// 4. 创建边框线
var edgeLine = Edu3D.edges(geometry, 0x334155);

// 5. 创建文字精灵（3D 空间中的文字标签）
var label = Edu3D.textSprite('文字', { color: '#1e293b', scale: 0.5 });
label.position.set(x, y, z);

// 6. 启动渲染循环（可选第5个参数为每帧回调）
Edu3D.startLoop(scene, camera, renderer, controls);
\`\`\`

### 3D 布局结构
\`\`\`html
<div class="canvas-area">
  <canvas id="c3d"></canvas>
</div>
\`\`\`
CSS: \`.canvas-area canvas { width:100%; height:100%; display:block; }\`

### 常用 Three.js 几何体
- BoxGeometry(w, h, d) — 长方体/正方体
- CylinderGeometry(rTop, rBottom, h, segments) — 圆柱
- ConeGeometry(r, h, segments) — 圆锥
- SphereGeometry(r, segments) — 球体
- PlaneGeometry(w, h) — 平面

### 3D 教具模板
\`\`\`html
<script src="../edu-lib/three.min.js"></script>
<script src="../edu-lib/OrbitControls.js"></script>
<script src="../edu-lib/edu-3d.js"></script>
<script>
var _scene, _camera, _renderer, _controls;
function init() {
  var canvas = document.getElementById('c3d');
  var r = Edu3D.createScene(canvas, { bg: 0xf0f5ff, camX: 6, camY: 5, camZ: 6 });
  _scene = r.scene; _camera = r.camera; _renderer = r.renderer; _controls = r.controls;
  Edu3D.addLights(_scene);
  Edu3D.addGrid(_scene, 12, 12);
  rebuild();
  Edu3D.startLoop(_scene, _camera, _renderer, _controls);
}
function rebuild() {
  // 读取控件值，清除旧对象，创建新的 Three.js 几何体
}
function resetAll() { /* 重置所有控件和3D场景 */ }
init();
</script>
\`\`\``;

/* ================================================================
 * Section D-5: 参考示例 4 — 3D 长方体认识
 * ================================================================ */
const EXAMPLE_4 = `
## 参考示例 4：3D 长方体认识（Three.js + edu-3d.js + 滑块 + 高亮）

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>长方体的认识 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <script src="../edu-lib/three.min.js"></script>
  <script src="../edu-lib/OrbitControls.js"></script>
  <script src="../edu-lib/edu-3d.js"></script>
  <style>
    .main-layout { display:grid; grid-template-columns:1fr 280px; height:100%; } @media(max-width:640px){.main-layout{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important;overflow-y:auto!important} .main-layout .control-panel{max-height:45vh;overflow-y:auto;border-top:1px solid #e2e8f0} .main-layout .canvas-area{min-height:50vh}}
    .canvas-area { position:relative; background:linear-gradient(135deg,#eff6ff,#dbeafe); overflow:hidden; }
    .canvas-area canvas { width:100%; height:100%; display:block; }
    .control-panel { background:#fff; border-left:1px solid #e2e8f0; padding:16px; display:flex; flex-direction:column; gap:12px; overflow:auto; }
    .ctrl-section { display:flex; flex-direction:column; gap:6px; }
    .ctrl-label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
    .divider { height:1px; background:#e2e8f0; }
    .info-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; font-size:12px; color:#64748b; line-height:1.9; }
    .info-box strong { color:#2563EB; }
    .slider-row { display:flex; align-items:center; gap:8px; }
    .slider-row label { font-size:12px; font-weight:600; color:#64748b; min-width:30px; }
    .slider-row input[type=range] { flex:1; }
    .slider-row .val { font-size:14px; font-weight:700; color:#2563EB; min-width:24px; text-align:right; }
    .highlight-btn { padding:6px 10px; border-radius:8px; font-size:11px; font-weight:600; cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; transition:all .15s; font-family:var(--edu-font); text-align:center; }
    .highlight-btn.active { background:#3B82F6; color:#fff; border-color:#3B82F6; }
  </style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="edu-toolbar-title">📦 长方体的认识</span>
      <span class="edu-toolbar-subtitle">五下 · 第三单元</span>
    </div>
    <div class="edu-toolbar-actions">
      <button class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area"><canvas id="c3d"></canvas></div>
      <div class="control-panel">
        <div class="ctrl-section">
          <div class="ctrl-label">调整尺寸</div>
          <div class="slider-row"><label>长</label><input type="range" id="sl" min="2" max="8" value="5" step="0.5" oninput="rebuild()"/><span class="val" id="vl">5</span></div>
          <div class="slider-row"><label>宽</label><input type="range" id="sw" min="2" max="6" value="3" step="0.5" oninput="rebuild()"/><span class="val" id="vw">3</span></div>
          <div class="slider-row"><label>高</label><input type="range" id="sh" min="2" max="6" value="4" step="0.5" oninput="rebuild()"/><span class="val" id="vh">4</span></div>
        </div>
        <div class="divider"></div>
        <div class="ctrl-section">
          <div class="ctrl-label">高亮显示</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
            <button class="highlight-btn" id="hb-vertex" onclick="setHighlight('vertex')">顶点</button>
            <button class="highlight-btn" id="hb-edge" onclick="setHighlight('edge')">棱</button>
            <button class="highlight-btn" id="hb-face" onclick="setHighlight('face')">面</button>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-box">
          <div>顶点数：<strong>8</strong> 个</div>
          <div>棱数：<strong>12</strong> 条</div>
          <div>面数：<strong>6</strong> 个</div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
var _scene, _camera, _renderer, _controls;
var _cuboid, _edges, _vertexGroup, _faceGroup;
var _highlight = '';
function init() {
  var canvas = document.getElementById('c3d');
  var r = Edu3D.createScene(canvas, { bg: 0xf0f5ff, camX: 6, camY: 5, camZ: 6 });
  _scene = r.scene; _camera = r.camera; _renderer = r.renderer; _controls = r.controls;
  Edu3D.addLights(_scene);
  Edu3D.addGrid(_scene, 12, 12);
  rebuild();
  Edu3D.startLoop(_scene, _camera, _renderer, _controls);
}
function rebuild() {
  var l = parseFloat(document.getElementById('sl').value);
  var w = parseFloat(document.getElementById('sw').value);
  var h = parseFloat(document.getElementById('sh').value);
  document.getElementById('vl').textContent = l;
  document.getElementById('vw').textContent = w;
  document.getElementById('vh').textContent = h;
  if (_cuboid) { _scene.remove(_cuboid); _scene.remove(_edges); }
  if (_vertexGroup) _scene.remove(_vertexGroup);
  if (_faceGroup) _scene.remove(_faceGroup);
  var geo = new THREE.BoxGeometry(l, h, w);
  _cuboid = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.35 }));
  _scene.add(_cuboid);
  _edges = Edu3D.edges(geo, 0x1e3a5c);
  _scene.add(_edges);
}
function setHighlight(h) {
  _highlight = _highlight === h ? '' : h;
  ['vertex','edge','face'].forEach(function(k){ document.getElementById('hb-'+k).classList.toggle('active',_highlight===k); });
}
function resetAll() {
  document.getElementById('sl').value=5; document.getElementById('sw').value=3; document.getElementById('sh').value=4;
  _highlight=''; ['vertex','edge','face'].forEach(function(k){ document.getElementById('hb-'+k).classList.remove('active'); });
  rebuild();
}
init();
</script>
</body>
</html>`;

/* ================================================================
 * Section E: 用户提示词构建
 * ================================================================ */

export interface GenerateParams {
  name: string;
  /** 展示用，如「五年级」 */
  gradeLabel: string;
  /** 展示用，如「数学」 */
  subjectLabel: string;
  chapter: string;
  /** 已由上一步整理好的需求说明（给 HTML 生成用） */
  description: string;
}

export const REFINE_SYSTEM = `你是资深小学/初中教研员兼产品经理。用户会用口语描述想做的交互教具，你要整理成给前端工程师用的「标准需求说明」。

## 输出格式（严格遵守，不要 markdown，不要代码块）
第一行必须是：
【教具名称】（这里写不超过18个字的简短名称，不要书名号）

换行后写：
【需求规格】
然后换行，用有序列表或分段说明，必须包含：
1. 教学目标（学生要理解什么）
2. 界面与交互（画布区域展示什么、右侧有哪些控件、每个控件控制什么）
3. 数学/学科约束（数值范围、单位、是否需要标注）
4. 默认状态与重置行为

语言简洁、可执行，总字数建议 200～500 字。不要输出 HTML。`;

export function buildRefineUserPrompt(params: {
  gradeLabel: string;
  subjectLabel: string;
  userIntent: string;
}): string {
  return `年级：${params.gradeLabel}
学科：${params.subjectLabel}

用户原始想法：
${params.userIntent}

请按系统要求的格式输出【教具名称】与【需求规格】。`;
}

/** 解析整理阶段的模型输出；失败时用启发式兜底 */
export function parseRefinedSpecOutput(
  raw: string,
  userIntent: string,
): { name: string; spec: string } {
  const trimmed = raw.trim().replace(/^```[\s\S]*?\n?|```$/g, "");
  const nameLine = trimmed.match(/【教具名称】\s*([^\n\r]+)/);
  const specBlock = trimmed.match(/【需求规格】\s*([\s\S]+)/);
  let name = nameLine?.[1]?.trim() ?? "";
  let spec = specBlock?.[1]?.trim() ?? trimmed;

  if (!name || name.length > 50) {
    const first = userIntent.replace(/\s+/g, " ").trim().slice(0, 18);
    name = first.length > 0 ? first : "自定义教具";
  }
  if (!spec || spec.length < 20) {
    spec = trimmed.length >= 20 ? trimmed : userIntent.trim();
  }
  return { name: name.slice(0, 50), spec };
}

let _cachedSystemPrompt: string | null = null;

export function buildSystemPrompt(): string {
  if (!_cachedSystemPrompt) {
    _cachedSystemPrompt = `${ROLE_AND_RULES}

## 可用的 CSS 变量和类（edu-base.css）

${EDU_BASE_CSS}

${SKELETON_TEMPLATE}

${EXAMPLE_1}

${EXAMPLE_2}

${EXAMPLE_3}

${EDU_3D_API}

${EXAMPLE_4}`;
  }
  return _cachedSystemPrompt;
}

export function buildUserPrompt(params: GenerateParams): string {
  return `请制作一个交互式教具：

教具名称：${params.name}
适用年级：${params.gradeLabel}
学科：${params.subjectLabel}
章节：${params.chapter}
教学目标与功能需求（已整理，请严格按此实现）：
${params.description}

## 编码前请想清楚（不要输出思考过程，直接输出最终 HTML）
1. 这是几何/空间类需求吗？是 → 用 Three.js + edu-3d.js（见 3D API 文档）；否 → 用 Canvas 2D
2. 需要几个画布？对比并排还是单画布？
3. 每个控件控制什么参数？范围多大？步长多少？
4. 数值变化时画布怎样立刻响应？
5. 结论区域展示什么推导过程？怎样让老师一眼看到数学关系？
6. info-box 应该总结哪些核心知识点？

## 实现要求
1. 符合${params.gradeLabel}学生的认知水平，界面简洁直观
2. 至少 3 个交互控件（滑块+按钮+预设的组合）
3. 拖动滑块时 Canvas 实时响应，做到「拖即见」
4. 至少 2 个预设按钮（快速跳转到典型参数值）
5. 控制面板的值显示必须实时同步
6. 自动推导并展示数学结论（不只是静态图形，要有推导过程）
7. Canvas 绘制函数拆分清晰，变量命名有意义
8. 包含 resetAll() 重置函数和工具栏重置按钮
9. 右侧控制面板底部添加 info-box，用中文说明 4-6 个核心要点
10. 直接输出完整 HTML，不要输出任何解释文字`;
}
