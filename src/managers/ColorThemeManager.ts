/**
 * Color Theme Manager - Centralized management of cube color themes
 * Supports extensible color schemes for different cube types
 */
export interface CubeColorScheme {
  front: string;
  back: string;
  right: string;
  left: string;
  top: string;
  bottom: string;
}

export interface BackgroundTheme {
  name: string;
  color: number;
  description: string;
}

export class ColorThemeManager {
  private static instance: ColorThemeManager;
  private currentColorTheme: string = 'classic';
  private currentBackgroundTheme: string = 'dark';

  // Color schemes for different themes
  private readonly colorSchemes: { [key: string]: CubeColorScheme } = {
    classic: {
      front: '#3366ff',   // Blue
      back: '#33cc33',    // Green
      right: '#ff3333',   // Red
      left: '#ff9900',    // Orange
      top: '#ffff33',     // Yellow
      bottom: '#ffffff'   // White
    },
    neon: {
      front: '#00ffff',   // Cyan
      back: '#ff00ff',    // Magenta
      right: '#ff0080',   // Pink
      left: '#80ff00',    // Lime
      top: '#ffff00',     // Yellow
      bottom: '#ffffff'   // White
    },
    pastel: {
      front: '#a8d5e2',   // Pastel blue
      back: '#b8e6b8',    // Pastel green
      right: '#f5b5b5',   // Pastel red
      left: '#f5d5a8',    // Pastel orange
      top: '#f5f5a8',     // Pastel yellow
      bottom: '#ffffff'   // White
    },
    vibrant: {
      front: '#ff6b35',   // Orange red
      back: '#004e89',    // Navy blue
      right: '#1a659e',   // Blue
      left: '#f7931e',    // Orange
      top: '#ffd23f',     // Golden yellow
      bottom: '#ffffff'   // White
    },
    sunset: {
      front: '#ff9a56',   // Peach
      back: '#ffad56',    // Light orange
      right: '#ff6b6b',   // Coral
      left: '#4ecdc4',    // Turquoise
      top: '#ffe66d',     // Light yellow
      bottom: '#ffffff'   // White
    },
    ocean: {
      front: '#006994',   // Ocean blue
      back: '#228b22',    // Forest green
      right: '#4169e1',   // Royal blue
      left: '#00ced1',    // Dark turquoise
      top: '#0000ff',     // Blue
      bottom: '#8b00ff'   // Violet
    },
    monochrome: {
      front: '#2c2c2c',   // Dark gray
      back: '#404040',    // Medium gray
      right: '#595959',   // Light gray
      left: '#737373',    // Silver
      top: '#8c8c8c',     // Light silver
      bottom: '#a6a6a6'   // Pale silver
    }
  };

  // Background themes
  private readonly backgroundThemes: { [key: string]: BackgroundTheme } = {
    dark: { name: 'Dark', color: 0x2a2a2a, description: 'Classic dark background' },
    light: { name: 'Light', color: 0xf5f5f5, description: 'Clean light background' },
    blue: { name: 'Blue', color: 0x1e3a5f, description: 'Deep blue background' },
    gradient: { name: 'Gradient', color: 0x4a90e2, description: 'Gradient-like solid color' },
    sunset: { name: 'Sunset', color: 0xff7f50, description: 'Warm coral sunset' },
    forest: { name: 'Forest', color: 0x228b22, description: 'Natural forest green' },
    ocean: { name: 'Ocean', color: 0x006994, description: 'Deep ocean blue' },
    space: { name: 'Space', color: 0x191970, description: 'Cosmic midnight blue' },
    fire: { name: 'Fire', color: 0xdc143c, description: 'Fiery crimson' },
    aurora: { name: 'Aurora', color: 0x9370db, description: 'Mystical aurora purple' }
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ColorThemeManager {
    if (!ColorThemeManager.instance) {
      ColorThemeManager.instance = new ColorThemeManager();
    }
    return ColorThemeManager.instance;
  }

  /**
   * Get available color theme names
   */
  public getAvailableColorThemes(): string[] {
    return Object.keys(this.colorSchemes);
  }

  /**
   * Get available background theme names
   */
  public getAvailableBackgroundThemes(): string[] {
    return Object.keys(this.backgroundThemes);
  }

  /**
   * Get color scheme by theme name
   */
  public getColorScheme(themeName: string): CubeColorScheme | null {
    return this.colorSchemes[themeName] || null;
  }

  /**
   * Get background theme by name
   */
  public getBackgroundTheme(themeName: string): BackgroundTheme | null {
    return this.backgroundThemes[themeName] || null;
  }

  /**
   * Get current color theme name
   */
  public getCurrentColorTheme(): string {
    return this.currentColorTheme;
  }

  /**
   * Get current background theme name
   */
  public getCurrentBackgroundTheme(): string {
    return this.currentBackgroundTheme;
  }

  /**
   * Set current color theme
   */
  public setCurrentColorTheme(themeName: string): boolean {
    if (this.colorSchemes[themeName]) {
      this.currentColorTheme = themeName;
      return true;
    }
    return false;
  }

  /**
   * Set current background theme
   */
  public setCurrentBackgroundTheme(themeName: string): boolean {
    if (this.backgroundThemes[themeName]) {
      this.currentBackgroundTheme = themeName;
      return true;
    }
    return false;
  }

  /**
   * Generate random color scheme
   */
  public generateRandomColorScheme(): CubeColorScheme {
    const getRandomColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
      const lightness = 45 + Math.floor(Math.random() * 20);  // 45-65%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    return {
      front: getRandomColor(),
      back: getRandomColor(),
      right: getRandomColor(),
      left: getRandomColor(),
      top: getRandomColor(),
      bottom: '#ffffff' // Keep white for bottom
    };
  }

  /**
   * Add custom color theme
   */
  public addCustomColorTheme(name: string, scheme: CubeColorScheme): void {
    this.colorSchemes[name] = { ...scheme };
  }

  /**
   * Add custom background theme
   */
  public addCustomBackgroundTheme(name: string, theme: BackgroundTheme): void {
    this.backgroundThemes[name] = { ...theme };
  }

  /**
   * Check if colors match (for theme conversion)
   */
  public colorsMatch(color1: string, color2: string): boolean {
    return color1.toLowerCase() === color2.toLowerCase();
  }

  /**
   * Convert colors from one theme to another
   */
  public convertColorsToTheme(
    colors: string[],
    fromTheme: string,
    toTheme: string
  ): string[] {
    const fromScheme = this.getColorScheme(fromTheme);
    const toScheme = this.getColorScheme(toTheme);
    
    if (!fromScheme || !toScheme) {
      return colors;
    }

    const convertedColors = [...colors];
    const faceKeys = ['right', 'left', 'top', 'bottom', 'front', 'back'];

    for (let i = 0; i < Math.min(colors.length, faceKeys.length); i++) {
      const faceKey = faceKeys[i] as keyof CubeColorScheme;
      if (this.colorsMatch(colors[i], fromScheme[faceKey])) {
        convertedColors[i] = toScheme[faceKey];
      }
    }

    return convertedColors;
  }
}
