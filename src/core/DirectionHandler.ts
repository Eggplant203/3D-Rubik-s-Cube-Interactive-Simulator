/**
 * Common interface for direction handling in Rubik's Cube operations
 * This helps standardize direction handling between cube types
 */
export interface DirectionHandler {
  /**
   * Convert standard notation direction to the actual direction needed for a specific cube type
   * @param clockwise - Standard notation direction (true for clockwise, false for counter-clockwise)
   * @returns The actual direction to use in rotation implementation
   */
  convertDirection(clockwise: boolean): boolean;
}

/**
 * Standard direction handler for 3x3x3 cube
 * For 3x3x3, the standard notation direction matches the implementation direction
 */
export class StandardDirectionHandler implements DirectionHandler {
  convertDirection(clockwise: boolean): boolean {
    return clockwise; // No conversion needed
  }
}

/**
 * Direction handler for 2x2x2 cube
 * For 2x2x2, the implementation requires inverting the standard notation direction
 */
export class InvertedDirectionHandler implements DirectionHandler {
  convertDirection(clockwise: boolean): boolean {
    return !clockwise; // Invert the direction
  }
}
