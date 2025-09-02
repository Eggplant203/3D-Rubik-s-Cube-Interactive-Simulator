import * as THREE from 'three';
import { CUBE_CONFIG } from '../config/constants';

/**
 * Cache for gradient textures to avoid recreating them
 */
const gradientTextureCache: { [key: string]: THREE.Texture } = {};

// Make the texture cache globally available
if (typeof window !== 'undefined') {
  (window as any).gradientTextureCache = gradientTextureCache;
}

/**
 * Represents a single cube piece (cubelet) in the Rubik's cube
 */
export class Cubelet {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public colors: string[];
  
  constructor(position: THREE.Vector3, colors: string[]) {
    this.position = position.clone();
    this.colors = colors;
    this.mesh = this.createMesh();
  }

  /**
   * Creates the 3D mesh for this cubelet
   */
  private createMesh(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(
      CUBE_CONFIG.cubeSize - CUBE_CONFIG.spacing,
      CUBE_CONFIG.cubeSize - CUBE_CONFIG.spacing,
      CUBE_CONFIG.cubeSize - CUBE_CONFIG.spacing
    );

    // Create materials for each face
    const materials: THREE.Material[] = [];

    for (let i = 0; i < 6; i++) {
      const colorValue = this.colors[i] || '#333333'; // Default to dark if no color
      
      // Check if color value is a gradient (starts with 'linear-gradient')
      if (typeof colorValue === 'string' && colorValue.startsWith('linear-gradient')) {
        // Create a canvas texture for gradient
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Use simpler regex for gradient parsing - work with two-color format only
          const gradientMatch = colorValue.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
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
              // Default to vertical gradient for any other direction
              gradient = ctx.createLinearGradient(0, 0, 0, 256);
            }
            
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            
            // Create a simple texture without caching
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
            
            // Set texture flag to ensure proper material handling
            (material as any).hasTexture = true;
            
            materials.push(material);
          } else {
            // Fallback to solid color if gradient parsing fails
            materials.push(new THREE.MeshPhongMaterial({ 
              color: '#333333',
              transparent: false,
              opacity: 1.0,
              shininess: 100,
              specular: 0x222222
            }));
          }
        } else {
          // Fallback if canvas context is not available
          materials.push(new THREE.MeshPhongMaterial({ 
            color: '#333333',
            transparent: false,
            opacity: 1.0,
            shininess: 100,
            specular: 0x222222
          }));
        }
      } else {
        // Regular color
        const material = new THREE.MeshPhongMaterial({ 
          color: colorValue,
          transparent: false,
          opacity: 1.0,
          shininess: 100,
          specular: 0x222222
        });
        
        // Mark as non-texture material
        (material as any).hasTexture = false;
        
        materials.push(material);
      }
    }

    const cube = new THREE.Mesh(geometry, materials);
    
    // Add black edges with thicker lines
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      linewidth: 2,
      transparent: false,
      opacity: 1.0
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

    group.add(cube);
    group.add(edgeLines);
    group.position.copy(this.position);
    
    return group;
  }

  /**
   * Rotates this cubelet around a given axis and angle
   */
  public rotate(axis: THREE.Vector3, angle: number): void {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, angle);
    
    // Apply rotation to position
    this.position.applyQuaternion(quaternion);
    
    // Apply rotation to mesh
    this.mesh.applyQuaternion(quaternion);
    
    // Update mesh position to match internal position
    this.mesh.position.copy(this.position);
    
    // Round position to avoid floating point errors
    this.position.x = Math.round(this.position.x * 100) / 100;
    this.position.y = Math.round(this.position.y * 100) / 100;
    this.position.z = Math.round(this.position.z * 100) / 100;
    
    this.mesh.position.copy(this.position);
  }
  
  /**
   * Apply a specific rotation quaternion to this cubelet
   */
  public applyRotation(quaternion: THREE.Quaternion): void {
    // Set mesh rotation directly
    this.mesh.quaternion.copy(quaternion);
  }

  /**
   * Gets the current world position of this cubelet
   */
  public getWorldPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  /**
   * Gets the current rotation of this cubelet
   */
  public getRotationQuaternion(): THREE.Quaternion {
    return this.mesh.quaternion.clone();
  }
}
