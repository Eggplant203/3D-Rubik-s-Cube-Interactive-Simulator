import * as THREE from 'three';
import { Cubelet } from './Cubelet';
import { CUBE_CONFIG, FACES, ROTATION_AXES, standardizeCubeConfig } from '../config/constants';
import { RotationLogic } from './RotationLogic';
import { DirectionHandler, StandardDirectionHandler } from './DirectionHandler';

type Face = string[][];

interface CubeState {
  U: Face;
  D: Face;
  L: Face;
  R: Face;
  F: Face;
  B: Face;
}

export class RubiksCube {
  private cubelets: Cubelet[] = [];
  private originalPositions: THREE.Vector3[] = [];
  private cubeGroup: THREE.Group;
  private scene: THREE.Scene;
  private animating: boolean = false;
  private animationFrameId: number | null = null;
  private currentRotationGroup: THREE.Group | null = null;
  private rotationLogic: RotationLogic;
  protected directionHandler: DirectionHandler = new StandardDirectionHandler();
  private isDisposed: boolean = false;

  public onMove?: () => void;
  public onSolveComplete?: () => void;
  public soundEnabledCallback?: () => boolean;

  private moveHistory: Array<{
    type: 'face' | 'middle' | 'equator' | 'standing' | 'cubeX' | 'cubeY' | 'cubeZ' | 'innerSlice' | 'innerSliceLayer';
    face?: keyof typeof FACES;
    clockwise: boolean;
    layerIndex?: number;
  }> = [];
  private historyIndex: number = -1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.cubeGroup = new THREE.Group();
    
    // Apply standard configuration before initialization
    standardizeCubeConfig('3x3x3');
    
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
   * Start animation (protected method for subclasses)
   */
  protected startAnimation(): void {
    this.animating = true;
  }
  
  /**
   * Get face rotation axis (protected method for subclasses)
   */
  protected getFaceRotationAxis(face: keyof typeof FACES): THREE.Vector3 {
    return this.getFaceAxis(face);
  }
  
  /**
   * Set current rotation group (protected method for subclasses)
   */
  protected setCurrentRotationGroup(group: THREE.Group | null): void {
    this.currentRotationGroup = group;
  }
  
  /**
   * Set animation frame ID (protected method for subclasses)
   */
  protected setAnimationFrameId(id: number | null): void {
    this.animationFrameId = id;
  }
  
  /**
   * Finalize slice rotation (protected method for subclasses)
   */
  protected finalizeSliceRotation(
    cubelets: Cubelet[],
    rotationGroup: THREE.Group, 
    axis: THREE.Vector3, 
    angle: number
  ): void {
    this.finalizeRotation(cubelets, rotationGroup, axis, angle);
  }
  
  /**
   * Play sound (protected method for subclasses)
   */
  protected playSound(type: string): void {
    if (type === 'rotate') {
      this.playRotationSound();
    } else if (type === 'solve') {
      // Handle solve sound if needed
    }
  }

  /**
   * Check if cube is currently animating
   */
  public isAnimating(): boolean {
    return this.animating;
  }
  
  /**
   * Get move history (protected method for subclasses)
   */
  protected getMoveHistory(): Array<{ 
    type: 'face' | 'middle' | 'equator' | 'standing' | 'cubeX' | 'cubeY' | 'cubeZ' | 'innerSlice' | 'innerSliceLayer'; 
    face?: keyof typeof FACES; 
    clockwise: boolean;
    layerIndex?: number;
  }> {
    return this.moveHistory;
  }
  
  /**
   * Clear move history (public method so it can be called from outside)
   */
  public clearMoveHistory(): void {
    this.moveHistory = [];
    this.historyIndex = -1;
  }
  
  /**
   * Add move to history (protected method for subclasses)
   */
  protected addMoveToHistory(move: { 
    type: 'face' | 'middle' | 'equator' | 'standing' | 'cubeX' | 'cubeY' | 'cubeZ' | 'innerSlice'; 
    face?: keyof typeof FACES; 
    clockwise: boolean 
  }): void {
    this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
    this.moveHistory.push(move);
    this.historyIndex++;
  }

  /**
   * Get cube state for 2D rendering
   */
  public getCubeState(): CubeState {
    return this.rotationLogic.getCubeState();
  }
  
  /**
   * Get cube type - this base implementation returns 3x3x3
   * This is overridden in subclasses
   */
  public getCubeType(): string {
    return '3x3x3';
  }

  /**
   * Initializes the cube with all 27 cubelets
   */
  private initialize(): void {
    this.cubelets = [];
    this.originalPositions = [];
    
    // Standardize cube configuration for 3x3x3
    standardizeCubeConfig('3x3x3');
    
    const size = CUBE_CONFIG.size;
    const cubeSize = CUBE_CONFIG.cubeSize;
    const spacing = CUBE_CONFIG.spacing;
    const offset = (size - 1) * (cubeSize + spacing) / 2;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const position = new THREE.Vector3(
            x * (cubeSize + spacing) - offset,
            y * (cubeSize + spacing) - offset,
            z * (cubeSize + spacing) - offset
          );

          const colors = this.determineCubeletColors(x, y, z, size);
          const cubelet = new Cubelet(position, colors);
          
          this.cubelets.push(cubelet);
          this.originalPositions.push(position.clone()); // Store original position
          this.cubeGroup.add(cubelet.mesh);
        }
      }
    }
    
    // Force update cube state after initialization to ensure rotations work
    if (this.rotationLogic) {
      this.rotationLogic.updateCubeStateFromCubelets(this.cubelets);
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
    
    // Convert direction based on cube type using the direction handler
    const actualClockwise = this.directionHandler.convertDirection(clockwise);
    
    // Update cube state first
    this.rotationLogic.updateCubeStateFace(face, actualClockwise);
    
    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'face', face, clockwise: actualClockwise });
      this.historyIndex++;
    }

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }
    
    this.animating = true;
    const angle = actualClockwise ? Math.PI / 2 : -Math.PI / 2;
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
    
    // Convert direction based on cube type
    const actualClockwise = this.directionHandler.convertDirection(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeX', clockwise: actualClockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeX(actualClockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = actualClockwise ? Math.PI / 2 : -Math.PI / 2;
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
    
    // Convert direction based on cube type
    const actualClockwise = this.directionHandler.convertDirection(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeY', clockwise: actualClockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeY(actualClockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = actualClockwise ? Math.PI / 2 : -Math.PI / 2;
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
    
    // Convert direction based on cube type
    const actualClockwise = this.directionHandler.convertDirection(clockwise);

    // Add to move history if not skipping
    if (!skipHistory) {
      this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
      this.moveHistory.push({ type: 'cubeZ', clockwise: actualClockwise });
      this.historyIndex++;
    }

    // Update cube state
    this.rotationLogic.updateCubeStateCubeZ(actualClockwise);

    // Call onMove callback
    if (this.onMove) {
      this.onMove();
    }

    this.animating = true;
    const angle = actualClockwise ? Math.PI / 2 : -Math.PI / 2;
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
    // Don't play sound if the cube has been disposed
    if (this.isDisposed) return;
    
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
    // Don't perform operations if cube has been disposed
    if (this.isDisposed) return;
    
    const faces = Object.keys(FACES) as Array<keyof typeof FACES>;
    const sliceMoves = ['middle', 'equator', 'standing'] as const;
    
    // try {
      for (let i = 0; i < moves; i++) {
        // Don't continue if cube has been disposed during animation
        if (this.isDisposed) return;
        
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
    
    // Get the current cube type before resetting
    const cubeType = this.getCubeType();
    
    // Determine the proper size based on cube type
    const properSize = cubeType === '2x2x2' ? 2 : 3;
    
    // Ensure CUBE_CONFIG has the right size for this cube type
    CUBE_CONFIG.size = properSize;
    
    // Clear existing cubelets
    this.cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
    });
    
    // Clear move history
    this.clearMoveHistory();
    
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
      case 'innerSlice':
        // Handle inner slice rotations for cubes that support it
        if (lastMove.face && (this as any).rotateInnerSlice) {
          await (this as any).rotateInnerSlice(lastMove.face, !lastMove.clockwise, true);
        }
        break;
      case 'innerSliceLayer':
        // Handle inner slice rotations with layer index for cubes that support it
        if (lastMove.face && lastMove.layerIndex !== undefined && (this as any).rotateInnerSliceAtLayer) {
          await (this as any).rotateInnerSliceAtLayer(lastMove.face, !lastMove.clockwise, lastMove.layerIndex, true);
        }
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
      case 'innerSlice':
        // Handle inner slice rotations for cubes that support it
        if (nextMove.face && (this as any).rotateInnerSlice) {
          await (this as any).rotateInnerSlice(nextMove.face, nextMove.clockwise, true);
        }
        break;
      case 'innerSliceLayer':
        // Handle inner slice rotations with layer index for cubes that support it
        if (nextMove.face && nextMove.layerIndex !== undefined && (this as any).rotateInnerSliceAtLayer) {
          await (this as any).rotateInnerSliceAtLayer(nextMove.face, nextMove.clockwise, nextMove.layerIndex, true);
        }
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
   * Rebuilds all cubelets with current colors
   * This is useful when switching between regular colors and gradient themes
   */
  public rebuildCubelets(): void {
    // Store current positions, colors and rotations
    const currentState = this.cubelets.map(cubelet => ({
      position: cubelet.position.clone(),
      colors: [...cubelet.colors],
      rotation: cubelet.getRotationQuaternion()
    }));
    
    // Remove all current cubelets from the scene
    this.cubelets.forEach(cubelet => {
      this.cubeGroup.remove(cubelet.mesh);
    });
    
    // Clear the cubelets array
    this.cubelets = [];
    
    // Create new cubelets with the stored state
    currentState.forEach(state => {
      const cubelet = new Cubelet(state.position, state.colors);
      
      // Preserve the rotation of the cubelet
      cubelet.applyRotation(state.rotation);
      
      this.cubelets.push(cubelet);
      this.cubeGroup.add(cubelet.mesh);
    });
    
    // Force update cube state after rebuilding
    this.rotationLogic.updateCubeStateFromCubelets(this.cubelets);
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
    
    // Create mapping from old colors to new colors before updating config
    const colorMapping: { [oldColor: string]: string } = {};
    colorMapping[oldColors.top] = newColors.top;
    colorMapping[oldColors.bottom] = newColors.bottom;
    colorMapping[oldColors.left] = newColors.left;
    colorMapping[oldColors.right] = newColors.right;
    colorMapping[oldColors.front] = newColors.front;
    colorMapping[oldColors.back] = newColors.back;
    
    // Map colors on existing cubelets first
    this.cubelets.forEach(cubelet => {
      // Map each face color of the cubelet
      cubelet.colors = cubelet.colors.map(color => {
        // If it's an internal face (gray), keep it gray
        if (color === '#333333') return color;
        // Otherwise map to new color
        return colorMapping[color] || color;
      });
    });
    
    // Update the config
    CUBE_CONFIG.colors = { ...newColors };
    
    // Always rebuild cubelets when changing themes - simplest and most reliable approach
    this.rebuildCubelets();
    
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
      if (!mesh || !(mesh.material instanceof Array)) return;
      
      for (let i = 0; i < 6; i++) {
        const color = newColorsArray[i] || '#333333';
        const material = mesh.material[i] as THREE.MeshPhongMaterial;
        
        if (!material) continue;
        
        // Handle gradient colors
        if (typeof color === 'string' && color.startsWith('linear-gradient')) {
          // Create a canvas texture for gradient
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Parse gradient colors - use simple two-color format
            const gradientMatch = color.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
            
            if (gradientMatch) {
              const direction = gradientMatch[1].trim();
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
              } else if (direction.includes('to bottom')) {
                gradient = ctx.createLinearGradient(0, 0, 0, 256);
              } else {
                gradient = ctx.createLinearGradient(0, 0, 0, 256); // default vertical
              }
              
              // Add color stops
              gradient.addColorStop(0, color1);
              gradient.addColorStop(1, color2);
              
              // Fill the canvas with the gradient
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 256, 256);
              
              // Create the texture
              const texture = new THREE.CanvasTexture(canvas);
              texture.needsUpdate = true;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              
              // Apply texture to material
              material.map = texture;
              material.color.setHex(0xFFFFFF); // Reset to white to show texture properly
              material.needsUpdate = true;
            } else {
              // If parsing fails, use a default color
              material.map = null;
              material.color.setStyle('#333333'); // Default gray
              material.needsUpdate = true;
            }
          }
        } else {
          // Regular solid color
          material.map = null; // Remove any previous texture
          material.color.setStyle(color);
          material.needsUpdate = true;
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
        // Consider both solid colors and gradients as colored faces
        if (cubelet.colors[i] !== '#333333' && cubelet.colors[i] !== '') {
          coloredCount++;
        }
      }
      return coloredCount === 3;
    });

    if (cornerCubelets.length < cornerIndex) return;

    // Use the cornerIndex-th corner cubelet (sorted by some consistent order)
    const cubelet = cornerCubelets[cornerIndex - 1];    // Get current colors
    const colors = [...cubelet.colors];

    // Find the 3 colored faces (non-black/non-empty faces) and sort them for consistent rotation order
    const coloredFaces: number[] = [];
    for (let i = 0; i < 6; i++) {
      // Check for both solid colors and gradients
      if (colors[i] !== '#333333' && colors[i] !== '') {
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
      // Need to regenerate materials for gradient themes
      if (colors.some(color => typeof color === 'string' && color.startsWith('linear-gradient'))) {
        // Create entirely new materials for this cubelet
        this.updateCubeletMaterialsForCorner(cubelet);
      } else {
        // For solid colors, simply update the material colors
        for (let i = 0; i < 6; i++) {
          const material = mesh.material[i] as THREE.MeshPhongMaterial;
          material.color.setStyle(colors[i] || '#333333');
          material.needsUpdate = true;
        }
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
   * Update cubelet materials specifically for corners that have been rotated
   * This is needed to properly display gradient themes when corners are rotated
   */
  private updateCubeletMaterialsForCorner(cubelet: Cubelet): void {
    const mesh = cubelet.mesh.children[0] as THREE.Mesh;
    if (!mesh || !(mesh.material instanceof Array)) return;
    
    const materials = [];
    
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
            materials.push(new THREE.MeshPhongMaterial({ color: color }));
          }
        } else {
          // Fallback if canvas context creation fails
          materials.push(new THREE.MeshPhongMaterial({ color: '#333333' }));
        }
      } else {
        // Handle regular solid colors
        materials.push(new THREE.MeshPhongMaterial({ 
          color: color || '#333333',
          transparent: false,
          opacity: 1.0,
          shininess: 100,
          specular: 0x222222
        }));
      }
    }
    
    // Replace all materials at once
    mesh.material = materials;
    mesh.material.forEach(mat => {
      mat.needsUpdate = true;
    });
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

  /**
   * Dispose of cube resources and remove from scene
   */
  public dispose(): void {
    // Mark as disposed to stop any ongoing or future operations
    this.isDisposed = true;
    
    // Stop any ongoing animations
    this.stopAnimation();
    
    // Remove cube group from scene
    if (this.scene && this.cubeGroup) {
      this.scene.remove(this.cubeGroup);
      
      // Dispose of all materials and geometries
      this.cubeGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
    }
    
    // Clear arrays
    this.cubelets = [];
    this.originalPositions = [];
    this.moveHistory = [];
    this.historyIndex = -1;
  }
}
