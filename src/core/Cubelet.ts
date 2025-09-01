import * as THREE from 'three';
import { CUBE_CONFIG } from '../config/constants';

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
      const color = this.colors[i] || '#333333'; // Default to dark if no color
      materials.push(new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: false,
        opacity: 1.0,
        shininess: 100,
        specular: 0x222222
      }));
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
   * Gets the current world position of this cubelet
   */
  public getWorldPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}
