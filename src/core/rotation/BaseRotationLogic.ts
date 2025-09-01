import { RotationLogic } from '../../core/RotationLogic';

/**
 * Face type representing an NxN grid of colors
 */
type Face = string[][];

/**
 * Cube state interface for 2D net rendering - supports any cube size
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
 * Abstract Base Rotation Logic - Extensible for different cube sizes
 */
export abstract class BaseRotationLogic {
  protected cubeState!: CubeState;
  protected size: number;

  constructor(size: number = 3) {
    this.size = size;
    this.initializeCubeState();
  }

  /**
   * Initialize cube state with solved colors
   */
  protected initializeCubeState(): void {
    this.cubeState = {
      U: this.createSolvedFace('#ffff33'), // Yellow
      D: this.createSolvedFace('#ffffff'), // White
      L: this.createSolvedFace('#ff9900'), // Orange
      R: this.createSolvedFace('#ff3333'), // Red
      F: this.createSolvedFace('#3366ff'), // Blue
      B: this.createSolvedFace('#33cc33')  // Green
    };
  }

  /**
   * Create a solved face with given color
   */
  protected createSolvedFace(color: string): Face {
    const face: Face = [];
    for (let i = 0; i < this.size; i++) {
      face[i] = [];
      for (let j = 0; j < this.size; j++) {
        face[i][j] = color;
      }
    }
    return face;
  }

  /**
   * Get current cube state
   */
  public getCubeState(): CubeState {
    return this.deepCloneCubeState(this.cubeState);
  }

  /**
   * Deep clone cube state
   */
  protected deepCloneCubeState(state: CubeState): CubeState {
    return {
      U: state.U.map(row => [...row]),
      D: state.D.map(row => [...row]),
      L: state.L.map(row => [...row]),
      R: state.R.map(row => [...row]),
      F: state.F.map(row => [...row]),
      B: state.B.map(row => [...row])
    };
  }

  /**
   * Reset cube to solved state
   */
  public reset(): void {
    this.initializeCubeState();
  }

  /**
   * Update colors based on new color scheme
   */
  public updateColors(colors: { [key: string]: string }): void {
    const faceMap = {
      U: colors.top || '#ffff33',
      D: colors.bottom || '#ffffff',
      L: colors.left || '#ff9900',
      R: colors.right || '#ff3333',
      F: colors.front || '#3366ff',
      B: colors.back || '#33cc33'
    };

    Object.keys(faceMap).forEach(faceKey => {
      const face = this.cubeState[faceKey as keyof CubeState];
      const color = faceMap[faceKey as keyof typeof faceMap];
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          face[i][j] = color;
        }
      }
    });
  }

  /**
   * Check if cube is solved
   */
  public isSolved(): boolean {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
    
    return faces.every(faceKey => {
      const face = this.cubeState[faceKey];
      const centerColor = face[Math.floor(this.size / 2)][Math.floor(this.size / 2)];
      
      return face.every(row => 
        row.every(color => color === centerColor)
      );
    });
  }

  /**
   * Rotate a 2D matrix 90 degrees clockwise
   */
  protected rotateMatrixCW(matrix: Face): Face {
    const n = matrix.length;
    const rotated: Face = Array(n).fill(null).map(() => Array(n).fill(''));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = matrix[i][j];
      }
    }
    
    return rotated;
  }

  /**
   * Rotate a 2D matrix 90 degrees counter-clockwise
   */
  protected rotateMatrixCCW(matrix: Face): Face {
    const n = matrix.length;
    const rotated: Face = Array(n).fill(null).map(() => Array(n).fill(''));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[n - 1 - j][i] = matrix[i][j];
      }
    }
    
    return rotated;
  }

  // Abstract methods to be implemented by concrete classes
  public abstract updateCubeStateFace(face: string, clockwise: boolean): void;
  public abstract updateCubeStateMiddleLayer(layer: 'M' | 'E' | 'S', clockwise: boolean): void;
  public abstract updateCubeStateRotation(axis: 'X' | 'Y' | 'Z', clockwise: boolean): void;
}

/**
 * 3x3x3 Rotation Logic - Standard Rubik's Cube
 */
export class Rotation3x3Logic extends BaseRotationLogic {
  private originalRotationLogic: RotationLogic;

  constructor() {
    super(3);
    this.originalRotationLogic = new RotationLogic();
  }

  public updateCubeStateFace(face: string, clockwise: boolean): void {
    this.originalRotationLogic.updateCubeStateFace(face as any, clockwise);
    this.cubeState = this.originalRotationLogic.getCubeState();
  }

  public updateCubeStateMiddleLayer(layer: 'M' | 'E' | 'S', clockwise: boolean): void {
    switch (layer) {
      case 'M':
        this.originalRotationLogic.updateCubeStateMiddle(clockwise);
        break;
      case 'E':
        this.originalRotationLogic.updateCubeStateEquator(clockwise);
        break;
      case 'S':
        this.originalRotationLogic.updateCubeStateStanding(clockwise);
        break;
    }
    this.cubeState = this.originalRotationLogic.getCubeState();
  }

  public updateCubeStateRotation(axis: 'X' | 'Y' | 'Z', clockwise: boolean): void {
    switch (axis) {
      case 'X':
        this.originalRotationLogic.updateCubeStateCubeX(clockwise);
        break;
      case 'Y':
        this.originalRotationLogic.updateCubeStateCubeY(clockwise);
        break;
      case 'Z':
        this.originalRotationLogic.updateCubeStateCubeZ(clockwise);
        break;
    }
    this.cubeState = this.originalRotationLogic.getCubeState();
  }

  public reset(): void {
    super.reset();
    // Reset original rotation logic by creating a new instance
    this.originalRotationLogic = new RotationLogic();
  }

  public getCubeState(): CubeState {
    return this.originalRotationLogic.getCubeState();
  }
}

/**
 * 2x2x2 Rotation Logic - Pocket Cube
 */
export class Rotation2x2Logic extends BaseRotationLogic {
  constructor() {
    super(2);
  }

  public updateCubeStateFace(face: string, clockwise: boolean): void {
    // Implement 2x2 face rotation logic
    switch (face.toLowerCase()) {
      case 'u':
        this.rotateFaceU(clockwise);
        break;
      case 'd':
        this.rotateFaceD(clockwise);
        break;
      case 'l':
        this.rotateFaceL(clockwise);
        break;
      case 'r':
        this.rotateFaceR(clockwise);
        break;
      case 'f':
        this.rotateFaceF(clockwise);
        break;
      case 'b':
        this.rotateFaceB(clockwise);
        break;
    }
  }

  public updateCubeStateMiddleLayer(_layer: 'M' | 'E' | 'S', _clockwise: boolean): void {
    // 2x2 cubes don't have middle layers
    console.warn('2x2 cubes do not have middle layers');
  }

  public updateCubeStateRotation(axis: 'X' | 'Y' | 'Z', clockwise: boolean): void {
    // Implement cube rotation for 2x2
    switch (axis) {
      case 'X':
        this.rotateFaceR(clockwise);
        this.rotateFaceL(!clockwise);
        break;
      case 'Y':
        this.rotateFaceU(clockwise);
        this.rotateFaceD(!clockwise);
        break;
      case 'Z':
        this.rotateFaceF(clockwise);
        this.rotateFaceB(!clockwise);
        break;
    }
  }

  private rotateFaceU(clockwise: boolean): void {
    // Rotate the U face itself
    this.cubeState.U = clockwise ? 
      this.rotateMatrixCW(this.cubeState.U) : 
      this.rotateMatrixCCW(this.cubeState.U);

    // Rotate adjacent edges (simplified for 2x2)
    if (clockwise) {
      const temp = [this.cubeState.F[0][0], this.cubeState.F[0][1]];
      this.cubeState.F[0][0] = this.cubeState.R[0][0];
      this.cubeState.F[0][1] = this.cubeState.R[0][1];
      this.cubeState.R[0][0] = this.cubeState.B[0][0];
      this.cubeState.R[0][1] = this.cubeState.B[0][1];
      this.cubeState.B[0][0] = this.cubeState.L[0][0];
      this.cubeState.B[0][1] = this.cubeState.L[0][1];
      this.cubeState.L[0][0] = temp[0];
      this.cubeState.L[0][1] = temp[1];
    } else {
      const temp = [this.cubeState.F[0][0], this.cubeState.F[0][1]];
      this.cubeState.F[0][0] = this.cubeState.L[0][0];
      this.cubeState.F[0][1] = this.cubeState.L[0][1];
      this.cubeState.L[0][0] = this.cubeState.B[0][0];
      this.cubeState.L[0][1] = this.cubeState.B[0][1];
      this.cubeState.B[0][0] = this.cubeState.R[0][0];
      this.cubeState.B[0][1] = this.cubeState.R[0][1];
      this.cubeState.R[0][0] = temp[0];
      this.cubeState.R[0][1] = temp[1];
    }
  }

  private rotateFaceD(clockwise: boolean): void {
    // Similar to rotateFaceU but for bottom face
    this.cubeState.D = clockwise ? 
      this.rotateMatrixCW(this.cubeState.D) : 
      this.rotateMatrixCCW(this.cubeState.D);

    // Rotate adjacent edges (reverse direction compared to U face)
    if (clockwise) {
      const temp = [this.cubeState.F[1][0], this.cubeState.F[1][1]];
      this.cubeState.F[1][0] = this.cubeState.L[1][0];
      this.cubeState.F[1][1] = this.cubeState.L[1][1];
      this.cubeState.L[1][0] = this.cubeState.B[1][0];
      this.cubeState.L[1][1] = this.cubeState.B[1][1];
      this.cubeState.B[1][0] = this.cubeState.R[1][0];
      this.cubeState.B[1][1] = this.cubeState.R[1][1];
      this.cubeState.R[1][0] = temp[0];
      this.cubeState.R[1][1] = temp[1];
    } else {
      const temp = [this.cubeState.F[1][0], this.cubeState.F[1][1]];
      this.cubeState.F[1][0] = this.cubeState.R[1][0];
      this.cubeState.F[1][1] = this.cubeState.R[1][1];
      this.cubeState.R[1][0] = this.cubeState.B[1][0];
      this.cubeState.R[1][1] = this.cubeState.B[1][1];
      this.cubeState.B[1][0] = this.cubeState.L[1][0];
      this.cubeState.B[1][1] = this.cubeState.L[1][1];
      this.cubeState.L[1][0] = temp[0];
      this.cubeState.L[1][1] = temp[1];
    }
  }

  private rotateFaceF(clockwise: boolean): void {
    this.cubeState.F = clockwise ? 
      this.rotateMatrixCW(this.cubeState.F) : 
      this.rotateMatrixCCW(this.cubeState.F);

    // Rotate adjacent edges
    if (clockwise) {
      const temp = [this.cubeState.U[1][0], this.cubeState.U[1][1]];
      this.cubeState.U[1][0] = this.cubeState.L[1][1];
      this.cubeState.U[1][1] = this.cubeState.L[0][1];
      this.cubeState.L[0][1] = this.cubeState.D[0][1];
      this.cubeState.L[1][1] = this.cubeState.D[0][0];
      this.cubeState.D[0][0] = this.cubeState.R[1][0];
      this.cubeState.D[0][1] = this.cubeState.R[0][0];
      this.cubeState.R[0][0] = temp[0];
      this.cubeState.R[1][0] = temp[1];
    } else {
      const temp = [this.cubeState.U[1][0], this.cubeState.U[1][1]];
      this.cubeState.U[1][0] = this.cubeState.R[0][0];
      this.cubeState.U[1][1] = this.cubeState.R[1][0];
      this.cubeState.R[0][0] = this.cubeState.D[0][1];
      this.cubeState.R[1][0] = this.cubeState.D[0][0];
      this.cubeState.D[0][0] = this.cubeState.L[1][1];
      this.cubeState.D[0][1] = this.cubeState.L[0][1];
      this.cubeState.L[0][1] = temp[1];
      this.cubeState.L[1][1] = temp[0];
    }
  }

  private rotateFaceB(clockwise: boolean): void {
    this.cubeState.B = clockwise ? 
      this.rotateMatrixCW(this.cubeState.B) : 
      this.rotateMatrixCCW(this.cubeState.B);

    // Rotate adjacent edges (reverse of F face)
    if (clockwise) {
      const temp = [this.cubeState.U[0][0], this.cubeState.U[0][1]];
      this.cubeState.U[0][0] = this.cubeState.R[0][1];
      this.cubeState.U[0][1] = this.cubeState.R[1][1];
      this.cubeState.R[0][1] = this.cubeState.D[1][1];
      this.cubeState.R[1][1] = this.cubeState.D[1][0];
      this.cubeState.D[1][0] = this.cubeState.L[1][0];
      this.cubeState.D[1][1] = this.cubeState.L[0][0];
      this.cubeState.L[0][0] = temp[1];
      this.cubeState.L[1][0] = temp[0];
    } else {
      const temp = [this.cubeState.U[0][0], this.cubeState.U[0][1]];
      this.cubeState.U[0][0] = this.cubeState.L[1][0];
      this.cubeState.U[0][1] = this.cubeState.L[0][0];
      this.cubeState.L[0][0] = this.cubeState.D[1][1];
      this.cubeState.L[1][0] = this.cubeState.D[1][0];
      this.cubeState.D[1][0] = this.cubeState.R[1][1];
      this.cubeState.D[1][1] = this.cubeState.R[0][1];
      this.cubeState.R[0][1] = temp[0];
      this.cubeState.R[1][1] = temp[1];
    }
  }

  private rotateFaceR(clockwise: boolean): void {
    this.cubeState.R = clockwise ? 
      this.rotateMatrixCW(this.cubeState.R) : 
      this.rotateMatrixCCW(this.cubeState.R);

    if (clockwise) {
      const temp = [this.cubeState.U[0][1], this.cubeState.U[1][1]];
      this.cubeState.U[0][1] = this.cubeState.F[0][1];
      this.cubeState.U[1][1] = this.cubeState.F[1][1];
      this.cubeState.F[0][1] = this.cubeState.D[0][1];
      this.cubeState.F[1][1] = this.cubeState.D[1][1];
      this.cubeState.D[0][1] = this.cubeState.B[1][0];
      this.cubeState.D[1][1] = this.cubeState.B[0][0];
      this.cubeState.B[0][0] = temp[1];
      this.cubeState.B[1][0] = temp[0];
    } else {
      const temp = [this.cubeState.U[0][1], this.cubeState.U[1][1]];
      this.cubeState.U[0][1] = this.cubeState.B[1][0];
      this.cubeState.U[1][1] = this.cubeState.B[0][0];
      this.cubeState.B[0][0] = this.cubeState.D[1][1];
      this.cubeState.B[1][0] = this.cubeState.D[0][1];
      this.cubeState.D[0][1] = this.cubeState.F[0][1];
      this.cubeState.D[1][1] = this.cubeState.F[1][1];
      this.cubeState.F[0][1] = temp[0];
      this.cubeState.F[1][1] = temp[1];
    }
  }

  private rotateFaceL(clockwise: boolean): void {
    this.cubeState.L = clockwise ? 
      this.rotateMatrixCW(this.cubeState.L) : 
      this.rotateMatrixCCW(this.cubeState.L);

    if (clockwise) {
      const temp = [this.cubeState.U[0][0], this.cubeState.U[1][0]];
      this.cubeState.U[0][0] = this.cubeState.B[1][1];
      this.cubeState.U[1][0] = this.cubeState.B[0][1];
      this.cubeState.B[0][1] = this.cubeState.D[1][0];
      this.cubeState.B[1][1] = this.cubeState.D[0][0];
      this.cubeState.D[0][0] = this.cubeState.F[0][0];
      this.cubeState.D[1][0] = this.cubeState.F[1][0];
      this.cubeState.F[0][0] = temp[0];
      this.cubeState.F[1][0] = temp[1];
    } else {
      const temp = [this.cubeState.U[0][0], this.cubeState.U[1][0]];
      this.cubeState.U[0][0] = this.cubeState.F[0][0];
      this.cubeState.U[1][0] = this.cubeState.F[1][0];
      this.cubeState.F[0][0] = this.cubeState.D[0][0];
      this.cubeState.F[1][0] = this.cubeState.D[1][0];
      this.cubeState.D[0][0] = this.cubeState.B[1][1];
      this.cubeState.D[1][0] = this.cubeState.B[0][1];
      this.cubeState.B[0][1] = temp[1];
      this.cubeState.B[1][1] = temp[0];
    }
  }
}

/**
 * Rotation Logic Factory - Creates appropriate rotation logic for cube size
 */
export class RotationLogicFactory {
  public static create(size: number): BaseRotationLogic {
    switch (size) {
      case 2:
        return new Rotation2x2Logic();
      case 3:
        return new Rotation3x3Logic();
      default:
        // For sizes > 3, we'll use a generic NxN logic (to be implemented)
        console.warn(`${size}x${size}x${size} rotation logic not fully implemented, using 3x3 logic`);
        return new Rotation3x3Logic();
    }
  }

  public static getSupportedSizes(): number[] {
    return [2, 3]; // Currently supported sizes
  }

  public static isSupported(size: number): boolean {
    return this.getSupportedSizes().includes(size);
  }
}
