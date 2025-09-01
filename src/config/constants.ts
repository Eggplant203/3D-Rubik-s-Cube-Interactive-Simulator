import * as THREE from 'three';

/**
 * Configuration constants for the Rubik's Cube
 */
export const CUBE_CONFIG = {
  size: 3, // Default size for backward compatibility
  dimensions: { width: 3, height: 3, depth: 3 }, // Dimensions for non-square cubes
  cubeSize: 2,
  spacing: 0.1,
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
