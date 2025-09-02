import { CubeConfiguration, CubeConfigurationFactory } from '../config/CubeConfigurationFactory';
import { CUBE_CONFIG, standardizeCubeConfig } from '../config/constants';
import { RubiksCube } from '../core/RubiksCube';
import { RubiksCube2x2 } from '../core/RubiksCube2x2';
import { SceneManager } from '../core/SceneManager';
import { SettingsManager } from './SettingsManager';
import { ColorThemeManager } from './ColorThemeManager';
import { NotificationSystem } from '../utils/NotificationSystem';

/**
 * Cube Type Manager - Manages different cube types and sizes
 * Provides easy switching between different cube configurations
 */
export class CubeTypeManager {
  private static instance: CubeTypeManager;
  private currentCube: RubiksCube | null = null;
  private currentConfig: CubeConfiguration;
  private sceneManager: SceneManager | null = null;
  private settingsManager: SettingsManager;
  private colorThemeManager: ColorThemeManager;
  private notificationSystem: NotificationSystem | null = null;

  // Callbacks for cube changes
  private cubeChangeCallbacks: ((cube: RubiksCube, config: CubeConfiguration) => void)[] = [];

  private constructor() {
    this.settingsManager = SettingsManager.getInstance();
    this.colorThemeManager = ColorThemeManager.getInstance();
    this.currentConfig = CubeConfigurationFactory.create3x3();
    
    // Subscribe to settings changes
    this.settingsManager.subscribe('cubeSize', (size) => {
      if (size !== this.currentConfig.size) {
        this.switchToCubeSize(size);
      }
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CubeTypeManager {
    if (!CubeTypeManager.instance) {
      CubeTypeManager.instance = new CubeTypeManager();
    }
    return CubeTypeManager.instance;
  }

  /**
   * Initialize with scene manager
   */
  public initialize(
    sceneManager: SceneManager, 
    initialCube?: RubiksCube,
    notificationSystem?: NotificationSystem
  ): void {
    this.sceneManager = sceneManager;
    this.notificationSystem = notificationSystem || null;
    
    // Save the initial cube first
    if (initialCube) {
      this.currentCube = initialCube;
      
      // Update internal config to match the initial cube
      const cubeType = initialCube instanceof RubiksCube2x2 ? '2x2x2' : '3x3x3';
      const size = cubeType === '2x2x2' ? 2 : 3;
      
      // Update CUBE_CONFIG to match the initial cube
      CUBE_CONFIG.size = size;
      
      // Update settings to match the actual cube displayed
      this.settingsManager.set('cubeSize', size);
      this.currentConfig = size === 2 
        ? CubeConfigurationFactory.create2x2() 
        : CubeConfigurationFactory.create3x3();
    } else {
      // No initial cube provided, create one based on settings
      const savedSize = this.settingsManager.get('cubeSize');
      
      // Ensure settings and displayed cube are in sync on page refresh
      if (savedSize !== undefined) {
        console.log(`Initializing with saved cube size: ${savedSize}`);
        this.switchToCubeSize(savedSize);
      } else {
        // Default to 3x3 if no saved size
        console.log('No saved cube size found, defaulting to 3x3');
        this.switchToCubeSize(3);
      }
      
      // Save the size to settings to ensure consistency
      this.settingsManager.set('cubeSize', savedSize || 3);
    }
  }

  /**
   * Get current cube instance
   */
  public getCurrentCube(): RubiksCube | null {
    return this.currentCube;
  }

  /**
   * Get current cube configuration
   */
  public getCurrentConfig(): CubeConfiguration {
    return this.currentConfig;
  }

  /**
   * Switch to different cube size
   */
  public async switchToCubeSize(size: number): Promise<boolean> {
    if (!this.sceneManager) {
      console.error('CubeTypeManager not initialized with SceneManager');
      return false;
    }

    try {
      // Create new configuration
      const newConfig = CubeConfigurationFactory.createConfiguration(size);
      
      // Update color scheme if needed
      const currentColorTheme = this.colorThemeManager.getCurrentColorTheme();
      const colorScheme = this.colorThemeManager.getColorScheme(currentColorTheme);
      if (colorScheme) {
        newConfig.colors = colorScheme;
      }

      // Dispose current cube if exists
      if (this.currentCube) {
        // Stop any ongoing animations and dispose properly
        this.currentCube.dispose();
      }

      // Update CUBE_CONFIG with new size and standardize configuration
      CUBE_CONFIG.size = size;
      standardizeCubeConfig(size === 2 ? '2x2x2' : '3x3x3');
      
      // Create new cube with new configuration
      if (size === 2) {
        this.currentCube = new RubiksCube2x2(this.sceneManager.getScene());
      } else {
        this.currentCube = new RubiksCube(this.sceneManager.getScene());
      }
      this.currentConfig = newConfig;

      // Update cube colors to match configuration
      this.currentCube.updateColors(newConfig.colors);

      // Get optimized settings for the new cube size
      const optimizedSettings = this.settingsManager.getCubeSizeOptimizedSettings(size);
      
      // Get default scramble steps from the CubeConfigurationFactory
      const scrambleSteps = CubeConfigurationFactory.getDefaultScrambleSteps(size);
      
      // Override scramble steps in optimized settings
      optimizedSettings.scrambleSteps = scrambleSteps;
      
      // Update settings and explicitly save to localStorage
      this.settingsManager.updateSettings(optimizedSettings);
      
      // Ensure cube size and scramble steps are explicitly saved to be consistent on page refresh
      this.settingsManager.set('cubeSize', size);
      this.settingsManager.set('scrambleSteps', scrambleSteps);
      
      // Log for debugging
      console.log(`Switched to cube size ${size} with scramble steps ${scrambleSteps}`);

      // Trigger callbacks
      this.triggerCubeChangeCallbacks();

      // Show notification
      if (this.notificationSystem) {
        this.notificationSystem.show(
          `Switched to ${CubeConfigurationFactory.getCubeTypeName(size)}`,
          'success'
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to switch cube size:', error);
      if (this.notificationSystem) {
        this.notificationSystem.show('Failed to switch cube size', 'error');
      }
      return false;
    }
  }

  /**
   * Switch to specific cube type
   */
  public async switchToCubeType(type: 'pocket' | 'standard' | 'revenge' | 'professor'): Promise<boolean> {
    const sizeMap = {
      pocket: 2,
      standard: 3,
      revenge: 4,
      professor: 5
    };

    return this.switchToCubeSize(sizeMap[type]);
  }

  /**
   * Get the ColorThemeManager instance
   * Allows other components to access the ColorThemeManager
   */
  public getColorThemeManager(): ColorThemeManager {
    return this.colorThemeManager;
  }

  /**
   * Switch to rectangular/non-cube dimensions
   */
  public async switchToRectangular(width: number, height: number, depth: number): Promise<boolean> {
    if (!this.sceneManager) {
      console.error('CubeTypeManager not initialized with SceneManager');
      return false;
    }

    try {
      // Create rectangular configuration
      const newConfig = CubeConfigurationFactory.createRectangular(width, height, depth);
      
      // Update color scheme
      const currentColorTheme = this.colorThemeManager.getCurrentColorTheme();
      const colorScheme = this.colorThemeManager.getColorScheme(currentColorTheme);
      if (colorScheme) {
        newConfig.colors = colorScheme;
      }

      // Dispose current cube
      if (this.currentCube) {
        this.currentCube.stopAnimation();
      }

      // Create new cube
      this.currentCube = new RubiksCube(this.sceneManager.getScene());
      this.currentConfig = newConfig;

      // Update cube colors to match configuration
      this.currentCube.updateColors(newConfig.colors);

      // Trigger callbacks
      this.triggerCubeChangeCallbacks();

      // Show notification
      if (this.notificationSystem) {
        this.notificationSystem.show(
          `Switched to ${width}x${height}x${depth} cube`,
          'success'
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to switch to rectangular cube:', error);
      if (this.notificationSystem) {
        this.notificationSystem.show('Failed to switch cube type', 'error');
      }
      return false;
    }
  }

  /**
   * Get available cube sizes
   */
  public getAvailableSizes(): number[] {
    return CubeConfigurationFactory.getStandardSizes();
  }

  /**
   * Get cube type name
   */
  public getCubeTypeName(size?: number): string {
    const cubeSize = size || this.currentConfig.size;
    return CubeConfigurationFactory.getCubeTypeName(cubeSize);
  }

  /**
   * Check if cube size is supported
   */
  public isSizeSupported(size: number): boolean {
    return size >= 2 && size <= 10;
  }

  /**
   * Get cube statistics
   */
  public getCubeStatistics(size?: number): {
    totalCublets: number;
    visibleFaces: number;
    hiddenCublets: number;
    edgePieces: number;
    cornerPieces: number;
    centerPieces: number;
    complexity: number;
  } {
    const cubeSize = size || this.currentConfig.size;
    const total = cubeSize * cubeSize * cubeSize;
    const hidden = Math.max(0, (cubeSize - 2) * (cubeSize - 2) * (cubeSize - 2));
    const visible = total - hidden;
    
    // Calculate piece types for standard cubes
    let corners = 8; // Always 8 corners
    let edges = (cubeSize === 2) ? 0 : 12 * (cubeSize - 2); // Edge pieces
    let centers = 0;

    if (cubeSize > 2) {
      // Center pieces calculation
      if (cubeSize % 2 === 1) {
        // Odd-sized cubes have fixed centers
        centers = 6; // 6 fixed center pieces
      } else {
        // Even-sized cubes have center groups
        centers = 6 * ((cubeSize - 2) / 2) * ((cubeSize - 2) / 2);
      }
    }

    return {
      totalCublets: total,
      visibleFaces: visible * 3, // Average 3 visible faces per visible cubelet
      hiddenCublets: hidden,
      edgePieces: edges,
      cornerPieces: corners,
      centerPieces: centers,
      complexity: this.currentConfig.complexityLevel || cubeSize
    };
  }

  /**
   * Subscribe to cube change events
   */
  public onCubeChange(callback: (cube: RubiksCube, config: CubeConfiguration) => void): () => void {
    this.cubeChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.cubeChangeCallbacks.indexOf(callback);
      if (index >= 0) {
        this.cubeChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update current cube with new colors
   */
  public updateCubeColors(colors: typeof this.currentConfig.colors): void {
    if (this.currentCube) {
      this.currentCube.updateColors(colors);
      this.currentConfig.colors = { ...colors };
    }
  }

  /**
   * Reset current cube to solved state
   */
  public resetCube(): void {
    if (this.currentCube) {
      this.currentCube.reset();
    }
  }

  /**
   * Scramble current cube
   */
  public scrambleCube(): void {
    if (this.currentCube) {
      const scrambleSteps = this.currentConfig.scrambleSteps || 25;
      this.currentCube.scramble(scrambleSteps);
    }
  }

  /**
   * Trigger cube change callbacks
   */
  private triggerCubeChangeCallbacks(): void {
    if (this.currentCube) {
      this.cubeChangeCallbacks.forEach(callback => {
        try {
          callback(this.currentCube!, this.currentConfig);
        } catch (error) {
          console.error('Error in cube change callback:', error);
        }
      });
    }
  }
  
  /**
   * Get the settings manager instance
   */
  public getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }
}
