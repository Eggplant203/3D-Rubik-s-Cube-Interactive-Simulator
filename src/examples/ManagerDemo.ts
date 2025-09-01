/**
 * Demo usage of the new manager architecture
 * This file shows how to use the refactored managers for different cube sizes
 */

import { 
  ColorThemeManager, 
  KeyMappingManager, 
  SettingsManager, 
  CubeTypeManager 
} from '../managers';
import { CubeConfigurationFactory } from '../config/CubeConfigurationFactory';
import { NotificationSystem } from '../utils/NotificationSystem';
import { UIStateManager } from '../managers/UIStateManager';

/**
 * Example: How to initialize and use the new manager system
 */
export class CubeManagerDemo {
  private colorThemeManager: ColorThemeManager;
  private keyMappingManager: KeyMappingManager;
  private settingsManager: SettingsManager;
  private cubeTypeManager: CubeTypeManager;
  private uiStateManager: UIStateManager;
  private notificationSystem: NotificationSystem;

  constructor() {
    // Initialize notification system first
    this.notificationSystem = new NotificationSystem();

    // Get manager instances
    this.colorThemeManager = ColorThemeManager.getInstance();
    this.keyMappingManager = KeyMappingManager.getInstance();
    this.settingsManager = SettingsManager.getInstance();
    this.cubeTypeManager = CubeTypeManager.getInstance();
    
    // Initialize UI state manager
    this.uiStateManager = new UIStateManager(this.notificationSystem);

    this.setupExamples();
  }

  private setupExamples(): void {
    console.log('=== Rubik\'s Cube Manager Demo ===\n');
    
    this.demoColorThemes();
    this.demoKeyMappings();
    this.demoSettings();
    this.demoCubeTypes();
    this.demoUIState();
  }

  /**
   * Demo: Color Theme Management
   */
  private demoColorThemes(): void {
    console.log('1. Color Theme Management:');
    
    // List available themes
    const themes = this.colorThemeManager.getAvailableColorThemes();
    console.log('Available color themes:', themes);
    
    // Switch to different themes
    this.colorThemeManager.setCurrentColorTheme('neon');
    console.log('Current theme:', this.colorThemeManager.getCurrentColorTheme());
    
    // Get color scheme
    const neonScheme = this.colorThemeManager.getColorScheme('neon');
    console.log('Neon color scheme:', neonScheme);
    
    // Generate random theme
    const randomScheme = this.colorThemeManager.generateRandomColorScheme();
    this.colorThemeManager.addCustomColorTheme('myRandom', randomScheme);
    console.log('Custom random theme added:', randomScheme);
    
    console.log('');
  }

  /**
   * Demo: Key Mapping Management
   */
  private demoKeyMappings(): void {
    console.log('2. Key Mapping Management:');
    
    // Get current mappings
    const currentMappings = this.keyMappingManager.getCurrentMappings();
    console.log('Current key mappings:', currentMappings);
    
    // Try different presets
    const presets = this.keyMappingManager.getAvailablePresets();
    console.log('Available presets:', presets);
    
    this.keyMappingManager.loadPreset('left_handed');
    console.log('Loaded left-handed preset');
    
    // Custom mapping
    const customMappings = {
      front: 'i',
      back: 'k',
      right: 'l',
      left: 'j'
    };
    
    const success = this.keyMappingManager.setMappings(customMappings);
    console.log('Custom mappings applied:', success);
    
    // Get help text
    console.log('Key mapping help:');
    console.log(this.keyMappingManager.getHelpText());
    
    console.log('');
  }

  /**
   * Demo: Settings Management
   */
  private demoSettings(): void {
    console.log('3. Settings Management:');
    
    // Get current settings
    const currentSettings = this.settingsManager.getSettings();
    console.log('Current cube size:', currentSettings.cubeSize);
    console.log('Current theme:', currentSettings.colorTheme);
    
    // Update settings
    this.settingsManager.updateSettings({
      cubeSize: 4,
      scrambleSteps: 35,
      animationSpeed: 600
    });
    
    console.log('Updated to 4x4x4 cube with optimized settings');
    
    // Get optimized settings for different cube sizes
    const cube2x2Settings = this.settingsManager.getCubeSizeOptimizedSettings(2);
    console.log('Optimized settings for 2x2x2:', cube2x2Settings);
    
    const cube5x5Settings = this.settingsManager.getCubeSizeOptimizedSettings(5);
    console.log('Optimized settings for 5x5x5:', cube5x5Settings);
    
    // Export/Import demo
    const exported = this.settingsManager.exportSettings();
    console.log('Settings exported (sample):', exported.substring(0, 100) + '...');
    
    console.log('');
  }

  /**
   * Demo: Cube Type Management
   */
  private demoCubeTypes(): void {
    console.log('4. Cube Type Management:');
    
    // List available sizes
    const availableSizes = this.cubeTypeManager.getAvailableSizes();
    console.log('Available cube sizes:', availableSizes);
    
    // Get cube type names
    availableSizes.forEach(size => {
      const typeName = this.cubeTypeManager.getCubeTypeName(size);
      console.log(`${size}x${size}x${size}: ${typeName}`);
    });
    
    // Show cube statistics for different sizes
    [2, 3, 4, 5].forEach(size => {
      const stats = this.cubeTypeManager.getCubeStatistics(size);
      console.log(`${size}x${size}x${size} statistics:`, stats);
    });
    
    console.log('');
  }

  /**
   * Demo: UI State Management
   */
  private demoUIState(): void {
    console.log('5. UI State Management:');
    
    // Timer demo
    console.log('Starting timer...');
    this.uiStateManager.startTimer();
    
    setTimeout(() => {
      const elapsed = this.uiStateManager.stopTimer();
      console.log(`Timer stopped. Elapsed: ${elapsed}ms`);
      
      // Add some moves and create a solve record
      this.uiStateManager.incrementMoveCount();
      this.uiStateManager.incrementMoveCount();
      this.uiStateManager.incrementMoveCount();
      
      const moves = this.uiStateManager.getMoveCount();
      this.uiStateManager.addSolveRecord(elapsed, moves);
      
      console.log(`Added solve record: ${elapsed}ms, ${moves} moves`);
      
      // Get statistics
      const stats = this.uiStateManager.getSolveStatistics();
      console.log('Solve statistics:', stats);
    }, 1000);
    
    // Notes demo
    this.uiStateManager.addNote('First solve', 'Used layer-by-layer method');
    this.uiStateManager.addNote('Speed tip', 'Focus on F2L efficiency');
    
    const notes = this.uiStateManager.getSavedNotes();
    console.log('Saved notes:', notes.length);
    
    console.log('');
  }

  /**
   * Demo: How to create different cube configurations
   */
  public demoCubeConfigurations(): void {
    console.log('6. Cube Configuration Examples:');
    
    // Create different cube configurations
    const pocket = CubeConfigurationFactory.create2x2();
    console.log('2x2x2 Pocket Cube config:', {
      size: pocket.size,
      scrambleSteps: pocket.scrambleSteps,
      complexity: pocket.complexityLevel
    });
    
    const standard = CubeConfigurationFactory.create3x3();
    console.log('3x3x3 Standard Cube config:', {
      size: standard.size,
      scrambleSteps: standard.scrambleSteps,
      complexity: standard.complexityLevel
    });
    
    const revenge = CubeConfigurationFactory.create4x4();
    console.log('4x4x4 Revenge Cube config:', {
      size: revenge.size,
      scrambleSteps: revenge.scrambleSteps,
      complexity: revenge.complexityLevel
    });
    
    // Custom rectangular cube
    const rectangular = CubeConfigurationFactory.createRectangular(2, 3, 4);
    console.log('2x3x4 Rectangular Cube config:', {
      dimensions: rectangular.dimensions,
      scrambleSteps: rectangular.scrambleSteps,
      complexity: rectangular.complexityLevel
    });
    
    console.log('');
  }

  /**
   * Demo: Integration example - Complete cube setup
   */
  public async demoCompleteSetup(_containerElement?: HTMLElement): Promise<void> {
    console.log('7. Complete Integration Demo:');
    
    try {
      // 1. Setup UI theme
      this.settingsManager.set('uiTheme', 'dark');
      this.settingsManager.set('colorTheme', 'vibrant');
      document.documentElement.setAttribute('data-theme', 'dark');
      
      // 2. Configure for 4x4x4 cube
      await this.cubeTypeManager.switchToCubeSize(4);
      console.log('Switched to 4x4x4 cube');
      
      // 3. Apply vibrant color theme
      this.uiStateManager.switchColorTheme('vibrant');
      
      // 4. Setup custom key mappings for WASD style
      const wasdMappings = {
        front: 's',
        back: 'w',
        right: 'd',
        left: 'a',
        up: 'q',
        down: 'e'
      };
      
      this.uiStateManager.updateKeyMappings(wasdMappings);
      
      // 5. Configure optimal settings for 4x4x4
      const optimizedSettings = this.settingsManager.getCubeSizeOptimizedSettings(4);
      this.settingsManager.updateSettings(optimizedSettings);
      
      console.log('Complete setup finished!');
      console.log('- Theme: Dark UI with Vibrant colors');
      console.log('- Cube: 4x4x4 with optimized settings');
      console.log('- Controls: WASD-style key mapping');
      
    } catch (error) {
      console.error('Setup failed:', error);
    }
  }
}

/**
 * Usage example:
 * 
 * ```typescript
 * const demo = new CubeManagerDemo();
 * 
 * // Run all demos
 * demo.demoCubeConfigurations();
 * 
 * // Setup a complete cube environment
 * const containerElement = document.getElementById('cube-container')!;
 * await demo.demoCompleteSetup(containerElement);
 * ```
 */
