import * as THREE from 'three';
import { standardizeCubeConfig } from './constants';

/**
 * Configuration for different cube sizes and types
 */
export interface CubeConfiguration {
  size: number;
  dimensions: { width: number; height: number; depth: number };
  cubeSize: number;
  spacing: number;
  positionOffset: THREE.Vector3;
  colors: {
    front: string;
    back: string;
    right: string;
    left: string;
    top: string;
    bottom: string;
  };
  animation: {
    rotationSpeed: number;
    transitionDuration: number;
  };
  camera: {
    position: THREE.Vector3;
    fov: number;
    near: number;
    far: number;
  };
  lighting: {
    ambient: {
      color: number;
      intensity: number;
    };
    directional: {
      color: number;
      intensity: number;
      position: THREE.Vector3;
    };
  };
  // Cube-specific properties
  scrambleSteps?: number;
  complexityLevel?: number;
}

/**
 * Cube Configuration Factory - Creates optimized configurations for different cube sizes
 */
export class CubeConfigurationFactory {
  private static readonly BASE_CONFIG: CubeConfiguration = {
    size: 3,
    dimensions: { width: 3, height: 3, depth: 3 },
    cubeSize: 2,
    spacing: 0.1,
    positionOffset: new THREE.Vector3(0, 0, 0),
    colors: {
      front: '#3366ff',
      back: '#33cc33',
      right: '#ff3333',
      left: '#ff9900',
      top: '#ffff33',
      bottom: '#ffffff'
    },
    animation: {
      rotationSpeed: 2,
      transitionDuration: 500
    },
    camera: {
      position: new THREE.Vector3(8, 8, 8),
      fov: 75,
      near: 0.1,
      far: 1000
    },
    lighting: {
      ambient: {
        color: 0x404040,
        intensity: 0.6
      },
      directional: {
        color: 0xffffff,
        intensity: 0.8,
        position: new THREE.Vector3(10, 10, 5)
      }
    }
  };

  /**
   * Create configuration for specific cube size
   */
  public static createConfiguration(size: number): CubeConfiguration {
    const config = this.cloneConfig(this.BASE_CONFIG);
    
    config.size = size;
    config.dimensions = { width: size, height: size, depth: size };
    
    // Adjust cube size based on overall size
    config.cubeSize = this.calculateOptimalCubeSize(size);
    
    // Adjust spacing for better visual appearance
    config.spacing = this.calculateOptimalSpacing(size);
    
    // Adjust camera position based on cube size
    config.camera.position = this.calculateOptimalCameraPosition(size);
    
    // Set scramble steps based on complexity
    config.scrambleSteps = this.calculateScrambleSteps(size);
    
    // Set complexity level
    config.complexityLevel = this.calculateComplexityLevel(size);
    
    // Adjust animation duration for larger cubes
    config.animation.transitionDuration = this.calculateAnimationDuration(size);
    
    // Standardize the cube configuration based on size
    if (size === 2) {
      standardizeCubeConfig('2x2x2');
    } else if (size === 4) {
      standardizeCubeConfig('4x4x4');
    } else if (size === 5) {
      standardizeCubeConfig('5x5x5');
    } else {
      standardizeCubeConfig('3x3x3');
    }
    
    return config;
  }

  /**
   * Create configuration for 2x2x2 cube (Pocket Cube)
   */
  public static create2x2(): CubeConfiguration {
    const config = this.createConfiguration(2);
    config.scrambleSteps = 15;
    config.complexityLevel = 1;
    return config;
  }

  /**
   * Create configuration for 3x3x3 cube (Standard Rubik's Cube)
   */
  public static create3x3(): CubeConfiguration {
    const config = this.createConfiguration(3);
    config.scrambleSteps = 25;
    config.complexityLevel = 3;
    return config;
  }

  /**
   * Create configuration for 4x4x4 cube (Rubik's Revenge)
   */
  public static create4x4(): CubeConfiguration {
    const config = this.createConfiguration(4);
    config.scrambleSteps = 35;
    config.complexityLevel = 5;
    return config;
  }

  /**
   * Create configuration for 5x5x5 cube (Professor's Cube)
   */
  public static create5x5(): CubeConfiguration {
    const config = this.createConfiguration(5);
    config.scrambleSteps = 50;
    config.complexityLevel = 7;
    return config;
  }

  /**
   * Create configuration for custom rectangular cube
   */
  public static createRectangular(
    width: number, 
    height: number, 
    depth: number
  ): CubeConfiguration {
    const maxDimension = Math.max(width, height, depth);
    const config = this.createConfiguration(maxDimension);
    
    config.dimensions = { width, height, depth };
    config.size = maxDimension; // Keep size as max for compatibility
    config.scrambleSteps = this.calculateScrambleSteps(maxDimension);
    config.complexityLevel = width + height + depth; // Total complexity
    
    return config;
  }

  /**
   * Get available standard cube sizes
   */
  public static getStandardSizes(): number[] {
    return [2, 3, 4, 5, 6, 7];
  }

  /**
   * Get cube type name by size
   */
  public static getCubeTypeName(size: number): string {
    const names: { [key: number]: string } = {
      2: "Pocket Cube (2x2x2)",
      3: "Rubik's Cube (3x3x3)",
      4: "Rubik's Revenge (4x4x4)",  
      5: "Professor's Cube (5x5x5)",
      6: "V-Cube 6 (6x6x6)",
      7: "V-Cube 7 (7x7x7)"
    };
    
    return names[size] || `${size}x${size}x${size} Cube`;
  }

  /**
   * Calculate optimal cube size for visual clarity
   * Using 3x3x3 as baseline (1.7):
   * - 2x2x2: 1.5 times larger (2.55)
   * - 4x4x4: 1.27 times smaller (1.34)
   * - Other sizes scale progressively smaller for larger cubes
   */
  private static calculateOptimalCubeSize(size: number): number {
    // Size ratios based on 3x3x3 as the baseline
    const sizeMap: { [key: number]: number } = {
      2: 2.55,  // 1.5 times larger than 3x3x3
      3: 1.7,   // Baseline size
      4: 1.34,  // 1.27 times smaller than 3x3x3
      5: 1.2,   // Progressively smaller for larger cubes
      6: 1.0,
      7: 0.9
    };
    
    return sizeMap[size] || Math.max(0.8, 1.7 - (size - 4) * 0.15);
  }

  /**
   * Calculate optimal spacing between cubelets
   * Using consistent spacing values from constants.ts
   */
  private static calculateOptimalSpacing(size: number): number {
    // Spacing values consistent with STANDARD_CUBE_CONFIGS
    const spacingMap: { [key: number]: number } = {
      2: 0.02,  // Same as in constants.ts
      3: 0.02,  // Same as in constants.ts
      4: 0.01,  // Same as in constants.ts
      5: 0.01,  // Consistently small for larger cubes
      6: 0.01,
      7: 0.01
    };
    
    return spacingMap[size] || Math.max(0.01, 0.02 - (size - 3) * 0.002);
  }

  /**
   * Calculate optimal camera position based on cube size
   */
  private static calculateOptimalCameraPosition(size: number): THREE.Vector3 {
    const distance = 4 + size * 1.5; // Adjust distance based on cube size
    const height = 3 + size * 1.2;   // Adjust height for better viewing angle
    
    return new THREE.Vector3(distance, height, distance);
  }

  /**
   * Calculate recommended scramble steps for a given cube size
   * Public method that can be used by other classes to get consistent scramble steps
   */
  public static getDefaultScrambleSteps(size: number): number {
    switch(size) {
      case 2:
        return 15; // Default for 2x2x2
      case 3:
        return 25; // Default for 3x3x3
      case 4:
        return 35; // Default for 4x4x4
      case 5:
        return 50; // Default for 5x5x5
      default:
        // For other sizes, use formula: base steps + size factor
        const baseSteps = 10;
        const sizeFactor = size * size;
        return Math.min(100, baseSteps + sizeFactor);
    }
  }

  /**
   * Calculate recommended scramble steps
   * @private
   */
  private static calculateScrambleSteps(size: number): number {
    return this.getDefaultScrambleSteps(size);
  }

  /**
   * Calculate complexity level (1-10 scale)
   */
  private static calculateComplexityLevel(size: number): number {
    if (size <= 2) return 1;
    if (size === 3) return 3;
    if (size === 4) return 5;
    if (size === 5) return 7;
    if (size === 6) return 8;
    if (size >= 7) return 9;
    return Math.min(10, size);
  }

  /**
   * Calculate animation duration based on cube complexity
   */
  private static calculateAnimationDuration(size: number): number {
    const baseDuration = 400;
    const sizeFactor = (size - 2) * 50; // Add 50ms per size increment
    return Math.min(1000, baseDuration + sizeFactor);
  }

  /**
   * Deep clone configuration object
   */
  private static cloneConfig(config: CubeConfiguration): CubeConfiguration {
    return {
      ...config,
      dimensions: { ...config.dimensions },
      positionOffset: config.positionOffset.clone(),
      colors: { ...config.colors },
      animation: { ...config.animation },
      camera: {
        ...config.camera,
        position: config.camera.position.clone()
      },
      lighting: {
        ambient: { ...config.lighting.ambient },
        directional: {
          ...config.lighting.directional,
          position: config.lighting.directional.position.clone()
        }
      }
    };
  }
}

// Export the base configuration and faces for backward compatibility
export const CUBE_CONFIG = CubeConfigurationFactory.create3x3();

/**
 * Face indices for cube operations
 */
export const FACES = {
  FRONT: 0,
  BACK: 1,
  RIGHT: 2,
  LEFT: 3,
  TOP: 4,
  BOTTOM: 5
} as const;

/**
 * Rotation axes
 */
export const ROTATION_AXES = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1)
} as const;
