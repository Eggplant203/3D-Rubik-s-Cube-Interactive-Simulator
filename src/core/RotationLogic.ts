import { CUBE_CONFIG, FACES } from '../config/constants';

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
 * Rotation definition for a face
 */
interface FaceRotationDefinition {
  faceKey: string;
  matrixRotation: 'CW' | 'CCW'; // Clockwise or Counter-clockwise matrix rotation
  adjacentUpdates: Array<{
    sourceFace: string;
    sourceRow: number;
    sourceCol: number;
    targetFace: string;
    targetRow: number;
    targetCol: number;
  }>;
}

/**
 * Rotation Logic class - Handles all cube rotation operations
 * This class manages the 2D state updates for cube rotations
 * Designed to be extensible for different cube sizes (2x2, 4x4, 5x5, etc.)
 */
export class RotationLogic {
  private cubeState!: CubeState;
  private faceOrientation: { [key: string]: string } = {
    'F': 'F', // Front label shows Front face
    'R': 'R', // Right label shows Right face
    'U': 'U', // Up label shows Up face
    'L': 'L', // Left label shows Left face
    'D': 'D', // Down label shows Down face
    'B': 'B'  // Back label shows Back face
  };

  // Rotation definitions for each face
  private faceRotationDefinitions: { [key: string]: FaceRotationDefinition } = {
    'U': {
      faceKey: 'U',
      matrixRotation: 'CW', // Clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // F[0] <- L[0], L[0] <- B[0], B[0] <- R[0], R[0] <- F[0]
        { sourceFace: 'F', sourceRow: 0, sourceCol: 0, targetFace: 'L', targetRow: 0, targetCol: 0 },
        { sourceFace: 'F', sourceRow: 0, sourceCol: 1, targetFace: 'L', targetRow: 0, targetCol: 1 },
        { sourceFace: 'F', sourceRow: 0, sourceCol: 2, targetFace: 'L', targetRow: 0, targetCol: 2 },
        { sourceFace: 'L', sourceRow: 0, sourceCol: 0, targetFace: 'B', targetRow: 0, targetCol: 0 },
        { sourceFace: 'L', sourceRow: 0, sourceCol: 1, targetFace: 'B', targetRow: 0, targetCol: 1 },
        { sourceFace: 'L', sourceRow: 0, sourceCol: 2, targetFace: 'B', targetRow: 0, targetCol: 2 },
        { sourceFace: 'B', sourceRow: 0, sourceCol: 0, targetFace: 'R', targetRow: 0, targetCol: 0 },
        { sourceFace: 'B', sourceRow: 0, sourceCol: 1, targetFace: 'R', targetRow: 0, targetCol: 1 },
        { sourceFace: 'B', sourceRow: 0, sourceCol: 2, targetFace: 'R', targetRow: 0, targetCol: 2 },
        { sourceFace: 'R', sourceRow: 0, sourceCol: 0, targetFace: 'F', targetRow: 0, targetCol: 0 },
        { sourceFace: 'R', sourceRow: 0, sourceCol: 1, targetFace: 'F', targetRow: 0, targetCol: 1 },
        { sourceFace: 'R', sourceRow: 0, sourceCol: 2, targetFace: 'F', targetRow: 0, targetCol: 2 },
      ]
    },
    'D': {
      faceKey: 'D',
      matrixRotation: 'CCW', // Counter-clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // F[2] <- R[2], R[2] <- B[2], B[2] <- L[2], L[2] <- F[2]
        { sourceFace: 'F', sourceRow: 2, sourceCol: 0, targetFace: 'R', targetRow: 2, targetCol: 0 },
        { sourceFace: 'F', sourceRow: 2, sourceCol: 1, targetFace: 'R', targetRow: 2, targetCol: 1 },
        { sourceFace: 'F', sourceRow: 2, sourceCol: 2, targetFace: 'R', targetRow: 2, targetCol: 2 },
        { sourceFace: 'R', sourceRow: 2, sourceCol: 0, targetFace: 'B', targetRow: 2, targetCol: 0 },
        { sourceFace: 'R', sourceRow: 2, sourceCol: 1, targetFace: 'B', targetRow: 2, targetCol: 1 },
        { sourceFace: 'R', sourceRow: 2, sourceCol: 2, targetFace: 'B', targetRow: 2, targetCol: 2 },
        { sourceFace: 'B', sourceRow: 2, sourceCol: 0, targetFace: 'L', targetRow: 2, targetCol: 0 },
        { sourceFace: 'B', sourceRow: 2, sourceCol: 1, targetFace: 'L', targetRow: 2, targetCol: 1 },
        { sourceFace: 'B', sourceRow: 2, sourceCol: 2, targetFace: 'L', targetRow: 2, targetCol: 2 },
        { sourceFace: 'L', sourceRow: 2, sourceCol: 0, targetFace: 'F', targetRow: 2, targetCol: 0 },
        { sourceFace: 'L', sourceRow: 2, sourceCol: 1, targetFace: 'F', targetRow: 2, targetCol: 1 },
        { sourceFace: 'L', sourceRow: 2, sourceCol: 2, targetFace: 'F', targetRow: 2, targetCol: 2 },
      ]
    },
    'F': {
      faceKey: 'F',
      matrixRotation: 'CW', // Clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // U[2] <- L[2][2], L[2][2] <- D[0][0], D[0][0] <- R[2][0], R[2][0] <- U[2][0]
        { sourceFace: 'U', sourceRow: 2, sourceCol: 0, targetFace: 'L', targetRow: 2, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 2, sourceCol: 1, targetFace: 'L', targetRow: 1, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 2, sourceCol: 2, targetFace: 'L', targetRow: 0, targetCol: 2 },
        { sourceFace: 'L', sourceRow: 0, sourceCol: 2, targetFace: 'D', targetRow: 0, targetCol: 0 },
        { sourceFace: 'L', sourceRow: 1, sourceCol: 2, targetFace: 'D', targetRow: 0, targetCol: 1 },
        { sourceFace: 'L', sourceRow: 2, sourceCol: 2, targetFace: 'D', targetRow: 0, targetCol: 2 },
        { sourceFace: 'D', sourceRow: 0, sourceCol: 0, targetFace: 'R', targetRow: 2, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 0, sourceCol: 1, targetFace: 'R', targetRow: 1, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 0, sourceCol: 2, targetFace: 'R', targetRow: 0, targetCol: 0 },
        { sourceFace: 'R', sourceRow: 0, sourceCol: 0, targetFace: 'U', targetRow: 2, targetCol: 0 },
        { sourceFace: 'R', sourceRow: 1, sourceCol: 0, targetFace: 'U', targetRow: 2, targetCol: 1 },
        { sourceFace: 'R', sourceRow: 2, sourceCol: 0, targetFace: 'U', targetRow: 2, targetCol: 2 },
      ]
    },
    'B': {
      faceKey: 'B',
      matrixRotation: 'CCW', // Counter-clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // U[0] <- R[0][2], R[0][2] <- D[2][0], D[2][0] <- L[0][0], L[0][0] <- U[0][0]
        { sourceFace: 'U', sourceRow: 0, sourceCol: 0, targetFace: 'R', targetRow: 0, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 0, sourceCol: 1, targetFace: 'R', targetRow: 1, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 0, sourceCol: 2, targetFace: 'R', targetRow: 2, targetCol: 2 },
        { sourceFace: 'R', sourceRow: 0, sourceCol: 2, targetFace: 'D', targetRow: 2, targetCol: 0 },
        { sourceFace: 'R', sourceRow: 1, sourceCol: 2, targetFace: 'D', targetRow: 2, targetCol: 1 },
        { sourceFace: 'R', sourceRow: 2, sourceCol: 2, targetFace: 'D', targetRow: 2, targetCol: 2 },
        { sourceFace: 'D', sourceRow: 2, sourceCol: 0, targetFace: 'L', targetRow: 0, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 2, sourceCol: 1, targetFace: 'L', targetRow: 1, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 2, sourceCol: 2, targetFace: 'L', targetRow: 2, targetCol: 0 },
        { sourceFace: 'L', sourceRow: 0, sourceCol: 0, targetFace: 'U', targetRow: 0, targetCol: 0 },
        { sourceFace: 'L', sourceRow: 1, sourceCol: 0, targetFace: 'U', targetRow: 0, targetCol: 1 },
        { sourceFace: 'L', sourceRow: 2, sourceCol: 0, targetFace: 'U', targetRow: 0, targetCol: 2 },
      ]
    },
    'R': {
      faceKey: 'R',
      matrixRotation: 'CW', // Clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // U[0][2] <- F[0][2], F[0][2] <- D[0][2], D[0][2] <- B[2][0], B[2][0] <- U[0][2]
        { sourceFace: 'U', sourceRow: 0, sourceCol: 2, targetFace: 'F', targetRow: 0, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 1, sourceCol: 2, targetFace: 'F', targetRow: 1, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 2, sourceCol: 2, targetFace: 'F', targetRow: 2, targetCol: 2 },
        { sourceFace: 'F', sourceRow: 0, sourceCol: 2, targetFace: 'D', targetRow: 0, targetCol: 2 },
        { sourceFace: 'F', sourceRow: 1, sourceCol: 2, targetFace: 'D', targetRow: 1, targetCol: 2 },
        { sourceFace: 'F', sourceRow: 2, sourceCol: 2, targetFace: 'D', targetRow: 2, targetCol: 2 },
        { sourceFace: 'D', sourceRow: 0, sourceCol: 2, targetFace: 'B', targetRow: 2, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 1, sourceCol: 2, targetFace: 'B', targetRow: 1, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 2, sourceCol: 2, targetFace: 'B', targetRow: 0, targetCol: 0 },
        { sourceFace: 'B', sourceRow: 0, sourceCol: 0, targetFace: 'U', targetRow: 0, targetCol: 2 },
        { sourceFace: 'B', sourceRow: 1, sourceCol: 0, targetFace: 'U', targetRow: 1, targetCol: 2 },
        { sourceFace: 'B', sourceRow: 2, sourceCol: 0, targetFace: 'U', targetRow: 2, targetCol: 2 },
      ]
    },
    'L': {
      faceKey: 'L',
      matrixRotation: 'CW', // Clockwise matrix rotation for clockwise face rotation
      adjacentUpdates: [
        // U[0][0] <- B[2][2], B[2][2] <- D[0][0], D[0][0] <- F[0][0], F[0][0] <- U[0][0]
        { sourceFace: 'U', sourceRow: 0, sourceCol: 0, targetFace: 'B', targetRow: 2, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 1, sourceCol: 0, targetFace: 'B', targetRow: 1, targetCol: 2 },
        { sourceFace: 'U', sourceRow: 2, sourceCol: 0, targetFace: 'B', targetRow: 0, targetCol: 2 },
        { sourceFace: 'B', sourceRow: 0, sourceCol: 2, targetFace: 'D', targetRow: 0, targetCol: 0 },
        { sourceFace: 'B', sourceRow: 1, sourceCol: 2, targetFace: 'D', targetRow: 1, targetCol: 0 },
        { sourceFace: 'B', sourceRow: 2, sourceCol: 2, targetFace: 'D', targetRow: 2, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 0, sourceCol: 0, targetFace: 'F', targetRow: 0, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 1, sourceCol: 0, targetFace: 'F', targetRow: 1, targetCol: 0 },
        { sourceFace: 'D', sourceRow: 2, sourceCol: 0, targetFace: 'F', targetRow: 2, targetCol: 0 },
        { sourceFace: 'F', sourceRow: 0, sourceCol: 0, targetFace: 'U', targetRow: 0, targetCol: 0 },
        { sourceFace: 'F', sourceRow: 1, sourceCol: 0, targetFace: 'U', targetRow: 1, targetCol: 0 },
        { sourceFace: 'F', sourceRow: 2, sourceCol: 0, targetFace: 'U', targetRow: 2, targetCol: 0 },
      ]
    }
  };

  constructor() {
    this.initializeCubeState();
  }

  /**
   * Initialize the cube state for 2D net rendering
   */
  private initializeCubeState(): void {
    this.cubeState = {
      U: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.top)),     // Up - Yellow
      D: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.bottom)),  // Down - White
      L: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.left)),    // Left - Orange
      R: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.right)),   // Right - Red
      F: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.front)),   // Front - Blue
      B: Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.back))     // Back - Green
    };

    // Reset face orientation to default
    this.faceOrientation = {
      'F': 'F', // Front label shows Front face
      'R': 'R', // Right label shows Right face
      'U': 'U', // Up label shows Up face
      'L': 'L', // Left label shows Left face
      'D': 'D', // Down label shows Down face
      'B': 'B'  // Back label shows Back face
    };
  }

  /**
   * Rotate a 3x3 matrix 90 degrees clockwise
   */
  private rotateMatrixCW(face: Face): Face {
    const size = face.length;
    const rotated: Face = Array(size).fill(null).map(() => Array(size).fill(""));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        rotated[j][size - 1 - i] = face[i][j];
      }
    }

    return rotated;
  }

  /**
   * Rotate a 3x3 matrix 90 degrees counter-clockwise
   */
  private rotateMatrixCCW(face: Face): Face {
    const size = face.length;
    const rotated: Face = Array(size).fill(null).map(() => Array(size).fill(""));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        rotated[size - 1 - j][i] = face[i][j];
      }
    }

    return rotated;
  }

  /**
   * Get cube state for 2D rendering
   */
  public getCubeState(): CubeState {
    return this.cubeState;
  }

  /**
   * Set cube state from loaded data
   */
  public setCubeState(cubeState: CubeState): void {
    this.cubeState = { ...cubeState };
  }

  /**
   * Update cube state when rotating a face
   */
  public updateCubeStateFace(face: keyof typeof FACES, clockwise: boolean): void {
    const faceKey = this.getFaceKey(face);
    this.rotateFaceState(faceKey, clockwise);
  }

  /**
   * Convert face enum to face key
   */
  private getFaceKey(face: keyof typeof FACES): string {
    switch (face) {
      case 'FRONT': return 'F';
      case 'BACK': return 'B';
      case 'RIGHT': return 'R';
      case 'LEFT': return 'L';
      case 'TOP': return 'U';
      case 'BOTTOM': return 'D';
      default: throw new Error(`Unknown face: ${face}`);
    }
  }

  /**
   * Rotate a specific face in cube state and update adjacent edges
   */
  private rotateFaceState(faceKey: string, clockwise: boolean): void {
    const definition = this.faceRotationDefinitions[faceKey];
    if (!definition) {
      throw new Error(`No rotation definition found for face: ${faceKey}`);
    }

    // Rotate the face matrix
    const rotationMethod = clockwise ? definition.matrixRotation : (definition.matrixRotation === 'CW' ? 'CCW' : 'CW');
    this.cubeState[faceKey as keyof CubeState] = rotationMethod === 'CW'
      ? this.rotateMatrixCW(this.cubeState[faceKey as keyof CubeState])
      : this.rotateMatrixCCW(this.cubeState[faceKey as keyof CubeState]);

    // Update adjacent edges
    this.updateAdjacentEdges(definition, clockwise);
  }

  /**
   * Update adjacent edges based on rotation definition
   */
  private updateAdjacentEdges(definition: FaceRotationDefinition, clockwise: boolean): void {
    const updates = clockwise ? definition.adjacentUpdates : definition.adjacentUpdates.slice().reverse();

    // Store original values
    const tempValues: string[] = [];
    updates.forEach(update => {
      const sourceFace = this.cubeState[update.sourceFace as keyof CubeState];
      tempValues.push(sourceFace[update.sourceRow][update.sourceCol]);
    });

    // Apply updates
    updates.forEach((update, index) => {
      const targetFace = this.cubeState[update.targetFace as keyof CubeState];
      targetFace[update.targetRow][update.targetCol] = tempValues[index];
    });
  }













  /**
   * Update cube state when rotating middle layer
   */
  public updateCubeStateMiddle(clockwise: boolean): void {
    // Middle layer rotation affects the middle edges of each face
    // M move: rotate middle layer around X-axis
    const temp = [
      this.cubeState.F[0][1], this.cubeState.F[1][1], this.cubeState.F[2][1]
    ];

    if (clockwise) {
      this.cubeState.F[0][1] = this.cubeState.U[1][1];
      this.cubeState.F[1][1] = this.cubeState.U[1][0];
      this.cubeState.F[2][1] = this.cubeState.U[1][2];

      this.cubeState.U[1][1] = this.cubeState.B[0][1];
      this.cubeState.U[1][0] = this.cubeState.B[1][1];
      this.cubeState.U[1][2] = this.cubeState.B[2][1];

      this.cubeState.B[0][1] = this.cubeState.D[1][1];
      this.cubeState.B[1][1] = this.cubeState.D[1][2];
      this.cubeState.B[2][1] = this.cubeState.D[1][0];

      this.cubeState.D[1][1] = temp[0];
      this.cubeState.D[1][0] = temp[1];
      this.cubeState.D[1][2] = temp[2];
    } else {
      this.cubeState.F[0][1] = this.cubeState.D[1][1];
      this.cubeState.F[1][1] = this.cubeState.D[1][0];
      this.cubeState.F[2][1] = this.cubeState.D[1][2];

      this.cubeState.D[1][1] = this.cubeState.B[0][1];
      this.cubeState.D[1][0] = this.cubeState.B[1][1];
      this.cubeState.D[1][2] = this.cubeState.B[2][1];

      this.cubeState.B[0][1] = this.cubeState.U[1][1];
      this.cubeState.B[1][1] = this.cubeState.U[1][0];
      this.cubeState.B[2][1] = this.cubeState.U[1][2];

      this.cubeState.U[1][1] = temp[0];
      this.cubeState.U[1][0] = temp[1];
      this.cubeState.U[1][2] = temp[2];
    }
  }

  /**
   * Update cube state when rotating equator layer
   */
  public updateCubeStateEquator(clockwise: boolean): void {
    // Equator layer rotation affects the middle edges of each face
    // E move: rotate equator layer around Y-axis
    const temp = [
      this.cubeState.F[1][0], this.cubeState.F[1][1], this.cubeState.F[1][2]
    ];

    if (clockwise) {
      this.cubeState.F[1] = [this.cubeState.L[1][2], this.cubeState.L[1][1], this.cubeState.L[1][0]];
      this.cubeState.L[1] = [this.cubeState.B[1][0], this.cubeState.B[1][1], this.cubeState.B[1][2]];
      this.cubeState.B[1] = [this.cubeState.R[1][2], this.cubeState.R[1][1], this.cubeState.R[1][0]];
      this.cubeState.R[1] = temp;
    } else {
      this.cubeState.F[1] = [this.cubeState.R[1][2], this.cubeState.R[1][1], this.cubeState.R[1][0]];
      this.cubeState.R[1] = [this.cubeState.B[1][0], this.cubeState.B[1][1], this.cubeState.B[1][2]];
      this.cubeState.B[1] = [this.cubeState.L[1][2], this.cubeState.L[1][1], this.cubeState.L[1][0]];
      this.cubeState.L[1] = temp;
    }
  }

  /**
   * Update cube state when rotating standing layer
   */
  public updateCubeStateStanding(clockwise: boolean): void {
    // Standing layer rotation affects the middle edges of each face
    // S move: rotate standing layer around Z-axis
    const temp = [
      this.cubeState.U[1][0], this.cubeState.U[1][1], this.cubeState.U[1][2]
    ];

    if (clockwise) {
      this.cubeState.U[1] = [this.cubeState.L[0][1], this.cubeState.L[1][1], this.cubeState.L[2][1]];
      this.cubeState.L[0][1] = this.cubeState.D[1][0];
      this.cubeState.L[1][1] = this.cubeState.D[1][1];
      this.cubeState.L[2][1] = this.cubeState.D[1][2];
      this.cubeState.D[1] = [this.cubeState.R[0][1], this.cubeState.R[1][1], this.cubeState.R[2][1]];
      this.cubeState.R[0][1] = temp[0];
      this.cubeState.R[1][1] = temp[1];
      this.cubeState.R[2][1] = temp[2];
    } else {
      this.cubeState.U[1] = [this.cubeState.R[0][1], this.cubeState.R[1][1], this.cubeState.R[2][1]];
      this.cubeState.R[0][1] = this.cubeState.D[1][0];
      this.cubeState.R[1][1] = this.cubeState.D[1][1];
      this.cubeState.R[2][1] = this.cubeState.D[1][2];
      this.cubeState.D[1] = [this.cubeState.L[0][1], this.cubeState.L[1][1], this.cubeState.L[2][1]];
      this.cubeState.L[0][1] = temp[0];
      this.cubeState.L[1][1] = temp[1];
      this.cubeState.L[2][1] = temp[2];
    }
  }

  /**
   * Update cube state when rotating entire cube around X-axis
   */
  public updateCubeStateCubeX(clockwise: boolean): void {
    // Cube X rotation: rotate entire cube around X-axis
    // This affects all faces: U->F, F->D, D->B, B->U, L and R stay the same
    const tempU = this.cubeState.U.map(row => [...row]);
    const tempF = this.cubeState.F.map(row => [...row]);
    const tempD = this.cubeState.D.map(row => [...row]);
    const tempB = this.cubeState.B.map(row => [...row]);

    if (clockwise) {
      // U -> B, B -> D, D -> F, F -> U
      this.cubeState.U = this.rotateMatrixCW(tempF);
      this.cubeState.F = this.rotateMatrixCW(tempD);
      this.cubeState.D = this.rotateMatrixCW(tempB);
      this.cubeState.B = this.rotateMatrixCW(tempU);

      // Update orientation: U->B, B->D, D->F, F->U
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.U = tempOrientation.F;
      this.faceOrientation.F = tempOrientation.D;
      this.faceOrientation.D = tempOrientation.B;
      this.faceOrientation.B = tempOrientation.U;
    } else {
      // U -> F, F -> D, D -> B, B -> U
      this.cubeState.U = this.rotateMatrixCW(tempB);
      this.cubeState.F = this.rotateMatrixCW(tempU);
      this.cubeState.D = this.rotateMatrixCW(tempF);
      this.cubeState.B = this.rotateMatrixCW(tempD);

      // Update orientation: U->F, F->D, D->B, B->U
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.U = tempOrientation.B;
      this.faceOrientation.F = tempOrientation.U;
      this.faceOrientation.D = tempOrientation.F;
      this.faceOrientation.B = tempOrientation.D;
    }
  }

  /**
   * Update cube state when rotating entire cube around Y-axis
   */
  public updateCubeStateCubeY(clockwise: boolean): void {
    // Cube Y rotation: rotate entire cube around Y-axis
    // This affects all faces: F->R, R->B, B->L, L->F, U and D stay the same
    const tempF = this.cubeState.F.map(row => [...row]);
    const tempR = this.cubeState.R.map(row => [...row]);
    const tempB = this.cubeState.B.map(row => [...row]);
    const tempL = this.cubeState.L.map(row => [...row]);

    if (clockwise) {
      // F -> L, L -> B, B -> R, R -> F
      this.cubeState.F = this.rotateMatrixCW(tempL);
      this.cubeState.L = this.rotateMatrixCW(tempB);
      this.cubeState.B = this.rotateMatrixCW(tempR);
      this.cubeState.R = this.rotateMatrixCW(tempF);

      // Update orientation: F->L, L->B, B->R, R->F
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.F = tempOrientation.L;
      this.faceOrientation.L = tempOrientation.B;
      this.faceOrientation.B = tempOrientation.R;
      this.faceOrientation.R = tempOrientation.F;
    } else {
      // F -> R, R -> B, B -> L, L -> F
      this.cubeState.F = this.rotateMatrixCW(tempR);
      this.cubeState.R = this.rotateMatrixCW(tempB);
      this.cubeState.B = this.rotateMatrixCW(tempL);
      this.cubeState.L = this.rotateMatrixCW(tempF);

      // Update orientation: F->R, R->B, B->L, L->F
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.F = tempOrientation.R;
      this.faceOrientation.R = tempOrientation.B;
      this.faceOrientation.B = tempOrientation.L;
      this.faceOrientation.L = tempOrientation.F;
    }
  }

  /**
   * Update cube state when rotating entire cube around Z-axis
   */
  public updateCubeStateCubeZ(clockwise: boolean): void {
    // Cube Z rotation: rotate entire cube around Z-axis
    // This affects all faces: U->R, R->D, D->L, L->U, F and B stay the same
    const tempU = this.cubeState.U.map(row => [...row]);
    const tempR = this.cubeState.R.map(row => [...row]);
    const tempD = this.cubeState.D.map(row => [...row]);
    const tempL = this.cubeState.L.map(row => [...row]);

    if (clockwise) {
      // U -> L, L -> D, D -> R, R -> U
      this.cubeState.U = this.rotateMatrixCW(tempL);
      this.cubeState.L = this.rotateMatrixCW(tempD);
      this.cubeState.D = this.rotateMatrixCW(tempR);
      this.cubeState.R = this.rotateMatrixCW(tempU);

      // Update orientation: U->L, L->D, D->R, R->U
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.U = tempOrientation.L;
      this.faceOrientation.L = tempOrientation.D;
      this.faceOrientation.D = tempOrientation.R;
      this.faceOrientation.R = tempOrientation.U;
    } else {
      // U -> R, R -> D, D -> L, L -> U
      this.cubeState.U = this.rotateMatrixCW(tempR);
      this.cubeState.R = this.rotateMatrixCW(tempD);
      this.cubeState.D = this.rotateMatrixCW(tempL);
      this.cubeState.L = this.rotateMatrixCW(tempU);

      // Update orientation: U->R, R->D, D->L, L->U
      const tempOrientation = { ...this.faceOrientation };
      this.faceOrientation.U = tempOrientation.R;
      this.faceOrientation.R = tempOrientation.D;
      this.faceOrientation.D = tempOrientation.L;
      this.faceOrientation.L = tempOrientation.U;
    }
  }

  /**
   * Get current face orientation for labels
   */
  public getFaceOrientation(): { [key: string]: string } {
    return { ...this.faceOrientation };
  }

  /**
   * Get face color for a specific label based on current orientation
   */
  public getLabelColor(label: string): string {
    const actualFace = this.faceOrientation[label];
    if (!actualFace) return '#ffffff';

    const faceColors = this.getFaceColors(actualFace);
    if (faceColors && faceColors[1] && faceColors[1][1]) {
      return faceColors[1][1];
    }
    return '#ffffff';
  }

  /**
   * Get face colors for 2D net rendering
   */
  public getFaceColors(face: string): string[][] {
    const faceKey = face.toUpperCase();

    switch (faceKey) {
      case 'U':
        return this.cubeState.U.map(row => [...row]);
      case 'D':
        return this.cubeState.D.map(row => [...row]);
      case 'L':
        return this.cubeState.L.map(row => [...row]);
      case 'R':
        return this.cubeState.R.map(row => [...row]);
      case 'F':
        return this.cubeState.F.map(row => [...row]);
      case 'B':
        return this.cubeState.B.map(row => [...row]);
      default:
        return Array(3).fill(null).map(() => Array(3).fill(CUBE_CONFIG.colors.top));
    }
  }

  /**
   * Update cube state from cubelets (for corner rotations)
   */
  public updateCubeStateFromCubelets(cubelets: any[]): void {
    // Reset cube state
    this.cubeState = {
      U: Array(3).fill(null).map(() => Array(3).fill('#333333')),
      D: Array(3).fill(null).map(() => Array(3).fill('#333333')),
      L: Array(3).fill(null).map(() => Array(3).fill('#333333')),
      R: Array(3).fill(null).map(() => Array(3).fill('#333333')),
      F: Array(3).fill(null).map(() => Array(3).fill('#333333')),
      B: Array(3).fill(null).map(() => Array(3).fill('#333333'))
    };

    const size = 3;
    const cubeSize = 2;
    const offset = (size - 1) * cubeSize / 2;

    cubelets.forEach(cubelet => {
      // Convert actual position to grid coordinates
      const gridX = Math.round((cubelet.position.x + offset) / cubeSize);
      const gridY = Math.round((cubelet.position.y + offset) / cubeSize);
      const gridZ = Math.round((cubelet.position.z + offset) / cubeSize);
      
      const colors = cubelet.colors;

      // Update faces based on cubelet position
      if (gridX === 2) this.cubeState.R[2-gridY][2-gridZ] = colors[0]; // Right face
      if (gridX === 0) this.cubeState.L[2-gridY][gridZ] = colors[1];   // Left face
      if (gridY === 2) this.cubeState.U[gridZ][gridX] = colors[2];     // Top face
      if (gridY === 0) this.cubeState.D[gridZ][gridX] = colors[3];     // Bottom face
      if (gridZ === 2) this.cubeState.F[2-gridY][gridX] = colors[4];   // Front face
      if (gridZ === 0) this.cubeState.B[2-gridY][2-gridX] = colors[5]; // Back face
    });
  }

  /**
   * Reset cube state to solved state
   */
  public reset(): void {
    this.initializeCubeState();
  }
}
