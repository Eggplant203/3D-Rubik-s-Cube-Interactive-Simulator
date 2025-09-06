import * as THREE from 'three';

/**
 * Configuration constants for the Rubik's Cube
 */
export const CUBE_CONFIG = {
  size: 3, // Default size for backward compatibility
  dimensions: { width: 3, height: 3, depth: 3 }, // Dimensions for non-square cubes
  cubeSize: 1.7, // Reduced from 2 to be more compact
  spacing: 0.02, // Reduced from 0.1 to be consistent with 2x2,
  positionOffset: new THREE.Vector3(0, 0, 0),  // Offset to adjust cube position (raise higher)
  colors: {
    front: '#3366ff',   // Blue
    back: '#33cc33',    // Green
    right: '#ff3333',   // Red
    left: '#ff9900',    // Orange
    top: '#ffff33',     // Yellow
    bottom: '#ffffff'   // White
  },
  animation: {
    rotationSpeed: 2,
    transitionDuration: 500 // Increased from 300ms to 500ms for smoother animation
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

/**
 * Standardized configuration values for different cube types
 * This ensures consistent cubelet sizes and spacing across the application
 * Using 3x3x3 cubelet size as the baseline
 */
export const STANDARD_CUBE_CONFIGS = {
  '2x2x2': {
    cubeSize: 2.24,
    spacing: 0.02
  },
  '3x3x3': {
    cubeSize: 1.7,   // Standard cubelet size (baseline)
    spacing: 0.02    // Standard spacing
  },
  '4x4x4': {
    cubeSize: 1.34,
    spacing: 0.015
  },
  '5x5x5': {
    cubeSize: 1.11,
    spacing: 0.015
  },
  '6x6x6': {
    cubeSize: 0.97,  // Smaller cubelets for 6x6x6
    spacing: 0.012   // Smaller spacing for 6x6x6
  },
  '10x10x10': {
    cubeSize: 0.55,  // Even smaller cubelets for 10x10x10
    spacing: 0.008   // Smaller spacing for 10x10x10
  }
};

/**
 * Standardize cube configuration based on cube type
 * This ensures that all cubes of the same type have consistent dimensions
 * @param cubeType The type of cube (2x2x2, 3x3x3, etc.)
 */
export function standardizeCubeConfig(cubeType: string): void {
  if (cubeType === '2x2x2') {
    CUBE_CONFIG.size = 2;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['2x2x2'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['2x2x2'].spacing;
  } else if (cubeType === '3x3x3') {
    CUBE_CONFIG.size = 3;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['3x3x3'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['3x3x3'].spacing;
  } else if (cubeType === '4x4x4') {
    CUBE_CONFIG.size = 4;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['4x4x4'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['4x4x4'].spacing;
  } else if (cubeType === '5x5x5') {
    CUBE_CONFIG.size = 5;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['5x5x5'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['5x5x5'].spacing;
  } else if (cubeType === '6x6x6') {
    CUBE_CONFIG.size = 6;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['6x6x6'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['6x6x6'].spacing;
  } else if (cubeType === '10x10x10') {
    CUBE_CONFIG.size = 10;
    CUBE_CONFIG.cubeSize = STANDARD_CUBE_CONFIGS['10x10x10'].cubeSize;
    CUBE_CONFIG.spacing = STANDARD_CUBE_CONFIGS['10x10x10'].spacing;
  }
  // Additional cube types can be added here
  
  console.log(`Standardized config for ${cubeType}: size=${CUBE_CONFIG.size}, cubeSize=${CUBE_CONFIG.cubeSize}, spacing=${CUBE_CONFIG.spacing}`);
}
