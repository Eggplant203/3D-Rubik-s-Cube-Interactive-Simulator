import './style.css';
import './ui-enhancements.css';
import './gradient-backgrounds.css';
import { SceneManager } from './core/SceneManager';
import { RubiksCube } from './core/RubiksCube';
import { RubiksCube2x2 } from './core/RubiksCube2x2';
import { InputManager } from './controllers/InputManager';
import { UIController } from './controllers/UIController';
import { SettingsManager } from './managers/SettingsManager';
import { CubeTypeManager } from './managers/CubeTypeManager';

class RubikApp {
  private sceneManager: SceneManager | null = null;
  private rubiksCube: RubiksCube | null = null;
  private inputManager: InputManager | null = null;
  private uiController: UIController | null = null;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    if (!this.container) {
      throw new Error('Canvas container not found');
    }
  }

  public async init(): Promise<void> {
    try {
      this.showLoading();

      this.sceneManager = new SceneManager(this.container);

      const settingsManager = SettingsManager.getInstance();
      const cubeSize = settingsManager.get('cubeSize');

      settingsManager.set('cubeSize', cubeSize);

      if (cubeSize === 2) {
        this.rubiksCube = new RubiksCube2x2(this.sceneManager.getScene());
        settingsManager.set('cubeSize', 2);
      } else {
        this.rubiksCube = new RubiksCube(this.sceneManager.getScene());
        // Explicitly set cube size to 3 to ensure consistency
        settingsManager.set('cubeSize', 3);
      }
      
      // Initialize input manager for cube rotation
      if (this.rubiksCube && this.sceneManager) {
        this.inputManager = new InputManager(this.rubiksCube);
        
        this.uiController = new UIController(this.rubiksCube, this.sceneManager, this.inputManager);
      } else {
        throw new Error('Failed to initialize cube or scene');
      }

      this.inputManager.setUIController(this.uiController);
      this.inputManager.enable();
      this.sceneManager.startRenderLoop();
      this.hideLoading();

    } catch (error) {
      this.showError('Failed to load the application. Please refresh the page.');
    }
  }

  private showLoading(): void {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loading';
    loading.innerHTML = `
      <h2>Loading 3D Rubik's Cube...</h2>
      <div class="spinner"></div>
    `;
    this.container.appendChild(loading);
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.remove();
    }
  }

  private showError(message: string): void {
    this.hideLoading();
    const error = document.createElement('div');
    error.className = 'error';
    error.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      padding: 20px;
      border-radius: 10px;
      border: 2px solid #ff6b6b;
    `;
    error.innerHTML = `
      <h2>Error</h2>
      <p>${message}</p>
    `;
    this.container.appendChild(error);
  }

  public dispose(): void {
    this.inputManager?.dispose();
    this.uiController?.dispose();
    this.sceneManager?.dispose();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  (window as any).CubeTypeManager = CubeTypeManager;

  const app = new RubikApp();

  try {
    await app.init();
  } catch (error) {
  }

  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
