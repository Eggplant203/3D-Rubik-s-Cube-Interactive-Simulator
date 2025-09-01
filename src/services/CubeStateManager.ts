import * as THREE from 'three';
import { RubiksCube } from '../core/RubiksCube';
import { Cubelet } from '../core/Cubelet';

/**
 * Interface for cubelet state data
 */
interface CubeletStateData {
  position: {
    x: number;
    y: number;
    z: number;
  };
  quaternion: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  colors: string[];
}

/**
 * Interface for complete cube state data
 */
interface CubeStateData {
  cubeState: {
    U: string[][];
    D: string[][];
    L: string[][];
    R: string[][];
    F: string[][];
    B: string[][];
  };
  cubeletsData: CubeletStateData[];
  timestamp: string;
  version: string;
  colorTheme?: string; // Optional for backward compatibility
}

/**
 * Cube State Manager - Handles saving and loading cube states
 */
export class CubeStateManager {
  private rubiksCube: RubiksCube;
  private currentColorTheme: string = 'classic';
  private colorThemes: { [key: string]: { [key: string]: string } } = {
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
      right: '#f4a4a4',   // Pastel red
      left: '#f9d5a7',    // Pastel orange
      top: '#fff2a8',     // Pastel yellow
      bottom: '#f5f5f5'   // Light gray
    },
    earth: {
      front: '#8b4513',   // Brown
      back: '#228b22',    // Forest green
      right: '#dc143c',   // Crimson
      left: '#daa520',    // Goldenrod
      top: '#ffd700',     // Gold
      bottom: '#f5f5dc'   // Beige
    },
    ocean: {
      front: '#1e90ff',   // Dodger blue
      back: '#008080',    // Teal
      right: '#ff6347',   // Coral
      left: '#20b2aa',    // Light sea green
      top: '#87ceeb',     // Sky blue
      bottom: '#e0ffff'   // Light cyan
    },
    fire: {
      front: '#ff4500',   // Orange red
      back: '#ff1493',    // Deep pink
      right: '#dc143c',   // Crimson
      left: '#ff8c00',    // Dark orange
      top: '#ffd700',     // Gold
      bottom: '#fff8dc'   // Cornsilk
    },
    rainbow: {
      front: '#ff0000',   // Red
      back: '#ff7f00',    // Orange
      right: '#ffff00',   // Yellow
      left: '#00ff00',    // Green
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

  constructor(rubiksCube: RubiksCube) {
    this.rubiksCube = rubiksCube;
  }

  /**
   * Set the current color theme
   */
  public setColorTheme(theme: string): void {
    this.currentColorTheme = theme;
  }

  /**
   * Get the current color theme
   */
  public getColorTheme(): string {
    return this.currentColorTheme;
  }

  /**
   * Save current cube state
   */
  public saveState(): CubeStateData {
    const cubeState = this.rubiksCube.getCubeState();
    const cubelets = this.rubiksCube.getCubelets();

    const cubeletsData: CubeletStateData[] = cubelets.map(cubelet => ({
      position: {
        x: cubelet.position.x,
        y: cubelet.position.y,
        z: cubelet.position.z
      },
      quaternion: {
        x: cubelet.mesh.quaternion.x,
        y: cubelet.mesh.quaternion.y,
        z: cubelet.mesh.quaternion.z,
        w: cubelet.mesh.quaternion.w
      },
      colors: [...cubelet.colors]
    }));

    return {
      cubeState,
      cubeletsData,
      timestamp: new Date().toISOString(),
      version: '1.0',
      colorTheme: this.currentColorTheme // Save current theme
    };
  }

  /**
   * Load cube state from data
   */
  public loadState(data: CubeStateData): void {
    // Stop any ongoing animation
    this.rubiksCube.stopAnimation();

    // Set 2D cube state
    this.rubiksCube['rotationLogic'].setCubeState(data.cubeState);

    // Update 3D cubelets
    const cubelets = this.rubiksCube.getCubelets();

    if (cubelets.length !== data.cubeletsData.length) {
      return;
    }

    // Get theme colors for conversion
    const savedTheme = data.colorTheme || 'classic';
    const currentThemeColors = this.colorThemes[this.currentColorTheme] || this.colorThemes['classic'];
    const savedThemeColors = this.colorThemes[savedTheme] || this.colorThemes['classic'];

    for (let i = 0; i < cubelets.length; i++) {
      const cubelet = cubelets[i];
      const cubeletData = data.cubeletsData[i];

      // Update position
      cubelet.position.copy(new THREE.Vector3(
        cubeletData.position.x,
        cubeletData.position.y,
        cubeletData.position.z
      ));

      // Update mesh position
      cubelet.mesh.position.copy(cubelet.position);

      // Update rotation
      cubelet.mesh.quaternion.set(
        cubeletData.quaternion.x,
        cubeletData.quaternion.y,
        cubeletData.quaternion.z,
        cubeletData.quaternion.w
      );

      // Convert colors from saved theme to current theme
      const convertedColors = this.convertColorsToCurrentTheme(
        cubeletData.colors,
        savedThemeColors,
        currentThemeColors
      );

      // Update colors
      cubelet.colors = convertedColors;

      // Update mesh materials
      this.updateCubeletMaterials(cubelet);
    }
  }

  /**
   * Convert colors from saved theme to current theme
   */
  private convertColorsToCurrentTheme(
    savedColors: string[],
    savedThemeColors: { [key: string]: string },
    currentThemeColors: { [key: string]: string }
  ): string[] {
    const convertedColors = [...savedColors];

    for (let i = 0; i < 6; i++) {
      const savedColor = savedColors[i];

      // Find which theme color this matches in the saved theme
      for (const [themeKey, themeColor] of Object.entries(savedThemeColors)) {
        if (this.colorsMatch(savedColor, themeColor)) {
          // Replace with corresponding color from current theme
          convertedColors[i] = currentThemeColors[themeKey] || savedColor;
          break;
        }
      }
    }

    return convertedColors;
  }

  /**
   * Check if two colors match (with some tolerance for slight variations)
   */
  private colorsMatch(color1: string, color2: string): boolean {
    // Simple exact match for now - could be enhanced with color distance calculation for better theme compatibility
    return color1.toLowerCase() === color2.toLowerCase();
  }

  /**
   * Update cubelet materials based on colors
   */
  private updateCubeletMaterials(cubelet: Cubelet): void {
    const materials: THREE.Material[] = [];

    for (let i = 0; i < 6; i++) {
      const color = cubelet.colors[i] || '#333333';
      materials.push(new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: false,
        opacity: 1.0,
        shininess: 100,
        specular: 0x222222
      }));
    }

    // Update the mesh materials - the cube mesh is the first child
    if (cubelet.mesh.children[0] instanceof THREE.Mesh) {
      (cubelet.mesh.children[0] as THREE.Mesh).material = materials;
    }
  }  /**
   * Export cube state to JSON file
   */
  public exportToFile(): void {
    const data = this.saveState();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create filename with local date and time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '-'); // HH-MM-SS

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `rubiks-cube-state-${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Import cube state from JSON file
   */
  public importFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data: CubeStateData = JSON.parse(event.target?.result as string);

          // Validate data structure
          if (!this.validateCubeStateData(data)) {
            reject(new Error('Invalid cube state file format'));
            return;
          }

          this.loadState(data);
          resolve();
        } catch (error) {
          reject(new Error('Failed to parse cube state file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate cube state data structure
   */
  private validateCubeStateData(data: any): data is CubeStateData {
    if (!data || typeof data !== 'object') return false;
    if (!data.cubeState || !data.cubeletsData || !Array.isArray(data.cubeletsData)) return false;

    // Check cube state structure
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    for (const face of faces) {
      if (!data.cubeState[face] || !Array.isArray(data.cubeState[face])) return false;
      if (data.cubeState[face].length !== 3) return false;
      for (const row of data.cubeState[face]) {
        if (!Array.isArray(row) || row.length !== 3) return false;
      }
    }

    // Check cubelets data
    if (data.cubeletsData.length !== 27) return false; // 3x3x3 cube has 27 cubelets

    for (const cubeletData of data.cubeletsData) {
      if (!cubeletData.position || !cubeletData.quaternion || !cubeletData.colors) return false;
      if (!Array.isArray(cubeletData.colors) || cubeletData.colors.length !== 6) return false;
    }

    // colorTheme is optional for backward compatibility
    return true;
  }

  /**
   * Save state to localStorage
   */
  public saveToLocalStorage(key: string = 'rubiks-cube-state'): void {
    const data = this.saveState();
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Load state from localStorage
   */
  public loadFromLocalStorage(key: string = 'rubiks-cube-state'): boolean {
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return false;

    try {
      const data: CubeStateData = JSON.parse(dataStr);
      if (this.validateCubeStateData(data)) {
        this.loadState(data);
        return true;
      }
    } catch (error) {
    }

    return false;
  }

  /**
   * Check if there's a saved state in localStorage
   */
  public hasSavedState(key: string = 'rubiks-cube-state'): boolean {
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return false;

    try {
      const data = JSON.parse(dataStr);
      return this.validateCubeStateData(data);
    } catch {
      return false;
    }
  }
}
