import * as THREE from 'three';
import { RubiksCube } from './RubiksCube';
import { Cubelet } from './Cubelet';
import { CUBE_CONFIG, FACES, standardizeCubeConfig } from '../config/constants';
import { InvertedDirectionHandler } from './DirectionHandler';

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
 * 4x4x4 Rubik's Cube implementation (Master Cube)
 * Inherits from RubiksCube but with specific 4x4x4 logic
 */
export class RubiksCube4x4 extends RubiksCube {
  
  constructor(scene: THREE.Scene) {
    // Apply standard configuration before calling super constructor
    standardizeCubeConfig('4x4x4');
    
    super(scene);
    
    // Use inverted direction handler like 2x2 cube
    this.directionHandler = new InvertedDirectionHandler();
    
    // Reinitialize with 4x4x4 configuration
    this.reinitialize();
  }

  /**
   * Standardize the cube configuration for 4x4x4
   */
  private standardize4x4Config(): void {
    // Use the standardizeCubeConfig function
    standardizeCubeConfig('4x4x4');
  }

  /**
   * Reinitialize the cube with 4x4x4 configuration
   */
  private reinitialize(): void {
    // Clear existing cubelets
    this.clearCube();
    
    // Initialize 4x4x4 cube
    this.initialize4x4();
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
   * Initialize 4x4x4 cube with proper spacing
   */
  private initialize4x4(): void {
    // Ensure config is set for 4x4x4
    this.standardize4x4Config();
    
    const size = 4;
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

          const colors = this.determineCubeletColors4x4(x, y, z, size);
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
    
    // Keep size as 4 for proper face rotation
    CUBE_CONFIG.size = 4;
  }

  /**
   * Determine colors for 4x4x4 cubelet based on position
   */
  private determineCubeletColors4x4(x: number, y: number, z: number, size: number): string[] {
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
   * Get available moves for 4x4x4 cube
   * Basic face rotations plus inner slice rotations denoted by digit 2
   */
  public getAvailableMoves(): string[] {
    return [
      'F', "F'", 'F2', "F2'",    // Front, Front inner slice
      'B', "B'", 'B2', "B2'",    // Back, Back inner slice 
      'R', "R'", 'R2', "R2'",    // Right, Right inner slice
      'L', "L'", 'L2', "L2'",    // Left, Left inner slice
      'U', "U'", 'U2', "U2'",    // Up, Up inner slice
      'D', "D'", 'D2', "D2'",    // Down, Down inner slice
      'X', "X'", 'Y', "Y'", 'Z', "Z'"  // Whole cube rotations
    ];
  }

  /**
   * Execute move sequence for 4x4x4 cube
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
        throw new Error(`Invalid move for 4x4x4 cube: ${move}`);
    }
  }

  /**
   * Generate scramble sequence for 4x4x4
   */
  public generateScrambleSequence(steps: number = 25): string[] {
    // Include outer face moves and inner slice moves for 4x4
    const moves = [
      // Outer face moves
      'F', "F'", 'B', "B'", 'R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 
      // Inner slice moves
      'F2', "F2'", 'B2', "B2'", 'R2', "R2'", 'L2', "L2'", 'U2', "U2'", 'D2', "D2'"
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
   * Override the parent scramble method for 4x4x4 cube
   */
  public async scramble(moves: number = 25): Promise<void> {
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
   * This overrides the parent method to handle 4x4x4 specific logic
   */
  public getCubeState(): CubeState {
    const size = 4;
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
    return '4x4x4';
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
    return 3; // Higher complexity than 2x2 and 3x3
  }
  
  /**
   * Override dispose to ensure clean up
   */
  public dispose(): void {
    // Call parent dispose
    super.dispose();
  }

  /**
   * Override middle slice rotations - not available in even-layered cubes like 4x4x4
   */
  public async rotateMiddle(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Middle slice rotation is not available for 4x4x4 cube');
  }

  /**
   * Override equator rotations - not available in even-layered cubes like 4x4x4
   */
  public async rotateEquator(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Equator rotation is not available for 4x4x4 cube');
  }

  /**
   * Override standing rotations - not available in even-layered cubes like 4x4x4
   */
  public async rotateStanding(_clockwise: boolean = true, _skipHistory: boolean = false): Promise<void> {
    throw new Error('Standing rotation is not available for 4x4x4 cube');
  }

  /**
   * Inner slice rotation for 4x4x4 cube (second layer from outside)
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
   * Override reset method to ensure proper 4x4x4 spacing
   */
  public reset(): void {
    // Stop any ongoing animation first
    this.stopAnimation();
    
    // Set config for 4x4x4 cube
    CUBE_CONFIG.size = 4;
    
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
    
    // Reinitialize with 4x4x4 configuration
    this.initialize4x4();
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
   * for selecting cubelets in a 4x4 cube
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
    
    // Get cubelets for the face - using our specialized method for 4x4 cube
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
   * Helper method to get face cubelets for 4x4 cube (outermost layer)
   */
  public getSpecificFaceCubelets(face: FaceType): Cubelet[] {
    const size = 4;
    const halfSize = (size - 1) / 2;
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 4x4 cube!');
      return [];
    }
    
    return cubelets.filter((cubelet: Cubelet) => {
      const pos = cubelet.position;
      // Use a reasonable tolerance for 4x4 since spacing might be different
      const tolerance = 0.1; 
      
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

  /**
   * Get inner slice cubelets for 4x4 cube (second layer from outside)
   */
  public getInnerSliceCubelets(face: FaceType): Cubelet[] {
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const size = 4;
    const offset = (size - 1) * (cubeSize + spacing) / 2;
    
    const layerPositions: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = i * (cubeSize + spacing) - offset;
      layerPositions.push(pos);
    }
    
    const innerPosition1 = layerPositions[1];
    const innerPosition2 = layerPositions[size-2];
    
    const cubelets = (this as any).cubelets;
    if (!cubelets || !cubelets.length) {
      console.error('No cubelets found in 4x4 cube!');
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
   * Override the solve method for 4x4x4 cube to correctly handle inner slice rotations
   */
  public async solve(): Promise<void> {
    if (this.isAnimating()) return;
    
    // Reverse all moves for 4x4 cube
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
          // Handle inner slice rotations for 4x4x4 cube
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
}
