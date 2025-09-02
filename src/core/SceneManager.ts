import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Manages the Three.js scene, camera, renderer, and controls
 */
export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.setupLighting();
    this.setupEventListeners();
  }

  /**
   * Creates and configures the camera
   */
  private createCamera(): THREE.PerspectiveCamera {
    const rect = this.container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(
      75,
      rect.width / rect.height,
      0.1,
      1000
    );
    
    // Position camera to center the cube between controls and bottom bar
    // Slightly zoomed in and angled toward the front face
    camera.position.set(4.5, 5, 6);
    camera.lookAt(0, 2, 0);
    
    return camera;
  }

  /**
   * Creates and configures the WebGL renderer
   */
  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    
    const rect = this.container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x2a2a2a, 1); // Lighter background to make colors more vibrant
    
    this.container.appendChild(renderer.domElement);
    
    return renderer;
  }

  /**
   * Creates and configures the orbit controls
   */
  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI;
    
    // Mouse controls thân thiện người dùng hơn
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,    // Left mouse button for rotation
      MIDDLE: THREE.MOUSE.DOLLY,   // Middle mouse button for zoom
      RIGHT: THREE.MOUSE.PAN       // Right mouse button for panning
    };

    // Increase pan sensitivity for better control
    controls.panSpeed = 1.2;
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    
    return controls;
  }

  /**
   * Sets up the scene lighting
   */
  private setupLighting(): void {
    // Ambient light for general illumination (tăng intensity)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    // Main directional light (tăng intensity)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // Fill light from the opposite side (tăng intensity)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // Bottom light to illuminate the underside
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.6);
    bottomLight.position.set(0, -10, 0);
    this.scene.add(bottomLight);

    // Rim light for edge definition (increased intensity)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 10, -10);
    this.scene.add(rimLight);

    // Additional side lights for uniform lighting
    const leftLight = new THREE.DirectionalLight(0xffffff, 0.3);
    leftLight.position.set(-10, 0, 0);
    this.scene.add(leftLight);

    const rightLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rightLight.position.set(10, 0, 0);
    this.scene.add(rightLight);
  }

  /**
   * Sets up event listeners for window resize
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Use ResizeObserver to watch for container size changes
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Handles window resize events
   */
  private onWindowResize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Public method to update renderer size when container changes
   */
  public updateSize(): void {
    this.onWindowResize();
  }

  /**
   * Renders a single frame
   */
  public render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Starts the render loop
   */
  public startRenderLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  /**
   * Gets the Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Gets the camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Gets the renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets the controls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Reset camera to default position and angle
   */
  public resetCameraView(): void {
    // Reset camera position to center the cube between controls and bottom bar
    // Slightly zoomed in and angled toward the front face
    this.camera.position.set(4.5, 5, 6);
    this.camera.lookAt(0, 2, 0);
    
    // Reset controls target
    this.controls.target.set(0, 2, 0);
    this.controls.reset();
    this.controls.update();
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Update background color/theme
   */
  public updateBackground(theme: string): void {
    // Remove any previous gradient background classes from container's parent
    const container = this.renderer.domElement.parentElement;
    if (container) {
      const parent = container.parentElement;
      if (parent) {
        // Remove existing background classes
        const classesToRemove = Array.from(parent.classList).filter(c => 
          c.startsWith('background-gradient'));
        classesToRemove.forEach(c => parent.classList.remove(c));
      }
    }
    
    // Apply gradient backgrounds using CSS for gradient themes
    if (theme.startsWith('gradient')) {
      const container = this.renderer.domElement.parentElement;
      if (container) {
        const parent = container.parentElement;
        if (parent) {
          parent.classList.add(`background-${theme}`);
          // Set renderer to transparent for CSS gradients to show through
          this.renderer.setClearColor(0x000000, 0);
          return;
        }
      }
    }
    
    // For regular color backgrounds, use the renderer's clear color
    switch (theme) {
      case 'dark':
        this.renderer.setClearColor(0x2a2a2a, 1);
        break;
      case 'light':
        this.renderer.setClearColor(0xf5f5f5, 1);
        break;
      case 'blue':
        this.renderer.setClearColor(0x1e3a5f, 1);
        break;
      case 'gradient': // Fallback if the CSS method fails
        this.renderer.setClearColor(0x4a90e2, 1);
        break;
      case 'sunset':
        this.renderer.setClearColor(0xff7f50, 1); // Coral
        break;
      case 'forest':
        this.renderer.setClearColor(0x228b22, 1); // Forest Green
        break;
      case 'ocean':
        this.renderer.setClearColor(0x006994, 1); // Ocean Blue
        break;
      case 'space':
        this.renderer.setClearColor(0x191970, 1); // Midnight Blue
        break;
      case 'fire':
        this.renderer.setClearColor(0xdc143c, 1); // Crimson
        break;
      case 'aurora':
        this.renderer.setClearColor(0x9370db, 1); // Medium Purple
        break;
      default:
        this.renderer.setClearColor(0x2a2a2a, 1);
    }
  }
}
