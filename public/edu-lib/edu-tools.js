/**
 * 教立方 EduCube — 教具公共工具函数库
 */

/**
 * 让元素可拖拽（鼠标 + 触摸）
 * @param {HTMLElement} el - 可拖拽元素（或带 .drag-handle 子元素的容器）
 * @param {HTMLElement} [container] - 限制在容器内
 */
function makeDraggable(el, container) {
  const handle = el.querySelector(".drag-handle") || el;
  let startX, startY, origX, origY;

  function getPos(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    e.preventDefault();
    const pos = getPos(e);
    startX = pos.x;
    startY = pos.y;
    const rect = el.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    const pos = getPos(e);
    let nx = origX + (pos.x - startX);
    let ny = origY + (pos.y - startY);

    if (container) {
      const cr = container.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      nx = Math.max(cr.left, Math.min(cr.right - er.width, nx));
      ny = Math.max(cr.top, Math.min(cr.bottom - er.height, ny));
    }

    el.style.position = "fixed";
    el.style.left = nx + "px";
    el.style.top = ny + "px";
    el.style.margin = "0";
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
    const val = parseFloat(slider.value);
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
function fmt(n, decimals = 0) {
  return Number(n).toFixed(decimals);
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
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
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
function drawGrid(ctx, w, h, step, color = "#e2e8f0") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
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
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}
