import './style.css';
import './ui-enhancements.css';
import { SceneManager } from './core/SceneManager';
import { RubiksCube } from './core/RubiksCube';
import { InputManager } from './controllers/InputManager';
import { UIController } from './controllers/UIController';

/**
 * Main application class
 */
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

  /**
   * Initialize the application
   */
  public async init(): Promise<void> {
    try {
      this.showLoading();
      
      // Initialize scene manager
      this.sceneManager = new SceneManager(this.container);
      
      // Initialize Rubik's cube
      this.rubiksCube = new RubiksCube(this.sceneManager.getScene());
      
      // Initialize input manager for cube rotation
      this.inputManager = new InputManager(this.rubiksCube);
      
      // Initialize UI controller
      this.uiController = new UIController(this.rubiksCube, this.sceneManager, this.inputManager);
      
      // Set UIController reference in InputManager
      this.inputManager.setUIController(this.uiController);
      
      this.inputManager.enable();
      
      // Start render loop
      this.sceneManager.startRenderLoop();
      
      this.hideLoading();
      
    } catch (error) {
      this.showError('Failed to load the application. Please refresh the page.');
    }
  }

  /**
   * Show loading screen
   */
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

  /**
   * Hide loading screen
   */
  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.remove();
    }
  }

  /**
   * Show error message
   */
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

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.inputManager?.dispose();
    this.uiController?.dispose();
    this.sceneManager?.dispose();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new RubikApp();
  
  try {
    await app.init();
  } catch (error) {
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
