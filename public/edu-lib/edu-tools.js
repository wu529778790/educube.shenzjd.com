/**
 * 教立方 EduCube — 教具公共工具函数库
 */

/**
 * 让元素可拖拽（鼠标 + 触摸）
 * @param {HTMLElement} el - 可拖拽元素（或带 .drag-handle 子元素的容器）
 * @param {HTMLElement} [container] - 限制在容器内
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
    // Don't drag if touching interactive elements inside the panel
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

    // Keep panel within viewport
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

/**
 * 绑定滑块到显示元素，并在变化时回调
 * @param {HTMLInputElement} slider
 * @param {HTMLElement} display - 显示当前值的元素
 * @param {function} [onChange] - 值变化回调，接收 number
 * @param {function} [format] - 格式化显示值，默认 toString
 */
function bindSlider(slider, display, onChange, format) {
  function update() {
    var val = parseFloat(slider.value);
    if (display) display.textContent = format ? format(val) : String(val);
    if (onChange) onChange(val);
  }
  slider.addEventListener("input", update);
  update();
}

/**
 * 格式化数字（保留小数位）
 * @param {number} n
 * @param {number} [decimals=0]
 * @returns {string}
 */
function fmt(n, decimals) {
  return Number(n).toFixed(decimals || 0);
}

/**
 * 将角度转弧度
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * 线性插值
 * @param {number} a
 * @param {number} b
 * @param {number} t 0~1
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 防抖
 * @param {function} fn
 * @param {number} delay ms
 */
function debounce(fn, delay) {
  var timer;
  return function () {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

/**
 * 在 canvas 上画网格
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w 宽
 * @param {number} h 高
 * @param {number} step 格子大小
 * @param {string} [color]
 */
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

/**
 * 创建响应式 canvas（处理 devicePixelRatio）
 * @param {HTMLCanvasElement} canvas
 * @returns {{ ctx: CanvasRenderingContext2D, w: number, h: number }}
 */
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
   所有教具默认启用：控制面板浮动、可拖拽、可折叠
   ═══════════════════════════════════════════════════════════════ */
function initClassroomTool() {
  // Find the control panel (support both .control-panel and .panel)
  var panel = document.querySelector(".control-panel") || document.querySelector(".panel");
  if (!panel) return;

  // Add drag handle at the top of the panel (only if not already present)
  if (!panel.querySelector(".drag-handle")) {
    var handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerHTML = '<span class="drag-handle-icon">⠿</span> 拖动移动';
    panel.insertBefore(handle, panel.firstChild);
  }

  // Make the panel draggable
  makeDraggable(panel);

  // Add collapse/expand toggle button (only if not already present)
  if (!document.querySelector(".panel-toggle")) {
    var toggleBtn = document.createElement("div");
    toggleBtn.className = "panel-toggle";
    toggleBtn.innerHTML = "⚙";
    toggleBtn.title = "显示控制面板";
    document.body.appendChild(toggleBtn);

    var collapsed = false;
    toggleBtn.addEventListener("click", function () {
      collapsed = !collapsed;
      panel.style.display = collapsed ? "none" : "";
      toggleBtn.innerHTML = collapsed ? "⚙" : "✕";
      toggleBtn.title = collapsed ? "显示控制面板" : "隐藏控制面板";
      toggleBtn.classList.toggle("visible", collapsed);
      window.dispatchEvent(new Event("resize"));
    });
  }

  // Add close button at top-right of panel (only if not already present)
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
}

// Auto-initialize when edu-tools.js is loaded
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClassroomTool);
  } else {
    initClassroomTool();
  }
}
