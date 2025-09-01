/**
 * Key Mapping Manager - Centralized management of keyboard controls
 * Supports customizable key mappings for different cube operations
 */
export interface KeyMapping {
  front: string;
  back: string;
  right: string;
  left: string;
  up: string;
  down: string;
  middle: string;
  equator: string;
  standing: string;
  cubeX: string;
  cubeY: string;
  cubeZ: string;
  shift: string;
}

export interface KeyAction {
  type: 'face' | 'middle' | 'equator' | 'standing' | 'cubeX' | 'cubeY' | 'cubeZ';
  face?: string;
  modifier?: boolean;
}

export class KeyMappingManager {
  private static instance: KeyMappingManager;
  private currentMappings: KeyMapping;
  
  // Default key mappings
  private readonly defaultMappings: KeyMapping = {
    front: 'f',
    back: 'b', 
    right: 'r',
    left: 'l',
    up: 'u',
    down: 'd',
    middle: 'm',
    equator: 'e',
    standing: 's',
    cubeX: 'x',
    cubeY: 'y',
    cubeZ: 'z',
    shift: 'SHIFT'
  };

  // Preset mappings for different preferences
  private readonly presetMappings: { [key: string]: KeyMapping } = {
    default: { ...this.defaultMappings },
    qwerty_optimized: {
      front: 'j',
      back: 'f',
      right: 'l',
      left: 'h',
      up: 'i',
      down: 'k',
      middle: 'm',
      equator: 'e',
      standing: 's',
      cubeX: 'x',
      cubeY: 'y',
      cubeZ: 'z',
      shift: 'SHIFT'
    },
    left_handed: {
      front: 'u',
      back: 'o',
      right: 'p',
      left: 'i',
      up: 'k',
      down: 'j',
      middle: 'm',
      equator: 'n',
      standing: 'b',
      cubeX: 'x',
      cubeY: 'c',
      cubeZ: 'v',
      shift: 'SHIFT'
    }
  };

  private constructor() {
    this.currentMappings = { ...this.defaultMappings };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KeyMappingManager {
    if (!KeyMappingManager.instance) {
      KeyMappingManager.instance = new KeyMappingManager();
    }
    return KeyMappingManager.instance;
  }

  /**
   * Get current key mappings
   */
  public getCurrentMappings(): KeyMapping {
    return { ...this.currentMappings };
  }

  /**
   * Get default key mappings
   */
  public getDefaultMappings(): KeyMapping {
    return { ...this.defaultMappings };
  }

  /**
   * Get available preset mapping names
   */
  public getAvailablePresets(): string[] {
    return Object.keys(this.presetMappings);
  }

  /**
   * Get preset mapping by name
   */
  public getPresetMapping(presetName: string): KeyMapping | null {
    return this.presetMappings[presetName] ? { ...this.presetMappings[presetName] } : null;
  }

  /**
   * Set current mappings
   */
  public setMappings(mappings: Partial<KeyMapping>): boolean {
    // Validate no duplicates
    const values = Object.values(mappings).filter(v => v !== undefined);
    const uniqueValues = new Set(values.map(v => v.toLowerCase()));
    
    if (values.length !== uniqueValues.size) {
      return false; // Duplicates found
    }

    // Update current mappings
    this.currentMappings = { ...this.currentMappings, ...mappings };
    return true;
  }

  /**
   * Load preset mapping
   */
  public loadPreset(presetName: string): boolean {
    const preset = this.presetMappings[presetName];
    if (preset) {
      this.currentMappings = { ...preset };
      return true;
    }
    return false;
  }

  /**
   * Reset to default mappings
   */
  public resetToDefault(): void {
    this.currentMappings = { ...this.defaultMappings };
  }

  /**
   * Add custom preset
   */
  public addCustomPreset(name: string, mappings: KeyMapping): void {
    this.presetMappings[name] = { ...mappings };
  }

  /**
   * Get key action for a given key press
   */
  public getKeyAction(key: string, shiftPressed: boolean = false): KeyAction | null {
    const lowerKey = key.toLowerCase();
    
    // Check face rotations
    if (lowerKey === this.currentMappings.front) {
      return { type: 'face', face: 'F', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.back) {
      return { type: 'face', face: 'B', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.right) {
      return { type: 'face', face: 'R', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.left) {
      return { type: 'face', face: 'L', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.up) {
      return { type: 'face', face: 'U', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.down) {
      return { type: 'face', face: 'D', modifier: shiftPressed };
    }

    // Check middle layer rotations
    if (lowerKey === this.currentMappings.middle) {
      return { type: 'middle', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.equator) {
      return { type: 'equator', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.standing) {
      return { type: 'standing', modifier: shiftPressed };
    }

    // Check cube rotations
    if (lowerKey === this.currentMappings.cubeX) {
      return { type: 'cubeX', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.cubeY) {
      return { type: 'cubeY', modifier: shiftPressed };
    }
    if (lowerKey === this.currentMappings.cubeZ) {
      return { type: 'cubeZ', modifier: shiftPressed };
    }

    return null;
  }

  /**
   * Get readable description for a key action
   */
  public getActionDescription(action: KeyAction): string {
    const clockwise = !action.modifier;
    const direction = clockwise ? 'clockwise' : 'counter-clockwise';

    switch (action.type) {
      case 'face':
        return `${action.face} face ${direction}`;
      case 'middle':
        return `Middle layer ${direction}`;
      case 'equator':
        return `Equator layer ${direction}`;
      case 'standing':
        return `Standing layer ${direction}`;
      case 'cubeX':
        return `Cube X-axis rotation ${direction}`;
      case 'cubeY':
        return `Cube Y-axis rotation ${direction}`;
      case 'cubeZ':
        return `Cube Z-axis rotation ${direction}`;
      default:
        return 'Unknown action';
    }
  }

  /**
   * Validate key mappings
   */
  public validateMappings(mappings: Partial<KeyMapping>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for duplicates
    const duplicateMap = new Map<string, string[]>();
    Object.entries(mappings).forEach(([key, value]) => {
      if (value) {
        const lowerValue = value.toLowerCase();
        if (!duplicateMap.has(lowerValue)) {
          duplicateMap.set(lowerValue, []);
        }
        duplicateMap.get(lowerValue)!.push(key);
      }
    });

    duplicateMap.forEach((keys, value) => {
      if (keys.length > 1) {
        errors.push(`Duplicate key "${value}" used for: ${keys.join(', ')}`);
      }
    });

    // Check for invalid characters (basic validation)
    Object.entries(mappings).forEach(([key, value]) => {
      if (value && key !== 'shift') {
        if (value.length !== 1 || !/^[a-zA-Z]$/.test(value)) {
          errors.push(`Invalid key "${value}" for ${key}. Use single letters only.`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get help text for current mappings
   */
  public getHelpText(): string {
    const mappings = this.currentMappings;
    return `
Cube Controls:
- ${mappings.front.toUpperCase()}: Front face
- ${mappings.back.toUpperCase()}: Back face  
- ${mappings.right.toUpperCase()}: Right face
- ${mappings.left.toUpperCase()}: Left face
- ${mappings.up.toUpperCase()}: Up face
- ${mappings.down.toUpperCase()}: Down face

Middle Layers:
- ${mappings.middle.toUpperCase()}: Middle layer
- ${mappings.equator.toUpperCase()}: Equator layer  
- ${mappings.standing.toUpperCase()}: Standing layer

Cube Rotation:
- ${mappings.cubeX.toUpperCase()}: X-axis rotation
- ${mappings.cubeY.toUpperCase()}: Y-axis rotation
- ${mappings.cubeZ.toUpperCase()}: Z-axis rotation

Hold ${mappings.shift} for counter-clockwise rotation.
    `.trim();
  }
}
