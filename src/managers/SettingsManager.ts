/**
 * Settings Manager - Centralized management of application settings
 * Handles persistence, validation, and synchronization of all settings
 */
export interface AppSettings {
  // Theme settings
  uiTheme: 'light' | 'dark';
  colorTheme: string;
  backgroundTheme: string;

  // Cube settings  
  cubeSize: number; // 2, 3, 4, 5, etc.
  scrambleSteps: number;
  animationSpeed: number;

  // UI settings
  soundEnabled: boolean;
  showClock: boolean;
  blindfoldMode: boolean;
  saveRecordEnabled: boolean;
  panelCollapsed: boolean;
  uiHidden: boolean;

  // Timer settings
  currentMode: 'practice' | 'timer';
  
  // Key mappings
  keyMappings: {
    front: string;
    back: string;
    right: string;
    left: string;
    up: string;
    down: string;
    middle: string;
    equator: string;
    standing: string;
    cubeX: string;
    cubeY: string;
    cubeZ: string;
    shift: string;
  };

  // Advanced settings
  enableHints: boolean;
  showMoveCount: boolean;
  autoSolveSteps: boolean;
}

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: AppSettings;
  private readonly STORAGE_KEY = 'rubiks-cube-settings';
  private callbacks: Map<string, ((value: any) => void)[]> = new Map();

  // Default settings
  private readonly defaultSettings: AppSettings = {
    uiTheme: 'light',
    colorTheme: 'classic',
    backgroundTheme: 'dark',
    cubeSize: 3,
    scrambleSteps: 25,
    animationSpeed: 500,
    soundEnabled: true,
    showClock: true,
    blindfoldMode: false,
    saveRecordEnabled: false,
    panelCollapsed: false,
    uiHidden: false,
    currentMode: 'practice',
    keyMappings: {
      front: 'f',
      back: 'b',
      right: 'r',
      left: 'l',
      up: 'u',
      down: 'd',
      middle: 'm',
      equator: 'e',
      standing: 's',
      cubeX: 'x',
      cubeY: 'y',
      cubeZ: 'z',
      shift: 'SHIFT'
    },
    enableHints: true,
    showMoveCount: true,
    autoSolveSteps: false
  };

  private constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get current settings
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get specific setting value
   */
  public get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Set specific setting value
   */
  public set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    // Save to storage
    this.saveSettings();
    
    // Trigger callbacks
    if (oldValue !== value) {
      this.triggerCallbacks(key, value);
    }
  }

  /**
   * Update multiple settings at once
   */
  public updateSettings(updates: Partial<AppSettings>): void {
    const changedKeys: string[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      const settingKey = key as keyof AppSettings;
      if (this.settings[settingKey] !== value) {
        changedKeys.push(key);
        (this.settings as any)[settingKey] = value;
      }
    });

    if (changedKeys.length > 0) {
      this.saveSettings();
      
      // Trigger callbacks for changed settings
      changedKeys.forEach(key => {
        this.triggerCallbacks(key, (this.settings as any)[key]);
      });
    }
  }

  /**
   * Reset settings to default
   */
  public resetToDefault(): void {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
    
    // Trigger callbacks for all settings
    Object.keys(this.settings).forEach(key => {
      this.triggerCallbacks(key, (this.settings as any)[key]);
    });
  }

  /**
   * Reset specific setting to default
   */
  public resetSetting<K extends keyof AppSettings>(key: K): void {
    this.set(key, this.defaultSettings[key]);
  }

  /**
   * Subscribe to setting changes
   */
  public subscribe<K extends keyof AppSettings>(
    key: K | K[], 
    callback: (value: AppSettings[K]) => void
  ): () => void {
    const keys = Array.isArray(key) ? key : [key];
    
    keys.forEach(k => {
      if (!this.callbacks.has(k)) {
        this.callbacks.set(k, []);
      }
      this.callbacks.get(k)!.push(callback);
    });

    // Return unsubscribe function
    return () => {
      keys.forEach(k => {
        const callbacks = this.callbacks.get(k);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index >= 0) {
            callbacks.splice(index, 1);
          }
        }
      });
    };
  }

  /**
   * Export settings as JSON
   */
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  public importSettings(jsonString: string): { success: boolean; errors: string[] } {
    try {
      const importedSettings = JSON.parse(jsonString);
      const validation = this.validateSettings(importedSettings);
      
      if (validation.valid) {
        this.settings = { ...this.defaultSettings, ...importedSettings };
        this.saveSettings();
        
        // Trigger callbacks for all settings
        Object.keys(this.settings).forEach(key => {
          this.triggerCallbacks(key, (this.settings as any)[key]);
        });
        
        return { success: true, errors: [] };
      } else {
        return { success: false, errors: validation.errors };
      }
    } catch (error) {
      return { success: false, errors: ['Invalid JSON format'] };
    }
  }

  /**
   * Get settings optimized for specific cube size
   */
  public getCubeSizeOptimizedSettings(size: number): Partial<AppSettings> {
    const optimizations: Partial<AppSettings> = {
      cubeSize: size
    };

    // Adjust scramble steps based on cube size
    switch (size) {
      case 2:
        optimizations.scrambleSteps = 15;
        break;
      case 3:
        optimizations.scrambleSteps = 25;
        break;
      case 4:
        optimizations.scrambleSteps = 35;
        break;
      case 5:
        optimizations.scrambleSteps = 50;
        break;
      default:
        optimizations.scrambleSteps = size * 8;
    }

    // Adjust animation speed for larger cubes
    if (size > 3) {
      optimizations.animationSpeed = Math.min(800, this.settings.animationSpeed + (size - 3) * 100);
    }

    return optimizations;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validation = this.validateSettings(parsed);
        
        if (validation.valid) {
          return { ...this.defaultSettings, ...parsed };
        } else {
          console.warn('Invalid settings found, using defaults:', validation.errors);
        }
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
    }
    
    return { ...this.defaultSettings };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Validate settings object
   */
  private validateSettings(settings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof settings !== 'object' || settings === null) {
      errors.push('Settings must be an object');
      return { valid: false, errors };
    }

    // Validate theme settings
    if (settings.uiTheme && !['light', 'dark'].includes(settings.uiTheme)) {
      errors.push('Invalid UI theme');
    }

    // Validate cube size
    if (settings.cubeSize && (typeof settings.cubeSize !== 'number' || settings.cubeSize < 2 || settings.cubeSize > 10)) {
      errors.push('Cube size must be a number between 2 and 10');
    }

    // Validate scramble steps
    if (settings.scrambleSteps && (typeof settings.scrambleSteps !== 'number' || settings.scrambleSteps < 1 || settings.scrambleSteps > 100)) {
      errors.push('Scramble steps must be a number between 1 and 100');
    }

    // Validate animation speed
    if (settings.animationSpeed && (typeof settings.animationSpeed !== 'number' || settings.animationSpeed < 100 || settings.animationSpeed > 2000)) {
      errors.push('Animation speed must be a number between 100 and 2000');
    }

    // Validate boolean settings
    const booleanSettings = ['soundEnabled', 'showClock', 'blindfoldMode', 'saveRecordEnabled', 'panelCollapsed', 'uiHidden', 'enableHints', 'showMoveCount', 'autoSolveSteps'];
    booleanSettings.forEach(setting => {
      if (settings[setting] !== undefined && typeof settings[setting] !== 'boolean') {
        errors.push(`${setting} must be a boolean`);
      }
    });

    // Validate mode
    if (settings.currentMode && !['practice', 'timer'].includes(settings.currentMode)) {
      errors.push('Invalid current mode');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Trigger callbacks for setting change
   */
  private triggerCallbacks(key: string, value: any): void {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in settings callback for ${key}:`, error);
        }
      });
    }
  }
}
