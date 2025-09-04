import * as THREE from 'three';
import { RubiksCube } from './RubiksCube';
import { Cubelet } from './Cubelet';
import { CUBE_CONFIG, FACES, ROTATION_AXES, standardizeCubeConfig } from '../config/constants';
import { StandardDirectionHandler } from './DirectionHandler';

// Import CubeState interface from RubiksCube module
interface Face extends Array<Array<string>> {}
interface CubeState {
  U: Face;
  D: Face;
  L: Face;
  R: Face;
  F: Face;
  B: Face;
}

// Define types for the face rotations
type FaceType = keyof typeof FACES;

/**
 * 5x5x5 Rubik's Cube implementation (Professor Cube)
 * Inherits from RubiksCube but with specific 5x5x5 logic
 */
export class RubiksCube5x5 extends RubiksCube {
  
  constructor(scene: THREE.Scene) {
    // Apply standard configuration before calling super constructor
    standardizeCubeConfig('5x5x5');
    
    super(scene);
    
    // Use standard direction handler like 3x3x3 cube
    this.directionHandler = new StandardDirectionHandler();
    
    // Reinitialize with 5x5x5 configuration
    this.reinitialize();
  }

  /**
   * Standardize the cube configuration for 5x5x5
   */
  private standardize5x5Config(): void {
    standardizeCubeConfig('5x5x5');
  }

  /**
   * Reinitialize the cube with 5x5x5 configuration
   */
  private reinitialize(): void {
    // Clear existing cubelets
    this.clearCube();
    
    // Initialize 5x5x5 cube
    this.initialize5x5();
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
   * Initialize 5x5x5 cube with proper spacing
   */
  private initialize5x5(): void {
    // Ensure config is set for 5x5x5
    this.standardize5x5Config();
    
    const size = 5;
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

          const colors = this.determineCubeletColors5x5(x, y, z, size);
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
    
    // Keep size as 5 for proper face rotation
    CUBE_CONFIG.size = 5;
  }

  /**
   * Determine colors for 5x5x5 cubelet based on position
   */
  private determineCubeletColors5x5(x: number, y: number, z: number, size: number): string[] {
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
   * Get available moves for 5x5x5 cube
   * Basic face rotations, middle slice rotations (M, E, S),
   * and inner slice rotations denoted by digit 2
   */
  public getAvailableMoves(): string[] {
    return [
      'F', "F'", 'F2', "F2'",    // Front, Front inner slice (2nd from outside)
      'B', "B'", 'B2', "B2'",    // Back, Back inner slice (2nd from outside)
      'R', "R'", 'R2', "R2'",    // Right, Right inner slice (2nd from outside)
      'L', "L'", 'L2', "L2'",    // Left, Left inner slice (2nd from outside)
      'U', "U'", 'U2', "U2'",    // Up, Up inner slice (2nd from outside)
      'D', "D'", 'D2', "D2'",    // Down, Down inner slice (2nd from outside)
      'M', "M'", 'E', "E'", 'S', "S'",  // Middle layer rotations (center slices)
      'X', "X'", 'Y', "Y'", 'Z', "Z'"   // Whole cube rotations
    ];
  }

  /**
   * Execute move sequence for 5x5x5 cube
   */
  public async executeMove(move: string): Promise<void> {
    const trimmedMove = move.trim();
    const isPrime = trimmedMove.endsWith("'");
    // Remove the prime symbol for parsing
    const baseMoveWithLayer = trimmedMove.replace("'", "");
    
    // Check if it's a layered move (e.g., F2 for second layer)
    const hasLayer = /[FBRLUDFMSE][2-3]/.test(baseMoveWithLayer);
    const layer = hasLayer ? parseInt(baseMoveWithLayer.slice(-1)) : 1;
    const baseMove = hasLayer ? baseMoveWithLayer.slice(0, -1) : baseMoveWithLayer;

    const faceMap: Record<string, FaceType> = {
      'F': 'FRONT',
      'B': 'BACK',
      'R': 'RIGHT',
      'L': 'LEFT',
      'U': 'TOP',
      'D': 'BOTTOM'
    };

    switch (baseMove.toUpperCase()) {
      case 'F': case 'B': case 'R': case 'L': case 'U': case 'D':
        const face = faceMap[baseMove.toUpperCase()];
        if (layer === 1) {
          await this.rotateFace(face, !isPrime);
        } else if (layer === 2) {
          await this.rotateInnerSlice(face, !isPrime);
        }
        break;
      case 'M':
        await this.rotateMiddle(!isPrime);
        break;
      case 'E':
        await this.rotateEquator(!isPrime);
        break;
      case 'S':
        await this.rotateStanding(!isPrime);
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
        throw new Error(`Invalid move for 5x5x5 cube: ${move}`);
    }
  }

  /**
   * Generate scramble sequence for 5x5x5
   */
  public generateScrambleSequence(steps: number = 30): string[] {
    // Include outer face moves, inner slice moves, and middle layer moves
    const moves = [
      // Outer face moves
      'F', "F'", 'B', "B'", 'R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 
      // Inner slice moves (2nd from outside)
      'F2', "F2'", 'B2', "B2'", 'R2', "R2'", 'L2', "L2'", 'U2', "U2'", 'D2', "D2'",
      // Middle slice moves
      'M', "M'", 'E', "E'", 'S', "S'"
    ];
    
    const sequence: string[] = [];
    let lastMove = '';

    for (let i = 0; i < steps; i++) {
      let move: string;
      do {
        move = moves[Math.floor(Math.random() * moves.length)];
        // Avoid same face consecutively (including inner slices)
      } while (move.charAt(0) === lastMove.charAt(0)); 
      
      sequence.push(move);
      lastMove = move;
    }

    return sequence;
  }

  /**
   * Override the parent scramble method for 5x5x5 cube
   */
  public async scramble(moves: number = 30): Promise<void> {
    // Check if the cube has been disposed
    if ((this as any).isDisposed) return;
    
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
    for (const faceName of ['U', 'D', 'L', 'R', 'F', 'B']) {
      const face = state[faceName as keyof CubeState];
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
   * Get cube state as a 2D representation for each face
   * This overrides the parent method to handle 5x5x5 specific logic
   */
  public getCubeState(): CubeState {
    const size = 5;
    const cubelets = (this as any).cubelets;
    
    // Initialize the state object with empty arrays
    const state = {
      U: Array(size).fill(0).map(() => Array(size).fill('')),
      D: Array(size).fill(0).map(() => Array(size).fill('')),
      L: Array(size).fill(0).map(() => Array(size).fill('')),
      R: Array(size).fill(0).map(() => Array(size).fill('')),
      F: Array(size).fill(0).map(() => Array(size).fill('')),
      B: Array(size).fill(0).map(() => Array(size).fill(''))
    } as CubeState;

    // Map cube positions to state grid indices
    cubelets.forEach((cubelet: Cubelet) => {
      const pos = cubelet.position;
      const x = Math.round(pos.x / (CUBE_CONFIG.cubeSize + CUBE_CONFIG.spacing) + (size - 1) / 2);
      const y = Math.round(pos.y / (CUBE_CONFIG.cubeSize + CUBE_CONFIG.spacing) + (size - 1) / 2);
      const z = Math.round(pos.z / (CUBE_CONFIG.cubeSize + CUBE_CONFIG.spacing) + (size - 1) / 2);
      
      // Top face (Y+)
      if (y === size - 1) {
        state.U[z][x] = cubelet.colors[2];
      }
      // Bottom face (Y-)
      if (y === 0) {
        state.D[size - 1 - z][x] = cubelet.colors[3];
      }
      // Left face (X-)
      if (x === 0) {
        state.L[size - 1 - y][size - 1 - z] = cubelet.colors[1];
      }
      // Right face (X+)
      if (x === size - 1) {
        state.R[size - 1 - y][z] = cubelet.colors[0];
      }
      // Front face (Z+)
      if (z === size - 1) {
        state.F[size - 1 - y][size - 1 - x] = cubelet.colors[4];
      }
      // Back face (Z-)
      if (z === 0) {
        state.B[size - 1 - y][x] = cubelet.colors[5];
      }
    });
    
    return state;
  }

  /**
   * Get cube type identifier
   */
  public getCubeType(): string {
    return '5x5x5';
  }
  
  /**
   * Easing function for smooth animations
   * Simple cubic ease in/out
   */
  protected easingFunction(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Get complexity level
   */
  public getComplexityLevel(): number {
    return 4; // Higher complexity than 2x2, 3x3, and 4x4
  }
  
  /**
   * Override dispose to ensure clean up
   */
  public dispose(): void {
    // Call parent dispose
    super.dispose();
  }

  /**
   * Inner slice rotation for 5x5x5 cube (second layer from outside)
   */
  public async rotateInnerSlice(face: FaceType, clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.isAnimating()) return;
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.addMoveToHistory({ type: 'innerSlice', face, clockwise });
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    // Use a protected method instead of accessing private property
    this.startAnimation();
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the inner slice - layer 2 from the outside
    const cubelets = this.getInnerSliceCubelets(face);
    // Use parent method to get face axis
    const axis = this.getFaceRotationAxis(face);
    
    // Play rotation sound
    this.playSound('rotate');
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    this.setCurrentRotationGroup(rotationGroup);
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = CUBE_CONFIG.animation.transitionDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easingFunction(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          // Store animation frame ID for possible cancellation
          const animationFrameId = requestAnimationFrame(animate);
          this.setAnimationFrameId(animationFrameId);
        } else {
          // Animation complete - finalize positions
          this.finalizeSliceRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          this.setCurrentRotationGroup(null);
          this.stopAnimation();
          
          // Check if cube is solved
          if (this.isSolved() && this.onSolveComplete) {
            this.onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Rotates the middle layer (M move) - center slice parallel to L/R faces
   * Implemented for 5x5x5 cube which has odd number of layers
   */
  public async rotateMiddle(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.isAnimating()) return;
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.addMoveToHistory({ type: 'middle', clockwise });
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    // Use a protected method instead of accessing private property
    this.startAnimation();
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the middle slice
    const cubelets = this.getMiddleLayerCubelets();
    const axis = ROTATION_AXES.X; // Rotate around X axis for middle layer
    
    // Play rotation sound
    this.playSound('rotate');
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    this.setCurrentRotationGroup(rotationGroup);
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = CUBE_CONFIG.animation.transitionDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easingFunction(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          // Store animation frame ID for possible cancellation
          const animationFrameId = requestAnimationFrame(animate);
          this.setAnimationFrameId(animationFrameId);
        } else {
          // Animation complete - finalize positions
          this.finalizeSliceRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          this.setCurrentRotationGroup(null);
          this.stopAnimation();
          
          // Check if cube is solved
          if (this.isSolved() && this.onSolveComplete) {
            this.onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Rotates the equator layer (E move) - center slice parallel to U/D faces
   * Implemented for 5x5x5 cube which has odd number of layers
   */
  public async rotateEquator(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.isAnimating()) return;
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.addMoveToHistory({ type: 'equator', clockwise });
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    // Use a protected method instead of accessing private property
    this.startAnimation();
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the equator slice
    const cubelets = this.getEquatorLayerCubelets();
    const axis = ROTATION_AXES.Y; // Rotate around Y axis for equator layer
    
    // Play rotation sound
    this.playSound('rotate');
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    this.setCurrentRotationGroup(rotationGroup);
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = CUBE_CONFIG.animation.transitionDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easingFunction(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          // Store animation frame ID for possible cancellation
          const animationFrameId = requestAnimationFrame(animate);
          this.setAnimationFrameId(animationFrameId);
        } else {
          // Animation complete - finalize positions
          this.finalizeSliceRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          this.setCurrentRotationGroup(null);
          this.stopAnimation();
          
          // Check if cube is solved
          if (this.isSolved() && this.onSolveComplete) {
            this.onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Rotates the standing layer (S move) - center slice parallel to F/B faces
   * Implemented for 5x5x5 cube which has odd number of layers
   */
  public async rotateStanding(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.isAnimating()) return;
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.addMoveToHistory({ type: 'standing', clockwise });
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    // Use a protected method instead of accessing private property
    this.startAnimation();
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the standing slice
    const cubelets = this.getStandingLayerCubelets();
    const axis = ROTATION_AXES.Z; // Rotate around Z axis for standing layer
    
    // Play rotation sound
    this.playSound('rotate');
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    this.setCurrentRotationGroup(rotationGroup);
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = CUBE_CONFIG.animation.transitionDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easingFunction(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          // Store animation frame ID for possible cancellation
          const animationFrameId = requestAnimationFrame(animate);
          this.setAnimationFrameId(animationFrameId);
        } else {
          // Animation complete - finalize positions
          this.finalizeSliceRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          this.setCurrentRotationGroup(null);
          this.stopAnimation();
          
          // Check if cube is solved
          if (this.isSolved() && this.onSolveComplete) {
            this.onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Override reset method to ensure proper 5x5x5 spacing
   */
  public reset(): void {
    // Stop any ongoing animation first
    this.stopAnimation();
    
    // Set config for 5x5x5 cube
    CUBE_CONFIG.size = 5;
    
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
    
    // Clear move history
    this.clearMoveHistory();
    
    // Reset cube state
    (this as any).rotationLogic.reset();
    
    // Reinitialize with 5x5x5 configuration
    this.initialize5x5();
  }

  /**
   * Get inner slice cubelets for 5x5x5 cube (second layer from outside)
   */
  public getInnerSliceCubelets(face: FaceType): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 5;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    const innerPosition1 = layerPositions[1]; // Second layer from outside
    const innerPosition2 = layerPositions[size-2]; // Second layer from opposite side
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 5x5x5 cube!');
      return [];
    }
    
    const tolerance = 0.05;
    
    const filteredCubelets = cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      
      switch (face) {
        case 'FRONT':
          return Math.abs(pos.z - innerPosition2) < tolerance;
        case 'BACK':
          return Math.abs(pos.z - innerPosition1) < tolerance;
        case 'RIGHT':
          return Math.abs(pos.x - innerPosition2) < tolerance;
        case 'LEFT':
          return Math.abs(pos.x - innerPosition1) < tolerance;
        case 'TOP':
          return Math.abs(pos.y - innerPosition2) < tolerance;
        case 'BOTTOM':
          return Math.abs(pos.y - innerPosition1) < tolerance;
        default:
          return false;
      }
    });
    
    return filteredCubelets;
  }
  
  /**
   * Get middle layer cubelets for 5x5x5 cube
   * Middle slice is parallel to L/R faces (M slice)
   */
  public getMiddleLayerCubelets(): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 5;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    // Middle position for size 5 is position 2 (0-based indexing)
    const middlePosition = layerPositions[Math.floor(size / 2)];
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 5x5x5 cube!');
      return [];
    }
    
    const tolerance = 0.05;
    
    return cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      return Math.abs(pos.x - middlePosition) < tolerance;
    });
  }
  
  /**
   * Get equator layer cubelets for 5x5x5 cube
   * Equator slice is parallel to U/D faces (E slice)
   */
  public getEquatorLayerCubelets(): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 5;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    // Middle position for size 5 is position 2 (0-based indexing)
    const middlePosition = layerPositions[Math.floor(size / 2)];
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 5x5x5 cube!');
      return [];
    }
    
    const tolerance = 0.05;
    
    return cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      return Math.abs(pos.y - middlePosition) < tolerance;
    });
  }
  
  /**
   * Get standing layer cubelets for 5x5x5 cube
   * Standing slice is parallel to F/B faces (S slice)
   */
  public getStandingLayerCubelets(): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 5;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    // Middle position for size 5 is position 2 (0-based indexing)
    const middlePosition = layerPositions[Math.floor(size / 2)];
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 5x5x5 cube!');
      return [];
    }
    
    const tolerance = 0.05;
    
    return cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      return Math.abs(pos.z - middlePosition) < tolerance;
    });
  }

  /**
   * Override the solve method for 5x5x5 cube to correctly handle all rotations
   */
  public async solve(): Promise<void> {
    if (this.isAnimating()) return;
    
    // Reverse all moves for 5x5 cube
    const reverseMoves = [...this.getMoveHistory()].reverse();
    
    for (const move of reverseMoves) {
      switch (move.type) {
        case 'face':
          if (move.face) {
            await this.rotateFace(move.face as FaceType, !move.clockwise);
          }
          break;
        case 'middle':
          await this.rotateMiddle(!move.clockwise);
          break;
        case 'equator':
          await this.rotateEquator(!move.clockwise);
          break;
        case 'standing':
          await this.rotateStanding(!move.clockwise);
          break;
        case 'innerSlice':
          // Handle inner slice rotations for 5x5x5 cube
          if (move.face) {
            await this.rotateInnerSlice(move.face as FaceType, !move.clockwise);
          }
          break;
        case 'cubeX':
          await this.rotateCubeX(!move.clockwise);
          break;
        case 'cubeY':
          await this.rotateCubeY(!move.clockwise);
          break;
        case 'cubeZ':
          await this.rotateCubeZ(!move.clockwise);
          break;
      }
    }
    
    // Clear history after solving
    this.clearMoveHistory();
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
   * Get inner slice cubelets at a specific layer
   * @param face The face to get the inner slice for
   * @param layerIndex The layer index (0 for outer layer, 1 for second layer, etc.)
   * @returns Cubelets at the specified layer
   */
  public getInnerSliceAtLayerCubelets(face: FaceType, layerIndex: number): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 5;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    // Make sure layerIndex is within bounds
    const boundedLayerIndex = Math.min(Math.max(layerIndex, 0), size - 1);
    
    // For FRONT, RIGHT, TOP faces, we count from the positive side
    // For BACK, LEFT, BOTTOM faces, we count from the negative side
    let targetPosition: number;
    switch (face) {
      case 'FRONT':
      case 'RIGHT':
      case 'TOP':
        targetPosition = layerPositions[size - 1 - boundedLayerIndex];
        break;
      case 'BACK':
      case 'LEFT':
      case 'BOTTOM':
        targetPosition = layerPositions[boundedLayerIndex];
        break;
      default:
        return [];
    }
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 5x5x5 cube!');
      return [];
    }
    
    const tolerance = 0.05;
    
    const filteredCubelets = cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      
      switch (face) {
        case 'FRONT':
          return Math.abs(pos.z - targetPosition) < tolerance;
        case 'BACK':
          return Math.abs(pos.z - targetPosition) < tolerance;
        case 'RIGHT':
          return Math.abs(pos.x - targetPosition) < tolerance;
        case 'LEFT':
          return Math.abs(pos.x - targetPosition) < tolerance;
        case 'TOP':
          return Math.abs(pos.y - targetPosition) < tolerance;
        case 'BOTTOM':
          return Math.abs(pos.y - targetPosition) < tolerance;
        default:
          return false;
      }
    });
    
    return filteredCubelets;
  }
  
  /**
   * Rotate inner slice at a specific layer
   * @param face The face to rotate the inner slice from
   * @param clockwise Whether to rotate clockwise
   * @param layerIndex The layer index (0 for outer layer, 1 for second layer, etc.)
   * @param skipHistory Whether to skip adding to move history
   */
  public async rotateInnerSliceAtLayer(face: FaceType, clockwise: boolean = true, layerIndex: number = 1, skipHistory: boolean = false): Promise<void> {
    if (this.isAnimating()) return;
    
    // Add to move history if not skipping
    if (!skipHistory) {
      // Use 'innerSlice' type instead of 'innerSliceAtLayer' for compatibility
      this.addMoveToHistory({ type: 'innerSlice', face, clockwise });
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    this.startAnimation();
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    
    // Get cubelets for the inner slice at the specified layer
    const cubelets = this.getInnerSliceAtLayerCubelets(face, layerIndex);
    const axis = this.getFaceRotationAxis(face);
    
    // Play rotation sound
    this.playSound('rotate');
    
    // Create a temporary group to handle rotation animation
    const rotationGroup = new THREE.Group();
    this.getCubeGroup().add(rotationGroup);
    this.setCurrentRotationGroup(rotationGroup);
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.getCubeGroup().remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = CUBE_CONFIG.animation.transitionDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easingFunction(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          // Store animation frame ID for possible cancellation
          const animationFrameId = requestAnimationFrame(animate);
          this.setAnimationFrameId(animationFrameId);
        } else {
          // Animation complete - finalize positions
          this.finalizeSliceRotation(cubelets, rotationGroup, axis, angle);
          this.getCubeGroup().remove(rotationGroup);
          this.setCurrentRotationGroup(null);
          this.stopAnimation();
          
          // Check if cube is solved
          if (this.isSolved() && this.onSolveComplete) {
            this.onSolveComplete();
          }
          
          resolve();
        }
      };
      
      animate();
    });
  }
}
