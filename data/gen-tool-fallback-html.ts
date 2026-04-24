import type { Tool } from "@/data/tools";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 当 `public/tools/gen/{id}.html` 缺失时写入的默认可运行教具（长方体/正方体三向滑条 + 体积）。
 * 静态资源使用绝对路径，避免依赖具体的承载路由层级。
 */
export function buildGeneratedToolFallbackHtml(tool: Tool): string {
  const title = escapeHtml(tool.name);
  const subtitle = escapeHtml(tool.subtitle || tool.chapter || "交互演示");
  const descShort = escapeHtml(
    tool.description.length > 600
      ? tool.description.slice(0, 600) + "…"
      : tool.description,
  );
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title} — 教立方</title>
<link rel="stylesheet" href="/edu-lib/edu-base.css"/>
<script src="/edu-lib/three.min.js"></script>
<script src="/edu-lib/OrbitControls.js"></script>
<script src="/edu-lib/edu-3d.js"></script>
<style>
  .main-layout { display:grid; grid-template-columns:1fr minmax(260px,300px); height:100%; }
  .canvas-area { position:relative; background:linear-gradient(135deg,#eff6ff,#dbeafe); overflow:hidden; }
  .canvas-area canvas { width:100%; height:100%; display:block; }
  .control-panel { background:#fff; border-left:1px solid #e2e8f0; padding:14px; display:flex; flex-direction:column; gap:10px; overflow:auto; }
  .ctrl-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:.04em; }
  .slider-row { display:flex; align-items:center; gap:8px; }
  .slider-row label { font-size:12px; font-weight:600; color:#64748b; min-width:36px; }
  .slider-row input[type=range] { flex:1; }
  .slider-row .val { font-size:13px; font-weight:700; color:#2563EB; min-width:40px; text-align:right; }
  .info-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; font-size:11px; color:#475569; line-height:1.65; max-height:28vh; overflow:auto; white-space:pre-wrap; }
  .orbit-hint { position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(255,255,255,.88); padding:6px 12px; border-radius:18px; font-size:11px; color:#64748b; pointer-events:none; }
</style>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar">
    <div class="edu-toolbar-lead">
      <span class="edu-toolbar-title">${escapeHtml(tool.icon)} ${title}</span>
      <span class="edu-toolbar-subtitle">${subtitle}</span>
    </div>
    <div class="edu-toolbar-actions">
      <button type="button" class="edu-btn edu-btn-outline" onclick="resetAll()">重置</button>
    </div>
  </div>
  <div class="edu-content">
    <div class="main-layout">
      <div class="canvas-area">
        <canvas id="c3d"></canvas>
        <div class="orbit-hint">拖拽旋转 · 滚轮缩放</div>
      </div>
      <div class="control-panel">
        <div class="ctrl-label">尺寸（厘米，示意缩放显示）</div>
        <div class="slider-row"><label>长</label><input type="range" id="sl" min="2" max="100" value="10" oninput="rebuild()"/><span class="val" id="vl">10</span><span>cm</span></div>
        <div class="slider-row"><label>宽</label><input type="range" id="sw" min="2" max="100" value="10" oninput="rebuild()"/><span class="val" id="vw">10</span><span>cm</span></div>
        <div class="slider-row"><label>高</label><input type="range" id="sh" min="2" max="100" value="10" oninput="rebuild()"/><span class="val" id="vh">10</span><span>cm</span></div>
        <div class="ctrl-label">体积</div>
        <p style="font-size:18px;font-weight:800;color:#1d4ed8" id="vol">1000 立方厘米</p>
        <div class="ctrl-label">说明</div>
        <div class="info-box">${descShort}</div>
      </div>
    </div>
  </div>
</div>
<script>
var _scene, _camera, _renderer, _controls, _mesh, _edges;
function cmToScene(cm) { return cm * 0.08; }
function init() {
  var canvas = document.getElementById("c3d");
  var r = Edu3D.createScene(canvas, { bg: 0xf0f5ff, camX: 7, camY: 5, camZ: 7 });
  _scene = r.scene; _camera = r.camera; _renderer = r.renderer; _controls = r.controls;
  Edu3D.addLights(_scene);
  Edu3D.addGrid(_scene, 14, 14);
  rebuild();
  Edu3D.startLoop(_scene, _camera, _renderer, _controls);
}
function rebuild() {
  var lc = parseFloat(document.getElementById("sl").value);
  var wc = parseFloat(document.getElementById("sw").value);
  var hc = parseFloat(document.getElementById("sh").value);
  document.getElementById("vl").textContent = String(lc);
  document.getElementById("vw").textContent = String(wc);
  document.getElementById("vh").textContent = String(hc);
  document.getElementById("vol").textContent = (lc * wc * hc).toFixed(0) + " 立方厘米";
  var l = cmToScene(lc), w = cmToScene(wc), h = cmToScene(hc);
  if (_mesh) { _scene.remove(_mesh); _mesh.geometry.dispose(); _mesh.material.dispose(); }
  if (_edges) { _scene.remove(_edges); _edges.geometry.dispose(); _edges.material.dispose(); }
  var geo = new THREE.BoxGeometry(l, h, w);
  geo.translate(0, h / 2, 0);
  var mat = new THREE.MeshLambertMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.92 });
  _mesh = new THREE.Mesh(geo, mat);
  _mesh.castShadow = true;
  _scene.add(_mesh);
  var em = new THREE.LineBasicMaterial({ color: 0x1e293b, linewidth: 1 });
  _edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), em);
  _scene.add(_edges);
}
function resetAll() {
  document.getElementById("sl").value = "10";
  document.getElementById("sw").value = "10";
  document.getElementById("sh").value = "10";
  rebuild();
}
init();
</script>
</body>
</html>`;
}
