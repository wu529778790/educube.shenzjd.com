/**
 * 教立方 EduCube — 教具公共工具函数库
 */

/**
 * 让元素可拖拽（鼠标 + 触摸）
 */
function makeDraggable(el, container) {
  var handle = el.querySelector(".drag-handle") || el;
  var startX, startY, origX, origY;

  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    if (e.target.closest('input, button, select, textarea, .quiz-opt, a')) return;
    e.preventDefault();
    var pos = getPos(e);
    startX = pos.x;
    startY = pos.y;
    var rect = el.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    var pos = getPos(e);
    var nx = origX + (pos.x - startX);
    var ny = origY + (pos.y - startY);
    var ew = el.offsetWidth;
    var eh = el.offsetHeight;
    nx = Math.max(0, Math.min(window.innerWidth - ew, nx));
    ny = Math.max(0, Math.min(window.innerHeight - eh, ny));
    el.style.left = nx + "px";
    el.style.top = ny + "px";
    el.style.right = "auto";
  }

  function onEnd() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchend", onEnd);
  }

  handle.addEventListener("mousedown", onStart);
  handle.addEventListener("touchstart", onStart, { passive: false });
  handle.style.cursor = "grab";
}

function bindSlider(slider, display, onChange, format) {
  function update() {
    var val = parseFloat(slider.value);
    if (display) display.textContent = format ? format(val) : String(val);
    if (onChange) onChange(val);
  }
  slider.addEventListener("input", update);
  update();
}

function fmt(n, decimals) {
  return Number(n).toFixed(decimals || 0);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function debounce(fn, delay) {
  var timer;
  return function () {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

function drawGrid(ctx, w, h, step, color) {
  ctx.save();
  ctx.strokeStyle = color || "#e2e8f0";
  ctx.lineWidth = 0.5;
  for (var x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (var y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function setupCanvas(canvas) {
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx: ctx, w: rect.width, h: rect.height };
}

/* ═══════════════════════════════════════════════════════════════
   课堂大屏触屏模式初始化
   ═══════════════════════════════════════════════════════════════ */
function initClassroomTool() {
  var panel = document.querySelector(".control-panel") || document.querySelector(".panel");
  if (!panel) return;

  // Drag handle
  if (!panel.querySelector(".drag-handle")) {
    var handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerHTML = '<span class="drag-handle-icon">⠿</span> 拖动移动';
    panel.insertBefore(handle, panel.firstChild);
  }
  makeDraggable(panel);

  // Collapse/expand toggle
  if (!document.querySelector(".panel-toggle")) {
    var toggleBtn = document.createElement("div");
    toggleBtn.className = "panel-toggle";
    toggleBtn.innerHTML = "📋";
    toggleBtn.title = "显示控制面板";
    document.body.appendChild(toggleBtn);

    var collapsed = false;
    toggleBtn.addEventListener("click", function () {
      collapsed = !collapsed;
      panel.style.display = collapsed ? "none" : "";
      toggleBtn.innerHTML = collapsed ? "📋" : "✕";
      toggleBtn.title = collapsed ? "显示控制面板" : "隐藏控制面板";
      toggleBtn.classList.toggle("visible", collapsed);
      window.dispatchEvent(new Event("resize"));
    });
  }

  // Close button
  if (!panel.querySelector(".panel-close-btn")) {
    var closeBtn = document.createElement("button");
    closeBtn.className = "panel-close-btn";
    closeBtn.innerHTML = "✕";
    closeBtn.title = "隐藏面板";
    closeBtn.addEventListener("click", function () {
      panel.style.display = "none";
      var tb = document.querySelector(".panel-toggle");
      if (tb) tb.classList.add("visible");
      window.dispatchEvent(new Event("resize"));
    });
    panel.style.position = "fixed";
    panel.appendChild(closeBtn);
  }

  // Fullscreen button in toolbar
  var toolbar = document.querySelector(".edu-toolbar-actions");
  if (toolbar && !toolbar.querySelector(".fullscreen-btn")) {
    var fsBtn = document.createElement("button");
    fsBtn.className = "edu-btn edu-btn-outline fullscreen-btn";
    fsBtn.innerHTML = "⛶ 全屏";
    fsBtn.title = "切换全屏模式";
    fsBtn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
        fsBtn.innerHTML = "✕ 退出全屏";
      } else {
        document.exitFullscreen();
        fsBtn.innerHTML = "⛶ 全屏";
      }
    });
    document.addEventListener("fullscreenchange", function () {
      fsBtn.innerHTML = document.fullscreenElement ? "✕ 退出全屏" : "⛶ 全屏";
    });
    toolbar.appendChild(fsBtn);
  }

  // Intercept reset buttons to add confirmation
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".edu-btn, .unfold-btn, .reset-btn");
    if (!btn) return;
    var text = (btn.textContent || "").trim();
    if (text !== "重置" && text !== "清空") return;
    // Check if there's meaningful state to lose
    var hasState = checkHasState();
    if (hasState) {
      if (!confirm("确定要" + text + "吗？当前操作将不会被保存。")) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }
  }, true);

  // Show first-use help overlay
  showHelpOverlay();
}

function showHelpOverlay() {
  if (localStorage.getItem('edu-help-seen')) return;

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:16px;padding:20px;max-width:400px;width:90%;z-index:10000;font-size:16px;line-height:2;text-align:center;color:#334155;box-shadow:0 8px 32px rgba(0,0,0,0.2);';

  var msg = document.createElement('div');
  msg.innerHTML = '拖拽旋转3D模型 · 滚轮/双指缩放<br/>点击按钮切换模式<br/>点击📋按钮显示/隐藏控制面板';
  msg.style.marginBottom = '16px';

  var btn = document.createElement('button');
  btn.textContent = '知道了';
  btn.style.cssText = 'padding:10px 32px;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;background:#3b82f6;color:#fff;font-family:var(--edu-font);';
  btn.addEventListener('click', function () {
    document.body.removeChild(overlay);
    localStorage.setItem('edu-help-seen', '1');
  });

  function onEsc(e) {
    if (e.key === 'Escape') {
      if (overlay.parentNode) document.body.removeChild(overlay);
      localStorage.setItem('edu-help-seen', '1');
      document.removeEventListener('keydown', onEsc);
    }
  }
  document.addEventListener('keydown', onEsc);

  modal.appendChild(msg);
  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function checkHasState() {
  // Check for common state indicators
  var sliders = document.querySelectorAll('input[type="range"]');
  for (var i = 0; i < sliders.length; i++) {
    var s = sliders[i];
    if (s.defaultValue !== s.value) return true;
  }
  // Check for non-empty text inputs
  var inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
  for (var j = 0; j < inputs.length; j++) {
    if (inputs[j].value && inputs[j].value !== inputs[j].defaultValue) return true;
  }
  return false;
}

// Auto-initialize
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClassroomTool);
  } else {
    initClassroomTool();
  }
}
