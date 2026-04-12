/**
 * 教立方 EduCube — 3D 教具工具库（基于 Three.js r128）
 * 必须在 three.min.js 和 OrbitControls.js 之后加载
 */

var Edu3D = (function () {
  /** 创建标准场景 */
  function createScene(canvas, opts) {
    opts = opts || {};
    var w = canvas.clientWidth || 600;
    var h = canvas.clientHeight || 400;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.bg || 0xf8fafc);

    var camera = new THREE.PerspectiveCamera(
      opts.fov || 45,
      w / h,
      opts.near || 0.1,
      opts.far || 1000
    );
    camera.position.set(
      opts.camX || 5,
      opts.camY || 4,
      opts.camZ || 5
    );
    camera.lookAt(opts.lookX || 0, opts.lookY || 0, opts.lookZ || 0);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = opts.shadows !== false;

    var controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = opts.minDist || 2;
    controls.maxDistance = opts.maxDist || 20;
    controls.enablePan = opts.enablePan !== undefined ? opts.enablePan : false;
    controls.target.set(opts.lookX || 0, opts.lookY || 0, opts.lookZ || 0);

    return { scene: scene, camera: camera, renderer: renderer, controls: controls };
  }

  /** 三灯设置：环境光 + 方向光 + 半球光 */
  function addLights(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    var dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(6, 8, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    scene.add(dir);

    scene.add(new THREE.HemisphereLight(0xe8f4ff, 0xfff3e0, 0.4));
  }

  /** 地面网格 */
  function addGrid(scene, size, divisions, color) {
    size = size || 10;
    divisions = divisions || 10;
    color = color || 0xd1d5db;

    var grid = new THREE.GridHelper(size, divisions, color, color);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    var floorGeo = new THREE.PlaneGeometry(size, size);
    var floorMat = new THREE.MeshLambertMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.3,
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  /** 创建边框线 */
  function edges(geometry, color) {
    color = color || 0x334155;
    var geo = new THREE.EdgesGeometry(geometry);
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  /** 创建标准材质 */
  function material(color, opts) {
    opts = opts || {};
    return new THREE.MeshLambertMaterial(
      Object.assign(
        {
          color: color,
          transparent: opts.opacity !== undefined,
          opacity: opts.opacity !== undefined ? opts.opacity : 1,
          side: opts.side || THREE.FrontSide,
        },
        opts
      )
    );
  }

  /** 启动渲染循环 */
  function startLoop(scene, camera, renderer, controls, updateFn) {
    function loop() {
      requestAnimationFrame(loop);

      // 自适应尺寸
      var canvas = renderer.domElement;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      controls.update();
      if (updateFn) updateFn();
      renderer.render(scene, camera);
    }
    loop();
  }

  /** 3D 文字精灵（画布宽度随 measureText 增大，避免「直角三角形」等长标签被裁切） */
  function textSprite(text, opts) {
    opts = opts || {};
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var baseSize = opts.size || 128;
    var fontPx = Math.round(baseSize / 4);
    var pad = opts.pad != null ? opts.pad : 24;
    ctx.font = "bold " + fontPx + "px sans-serif";
    var mw = ctx.measureText(text || " ").width;
    var w = Math.max(baseSize, Math.ceil(mw + pad * 2));
    var h = Math.round(baseSize / 2);
    canvas.width = w;
    canvas.height = h;

    ctx.font = "bold " + fontPx + "px sans-serif";
    ctx.fillStyle = opts.color || "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);

    var texture = new THREE.CanvasTexture(canvas);
    var spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    var sprite = new THREE.Sprite(spriteMat);
    var sc = opts.scale || 0.5;
    var aspect = w / h;
    sprite.scale.set((sc / 2) * aspect, sc / 2, 1);
    return sprite;
  }

  return {
    createScene: createScene,
    addLights: addLights,
    addGrid: addGrid,
    edges: edges,
    material: material,
    startLoop: startLoop,
    textSprite: textSprite,
  };
})();
