/**
 * 教立方 EduCube — 声明式渲染器
 * 将 JSON Spec 渲染为完整教具页面。
 *
 * 使用方式：
 *   <script src="../edu-lib/edu-base.css"></script>   (或 link)
 *   <script src="../edu-lib/edu-components.js"></script>
 *   <script src="../edu-lib/edu-renderer.js"></script>
 *   <script>
 *     EduRender.run({
 *       title: "分数的初步认识",
 *       subtitle: "上册 · 第八单元",
 *       ...
 *     });
 *   </script>
 *
 * 或者用 custom draw 函数：
 *   EduRender.run(spec, function(state) { ... });
 */

var EduRender = (function () {
  'use strict';

  /**
   * JSON Spec 规范：
   *
   * {
   *   title: string,           // 工具栏标题
   *   subtitle: string,        // 工具栏副标题
   *   icon: string,            // 标题前的 emoji（可选）
   *   bgGradient: string,      // 画布区渐变色（可选，如 "#fdf2f8,#fce7f3"）
   *   panelWidth: number,      // 控制面板宽度（可选，默认 260）
   *   themeColor: string,      // 主色调（可选，如 "#EC4899"）
   *
   *   // ── 渲染模式 ──
   *   render: {
   *     type: "canvas2d" | "tabs" | "custom",
   *
   *     // type="canvas2d" 时：
   *     canvas: { width: 400, height: 300 },
   *     draw: function(ctx, w, h, state) { ... },    // 自定义绘制
   *     // 或者用预置 draw 指令：
   *     drawSteps: [
   *       { fn: "fractionCircle", params: [...] },
   *       ...
   *     ],
   *
   *     // type="tabs" 时：
   *     tabs: [
   *       { id: "explore", label: "认识分数", canvas: {w, h},
   *         draw: function(ctx, w, h, state) {...} },
   *       ...
   *     ]
   *   },
   *
   *   // ── 控件 ──
   *   controls: [
   *     { type: "slider", id: "den", label: "分母", min: 2, max: 8, value: 4 },
   *     { type: "presets", label: "预设分数",
   *       items: [{label:"½", values:{den:2,num:1}}, ...] },
   *     { type: "divider" },
   *     { type: "info", title: "分数的初步认识",
   *       points: ["把物体平均分成几份", ...] }
   *   ],
   *
   *   // ── 3D 模式 ──
   *   render: {
   *     type: "threejs",
   *     setup: function(scene, camera, renderer, controls, state) { ... },
   *     update: function(scene, state) { ... }
   *   },
   *
   *   // ── 工具栏按钮 ──
   *   actions: [
   *     { label: "重置", type: "outline", action: "reset" },
   *     { label: "操作", type: "primary", action: "custom" }
   *   ],
   *
   *   // ── 自定义逻辑 ──
   *   onInit: function(tool) { ... },
   *   onReset: function(state) { ... }
   * }
   */

  function run(spec, customDraw) {
    // 如果 spec 是字符串，尝试解析为 JSON
    if (typeof spec === 'string') {
      try { spec = JSON.parse(spec); } catch (e) {
        console.error('[EduRender] Invalid JSON spec:', e);
        return;
      }
    }

    // 用 customDraw 替换 spec.render.draw
    if (typeof customDraw === 'function') {
      if (!spec.render) spec.render = {};
      spec.render._customDraw = customDraw;
    }

    // 注入基础样式
    injectBaseCSS();

    // 创建骨架
    var tool = EduComp.create(spec);
    var state = tool.state;
    var sliderRefs = {};

    // ── 构建控件 ──
    if (spec.controls) {
      spec.controls.forEach(function (ctrl) {
        switch (ctrl.type) {
          case 'slider':
            var ref = EduComp.addSlider(tool.panel, ctrl, function () {
              tool.redraw();
            }, state);
            sliderRefs[ctrl.id] = { input: ref.input, display: ref.display, format: ctrl.format };
            break;

          case 'presets':
            EduComp.addPresets(tool.panel, ctrl, function () {
              tool.redraw();
            }, state, sliderRefs);
            break;

          case 'tabs':
            // 标签页放 canvas-area 内部
            EduComp.addTabs(tool.canvasArea, ctrl, function () {
              tool.redraw();
              updateTabPanels();
            }, state);
            break;

          case 'toggle':
            EduComp.addToggle(tool.panel, ctrl, function () {
              tool.redraw();
            }, state);
            break;

          case 'divider':
            EduComp.addDivider(tool.panel);
            break;

          case 'info':
            EduComp.addInfoBox(tool.panel, ctrl);
            break;
        }
      });
    }

    // ── 构建工具栏按钮 ──
    if (spec.actions) {
      spec.actions.forEach(function (act) {
        EduComp.addToolbarButton(tool.actions, {
          label: act.label,
          type: act.type || 'outline',
          onClick: function () {
            if (act.action === 'reset') {
              doReset(spec, state, sliderRefs);
              tool.redraw();
            } else if (act.action === 'custom' && act.onClick) {
              act.onClick(state);
              tool.redraw();
            }
          }
        });
      });
    } else {
      // 默认重置按钮
      EduComp.addToolbarButton(tool.actions, {
        label: '重置',
        type: 'outline',
        onClick: function () {
          doReset(spec, state, sliderRefs);
          tool.redraw();
        }
      });
    }

    // ── 渲染模式 ──
    var render = spec.render || {};
    var canvasMap = {}; // tabId → canvas

    if (render.type === 'threejs') {
      render3D(tool, spec, state);
    } else if (render.type === 'tabs') {
      renderTabs(tool, spec, state, canvasMap);
    } else {
      renderCanvas2D(tool, spec, state, null, canvasMap);
    }

    // ── 初始化回调 ──
    if (spec.onInit) spec.onInit(tool);

    return tool;
  }

  /* ── 2D Canvas 渲染 ── */

  function renderCanvas2D(tool, spec, state, tabId, canvasMap) {
    var render = spec.render;
    var cOpts = (tabId && render.tabs) ? findTab(render.tabs, tabId).canvas : render.canvas;
    var w = (cOpts && cOpts.width) || 400;
    var h = (cOpts && cOpts.height) || 300;

    var canvas = document.createElement('canvas');
    canvas.id = tabId ? 'cvs-' + tabId : 'cvs';
    canvas.style.cssText = 'border-radius:12px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.06);';
    tool.canvasArea.appendChild(canvas);

    var ctx = EduComp.draw.setup(canvas, w, h);
    canvasMap[tabId || '_default'] = { canvas: canvas, ctx: ctx, w: w, h: h };

    // 绑定绘制
    tool.onDraw(function (st) {
      var activeTab = st._activeTab;
      // 如果是 tabs 模式，只绘制当前 tab 的 canvas
      if (render.type === 'tabs' && activeTab !== tabId) return;

      ctx.clearRect(0, 0, w, h);

      if (render._customDraw) {
        render._customDraw(ctx, w, h, st);
      } else if (render.draw && typeof render.draw === 'function') {
        render.draw(ctx, w, h, st);
      } else if (tabId && render.tabs) {
        var tab = findTab(render.tabs, tabId);
        if (tab && typeof tab.draw === 'function') tab.draw(ctx, w, h, st);
      } else if (render.drawSteps) {
        execDrawSteps(ctx, render.drawSteps, st, w, h);
      }
    });

    // 首次绘制
    tool.redraw();
  }

  /* ── Tabs 模式渲染 ── */

  function renderTabs(tool, spec, state, canvasMap) {
    var tabs = spec.render.tabs || [];
    var panels = {};

    // 为每个 tab 创建一个面板
    tabs.forEach(function (tab) {
      var panel = document.createElement('div');
      panel.id = 'panel-' + tab.id;
      panel.style.display = tab.id === state._activeTab ? '' : 'none';
      tool.canvasArea.appendChild(panel);
      panels[tab.id] = panel;

      // 在面板内创建 canvas
      var w = (tab.canvas && tab.canvas.width) || 400;
      var h = (tab.canvas && tab.canvas.height) || 300;
      var canvas = document.createElement('canvas');
      canvas.id = 'cvs-' + tab.id;
      canvas.style.cssText = 'border-radius:12px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.06);';
      panel.appendChild(canvas);

      var ctx = EduComp.draw.setup(canvas, w, h);
      canvasMap[tab.id] = { canvas: canvas, ctx: ctx, w: w, h: h };
    });

    // 处理结果展示区（如比较结果的文字）
    if (spec.render.resultArea) {
      var resultDiv = document.createElement('div');
      resultDiv.id = '_result';
      resultDiv.className = 'compare-row';
      resultDiv.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:22px;font-weight:800;font-family:Courier New,monospace;margin:8px 0;';
      tool.canvasArea.appendChild(resultDiv);
    }

    // 统一绘制函数
    tool.onDraw(function (st) {
      tabs.forEach(function (tab) {
        var panel = panels[tab.id];
        if (!panel) return;
        panel.style.display = tab.id === st._activeTab ? '' : 'none';

        if (tab.id === st._activeTab && typeof tab.draw === 'function') {
          var info = canvasMap[tab.id];
          if (info) {
            info.ctx.clearRect(0, 0, info.w, info.h);
            tab.draw(info.ctx, info.w, info.h, st);
          }
        }
      });

      // 更新结果区
      if (spec.render.resultArea && typeof spec.render.resultArea === 'function') {
        var rEl = document.getElementById('_result');
        if (rEl) rEl.innerHTML = spec.render.resultArea(state);
      }
    });

    tool.redraw();

    // Tab 切换时隐藏/显示面板
    window._tabPanels = panels;
  }

  function updateTabPanels() {
    if (!window._tabPanels) return;
    var activeTab = window._eduState && window._eduState._activeTab;
    Object.keys(window._tabPanels).forEach(function (id) {
      window._tabPanels[id].style.display = id === activeTab ? '' : 'none';
    });
  }

  /* ── 3D 渲染 ── */

  function render3D(tool, spec, state) {
    var canvas = document.createElement('canvas');
    canvas.id = 'c3d';
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    tool.canvasArea.style.padding = '0';
    tool.canvasArea.style.overflow = 'hidden';
    tool.canvasArea.appendChild(canvas);

    // 需要 Three.js 和 edu-3d.js
    if (typeof Edu3D === 'undefined') {
      tool.canvasArea.innerHTML = '<div style="padding:40px;color:#ef4444;font-size:16px;">错误：需要先加载 three.min.js、OrbitControls.js 和 edu-3d.js</div>';
      return;
    }

    var r = Edu3D.createScene(canvas, {
      bg: spec.render.bg || 0xf0f5ff,
      camX: spec.render.camX || 6,
      camY: spec.render.camY || 5,
      camZ: spec.render.camZ || 6
    });
    var scene = r.scene, camera = r.camera, renderer = r.renderer, controls = r.controls;

    Edu3D.addLights(scene);
    if (spec.render.showGrid !== false) Edu3D.addGrid(scene, 12, 12);

    // 用户定义的 3D setup
    if (spec.render.setup) spec.render.setup(scene, camera, renderer, controls, state);

    // 绑定更新
    tool.onDraw(function (st) {
      if (spec.render.update) spec.render.update(scene, st);
    });

    Edu3D.startLoop(scene, camera, renderer, controls, function () {
      // 每帧可以放动画逻辑
    });
  }

  /* ── Draw Steps 执行器 ── */

  function execDrawSteps(ctx, steps, state, w, h) {
    steps.forEach(function (step) {
      var fn = EduComp.draw[step.fn];
      if (!fn) { console.warn('[EduRender] Unknown draw fn:', step.fn); return; }

      // 替换参数中的 $var 引用
      var params = (step.params || []).map(function (p) {
        if (typeof p === 'string' && p.charAt(0) === '$') {
          var key = p.substring(1);
          return state[key] != null ? state[key] : 0;
        }
        return p;
      });

      // 特殊占位符
      params = params.map(function (p) {
        if (p === 'CENTER_X') return w / 2;
        if (p === 'CENTER_Y') return h / 2;
        if (p === 'WIDTH') return w;
        if (p === 'HEIGHT') return h;
        return p;
      });

      fn.apply(null, [ctx].concat(params));
    });
  }

  /* ── 重置 ── */

  function doReset(spec, state, sliderRefs) {
    if (spec.onReset) {
      spec.onReset(state);
      // 更新滑块显示
      Object.keys(sliderRefs).forEach(function (key) {
        var ref = sliderRefs[key];
        if (state[key] != null) {
          ref.input.value = state[key];
          ref.display.textContent = EduComp.draw._formatVal
            ? '' : String(state[key]);
        }
      });
      return;
    }

    // 默认：将所有滑块恢复初始值
    if (spec.controls) {
      spec.controls.forEach(function (ctrl) {
        if (ctrl.type === 'slider' && ctrl.value != null) {
          state[ctrl.id] = ctrl.value;
          if (sliderRefs[ctrl.id]) {
            sliderRefs[ctrl.id].input.value = ctrl.value;
            sliderRefs[ctrl.id].display.textContent = String(ctrl.value);
          }
        }
      });
    }
  }

  /* ── 辅助 ── */

  function findTab(tabs, id) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === id) return tabs[i];
    }
    return null;
  }

  function injectBaseCSS() {
    if (document.getElementById('edu-renderer-base')) return;
    var s = document.createElement('style');
    s.id = 'edu-renderer-base';
    s.textContent =
      '.main-layout{display:grid;height:100%;}' +
      '.canvas-area{display:flex;flex-direction:column;align-items:center;}' +
      '.control-panel{display:flex;flex-direction:column;gap:12px;overflow:auto;}' +
      '.ctrl-section{display:flex;flex-direction:column;gap:6px;}' +
      '.ctrl-label{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;}' +
      '.slider-row{display:flex;align-items:center;gap:8px;}' +
      '.slider-row input[type=range]{flex:1;}' +
      '.slider-row .val{font-size:14px;font-weight:700;color:var(--edu-accent);min-width:24px;text-align:right;}' +
      '.info-box{background:#fff;border:1px solid var(--edu-border);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.8;color:var(--edu-text);}' +
      '.info-box strong{color:var(--edu-primary);}' +
      '.preset-btn{padding:8px 0;border-radius:8px;font-size:13px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer;transition:all .15s;}' +
      '.preset-btn:hover{border-color:var(--edu-primary);color:var(--edu-primary);}' +
      '.tab-bar{display:flex;gap:6px;margin-bottom:10px;}' +
      '.tab-btn{padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;cursor:pointer;font-weight:600;transition:all .15s;}' +
      '.tab-btn.active{background:var(--edu-primary);color:#fff;border-color:var(--edu-primary);}' +
      '.mode-btn{padding:6px 10px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;transition:all .15s;}' +
      '.mode-btn.active{background:var(--edu-primary);color:#fff;border-color:var(--edu-primary);}' +
      '.divider{height:1px;background:var(--edu-border);}';
    document.head.appendChild(s);
  }

  return {
    run: run
  };
})();
