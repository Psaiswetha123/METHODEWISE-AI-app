/**
 * MethodWise AI - Interactive 3D WebGL CAD Visualization Module
 * Powered by Three.js
 */

class CAD3DViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      autoRotate: true,
      wireframe: false,
      materialStyle: 'metallic', // 'metallic', 'plastic', 'clay', 'heatmap'
      showGrid: true
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshGroup = null;
    this.mainMesh = null;
    this.innerCoreMesh = null;
    this.gridHelper = null;
    this.animId = null;
    this.isExploded = false;
    this.isAutoOrbit = this.options.autoRotate;

    // Orbit control state
    this.isMouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;
    this.currentRotationX = 0.3;
    this.currentRotationY = 0.6;
    this.zoomDistance = 6;

    this.init();
  }

  init() {
    // Clear container
    this.container.innerHTML = '';
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 400;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, this.zoomDistance);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7928ca, 0.8);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);

    // 5. CAD Grid Overlay
    this.gridHelper = new THREE.GridHelper(10, 20, 0x00f2fe, 0x1e293b);
    this.gridHelper.position.y = -1.5;
    this.scene.add(this.gridHelper);

    // 6. Build Geometry Group
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);
    this.createModelGeometry();

    // 7. Event Listeners for Rotation & Zooming
    this.addControlListeners();

    // 8. Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // 9. Animation Loop
    this.animate();
  }

  createModelGeometry(type = 'helmet', scaleX = 1, scaleY = 1, scaleZ = 1) {
    // Remove existing meshes
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0];
      this.meshGroup.remove(child);
    }

    // Outer Shell - Chamfered / Aerodynamic Geometry
    const shellGeo = new THREE.DodecahedronGeometry(1.4, 2);
    
    // Deform vertices to look like a futuristic smart product / helmet frame
    const pos = shellGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      if (y < -0.3) {
        y *= 0.5; // flatten bottom
      }
      pos.setXYZ(i, x * scaleX, y * scaleY, z * scaleZ);
    }
    shellGeo.computeVertexNormals();

    let matProps = this.getMaterialProps(this.options.materialStyle);
    this.mainMaterial = new THREE.MeshStandardMaterial(matProps);
    this.mainMaterial.wireframe = this.options.wireframe;

    this.mainMesh = new THREE.Mesh(shellGeo, this.mainMaterial);
    this.mainMesh.castShadow = true;
    this.mainMesh.receiveShadow = true;
    this.meshGroup.add(this.mainMesh);

    // Inner Core Part (for Explode View Demo)
    const coreGeo = new THREE.CylinderGeometry(0.8 * scaleX, 0.8 * scaleX, 1.2 * scaleY, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003344,
      emissiveIntensity: 0.3
    });
    this.innerCoreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.meshGroup.add(this.innerCoreMesh);

    // Accent Rim / Visor ring
    const ringGeo = new THREE.TorusGeometry(1.2 * scaleX, 0.08, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.2 * scaleY;
    this.meshGroup.add(ringMesh);
  }

  getMaterialProps(style) {
    switch (style) {
      case 'plastic':
        return { color: 0x2563eb, metalness: 0.1, roughness: 0.35 };
      case 'clay':
        return { color: 0xe2e8f0, metalness: 0.0, roughness: 0.9 };
      case 'heatmap':
        return { color: 0xef4444, metalness: 0.3, roughness: 0.4, emissive: 0x7f1d1d };
      case 'metallic':
      default:
        return { color: 0x38bdf8, metalness: 0.85, roughness: 0.25 };
    }
  }

  updateDimensions(l, w, h, unit = 'mm') {
    let factor = unit === 'cm' ? 0.1 : (unit === 'inches' ? 0.25 : 0.01);
    let sx = Math.max(0.4, Math.min(2.5, l * factor));
    let sy = Math.max(0.4, Math.min(2.5, h * factor));
    let sz = Math.max(0.4, Math.min(2.5, w * factor));

    if (this.meshGroup) {
      this.meshGroup.scale.set(sx, sy, sz);
    }
  }

  setMaterialStyle(style) {
    this.options.materialStyle = style;
    if (this.mainMaterial) {
      const props = this.getMaterialProps(style);
      this.mainMaterial.color.setHex(props.color);
      this.mainMaterial.metalness = props.metalness;
      this.mainMaterial.roughness = props.roughness;
      if (props.emissive) this.mainMaterial.emissive.setHex(props.emissive);
      else this.mainMaterial.emissive.setHex(0x000000);
      this.mainMaterial.needsUpdate = true;
    }
  }

  toggleWireframe() {
    this.options.wireframe = !this.options.wireframe;
    if (this.mainMaterial) {
      this.mainMaterial.wireframe = this.options.wireframe;
    }
  }

  toggleAutoOrbit() {
    this.isAutoOrbit = !this.isAutoOrbit;
    return this.isAutoOrbit;
  }

  toggleExplode() {
    this.isExploded = !this.isExploded;
    if (this.innerCoreMesh) {
      let targetY = this.isExploded ? 1.5 : 0;
      let duration = 500;
      let startY = this.innerCoreMesh.position.y;
      let startTime = performance.now();

      const animateExplode = (now) => {
        let elapsed = now - startTime;
        let progress = Math.min(1, elapsed / duration);
        this.innerCoreMesh.position.y = startY + (targetY - startY) * progress;
        if (progress < 1) requestAnimationFrame(animateExplode);
      };
      requestAnimationFrame(animateExplode);
    }
    return this.isExploded;
  }

  resetView() {
    this.currentRotationX = 0.3;
    this.currentRotationY = 0.6;
    this.camera.position.set(0, 1.2, 6);
    this.camera.lookAt(0, 0, 0);
  }

  addControlListeners() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      let deltaX = e.clientX - this.mouseX;
      let deltaY = e.clientY - this.mouseY;

      this.currentRotationY += deltaX * 0.008;
      this.currentRotationX += deltaY * 0.008;

      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomDistance += e.deltaY * 0.005;
      this.zoomDistance = Math.max(3, Math.min(12, this.zoomDistance));
      this.camera.position.z = this.zoomDistance;
    });
  }

  onWindowResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 400;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    if (this.isAutoOrbit && !this.isMouseDown) {
      this.currentRotationY += 0.008;
    }

    if (this.meshGroup) {
      this.meshGroup.rotation.y = this.currentRotationY;
      this.meshGroup.rotation.x = this.currentRotationX;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer) this.renderer.dispose();
  }
}

window.CAD3DViewer = CAD3DViewer;
