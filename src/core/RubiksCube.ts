import * as THREE from 'three';
import { Cubelet } from './Cubelet';
import { CUBE_CONFIG, FACES, ROTATION_AXES } from '../config/constants';
import { RotationLogic } from './RotationLogic';

/**
 * Face type representing a 3x3 grid of colors
 */
type Face = string[][];

/**
 * Cube state interface for 2D net rendering
 */
interface CubeState {
  U: Face; // Up
  D: Face; // Down
  L: Face; // Left
  R: Face; // Right
  F: Face; // Front
  B: Face; // Back
}

/**
 * Main Rubik's Cube class that manages all cubelets and operations
 */
export class RubiksCube {
  private cubelets: Cubelet[] = [];
  private originalPositions: THREE.Vector3[] = []; // Store original positions for color updates
  private cubeGroup: THREE.Group;
  private scene: THREE.Scene;
  private animating: boolean = false;
  private animationFrameId: number | null = null;
  private currentRotationGroup: THREE.Group | null = null;
  private rotationLogic: RotationLogic;
  
  // Callbacks
  public onMove?: () => void;
  public onSolveComplete?: () => void;
  public soundEnabledCallback?: () => boolean;
  
  // Move history for undo/redo
  private moveHistory: Array<{ 
    type: 'face' | 'middle' | 'equator' | 'standing' | 'cubeX' | 'cubeY' | 'cubeZ'; 
    face?: keyof typeof FACES; 
    clockwise: boolean 
  }> = [];
  private historyIndex: number = -1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.cubeGroup = new THREE.Group();
    this.cubeGroup.position.copy(CUBE_CONFIG.positionOffset);
    this.scene.add(this.cubeGroup);
    this.rotationLogic = new RotationLogic();
    this.initialize();
  }

  /**
   * Get animation duration from config
   */
  private get animationDuration(): number {
    return CUBE_CONFIG.animation.transitionDuration;
  }

  /**
   * Stops any ongoing animation
   */
  public stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.currentRotationGroup) {
      // Move cubelets back to cube group
      this.currentRotationGroup.children.forEach(child => {
        this.cubeGroup.add(child);
      });
      this.cubeGroup.remove(this.currentRotationGroup);
      this.currentRotationGroup = null;
    }
    
    this.animating = false;
  }

  /**
   * Check if cube is currently animating
   */
  public isAnimating(): boolean {
    return this.animating;
  }

  /**
   * Get cube state for 2D rendering
   */
  public getCubeState(): CubeState {
    return this.rotationLogic.getCubeState();
  }

  /**
   * Initializes the cube with all 27 cubelets
   */
  private initialize(): void {
    this.cubelets = [];
    this.originalPositions = [];
    const size = CUBE_CONFIG.size;
    const cubeSize = CUBE_CONFIG.cubeSize;
    const offset = (size - 1) * cubeSize / 2;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const position = new THREE.Vector3(
            x * cubeSize - offset,
            y * cubeSize - offset,
            z * cubeSize - offset
          );

          const colors = this.determineCubeletColors(x, y, z, size);
          const cubelet = new Cubelet(position, colors);
          
          this.cubelets.push(cubelet);
          this.originalPositions.push(position.clone()); // Store original position
          this.cubeGroup.add(cubelet.mesh);
        }
      }
    }
  }

  /**
   * Determines the colors for a cubelet based on its position
   */
  private determineCubeletColors(x: number, y: number, z: number, size: number): string[] {
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
   * Rotates a face of the cube
   */
  public async rotateFace(face: keyof typeof FACES, clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;
    
    // Update cube state first
    this.rotationLogic.updateCubeStateFace(face, clockwise);
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'face', face, clockwise });
      this.historyIndex++;
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.getFaceCubelets(face);
    const axis = this.getFaceAxis(face);
    
    // Play rotation sound (optional)
    this.playRotationSound();
    
    // Create a temporary group to handle rotation animation for selected face cubelets
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);
    this.currentRotationGroup = rotationGroup;
    
    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);
        
        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);
        
        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.scene.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;
          
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
   * Rotates the middle layer (M move)
   */
  public async rotateMiddle(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Update cube state first
    this.rotationLogic.updateCubeStateMiddle(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'middle', clockwise });
      this.historyIndex++;
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.getMiddleCubelets();
    const axis = ROTATION_AXES.X;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);
    this.currentRotationGroup = rotationGroup;

    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Rotates the equator layer (E move)
   */
  public async rotateEquator(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Update cube state first
    this.rotationLogic.updateCubeStateEquator(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'equator', clockwise });
      this.historyIndex++;
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.getEquatorCubelets();
    const axis = ROTATION_AXES.Y;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);
    this.currentRotationGroup = rotationGroup;

    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Rotates the standing layer (S move)
   */
  public async rotateStanding(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Update cube state first
    this.rotationLogic.updateCubeStateStanding(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'standing', clockwise });
      this.historyIndex++;
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.getStandingCubelets();
    const axis = ROTATION_AXES.Z;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);
    this.currentRotationGroup = rotationGroup;

    // Move cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Rotates the entire cube around X-axis (X move)
   */
  public async rotateCubeX(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeX', clockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeX(clockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.cubelets; // All cubelets
    const axis = ROTATION_AXES.X;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);

    // Move all cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Rotates the entire cube around Y-axis (Y move)
   */
  public async rotateCubeY(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeY', clockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeY(clockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.cubelets; // All cubelets
    const axis = ROTATION_AXES.Y;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);

    // Move all cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Rotates the entire cube around Z-axis (Z move)
   */
  public async rotateCubeZ(clockwise: boolean = true, skipHistory: boolean = false): Promise<void> {
    if (this.animating) return;

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeZ', clockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeZ(clockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cubelets = this.cubelets; // All cubelets
    const axis = ROTATION_AXES.Z;

    // Play rotation sound (optional)
    this.playRotationSound();

    // Create a temporary group for rotation animation
    const rotationGroup = new THREE.Group();
    this.cubeGroup.add(rotationGroup);

    // Move all cubelets to rotation group
    cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
      rotationGroup.add(cubelet.mesh);
    });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * this.easeInOutBack(progress);

        // Reset rotation and apply new rotation
        rotationGroup.rotation.set(0, 0, 0);
        rotationGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - finalize positions
          this.finalizeRotation(cubelets, rotationGroup, axis, angle);
          this.cubeGroup.remove(rotationGroup);
          this.currentRotationGroup = null;
          this.animating = false;

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
   * Play rotation sound effect (optional)
   */
  private playRotationSound(): void {
    // Check if sound is enabled via callback
    if (this.soundEnabledCallback && !this.soundEnabledCallback()) return;
    
    try {
      // Create a subtle click sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if Web Audio API is not available
    }
  }

  /**
   * Finalizes rotation by updating cubelet positions and returning them to scene
   */
  private finalizeRotation(
    cubelets: Cubelet[], 
    rotationGroup: THREE.Group, 
    axis: THREE.Vector3, 
    angle: number
  ): void {
    cubelets.forEach(cubelet => {
      // Remove from rotation group
      rotationGroup.remove(cubelet.mesh);
      
      // Apply final rotation to cubelet's internal state
      cubelet.rotate(axis, angle);
      
      // Add back to cube group
      this.cubeGroup.add(cubelet.mesh);
    });
  }

  /**
   * Gets cubelets that belong to a specific face
   */
  private getFaceCubelets(face: keyof typeof FACES): Cubelet[] {
    const size = CUBE_CONFIG.size;
    const halfSize = Math.floor(size / 2);
    
    return this.cubelets.filter(cubelet => {
      const pos = cubelet.position;
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
   * Gets cubelets that belong to the middle layer (M slice)
   */
  private getMiddleCubelets(): Cubelet[] {
    const size = CUBE_CONFIG.size;
    const middleIndex = Math.floor(size / 2);
    
    return this.cubelets.filter(cubelet => {
      const pos = cubelet.position;
      const tolerance = 0.1;
      const middlePos = middleIndex * CUBE_CONFIG.cubeSize - (size - 1) * CUBE_CONFIG.cubeSize / 2;
      
      return Math.abs(pos.x - middlePos) < tolerance;
    });
  }

  /**
   * Gets cubelets that belong to the equator layer (E slice)
   */
  private getEquatorCubelets(): Cubelet[] {
    const size = CUBE_CONFIG.size;
    const middleIndex = Math.floor(size / 2);
    
    return this.cubelets.filter(cubelet => {
      const pos = cubelet.position;
      const tolerance = 0.1;
      const middlePos = middleIndex * CUBE_CONFIG.cubeSize - (size - 1) * CUBE_CONFIG.cubeSize / 2;
      
      return Math.abs(pos.y - middlePos) < tolerance;
    });
  }

  /**
   * Gets cubelets that belong to the standing layer (S slice)
   */
  private getStandingCubelets(): Cubelet[] {
    const size = CUBE_CONFIG.size;
    const middleIndex = Math.floor(size / 2);
    
    return this.cubelets.filter(cubelet => {
      const pos = cubelet.position;
      const tolerance = 0.1;
      const middlePos = middleIndex * CUBE_CONFIG.cubeSize - (size - 1) * CUBE_CONFIG.cubeSize / 2;
      
      return Math.abs(pos.z - middlePos) < tolerance;
    });
  }

  /**
   * Gets the rotation axis for a face
   */
  private getFaceAxis(face: keyof typeof FACES): THREE.Vector3 {
    switch (face) {
      case 'FRONT':
      case 'BACK':
        return ROTATION_AXES.Z;
      case 'RIGHT':
      case 'LEFT':
        return ROTATION_AXES.X;
      case 'TOP':
      case 'BOTTOM':
        return ROTATION_AXES.Y;
      default:
        return ROTATION_AXES.Y;
    }
  }

  /**
   * Ease in out back for natural rubik movement
   */
  private easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  /**
   * Scrambles the cube with random moves
   */
  public async scramble(moves: number = 20): Promise<void> {
    const faces = Object.keys(FACES) as Array<keyof typeof FACES>;
    const sliceMoves = ['middle', 'equator', 'standing'] as const;
    
    for (let i = 0; i < moves; i++) {
      const clockwise = Math.random() > 0.5;
      
      // Randomly choose between face turns and slice moves
      if (Math.random() > 0.5) {
        // Face turn
        const randomFace = faces[Math.floor(Math.random() * faces.length)];
        await this.rotateFace(randomFace, clockwise);
      } else {
        // Slice move
        const randomSlice = sliceMoves[Math.floor(Math.random() * sliceMoves.length)];
        switch (randomSlice) {
          case 'middle':
            await this.rotateMiddle(clockwise);
            break;
          case 'equator':
            await this.rotateEquator(clockwise);
            break;
          case 'standing':
            await this.rotateStanding(clockwise);
            break;
        }
      }
    }
  }

  /**
   * Resets the cube to solved state
   */
  public reset(): void {
    // Stop any ongoing animation first
    this.stopAnimation();
    
    // Clear existing cubelets
    this.cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
    });
    
    // Reset cube state
    this.rotationLogic.reset();
    
    // Reinitialize
    this.initialize();
  }

  /**
   * Checks if the cube is solved
   */
  public isSolved(): boolean {
    // Check if all faces have uniform colors
    return this.checkAllFacesUniform();
  }

  /**
   * Check if all faces have uniform colors
   */
  private checkAllFacesUniform(): boolean {
    const faces = ['F', 'B', 'R', 'L', 'U', 'D'];
    
    for (const face of faces) {
      const faceColors = this.rotationLogic.getFaceColors(face);
      if (!faceColors || faceColors.length === 0) continue;
      
      // Check if all colors in this face are the same
      const firstColor = faceColors[0][0];
      for (const row of faceColors) {
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
   * Auto-solve the cube (simplified implementation)
   */
  public async solve(): Promise<void> {
    if (this.animating) return;
    
    // Simple implementation: reverse all moves
    const reverseMoves = [...this.moveHistory].reverse();
    
    for (const move of reverseMoves) {
      switch (move.type) {
        case 'face':
          if (move.face) {
            await this.rotateFace(move.face, !move.clockwise);
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
    this.moveHistory = [];
    this.historyIndex = -1;
  }

  /**
   * Undo last move
   */
  public async undo(): Promise<boolean> {
    if (this.animating || this.historyIndex < 0) return false;
    
    const lastMove = this.moveHistory[this.historyIndex];
    this.historyIndex--;
    
    switch (lastMove.type) {
      case 'face':
        if (lastMove.face) {
          await this.rotateFace(lastMove.face, !lastMove.clockwise, true);
        }
        break;
      case 'middle':
        await this.rotateMiddle(!lastMove.clockwise, true);
        break;
      case 'equator':
        await this.rotateEquator(!lastMove.clockwise, true);
        break;
      case 'standing':
        await this.rotateStanding(!lastMove.clockwise, true);
        break;
      case 'cubeX':
        await this.rotateCubeX(!lastMove.clockwise, true);
        break;
      case 'cubeY':
        await this.rotateCubeY(!lastMove.clockwise, true);
        break;
      case 'cubeZ':
        await this.rotateCubeZ(!lastMove.clockwise, true);
        break;
    }
    return true;
  }

  /**
   * Redo next move
   */
  public async redo(): Promise<boolean> {
    if (this.animating || this.historyIndex >= this.moveHistory.length - 1) return false;
    
    this.historyIndex++;
    const nextMove = this.moveHistory[this.historyIndex];
    
    switch (nextMove.type) {
      case 'face':
        if (nextMove.face) {
          await this.rotateFace(nextMove.face, nextMove.clockwise, true);
        }
        break;
      case 'middle':
        await this.rotateMiddle(nextMove.clockwise, true);
        break;
      case 'equator':
        await this.rotateEquator(nextMove.clockwise, true);
        break;
      case 'standing':
        await this.rotateStanding(nextMove.clockwise, true);
        break;
      case 'cubeX':
        await this.rotateCubeX(nextMove.clockwise, true);
        break;
      case 'cubeY':
        await this.rotateCubeY(nextMove.clockwise, true);
        break;
      case 'cubeZ':
        await this.rotateCubeZ(nextMove.clockwise, true);
        break;
    }
    return true;
  }

  /**
   * Gets all cubelets for external access
   */
  public getCubelets(): Cubelet[] {
    return this.cubelets;
  }

  /**
   * Get current face orientation for labels
   */
  public getFaceOrientation(): { [key: string]: string } {
    return this.rotationLogic.getFaceOrientation();
  }

  /**
   * Gets face colors for 2D visualization
   * Returns a 3x3 grid of colors for each face
   */
  /**
   * Get face colors for 2D net rendering
   */
  public getFaceColors(face: string): string[][] {
    return this.rotationLogic.getFaceColors(face);
  }

  /**
   * Translate the entire cube by the given offsets
   */
  public translateCube(x: number, y: number, z: number): void {
    this.cubeGroup.position.x += x;
    this.cubeGroup.position.y += y;
    this.cubeGroup.position.z += z;
  }

  /**
   * Update cube colors based on new color configuration
   */
  public updateColors(newColors: typeof CUBE_CONFIG.colors): void {
    // Store old colors for mapping
    const oldColors = { ...CUBE_CONFIG.colors };
    
    // Update the config first
    CUBE_CONFIG.colors = { ...newColors };
    
    // Create mapping from old colors to new colors
    const colorMapping: { [oldColor: string]: string } = {};
    colorMapping[oldColors.top] = newColors.top;
    colorMapping[oldColors.bottom] = newColors.bottom;
    colorMapping[oldColors.left] = newColors.left;
    colorMapping[oldColors.right] = newColors.right;
    colorMapping[oldColors.front] = newColors.front;
    colorMapping[oldColors.back] = newColors.back;
    
    // Update each cubelet by mapping its current colors to new colors
    this.cubelets.forEach(cubelet => {
      // Map each face color of the cubelet
      const newColorsArray = cubelet.colors.map(color => {
        // If it's an internal face (gray), keep it gray
        if (color === '#333333') return color;
        // Otherwise map to new color
        return colorMapping[color] || color;
      });
      
      cubelet.colors = newColorsArray;
      
      // Update mesh materials
      const mesh = cubelet.mesh.children[0] as THREE.Mesh;
      if (mesh && mesh.material instanceof Array) {
        for (let i = 0; i < 6; i++) {
          const material = mesh.material[i] as THREE.MeshPhongMaterial;
          material.color.setStyle(newColorsArray[i] || '#333333');
          material.needsUpdate = true; // Force update
        }
      }
    });
  }

  /**
   * Rotate a corner cubelet by swapping its 3 visible colors based on its current orientation
   */
  public rotateCorner(cornerIndex: number, clockwise: boolean = true): void {
    if (cornerIndex < 1 || cornerIndex > 8) return;

    // Find corner cubelets (those with exactly 3 colored faces)
    const cornerCubelets = this.cubelets.filter(cubelet => {
      let coloredCount = 0;
      for (let i = 0; i < 6; i++) {
        if (cubelet.colors[i] !== '#333333') {
          coloredCount++;
        }
      }
      return coloredCount === 3;
    });

    if (cornerCubelets.length < cornerIndex) return;

    // Use the cornerIndex-th corner cubelet (sorted by some consistent order)
    const cubelet = cornerCubelets[cornerIndex - 1];    // Get current colors
    const colors = [...cubelet.colors];

    // Find the 3 colored faces (non-black faces) and sort them for consistent rotation order
    const coloredFaces: number[] = [];
    for (let i = 0; i < 6; i++) {
      if (colors[i] !== '#333333') {
        coloredFaces.push(i);
      }
    }

    if (coloredFaces.length !== 3) return; // Not a corner cubelet

    // Sort colored faces by index for consistent rotation order
    coloredFaces.sort((a, b) => a - b);

    // Determine the rotation order based on the current orientation
    // We need to rotate the colors in a cycle based on the cubelet's current state
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
    cubelet.colors = colors;

    // Update visual materials
    const mesh = cubelet.mesh.children[0] as THREE.Mesh;
    if (mesh && mesh.material instanceof Array) {
      for (let i = 0; i < 6; i++) {
        const material = mesh.material[i] as THREE.MeshPhongMaterial;
        material.color.setStyle(colors[i] || '#333333');
        material.needsUpdate = true;
      }
    }

    // Update rotation logic state
    this.rotationLogic.updateCubeStateFromCubelets(this.cubelets);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
  }

  /**
   * Set blindfold mode - hide/show colors when solved
   */
  public setBlindfoldMode(enabled: boolean): void {
    this.cubelets.forEach(cubelet => {
      const mesh = cubelet.mesh.children[0] as THREE.Mesh;
      if (mesh && mesh.material instanceof Array) {
        for (let i = 0; i < 6; i++) {
          const material = mesh.material[i] as THREE.MeshPhongMaterial;
          if (enabled) {
            // Save current color before changing
            if (!material.userData.originalColor) {
              material.userData.originalColor = material.color.getHex();
            }
            // Set to white for internal faces, black for sticker faces
            if (material.userData.originalColor === 0x333333) {
              material.color.setHex(0xFFFFFF); // White for internal faces
            } else {
              material.color.setHex(0x000000); // Black for sticker faces
            }
          } else {
            // Restore saved color
            if (material.userData.originalColor) {
              material.color.setHex(material.userData.originalColor);
              // Clear saved color after restoring
              delete material.userData.originalColor;
            }
          }
          material.needsUpdate = true;
        }
      }
    });
  }
}
