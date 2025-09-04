import * as THREE from 'three';
import { RubiksCube } from '../core/RubiksCube';
import { Cubelet } from '../core/Cubelet';
import { standardizeCubeConfig } from '../config/constants';
import { ColorThemeManager, CubeColorScheme } from '../managers/ColorThemeManager';

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
  cubeType?: string;   // Type of cube (2x2x2, 3x3x3)
  cubeSize?: number;   // Size of cube (2, 3)
}

/**
 * Cube State Manager - Handles saving and loading cube states
 */
export class CubeStateManager {
  private rubiksCube: RubiksCube;
  private currentColorTheme: string = 'classic';
  // Use ColorThemeManager instead of local color themes

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

    // Get cube type information
    const cubeType = (this.rubiksCube as any).getCubeType?.() || '3x3x3';
    const cubeSize = cubeType === '2x2x2' ? 2 : 3;

    return {
      cubeState,
      cubeletsData,
      timestamp: new Date().toISOString(),
      version: '1.0',
      colorTheme: this.currentColorTheme, // Save current theme
      cubeType: cubeType,
      cubeSize: cubeSize
    };
  }

  /**
   * Load cube state from data
   */
  public loadState(data: CubeStateData): void {
    // Stop any ongoing animation
    this.rubiksCube.stopAnimation();

    try {
      // Ensure cube config is standardized based on the cube type in the data
      const cubeType = data.cubeType || '3x3x3';
      standardizeCubeConfig(cubeType);
      
      // Clear move history when loading a new state
      // Access the cube's clearMoveHistory method if available
      if (typeof this.rubiksCube['clearMoveHistory'] === 'function') {
        this.rubiksCube['clearMoveHistory']();
      }
      
      // Set 2D cube state using rotationLogic
      try {

        this.rubiksCube['rotationLogic'].setCubeState(data.cubeState);
      } catch (e) {
        console.warn('Error setting cube state:', e);
      }

      // Update 3D cubelets
      const cubelets = this.rubiksCube.getCubelets();

      if (cubelets.length !== data.cubeletsData.length) {
        console.warn(`Mismatch in cubelet count: expected ${cubelets.length}, got ${data.cubeletsData.length}`);
        return;
      }
      
      // Get theme colors for conversion from ColorThemeManager
      const themeManager = ColorThemeManager.getInstance();
      const savedTheme = data.colorTheme || 'classic';
      const currentThemeColors = themeManager.getColorScheme(this.currentColorTheme);
      const savedThemeColors = themeManager.getColorScheme(savedTheme);

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
    } catch (error) {
      console.error('Error applying cube state:', error);
    }
  }

  /**
   * Convert colors from saved theme to current theme
   */
  private convertColorsToCurrentTheme(
    savedColors: string[],
    savedThemeColors: CubeColorScheme | null,
    currentThemeColors: CubeColorScheme | null
  ): string[] {
    const convertedColors = [...savedColors];

    // Early return if either theme is null
    if (!savedThemeColors || !currentThemeColors) {
      return convertedColors;
    }

    const faceKeys: (keyof CubeColorScheme)[] = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    
    for (let i = 0; i < 6 && i < savedColors.length; i++) {
      const savedColor = savedColors[i];
      
      // Find which face color this matches in the saved theme
      for (const faceKey of faceKeys) {
        if (this.colorsMatch(savedColor, savedThemeColors[faceKey])) {
          // Replace with corresponding color from current theme
          convertedColors[i] = currentThemeColors[faceKey] || savedColor;
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
            
      // Check if color value is a gradient (starts with 'linear-gradient')
      if (typeof color === 'string' && color.startsWith('linear-gradient')) {
        // Create a canvas texture for gradient
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Parse gradient
          const gradientMatch = color.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
          if (gradientMatch) {
            const direction = gradientMatch[1];
            const color1 = gradientMatch[2].trim();
            const color2 = gradientMatch[3].trim();
            
            // Create gradient based on direction
            let gradient;
            if (direction.includes('45deg')) {
              gradient = ctx.createLinearGradient(0, 0, 256, 256);
            } else if (direction.includes('135deg')) {
              gradient = ctx.createLinearGradient(0, 256, 256, 0);
            } else if (direction.includes('to right')) {
              gradient = ctx.createLinearGradient(0, 0, 256, 0);
            } else {
              // Default to vertical gradient
              gradient = ctx.createLinearGradient(0, 0, 0, 256);
            }
            
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            
            // Create texture
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            
            // Create material with gradient texture
            const material = new THREE.MeshPhongMaterial({ 
              map: texture,
              color: 0xffffff,
              transparent: false,
              opacity: 1.0,
              shininess: 100,
              specular: 0x222222
            });
            
            materials.push(material);
          } else {
            // Fallback to solid color
            materials.push(new THREE.MeshPhongMaterial({ 
              color: color,
              transparent: false,
              opacity: 1.0,
              shininess: 100,
              specular: 0x222222
            }));
          }
        } else {
          // Fallback if canvas context not available
          materials.push(new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: false,
            opacity: 1.0,
            shininess: 100,
            specular: 0x222222
          }));
        }
      } else {
        // Regular color
      materials.push(new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: false,
        opacity: 1.0,
        shininess: 100,
        specular: 0x222222
      }));
    }
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

    // Create filename with local date and time and cube type
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '-'); // HH-MM-SS
    
    // Get cube type for the filename
    const cubeType = (this.rubiksCube as any).getCubeType?.() || '3x3x3';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `rubiks-cube-${cubeType}-${dateStr}_${timeStr}.json`;
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

      reader.onload = async (event) => {
        try {
          const jsonContent = event.target?.result as string;

          
          let data: CubeStateData;
          try {
            data = JSON.parse(jsonContent);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            reject(new Error('Invalid JSON format in file'));
            return;
          }

          // Check file name for cube type hints
          const fileName = file.name.toLowerCase();
          const is2x2FileByName = fileName.includes('2x2') || fileName.includes('pocket');
          

          // Try to determine cube size from data
          let cubeSize: number;
          
          // Validate data structure
          if (!this.validateCubeStateData(data)) {
            console.warn('Basic validation failed, using file name to determine cube type');
            cubeSize = is2x2FileByName ? 2 : 3;
          } else {
            cubeSize = this.detectCubeSizeFromData(data);
          }
          

          
          // Get current cube information
          const currentCube = this.rubiksCube;
          const currentCubeType = (currentCube as any).getCubeType?.() || '3x3x3';
          let currentCubeSize = 3; // Default to 3x3x3
          
          // Determine current cube size based on cube type
          if (currentCubeType === '2x2x2') currentCubeSize = 2;
          else if (currentCubeType === '4x4x4') currentCubeSize = 4;
          else if (currentCubeType === '5x5x5') currentCubeSize = 5;

          // If cube sizes don't match, switch to the appropriate cube size
          if (cubeSize !== currentCubeSize) {
            // Get CubeTypeManager instance to switch cube size
            const cubeTypeManager = (window as any).CubeTypeManager?.getInstance();
            if (cubeTypeManager) {
              // Switch to the cube size from the file
              await cubeTypeManager.switchToCubeSize(cubeSize);
              
              // Get the new cube reference after switching
              this.rubiksCube = cubeTypeManager.getCurrentCube() || this.rubiksCube;
            } else {
              console.warn('CubeTypeManager not available globally');
              
              // If CubeTypeManager is not available, at least standardize the cube config
              let cubeTypeStr = '3x3x3'; // Default
              if (cubeSize === 2) cubeTypeStr = '2x2x2';
              else if (cubeSize === 4) cubeTypeStr = '4x4x4';
              else if (cubeSize === 5) cubeTypeStr = '5x5x5';
              standardizeCubeConfig(cubeTypeStr);
            }
          } else {
            // Even if we're not switching cube size, ensure the configuration is standardized
            let cubeTypeStr = '3x3x3'; // Default
            if (cubeSize === 2) cubeTypeStr = '2x2x2';
            else if (cubeSize === 4) cubeTypeStr = '4x4x4';
            else if (cubeSize === 5) cubeTypeStr = '5x5x5';
            standardizeCubeConfig(cubeTypeStr);
          }

          // Load state from imported data (this will also clear move history)
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
    
    // For 2x2, 3x3, 4x4, and 5x5 cubes
    const isCube2x2 = data.cubeletsData.length === 8;
    const isCube3x3 = data.cubeletsData.length === 27;
    const isCube4x4 = data.cubeletsData.length === 64;
    const isCube5x5 = data.cubeletsData.length === 125;
    
    if (!isCube2x2 && !isCube3x3 && !isCube4x4 && !isCube5x5) {
      console.warn('Not a valid cube - cubelet count:', data.cubeletsData.length);
      return false; // Not a valid cube
    }
    
    // Determine cube size
    let size = 3; // Default
    if (isCube2x2) size = 2;
    else if (isCube4x4) size = 4;
    else if (isCube5x5) size = 5;
    

    
    // Simplified validation for 2x2 cubes which might have different state format
    if (isCube2x2) {
      // For 2x2 cubes, we'll be less strict about the state format
      // Just ensure each face has a state array
      for (const face of faces) {
        if (!data.cubeState[face]) {
          console.warn(`Missing face ${face} in cube state`);
          return false;
        }
      }
    } else {
      // More strict validation for 3x3 and 4x4 cubes
      for (const face of faces) {
        if (!data.cubeState[face] || !Array.isArray(data.cubeState[face])) return false;
        if (data.cubeState[face].length !== size) return false;
        for (const row of data.cubeState[face]) {
          if (!Array.isArray(row) || row.length !== size) return false;
        }
      }
    }

    // Check cubelets data
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
  public async loadFromLocalStorage(key: string = 'rubiks-cube-state'): Promise<boolean> {
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return false;

    try {
      const data: CubeStateData = JSON.parse(dataStr);
      if (this.validateCubeStateData(data)) {
        // Determine cube size from data
        const cubeSize = this.detectCubeSizeFromData(data);
        
        // Get current cube information
        const currentCubeType = this.rubiksCube.getCubeType();
        let currentCubeSize = 3; // Default to 3x3x3
        if (currentCubeType === '2x2x2') currentCubeSize = 2;
        else if (currentCubeType === '4x4x4') currentCubeSize = 4;
        else if (currentCubeType === '5x5x5') currentCubeSize = 5;

        // If cube sizes don't match, switch to the appropriate cube size
        if (cubeSize !== currentCubeSize) {

          // Get CubeTypeManager instance to switch cube size
          const cubeTypeManager = (window as any).CubeTypeManager?.getInstance();
          if (cubeTypeManager) {
            // Switch to the cube size from localStorage data
            await cubeTypeManager.switchToCubeSize(cubeSize);
            
            // Get the new cube reference after switching
            this.rubiksCube = cubeTypeManager.getCurrentCube() || this.rubiksCube;
          }
        }
        
        // Load state from localStorage (this will also clear move history)
        this.loadState(data);
        return true;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }

    return false;
  }

  /**
   * Check if there's a saved state in localStorage
   * @param key The localStorage key
   * @param requireSameCubeSize If true, only returns true if the saved state's cube size matches the current cube
   */
  public hasSavedState(key: string = 'rubiks-cube-state', requireSameCubeSize: boolean = false): boolean {
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return false;

    try {
      const data = JSON.parse(dataStr);
      
      if (!this.validateCubeStateData(data)) {
        return false;
      }
      
      // If we need to verify cube size matches
      if (requireSameCubeSize) {
        const savedCubeSize = this.detectCubeSizeFromData(data);
        const currentCubeType = this.rubiksCube.getCubeType();
        
        // Determine current cube size based on type
        let currentCubeSize = 3; // Default to 3x3x3
        if (currentCubeType === '2x2x2') currentCubeSize = 2;
        else if (currentCubeType === '4x4x4') currentCubeSize = 4;
        else if (currentCubeType === '5x5x5') currentCubeSize = 5;
        
        if (savedCubeSize !== currentCubeSize) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect cube size from state data
   */
  private detectCubeSizeFromData(data: CubeStateData): number {
    // Detect from the number of cubelets in the data
    // 2x2 cube has 8 cubelets, 3x3 cube has 27 cubelets, 4x4 cube has 64 cubelets, 5x5 cube has 125 cubelets
    if (data.cubeletsData.length === 8) {
      return 2; // 2x2 cube
    } else if (data.cubeletsData.length === 27) {
      return 3; // 3x3 cube
    } else if (data.cubeletsData.length === 64) {
      return 4; // 4x4 cube
    } else if (data.cubeletsData.length === 125) {
      return 5; // 5x5 cube
    } else {
      // Try to determine from first face dimension if available
      if (data.cubeState && data.cubeState.U) {
        if (Array.isArray(data.cubeState.U)) {
          return data.cubeState.U.length;
        }
      }
      // Default to 3x3 if we can't determine size
      return 3;
    }
  }
}
