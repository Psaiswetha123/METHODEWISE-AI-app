/**
 * MethodWise AI - Interactive 3D WebGL CAD Visualization Module
 * Powered by Three.js
 * Generates custom 3D WebGL CAD geometries dynamically for every product design
 * with 5 distinct 3D Render Models (Solid CAD, Exploded Assembly, FEA Stress Map, Photorealistic, Wireframe Mesh).
 */

class CAD3DViewer {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!this.container) return;

    this.options = Object.assign({
      autoRotate: true,
      wireframe: false,
      materialStyle: 'metallic', // 'metallic', 'plastic', 'clay', 'heatmap'
      renderMode: 'solid', // 'solid', 'exploded', 'fea', 'photo', 'wireframe'
      showGrid: true,
      productName: 'Smart Helmet',
      productType: 'Consumer Product',
      shapeType: 'helmet'
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshGroup = null;
    this.mainMesh = null;
    this.innerCoreMesh = null;
    this.extraMeshes = [];
    this.gridHelper = null;
    this.animId = null;
    this.isExploded = false;
    this.isAutoOrbit = this.options.autoRotate;

    // Orbit control state
    this.isMouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentRotationX = 0.3;
    this.currentRotationY = 0.6;
    this.zoomDistance = 6.5;

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 400;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a14);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, this.zoomDistance);
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

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.3);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7928ca, 0.9);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(0, 6, 2);
    this.scene.add(pointLight);

    // 5. CAD Grid Overlay
    this.gridHelper = new THREE.GridHelper(10, 20, 0x00f2fe, 0x1e293b);
    this.gridHelper.position.y = -1.6;
    this.scene.add(this.gridHelper);

    // 6. Build Geometry Group
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    this.createModelGeometry(this.options.shapeType || this.detectShapeFromProduct(this.options.productName, this.options.productType));

    // 7. Event Listeners for Rotation & Zooming
    this.addControlListeners();

    // 8. Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // 9. Animation Loop
    this.animate();
  }

  detectShapeFromProduct(name = '', type = '') {
    const str = `${name} ${type}`.toLowerCase();
    if (str.includes('helmet') || str.includes('visor') || str.includes('consumer')) return 'helmet';
    if (str.includes('medical') || str.includes('syringe') || str.includes('pump')) return 'medical';
    if (str.includes('drone') || str.includes('frame') || str.includes('quadcopter') || str.includes('robotics')) return 'drone';
    if (str.includes('thermal') || str.includes('plate') || str.includes('heat') || str.includes('ev battery') || str.includes('bracket')) return 'thermal';
    if (str.includes('impeller') || str.includes('turbine') || str.includes('jet') || str.includes('aerospace')) return 'impeller';
    if (str.includes('robot') || str.includes('joint') || str.includes('casing') || str.includes('gearbox') || str.includes('arm')) return 'robot';
    return 'custom';
  }

  createModelGeometry(shapeType) {
    this.options.shapeType = shapeType;
    this.extraMeshes = [];
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0];
      this.meshGroup.remove(child);
    }

    let matProps = this.getMaterialProps(this.options.materialStyle);
    this.mainMaterial = new THREE.MeshStandardMaterial(matProps);
    this.mainMaterial.wireframe = (this.options.renderMode === 'wireframe') || this.options.wireframe;

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x003344,
      emissiveIntensity: 0.4
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3
    });

    if (shapeType === 'helmet') {
      // 1. SMART HELMET & VISOR
      const shellGeo = new THREE.DodecahedronGeometry(1.4, 2);
      const pos = shellGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        if (y < -0.2) pos.setY(i, y * 0.4);
      }
      shellGeo.computeVertexNormals();

      this.mainMesh = new THREE.Mesh(shellGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      // Inner Core Cushion
      const coreGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.2, 16);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);

      // Visor Rim Ring
      const ringGeo = new THREE.TorusGeometry(1.25, 0.08, 16, 32);
      const ringMesh = new THREE.Mesh(ringGeo, darkMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -0.15;
      this.meshGroup.add(ringMesh);
      this.extraMeshes.push(ringMesh);

    } else if (shapeType === 'medical') {
      // 2. MEDICAL SYRINGE PUMP CHASSIS
      const bodyGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.2, 32);
      this.mainMesh = new THREE.Mesh(bodyGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 24);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);

      const tipGeo = new THREE.ConeGeometry(0.4, 0.8, 24);
      const tipMesh = new THREE.Mesh(tipGeo, darkMat);
      tipMesh.position.y = 1.5;
      this.meshGroup.add(tipMesh);
      this.extraMeshes.push(tipMesh);

      [0.6, -0.6].forEach(py => {
        const flangeGeo = new THREE.TorusGeometry(1.02, 0.07, 16, 32);
        const flangeMesh = new THREE.Mesh(flangeGeo, darkMat);
        flangeMesh.rotation.x = Math.PI / 2;
        flangeMesh.position.y = py;
        this.meshGroup.add(flangeMesh);
        this.extraMeshes.push(flangeMesh);
      });

    } else if (shapeType === 'drone') {
      // 3. AUTONOMOUS DRONE FRAME
      const hubGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 8);
      this.mainMesh = new THREE.Mesh(hubGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const armGeo = new THREE.BoxGeometry(0.18, 0.12, 2.2);
        const armMesh = new THREE.Mesh(armGeo, darkMat);
        armMesh.rotation.y = angle;
        this.meshGroup.add(armMesh);
        this.extraMeshes.push(armMesh);

        const podGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
        const podMesh = new THREE.Mesh(podGeo, accentMat);
        podMesh.position.set(Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1);
        this.meshGroup.add(podMesh);
        this.extraMeshes.push(podMesh);
      }

    } else if (shapeType === 'thermal') {
      // 4. EV BATTERY THERMAL COOLING PLATE
      const slabGeo = new THREE.BoxGeometry(3.0, 0.22, 2.2);
      this.mainMesh = new THREE.Mesh(slabGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.BoxGeometry(2.6, 0.15, 1.8);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);

      for (let x = -1.1; x <= 1.1; x += 0.3) {
        const finGeo = new THREE.BoxGeometry(0.08, 0.35, 2.0);
        const finMesh = new THREE.Mesh(finGeo, darkMat);
        finMesh.position.set(x, 0.18, 0);
        this.meshGroup.add(finMesh);
        this.extraMeshes.push(finMesh);
      }

    } else if (shapeType === 'impeller') {
      // 5. AEROSPACE JET ENGINE IMPELLER
      const hubGeo = new THREE.ConeGeometry(0.75, 1.6, 24);
      this.mainMesh = new THREE.Mesh(hubGeo, this.mainMaterial);
      this.mainMesh.rotation.x = Math.PI;
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 16);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const bladeGeo = new THREE.BoxGeometry(0.08, 1.2, 0.6);
        const bladeMesh = new THREE.Mesh(bladeGeo, darkMat);
        bladeMesh.position.set(Math.cos(angle) * 0.65, -0.1, Math.sin(angle) * 0.65);
        bladeMesh.rotation.y = angle + Math.PI / 6;
        bladeMesh.rotation.z = Math.PI / 12;
        this.meshGroup.add(bladeMesh);
        this.extraMeshes.push(bladeMesh);
      }

    } else if (shapeType === 'robot') {
      // 6. ROBOTIC ARM JOINT HOUSING
      const jointGeo = new THREE.SphereGeometry(1.2, 24, 24);
      this.mainMesh = new THREE.Mesh(jointGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.5, 20);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.innerCoreMesh.rotation.z = Math.PI / 2;
      this.meshGroup.add(this.innerCoreMesh);

      const gearGeo = new THREE.TorusGeometry(1.22, 0.12, 16, 32);
      const gearMesh = new THREE.Mesh(gearGeo, darkMat);
      gearMesh.rotation.x = Math.PI / 2;
      this.meshGroup.add(gearMesh);
      this.extraMeshes.push(gearMesh);

    } else {
      // 7. CUSTOM INDUSTRIAL HOUSING
      const boxGeo = new THREE.BoxGeometry(2.0, 1.5, 1.8);
      this.mainMesh = new THREE.Mesh(boxGeo, this.mainMaterial);
      this.meshGroup.add(this.mainMesh);

      const coreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.6, 24);
      this.innerCoreMesh = new THREE.Mesh(coreGeo, accentMat);
      this.meshGroup.add(this.innerCoreMesh);
    }
  }

  setRenderMode(mode) {
    this.options.renderMode = mode;

    if (mode === 'wireframe') {
      if (this.mainMaterial) this.mainMaterial.wireframe = true;
      if (this.innerCoreMesh) this.innerCoreMesh.position.y = 0;
    } else if (mode === 'exploded') {
      if (this.mainMaterial) this.mainMaterial.wireframe = false;
      if (this.innerCoreMesh) {
        this.innerCoreMesh.position.y = 1.4;
      }
      this.extraMeshes.forEach((m, idx) => {
        m.position.y += (idx % 2 === 0 ? 0.6 : -0.6);
      });
    } else if (mode === 'fea') {
      // FEA Stress Heatmap Mode (Red high stress nodes, yellow transitions)
      if (this.mainMaterial) {
        this.mainMaterial.wireframe = false;
        this.mainMaterial.color.setHex(0xef4444); // Red high stress
        this.mainMaterial.emissive.setHex(0x7f1d1d);
        this.mainMaterial.emissiveIntensity = 0.5;
        this.mainMaterial.needsUpdate = true;
      }
      if (this.innerCoreMesh) {
        this.innerCoreMesh.material.color.setHex(0xf59e0b); // Yellow mid stress
      }
    } else if (mode === 'photo') {
      // Photorealistic Studio Render Mode
      if (this.mainMaterial) {
        this.mainMaterial.wireframe = false;
        this.mainMaterial.color.setHex(0x38bdf8);
        this.mainMaterial.metalness = 0.98;
        this.mainMaterial.roughness = 0.05;
        this.mainMaterial.emissive.setHex(0x002233);
        this.mainMaterial.needsUpdate = true;
      }
    } else {
      // Standard Solid CAD
      if (this.mainMaterial) {
        this.mainMaterial.wireframe = false;
        const props = this.getMaterialProps(this.options.materialStyle);
        this.mainMaterial.color.setHex(props.color);
        this.mainMaterial.metalness = props.metalness;
        this.mainMaterial.roughness = props.roughness;
        this.mainMaterial.emissive.setHex(0x000000);
        this.mainMaterial.needsUpdate = true;
      }
      if (this.innerCoreMesh) this.innerCoreMesh.position.y = 0;
    }
  }

  getMaterialProps(style) {
    switch (style) {
      case 'plastic':
        return { color: 0x2563eb, metalness: 0.15, roughness: 0.35 };
      case 'clay':
        return { color: 0xe2e8f0, metalness: 0.0, roughness: 0.9 };
      case 'heatmap':
        return { color: 0xef4444, metalness: 0.3, roughness: 0.4, emissive: 0x7f1d1d };
      case 'metallic':
      default:
        return { color: 0x38bdf8, metalness: 0.85, roughness: 0.25 };
    }
  }

  setModelShape(shapeType) {
    this.createModelGeometry(shapeType);
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
    this.setRenderMode(this.isExploded ? 'exploded' : 'solid');
    return this.isExploded;
  }

  resetView() {
    this.currentRotationX = 0.3;
    this.currentRotationY = 0.6;
    this.camera.position.set(0, 1.5, 6.5);
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
