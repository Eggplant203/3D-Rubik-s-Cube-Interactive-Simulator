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
    },
    // Gradient themes using linear-gradient CSS - simplified format for better compatibility
    gradientRainbow: {
      front: 'linear-gradient(45deg, #ff0000, #ff8000)',   // Red-Orange
      back: 'linear-gradient(45deg, #00ff00, #80ff00)',    // Green-Lime
      right: 'linear-gradient(45deg, #0000ff, #8000ff)',   // Blue-Purple
      left: 'linear-gradient(45deg, #ff8000, #ffff00)',    // Orange-Yellow
      top: 'linear-gradient(45deg, #ffff00, #80ff00)',     // Yellow-Lime
      bottom: 'linear-gradient(45deg, #ffffff, #f0f0f0)'   // White-LightGray
    },
    gradientNeon: {
      front: 'linear-gradient(to right, #00ffff, #0080ff)',  // Cyan-Blue
      back: 'linear-gradient(to right, #ff00ff, #ff0080)',   // Magenta-Pink
      right: 'linear-gradient(to right, #ff0080, #ff0000)',  // Pink-Red
      left: 'linear-gradient(to right, #80ff00, #00ff80)',   // Lime-GreenCyan
      top: 'linear-gradient(to right, #ffff00, #ff8000)',    // Yellow-Orange
      bottom: 'linear-gradient(to right, #ffffff, #e0e0e0)'  // White-LightGray
    },
    gradientCosmic: {
      front: 'linear-gradient(to right, #0f2027, #2c5364)',          // Deep blue gradient 
      back: 'linear-gradient(to right, #134e5e, #71b280)',           // Green-blue gradient
      right: 'linear-gradient(to right, #8e0e00, #1f1c18)',          // Dark red gradient
      left: 'linear-gradient(to right, #ff8008, #ffc837)',           // Orange-yellow gradient
      top: 'linear-gradient(to right, #ffd200, #f7971e)',            // Bright yellow gradient
      bottom: 'linear-gradient(to right, #ece9e6, #ffffff)'          // White gradient
    },
    gradientMetallic: {
      front: 'linear-gradient(to right, #283048, #859398)',          // Steel blue
      back: 'linear-gradient(to right, #3c3b3f, #605c3c)',           // Dark olive
      right: 'linear-gradient(to right, #800000, #a52a2a)',          // Maroon to brown
      left: 'linear-gradient(to right, #b79891, #94716b)',           // Rose brown
      top: 'linear-gradient(to right, #bdc3c7, #d9d9d9)',            // Silver
      bottom: 'linear-gradient(to right, #e6dada, #ffffff)'          // White smoke
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
    aurora: { name: 'Aurora', color: 0x9370db, description: 'Mystical aurora purple' },
    // Gradient themes
    gradientSunrise: { name: 'Gradient Sunrise', color: 0xffa500, description: 'Orange to yellow gradient' },
    gradientTwilight: { name: 'Gradient Twilight', color: 0x4b0082, description: 'Deep purple to dark blue gradient' },
    gradientOcean: { name: 'Gradient Ocean', color: 0x00bfff, description: 'Light blue to deep blue gradient' },
    gradientForest: { name: 'Gradient Forest', color: 0x006400, description: 'Light green to dark green gradient' },
    gradientFire: { name: 'Gradient Fire', color: 0xff4500, description: 'Orange to red gradient' },
    gradientCosmic: { name: 'Gradient Cosmic', color: 0x663399, description: 'Purple to black with starry effect' },
    gradientNeon: { name: 'Gradient Neon', color: 0x39ff14, description: 'Vibrant neon color gradient' }
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
