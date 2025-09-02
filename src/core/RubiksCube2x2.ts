import * as THREE from 'three';
import { RubiksCube } from './RubiksCube';
import { Cubelet } from './Cubelet';
import { CUBE_CONFIG, FACES, standardizeCubeConfig } from '../config/constants';
import { InvertedDirectionHandler } from './DirectionHandler';

// Define types for the face rotations
type FaceType = keyof typeof FACES;

/**
 * 2x2x2 Rubik's Cube implementation (Pocket Cube)
 * Inherits from RubiksCube but with specific 2x2x2 logic
 */
export class RubiksCube2x2 extends RubiksCube {
  
  constructor(scene: THREE.Scene) {
    // Apply standard configuration before calling super constructor
    standardizeCubeConfig('2x2x2');
    
    super(scene);
    
    // Use inverted direction handler for 2x2 cube
    this.directionHandler = new InvertedDirectionHandler();
    
    // Reinitialize with 2x2x2 configuration
    this.reinitialize();
  }

  /**
   * Reinitialize the cube with 2x2x2 configuration
   */
  private reinitialize(): void {
    // Clear existing cubelets
    this.clearCube();
    
    // Initialize 2x2x2 cube
    this.initialize2x2();
  }

  /**
   * Clear all existing cubelets from the scene
   */
  private clearCube(): void {
    const cubeGroup = this.getCubeGroup();
    while (cubeGroup.children.length > 0) {
      const child = cubeGroup.children[0];
      cubeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }
  }

  /**
   * Initialize 2x2x2 cube with proper spacing
   */
  private initialize2x2(): void {
    // Ensure config is standardized for 2x2x2
    standardizeCubeConfig('2x2x2');
    
    const size = 2;
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const offset = (size - 1) * (cubeSize + spacing) / 2;

    const cubelets: Cubelet[] = [];
    const originalPositions: THREE.Vector3[] = [];

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const position = new THREE.Vector3(
            x * (cubeSize + spacing) - offset,
            y * (cubeSize + spacing) - offset,
            z * (cubeSize + spacing) - offset
          );

          const colors = this.determineCubeletColors2x2(x, y, z, size);
          const cubelet = new Cubelet(position, colors);
          
          cubelets.push(cubelet);
          originalPositions.push(position.clone());
          this.getCubeGroup().add(cubelet.mesh);
        }
      }
    }

    // Update internal arrays
    this.setCubelets(cubelets);
    this.setOriginalPositions(originalPositions);
    
    // Restore original config values after initialization
    CUBE_CONFIG.size = 2; // Keep size as 2 for proper face rotation
  }

  /**
   * Determine colors for 2x2x2 cubelet based on position
   */
  private determineCubeletColors2x2(x: number, y: number, z: number, size: number): string[] {
    const colors: string[] = new Array(6).fill('#333333'); // Default internal color
    
    // Right face (+X)
    if (x === size - 1) colors[0] = CUBE_CONFIG.colors.right;
    // Left face (-X)  
    if (x === 0) colors[1] = CUBE_CONFIG.colors.left;
    // Top face (+Y)
    if (y === size - 1) colors[2] = CUBE_CONFIG.colors.top;
    // Bottom face (-Y)
    if (y === 0) colors[3] = CUBE_CONFIG.colors.bottom;
    // Front face (+Z)
    if (z === size - 1) colors[4] = CUBE_CONFIG.colors.front;
    // Back face (-Z)
    if (z === 0) colors[5] = CUBE_CONFIG.colors.back;

    return colors;
  }

  /**
   * Get available moves for 2x2x2 cube
   * Only basic face rotations are available (no middle slices)
   */
  public getAvailableMoves(): string[] {
    return [
      'F', "F'", 'B', "B'",  // Front, Back
      'R', "R'", 'L', "L'",  // Right, Left  
      'U', "U'", 'D', "D'",  // Up, Down
      'X', "X'", 'Y', "Y'", 'Z', "Z'"  // Cube rotations
    ];
  }

  /**
   * Execute move sequence optimized for 2x2x2
   */
  /**
   * Execute move sequence for 2x2x2 cube
   * Using direction handler to handle the conversion automatically
   */
  public async executeMove(move: string): Promise<void> {
    const trimmedMove = move.trim();
    const isPrime = trimmedMove.endsWith("'");
    const baseFace = trimmedMove.replace("'", "");

    const faceMap: Record<string, FaceType> = {
      'F': 'FRONT',
      'B': 'BACK',
      'R': 'RIGHT',
      'L': 'LEFT',
      'U': 'TOP',
      'D': 'BOTTOM'
    };

    switch (baseFace.toUpperCase()) {
      case 'F': case 'B': case 'R': case 'L': case 'U': case 'D':
        await this.rotateFace(faceMap[baseFace.toUpperCase()], isPrime);
        break;
      case 'X':
        await this.rotateCubeX(isPrime);
        break;
      case 'Y':
        await this.rotateCubeY(isPrime);
        break;
      case 'Z':
        await this.rotateCubeZ(isPrime);
        break;
      default:
        throw new Error(`Invalid move for 2x2x2 cube: ${move}`);
    }
  }
  


  /**
   * Generate scramble sequence for 2x2x2
   */
  public generateScrambleSequence(steps: number = 15): string[] {
    const moves = ['F', "F'", 'B', "B'", 'R', "R'", 'L', "L'", 'U', "U'", 'D', "D'"];
    const sequence: string[] = [];
    let lastMove = '';

    for (let i = 0; i < steps; i++) {
      let move: string;
      do {
        move = moves[Math.floor(Math.random() * moves.length)];
      } while (move.charAt(0) === lastMove.charAt(0)); // Avoid same face consecutively
      
      sequence.push(move);
      lastMove = move;
    }

    return sequence;
  }

    /**
   * Override the parent scramble method for 2x2x2 cube
   * 2x2x2 doesn't have middle slices so we need a specialized scramble method
   */
  public async scramble(moves: number = 15): Promise<void> {
    // Check if the cube has been disposed
    if ((this as any).isDisposed) return;
    
    // try {
      // Generate a scramble sequence
      const sequence = this.generateScrambleSequence(moves);
      
      // Execute each move in the sequence
      for (const move of sequence) {
        // Don't continue if cube has been disposed during animation
        if ((this as any).isDisposed) return;
        
        await this.executeMove(move);
    }
  }

  /**
   * Check if cube is solved (all faces have uniform colors)
   */
  public isSolved(): boolean {
    const state = this.getCubeState();
    
    // Check each face for uniformity
    for (const face of Object.values(state)) {
      const firstColor = face[0][0];
      for (const row of face) {
        for (const color of row) {
          if (color !== firstColor) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Get cube type identifier
   */
  public getCubeType(): string {
    return '2x2x2';
  }

  /**
   * Get complexity level
   */
  public getComplexityLevel(): number {
    return 1; // Lowest complexity
  }
  
  /**
   * Override dispose to ensure clean up
   */
  public dispose(): void {
    // Call parent dispose
    super.dispose();
  }

  /**
   * Override middle slice rotations - not available in 2x2x2
   */
  public async rotateMiddle(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Middle slice rotation is not available for 2x2x2 cube');
  }

  /**
   * Override equator rotations - not available in 2x2x2
   */
  public async rotateEquator(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Equator rotation is not available for 2x2x2 cube');
  }

  /**
   * Override standing rotations - not available in 2x2x2
   */
  public async rotateStanding(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Standing rotation is not available for 2x2x2 cube');
  }

  /**
   * Override corner rotation - In 2x2x2, each piece is a corner.
   * We map the numbers 1-8 to the eight corner pieces
   */
  public rotateCorner(cornerIndex: number, clockwise: boolean = true, skipHistory: boolean = false): void {
    if (cornerIndex < 1 || cornerIndex > 8) return;

    // Since all 2x2 pieces are corners, we don't need to filter by colored faces
    // For 2x2, use a direct mapping from index to piece position
    // The indexing is consistent with the 3x3 cube corners:
    // 1=BLB, 2=BLF, 3=TLB, 4=TLF, 5=BRB, 6=BRF, 7=TRB, 8=TRF
    // (B=bottom, T=top, L=left, R=right, F=front, B=back)
    
    // Access the private cubelets array through the protected accessor
    const cubelets = (this as any).cubelets;
    if (!cubelets || cubelets.length !== 8) return; // Safety check
    
    // Map cornerIndex (1-8) to actual cubelet index (0-7) based on position
    // The mapping assumes the same coordinate system as 3x3
    const cornerToIndexMap: { [key: number]: number } = {
      1: 0, // Bottom-Left-Back
      2: 1, // Bottom-Left-Front
      3: 2, // Top-Left-Back
      4: 3, // Top-Left-Front
      5: 4, // Bottom-Right-Back
      6: 5, // Bottom-Right-Front
      7: 6, // Top-Right-Back
      8: 7  // Top-Right-Front
    };
    
    const cubeletIndex = cornerToIndexMap[cornerIndex];
    if (cubeletIndex === undefined) return; // Invalid mapping
    
    const cubelet = cubelets[cubeletIndex];
    
    // Get current colors
    const colors = [...cubelet.colors];
    
    // Find the 3 colored faces (non-black faces)
    const coloredFaces: number[] = [];
    for (let i = 0; i < 6; i++) {
      if (colors[i] !== '#333333') {
        coloredFaces.push(i);
      }
    }
    
    if (coloredFaces.length !== 3) return; // Safety check - should always be 3 for 2x2
    
    // Sort colored faces by index for consistent rotation order
    coloredFaces.sort((a, b) => a - b);
    
    // Determine the rotation order based on the current orientation
    const [face1, face2, face3] = coloredFaces;
    
    if (clockwise) {
      // Rotate clockwise: face1 -> face2 -> face3 -> face1
      const temp = colors[face1];
      colors[face1] = colors[face3];
      colors[face3] = colors[face2];
      colors[face2] = temp;
    } else {
      // Rotate counter-clockwise: face1 -> face3 -> face2 -> face1
      const temp = colors[face1];
      colors[face1] = colors[face2];
      colors[face2] = colors[face3];
      colors[face3] = temp;
    }
    
    // Update cubelet colors
    cubelet.colors = [...colors];
    
    // Update mesh materials
    const mesh = cubelet.mesh.children[0] as THREE.Mesh;
    if (mesh && mesh.material instanceof Array) {
      for (let i = 0; i < 6; i++) {
        const material = mesh.material[i] as THREE.MeshPhongMaterial;
        material.color.setStyle(colors[i] || '#333333');
        material.needsUpdate = true; // Force update
      }
    }
    
    // Add to move history if not skipping
    if (!skipHistory) {
      // Access moveHistory through 'this as any'
      (this as any).moveHistory = (this as any).moveHistory.slice(0, (this as any).historyIndex + 1);
      (this as any).moveHistory.push({ type: 'corner', cornerIndex, clockwise });
      (this as any).historyIndex++;
    }
    
    // Trigger move callback
    if ((this as any).onMove) {
      (this as any).onMove();
    }
    
    // Play sound using the parent class method
    if ((this as any).soundEnabledCallback && (this as any).soundEnabledCallback()) {
      // Sound already handled by the parent's callback
    }
  }

  /**
   * Override reset method to ensure proper 2x2 spacing
   */
  public reset(): void {
    // Stop any ongoing animation first
    (this as any).stopAnimation();
    
    // Ensure CUBE_CONFIG size is set to 2 for 2x2x2 cube
    CUBE_CONFIG.size = 2;
    CUBE_CONFIG.cubeSize = 1.5;
    CUBE_CONFIG.spacing = 0.02;
    
    // Clear existing cubelets
    const cubeGroup = this.getCubeGroup();
    while (cubeGroup.children.length > 0) {
      const child = cubeGroup.children[0];
      cubeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }
    
    // Reset cube state
    (this as any).rotationLogic.reset();
    
    // Reinitialize with 2x2x2 configuration
    this.initialize2x2();
  }

  // Protected methods to access parent class private members
  protected getCubeGroup(): THREE.Group {
    return (this as any).cubeGroup;
  }

  protected setCubelets(cubelets: Cubelet[]): void {
    (this as any).cubelets = cubelets;
  }

  protected setOriginalPositions(positions: THREE.Vector3[]): void {
    (this as any).originalPositions = positions;
  }
  
  /**
   * Override the rotateFace method to use our specific implementation
   * for selecting cubelets in a 2x2 cube
   */
  public async rotateFace(face: FaceType, clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if ((this as any).animating) return;
    
    // Update cube state first
    (this as any).rotationLogic.updateCubeStateFace(face, clockwise);
    
    // Add to move history if not skipping
    if (!skipHistory) {
      (this as any).moveHistory = (this as any).moveHistory.slice(0, (this as any).historyIndex + 1);
      (this as any).moveHistory.push({ type: 'face', face, clockwise });
      (this as any).historyIndex++;
    }

    // Call onMove callback
    if ((this as any).onMove) {
      (this as any).onMove();
    }
    
    (this as any).animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the face - using our specialized method for 2x2 cube
    const cubelets = this.getSpecificFaceCubelets(face);
    const axis = (this as any).getFaceAxis(face);
    
    // Play rotation sound (optional)
    (this as any).playRotationSound();
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    (this as any).currentRotationGroup = rotationGroup;
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = (this as any).animationDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * (this as any).easeInOutBack(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          (this as any).animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          (this as any).finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          (this as any).currentRotationGroup = null;
          (this as any).animating = false;
          
          // Check if cube is solved
          if (this.isSolved() && (this as any).onSolveComplete) {
            (this as any).onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }
  
  /**
   * Helper method to get face cubelets for 2x2 cube
   */
  public getSpecificFaceCubelets(face: FaceType): Cubelet[] {
    // For a 2x2 cube, the halfSize is 0.5
    const halfSize = 0.5;
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 2x2 cube!');
      return [];
    }
    
    return cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      // Use a larger tolerance for 2x2 since spacing might be different
      const tolerance = 0.15; 
      
      switch (face) {
        case 'FRONT':
          return Math.abs(pos.z - halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        case 'BACK':
          return Math.abs(pos.z + halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        case 'RIGHT':
          return Math.abs(pos.x - halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        case 'LEFT':
          return Math.abs(pos.x + halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        case 'TOP':
          return Math.abs(pos.y - halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        case 'BOTTOM':
          return Math.abs(pos.y + halfSize * CUBE_CONFIG.cubeSize) < tolerance;
        default:
          return false;
      }
    });
  }
}
