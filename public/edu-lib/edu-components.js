/**
 * 教立方 EduCube — 教具组件框架
 * 提供声明式 API，供 edu-renderer.js 和手工教具共用。
 *
 * 使用方式：
 *   <script src="../edu-lib/edu-components.js"></script>
 *   var tool = EduComp.create(spec);
 */

var EduComp = (function () {
  'use strict';

  /* ──────────────────────────────────────
   * 1. 工具骨架创建
   * ────────────────────────────────────── */

  /**
   * 根据声明式 spec 创建完整教具 DOM。
   * @param {object} spec - 见 edu-renderer.js 中的 JSON Spec 规范
   * @returns {{ el: HTMLElement, state: object, controls: object }}
   */
  function create(spec) {
    var state = {};   // 绑定控件的响应式状态
    var controls = {}; // 控件引用集合
    var drawFn = null; // 当前画布绘制函数

    // ── 根容器 ──
    var root = document.createElement('div');
    root.className = 'edu-tool';
    root.innerHTML = '';

    // ── Toolbar ──
    var toolbar = document.createElement('div');
    toolbar.className = 'edu-toolbar';
    toolbar.innerHTML =
      '<div class="edu-toolbar-lead">' +
        '<span class="edu-toolbar-title">' + esc(spec.title || '教具') + '</span>' +
        '<span class="edu-toolbar-subtitle">' + esc(spec.subtitle || '') + '</span>' +
      '</div>' +
      '<div class="edu-toolbar-actions" id="_actions"></div>';
    root.appendChild(toolbar);

    // ── Content ──
    var content = document.createElement('div');
    content.className = 'edu-content';
    var layout = document.createElement('div');
    layout.className = 'main-layout';
    layout.style.cssText = 'display:grid;grid-template-columns:1fr ' + (spec.panelWidth || 260) + 'px;height:100%;';

    // ── Canvas Area ──
    var canvasArea = document.createElement('div');
    canvasArea.className = 'canvas-area';
    canvasArea.style.cssText = 'padding:24px;overflow-y:auto;background:linear-gradient(135deg,' +
      (spec.bgGradient || 'var(--edu-bg),#fff') + ');display:flex;flex-direction:column;align-items:center;';
    layout.appendChild(canvasArea);

    // ── Control Panel ──
    var panel = document.createElement('div');
    panel.className = 'control-panel';
    panel.style.cssText = 'background:#fdfaf4;border-left:1px solid var(--edu-border);padding:14px;display:flex;flex-direction:column;gap:12px;overflow:auto;';
    layout.appendChild(panel);

    content.appendChild(layout);
    root.appendChild(content);

    // ── 注入到 body ──
    document.body.innerHTML = '';
    document.body.appendChild(root);

    return {
      el: root,
      state: state,
      controls: controls,
      canvasArea: canvasArea,
      panel: panel,
      actions: toolbar.querySelector('#_actions'),
      setState: function (key, val) {
        state[key] = val;
        if (drawFn) drawFn(state);
      },
      onDraw: function (fn) { drawFn = fn; },
      redraw: function () { if (drawFn) drawFn(state); }
    };
  }

  /* ──────────────────────────────────────
   * 2. 控件工厂
   * ────────────────────────────────────── */

  /**
   * 添加滑块控件
   * @param {HTMLElement} container
   * @param {object} opts - { id, label, min, max, step, value, color, format }
   * @param {function} onChange - callback(value, state)
   * @param {object} state - 共享状态对象
   */
  function addSlider(container, opts, onChange, state) {
    var section = document.createElement('div');
    section.className = 'ctrl-section';

    if (opts.label) {
      var label = document.createElement('div');
      label.className = 'ctrl-label';
      label.textContent = opts.label;
      section.appendChild(label);
    }

    var row = document.createElement('div');
    row.className = 'slider-row';

    var input = document.createElement('input');
    input.type = 'range';
    input.id = opts.id;
    input.min = opts.min || 0;
    input.max = opts.max || 100;
    input.step = opts.step || 1;
    input.value = opts.value != null ? opts.value : opts.min || 0;

    var valSpan = document.createElement('span');
    valSpan.className = 'val';
    valSpan.id = opts.id + '-val';
    valSpan.style.color = opts.color || '';
    valSpan.textContent = formatVal(input.value, opts.format);

    row.appendChild(input);
    row.appendChild(valSpan);
    section.appendChild(row);
    container.appendChild(section);

    // 初始化状态
    state[opts.id] = parseFloat(input.value);

    // 绑定事件
    input.addEventListener('input', function () {
      var v = parseFloat(this.value);
      // 动态最大值支持（如分子不超过分母）
      if (opts.maxExpr && state[opts.maxExpr]) {
        var dynamicMax = state[opts.maxExpr];
        if (v > dynamicMax) { v = dynamicMax; this.value = v; }
        input.max = dynamicMax;
      }
      state[opts.id] = v;
      valSpan.textContent = formatVal(v, opts.format);
      if (onChange) onChange(v, state);
    });

    return { input: input, display: valSpan };
  }

  /**
   * 添加预设按钮组
   * @param {HTMLElement} container
   * @param {object} opts - { label, items: [{label, values: {key: val}}] }
   * @param {function} onSelect - callback(values, state)
   * @param {object} state
   * @param {object} sliderRefs - 滑块引用映射，用于联动更新
   */
  function addPresets(container, opts, onSelect, state, sliderRefs) {
    var section = document.createElement('div');
    section.className = 'ctrl-section';

    if (opts.label) {
      var label = document.createElement('div');
      label.className = 'ctrl-label';
      label.textContent = opts.label;
      section.appendChild(label);
    }

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:4px;';

    opts.items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = item.label;
      btn.addEventListener('click', function () {
        // 更新滑块值
        if (item.values && sliderRefs) {
          Object.keys(item.values).forEach(function (key) {
            var v = item.values[key];
            state[key] = v;
            if (sliderRefs[key]) {
              sliderRefs[key].input.value = v;
              sliderRefs[key].display.textContent = formatVal(v, sliderRefs[key].format);
            }
          });
        }
        if (onSelect) onSelect(item.values || {}, state);
      });
      btnRow.appendChild(btn);
    });

    section.appendChild(btnRow);
    container.appendChild(section);
  }

  /**
   * 添加标签页切换
   * @param {HTMLElement} container
   * @param {object} opts - { tabs: [{id, label}], onChange }
   * @param {function} onChange - callback(tabId, state)
   * @param {object} state
   */
  function addTabs(container, opts, onChange, state) {
    var tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    tabBar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';

    opts.tabs.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.dataset.tab = tab.id;
      btn.textContent = tab.label;
      if (tab.active) btn.classList.add('active');
      btn.addEventListener('click', function () {
        tabBar.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state._activeTab = tab.id;
        if (onChange) onChange(tab.id, state);
      });
      tabBar.appendChild(btn);
    });

    container.appendChild(tabBar);
    if (opts.tabs.length > 0) state._activeTab = opts.tabs[0].id;
    return tabBar;
  }

  /**
   * 添加模式切换按钮组（互斥选中）
   * @param {HTMLElement} container
   * @param {object} opts - { label, items: [{id, label}], multiple: false }
   * @param {function} onChange
   * @param {object} state
   */
  function addToggle(container, opts, onChange, state) {
    var section = document.createElement('div');
    section.className = 'ctrl-section';

    if (opts.label) {
      var label = document.createElement('div');
      label.className = 'ctrl-label';
      label.textContent = opts.label;
      section.appendChild(label);
    }

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';

    opts.items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.textContent = item.label;
      btn.dataset.id = item.id;
      btn.addEventListener('click', function () {
        if (opts.multiple) {
          btn.classList.toggle('active');
        } else {
          row.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        }
        var selected = opts.multiple
          ? Array.from(row.querySelectorAll('.mode-btn.active')).map(function (b) { return b.dataset.id; })
          : item.id;
        state[opts.id || '_toggle'] = selected;
        if (onChange) onChange(selected, state);
      });
      section.appendChild(row);
      row.appendChild(btn);
    });

    container.appendChild(section);
  }

  /**
   * 添加操作按钮到 toolbar
   * @param {HTMLElement} actionsEl - toolbar actions 容器
   * @param {object} opts - { label, type: 'primary'|'accent'|'outline', onClick }
   */
  function addToolbarButton(actionsEl, opts) {
    var btn = document.createElement('button');
    btn.className = 'edu-btn edu-btn-' + (opts.type || 'outline');
    btn.textContent = opts.label;
    btn.addEventListener('click', function () {
      if (opts.onClick) opts.onClick();
    });
    actionsEl.appendChild(btn);
    return btn;
  }

  /**
   * 添加分隔线
   */
  function addDivider(container) {
    var d = document.createElement('div');
    d.className = 'divider';
    d.style.cssText = 'height:1px;background:var(--edu-border);';
    container.appendChild(d);
  }

  /**
   * 添加信息卡片
   * @param {HTMLElement} container
   * @param {object} opts - { title, points: string[], borderColor }
   */
  function addInfoBox(container, opts) {
    var box = document.createElement('div');
    box.className = 'info-box';
    if (opts.borderColor) {
      box.style.border = '1px solid ' + opts.borderColor;
    }

    var html = '';
    if (opts.title) html += '<strong>' + esc(opts.title) + '</strong><br/>';
    if (opts.points) {
      opts.points.forEach(function (p) {
        html += '● ' + esc(p) + '<br/>';
      });
    }
    box.innerHTML = html;
    container.appendChild(box);
    return box;
  }

  /* ──────────────────────────────────────
   * 3. Canvas 2D 绘图函数库
   * ────────────────────────────────────── */

  var draw = {
    /** 设置高清 Canvas */
    setup: function (canvas, w, h) {
      var dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      return ctx;
    },

    /** 分数圆形 */
    fractionCircle: function (ctx, cx, cy, r, den, num, color, bgColor) {
      color = color || '#f9a8d4';
      bgColor = bgColor || '#f1f5f9';
      for (var i = 0; i < den; i++) {
        var a1 = -Math.PI / 2 + (i / den) * Math.PI * 2;
        var a2 = -Math.PI / 2 + ((i + 1) / den) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a1, a2);
        ctx.closePath();
        ctx.fillStyle = i < num ? color : bgColor;
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },

    /** 分数条 */
    fractionBar: function (ctx, x, y, w, h, den, num, color, bgColor) {
      color = color || '#f9a8d4';
      bgColor = bgColor || '#f1f5f9';
      for (var i = 0; i < den; i++) {
        var bx = x + i * (w / den);
        ctx.fillStyle = i < num ? color : bgColor;
        ctx.fillRect(bx, y, w / den, h);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, y, w / den, h);
      }
    },

    /** 数轴 */
    numberLine: function (ctx, x, y, w, from, to, step, marks, opts) {
      opts = opts || {};
      ctx.save();
      ctx.strokeStyle = opts.lineColor || '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();

      // 箭头
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w - 8, y - 5);
      ctx.lineTo(x + w - 8, y + 5);
      ctx.closePath();
      ctx.fillStyle = opts.lineColor || '#334155';
      ctx.fill();

      var stepVal = step || 1;
      var pxPerUnit = w / (to - from);
      ctx.fillStyle = opts.textColor || '#334155';
      ctx.font = (opts.fontSize || 12) + 'px sans-serif';
      ctx.textAlign = 'center';

      for (var v = from; v <= to; v += stepVal) {
        var px = x + (v - from) * pxPerUnit;
        ctx.beginPath();
        ctx.moveTo(px, y - 6);
        ctx.lineTo(px, y + 6);
        ctx.stroke();
        ctx.fillText(v, px, y + 20);
      }

      // 高亮标记
      if (marks && marks.length) {
        marks.forEach(function (m) {
          var px = x + (m.value - from) * pxPerUnit;
          ctx.beginPath();
          ctx.arc(px, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = m.color || '#ef4444';
          ctx.fill();
        });
      }
      ctx.restore();
    },

    /** 网格 */
    grid: function (ctx, x, y, cols, rows, cellSize, opts) {
      opts = opts || {};
      ctx.save();
      // 背景
      ctx.fillStyle = opts.bg || '#fff';
      ctx.fillRect(x, y, cols * cellSize, rows * cellSize);

      // 高亮格子
      if (opts.highlights) {
        opts.highlights.forEach(function (h) {
          ctx.fillStyle = h.color || '#bbf7d0';
          ctx.fillRect(x + h.col * cellSize, y + h.row * cellSize, cellSize, cellSize);
        });
      }

      // 网格线
      ctx.strokeStyle = opts.lineColor || '#94a3b8';
      ctx.lineWidth = 1;
      for (var c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(x + c * cellSize, y);
        ctx.lineTo(x + c * cellSize, y + rows * cellSize);
        ctx.stroke();
      }
      for (var r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(x, y + r * cellSize);
        ctx.lineTo(x + cols * cellSize, y + r * cellSize);
        ctx.stroke();
      }
      ctx.restore();
    },

    /** 柱状图 */
    barChart: function (ctx, x, y, w, h, data, opts) {
      opts = opts || {};
      var barW = w / data.length - 4;
      var maxVal = opts.maxVal || Math.max.apply(null, data.map(function (d) { return d.value; }));

      ctx.save();
      data.forEach(function (d, i) {
        var bx = x + i * (w / data.length) + 2;
        var bh = (d.value / maxVal) * h;
        var by = y + h - bh;
        ctx.fillStyle = d.color || opts.color || '#3b82f6';
        ctx.fillRect(bx, by, barW, bh);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, bh);

        // 标签
        ctx.fillStyle = '#334155';
        ctx.font = (opts.fontSize || 11) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label || '', bx + barW / 2, y + h + 16);
        ctx.fillText(d.value, bx + barW / 2, by - 6);
      });
      ctx.restore();
    },

    /** 角度弧 */
    angleArc: function (ctx, cx, cy, r, degrees, opts) {
      opts = opts || {};
      ctx.save();
      // 基准线
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();

      // 角度弧
      var rad = degrees * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r * 0.4, 0, -rad, true);
      ctx.closePath();
      ctx.fillStyle = opts.fillColor || 'rgba(59,130,246,0.15)';
      ctx.fill();
      ctx.strokeStyle = opts.strokeColor || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 角度值
      var mid = -rad / 2;
      var tx = cx + Math.cos(mid) * r * 0.55;
      var ty = cy + Math.sin(mid) * r * 0.55;
      ctx.fillStyle = opts.textColor || '#3b82f6';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(degrees + '°', tx, ty);

      // 终边
      ctx.strokeStyle = opts.lineColor || '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-rad) * r, cy + Math.sin(-rad) * r);
      ctx.stroke();
      ctx.restore();
    },

    /** 长方形（带标注） */
    labeledRect: function (ctx, x, y, w, h, opts) {
      opts = opts || {};
      ctx.save();
      ctx.fillStyle = opts.fill || '#eff6ff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = opts.stroke || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      if (opts.labels) {
        ctx.fillStyle = opts.textColor || '#1e293b';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        // 底边
        if (opts.labels.bottom) ctx.fillText(opts.labels.bottom, x + w / 2, y + h + 18);
        // 右边
        if (opts.labels.right) {
          ctx.save();
          ctx.translate(x + w + 18, y + h / 2);
          ctx.fillText(opts.labels.right, 0, 0);
          ctx.restore();
        }
        // 面积
        if (opts.labels.center) {
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(opts.labels.center, x + w / 2, y + h / 2 + 6);
        }
      }
      ctx.restore();
    }
  };

  /* ──────────────────────────────────────
   * 4. 工具函数
   * ────────────────────────────────────── */

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatVal(v, fmt) {
    if (fmt === 'int') return Math.round(v);
    if (typeof fmt === 'number') return Number(v).toFixed(fmt);
    if (typeof fmt === 'function') return fmt(v);
    return String(v);
  }

  return {
    create: create,
    addSlider: addSlider,
    addPresets: addPresets,
    addTabs: addTabs,
    addToggle: addToggle,
    addToolbarButton: addToolbarButton,
    addDivider: addDivider,
    addInfoBox: addInfoBox,
    draw: draw
  };
})();
