import { RubiksCube } from '../core/RubiksCube';
import { UIController } from './UIController';

/**
 * Interface for input handlers
 */
interface InputHandler {
  enable(): void;
  disable(): void;
  dispose(): void;
}

/**
 * Manages keyboard input for cube operations
 */
export class KeyboardController implements InputHandler {
  private cube: RubiksCube;
  private enabled: boolean = false;
  private keyDownHandler: (event: KeyboardEvent) => void;
  private getSaveRecordEnabled: () => boolean;
  private getIsTimerRunning: () => boolean;
  private uiController: UIController | null;

  // Custom key mappings
  private keyMappings = {
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
    shift: 'shift'
  };

  constructor(cube: RubiksCube, getSaveRecordEnabled: () => boolean, getIsTimerRunning: () => boolean, uiController?: UIController | null) {
    this.cube = cube;
    this.getSaveRecordEnabled = getSaveRecordEnabled;
    this.getIsTimerRunning = getIsTimerRunning;
    this.uiController = uiController || null;
    this.keyDownHandler = this.onKeyDown.bind(this);
  }

  /**
   * Enable keyboard controls
   */
  public enable(): void {
    if (!this.enabled) {
      window.addEventListener('keydown', this.keyDownHandler);
      this.enabled = true;
    }
  }

  /**
   * Set custom key mappings
   */
  public setKeyMappings(mappings: typeof this.keyMappings): void {
    // Convert all mappings to lowercase for consistent comparison
    this.keyMappings = {
      front: mappings.front.toLowerCase(),
      back: mappings.back.toLowerCase(),
      right: mappings.right.toLowerCase(),
      left: mappings.left.toLowerCase(),
      up: mappings.up.toLowerCase(),
      down: mappings.down.toLowerCase(),
      middle: mappings.middle.toLowerCase(),
      equator: mappings.equator.toLowerCase(),
      standing: mappings.standing.toLowerCase(),
      cubeX: mappings.cubeX.toLowerCase(),
      cubeY: mappings.cubeY.toLowerCase(),
      cubeZ: mappings.cubeZ.toLowerCase(),
      shift: 'shift' // Always lowercase for shift
    };
  }

  /**
   * Get current key mappings
   */
  public getKeyMappings(): typeof this.keyMappings {
    return { ...this.keyMappings };
  }

  /**
   * Disable keyboard controls
   */
  public disable(): void {
    if (this.enabled) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.enabled = false;
    }
  }

  /**
   * Handle key press events - Only cube rotation keys, no UI shortcuts
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    // Don't handle keyboard events when user is typing in input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    const isShiftPressed = event.shiftKey;
    const isCtrlPressed = event.ctrlKey;
    
    // Handle undo/redo with Ctrl+Z/Y
    if (isCtrlPressed && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      
      // Check if save record is enabled and timer is running
      if (this.getSaveRecordEnabled() && this.getIsTimerRunning()) {
        // Show notification and prevent undo
        if (this.uiController) {
          this.uiController.showNotification(
            'Cannot undo while timer is running in Timer mode',
            'error',
            3000
          );
        }
        return;
      }
      
      this.cube.undo();
      return;
    }
    if (isCtrlPressed && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      
      // Check if save record is enabled and timer is running
      if (this.getSaveRecordEnabled() && this.getIsTimerRunning()) {
        // Show notification and prevent redo
        if (this.uiController) {
          this.uiController.showNotification(
            'Cannot redo while timer is running in Timer mode',
            'error',
            3000
          );
        }
        return;
      }
      
      this.cube.redo();
      return;
    }

    // Handle Backspace key for panel toggle
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.uiController) {
        this.uiController.togglePanelPublic();
      }
      return;
    }

    // Only handle cube rotation keys, avoid UI conflicts
    let normalizedKey = event.key.toLowerCase();

    // Handle special key mappings
    if (event.key === ' ') {
      normalizedKey = 'space';
    } else if (event.key.startsWith('Arrow')) {
      normalizedKey = event.key.replace('Arrow', '').toLowerCase(); // ArrowUp -> up
    }

    if (normalizedKey === this.keyMappings.front) {
      event.preventDefault();
      this.cube.rotateFace('FRONT', isShiftPressed);
    } else if (normalizedKey === this.keyMappings.back) {
      event.preventDefault();
      this.cube.rotateFace('BACK', !isShiftPressed);
    } else if (normalizedKey === this.keyMappings.right) {
      event.preventDefault();
      this.cube.rotateFace('RIGHT', isShiftPressed);
    } else if (normalizedKey === this.keyMappings.left) {
      event.preventDefault();
      this.cube.rotateFace('LEFT', !isShiftPressed);
    } else if (normalizedKey === this.keyMappings.up) {
      event.preventDefault();
      this.cube.rotateFace('TOP', isShiftPressed);
    } else if (normalizedKey === this.keyMappings.down) {
      event.preventDefault();
      this.cube.rotateFace('BOTTOM', !isShiftPressed);
    } else if (normalizedKey === this.keyMappings.middle) {
      event.preventDefault();
      this.cube.rotateMiddle(!isShiftPressed);
    } else if (normalizedKey === this.keyMappings.equator) {
      event.preventDefault();
      this.cube.rotateEquator(!isShiftPressed);
    } else if (normalizedKey === this.keyMappings.standing) {
      event.preventDefault();
      this.cube.rotateStanding(isShiftPressed);
    } else if (normalizedKey === this.keyMappings.cubeX) {
      event.preventDefault();
      this.cube.rotateCubeX(isShiftPressed);
    } else if (normalizedKey === this.keyMappings.cubeY) {
      event.preventDefault();
      this.cube.rotateCubeY(isShiftPressed);
    } else if (normalizedKey === this.keyMappings.cubeZ) {
      event.preventDefault();
      this.cube.rotateCubeZ(isShiftPressed);
    } else {
      // Handle corner rotations with Ctrl + number (1-8)
      switch (event.key.toLowerCase()) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          if (isCtrlPressed) {
            event.preventDefault();
            
            const cornerIndex = parseInt(event.key);
            const direction = isShiftPressed ? 'counter-clockwise' : 'clockwise';
            const cornerNames = [
              'Bottom-Left-Back', 'Bottom-Left-Front', 'Top-Left-Back', 'Top-Left-Front',
              'Bottom-Right-Back', 'Bottom-Right-Front', 'Top-Right-Back', 'Top-Right-Front'
            ];
            
            this.cube.rotateCorner(cornerIndex, !isShiftPressed); // Shift reverses direction
            
            // Show notification
            if (this.uiController) {
              this.uiController.showNotification(
                `Corner ${cornerIndex} (${cornerNames[cornerIndex - 1]}) rotated ${direction}`,
                'info',
                2000
              );
            }
          }
          break;
        case ' ': // Space key for scramble
          event.preventDefault();
          
          // Check if save record is enabled and timer is running
          if (this.getSaveRecordEnabled() && this.getIsTimerRunning()) {
            // Show notification and prevent scramble
            if (this.uiController) {
              this.uiController.showNotification(
                'Cannot scramble while timer is running in Timer mode',
                'error',
                3000
              );
            }
            return;
          }
          
          // Use UIController's keyboard scramble handler for consistent behavior
          if (this.uiController) {
            this.uiController.handleKeyboardScramble();
          }
          break;
        // Also handle by keyCode for better compatibility
        default:
          if (isCtrlPressed && event.keyCode >= 49 && event.keyCode <= 56) { // 49-56 is '1'-'8'
            event.preventDefault();
            
            const cornerIndex = event.keyCode - 48; // Convert keyCode to number
            const direction = isShiftPressed ? 'counter-clockwise' : 'clockwise';
            const cornerNames = [
              'Bottom-Left-Back', 'Bottom-Left-Front', 'Top-Left-Back', 'Top-Left-Front',
              'Bottom-Right-Back', 'Bottom-Right-Front', 'Top-Right-Back', 'Top-Right-Front'
            ];
            
            this.cube.rotateCorner(cornerIndex, !isShiftPressed);
            
            // Show notification
            if (this.uiController) {
              this.uiController.showNotification(
                `Corner ${cornerIndex} (${cornerNames[cornerIndex - 1]}) rotated ${direction}`,
                'info',
                2000
              );
            }
          }
          break;
      }
    }
  }

  /**
   * Execute a move based on notation (used by sequence input)
   */
  public async executeMoveByNotation(notation: string): Promise<void> {
    // Parse notation to extract base, prime, and number
    const isPrime = notation.includes("'");
    const numberMatch = notation.match(/(\d+)$/);
    const number = numberMatch ? parseInt(numberMatch[1]) : (notation.includes('2') ? 2 : 1);
    let baseNotation = notation.replace(/['\d]/g, '');

    // Execute the move 'number' times
    for (let i = 0; i < number; i++) {
      await this.executeSingleMove(baseNotation, isPrime);
    }
  }

  /**
   * Execute a single move
   */
  private async executeSingleMove(key: string, isPrime: boolean): Promise<void> {
    switch (key.toLowerCase()) {
      case 'f':
        await this.cube.rotateFace('FRONT', isPrime);
        break;
      case 'b':
        await this.cube.rotateFace('BACK', !isPrime);
        break;
      case 'r':
        await this.cube.rotateFace('RIGHT', isPrime);
        break;
      case 'l':
        await this.cube.rotateFace('LEFT', !isPrime);
        break;
      case 'u':
        await this.cube.rotateFace('TOP', isPrime);
        break;
      case 'd':
        await this.cube.rotateFace('BOTTOM', !isPrime);
        break;
      case 'm':
        await this.cube.rotateMiddle(!isPrime);
        break;
      case 'e':
        await this.cube.rotateEquator(!isPrime);
        break;
      case 's':
        await this.cube.rotateStanding(isPrime);
        break;
      case 'x':
        await this.cube.rotateCubeX(isPrime);
        break;
      case 'y':
        await this.cube.rotateCubeY(isPrime);
        break;
      case 'z':
        await this.cube.rotateCubeZ(isPrime);
        break;
      default:
        throw new Error(`Unknown notation: ${key}`);
    }
  }

  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    this.disable();
  }
}

/**
 * Manages UI controls
 */
export class UIInputController implements InputHandler {
  private cube: RubiksCube;
  private scrambleBtn: HTMLElement | null;
  private resetBtn: HTMLElement | null;
  private solveBtn: HTMLElement | null;
  private toggleUIBtn: HTMLElement | null;
  private controls: HTMLElement | null;
  private enabled: boolean = false;
  private uiVisible: boolean = true;
  private floatingToggle: HTMLElement | null = null;

  constructor(cube: RubiksCube) {
    this.cube = cube;
    this.scrambleBtn = document.getElementById('scrambleBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.solveBtn = document.getElementById('solveBtn');
    this.toggleUIBtn = document.getElementById('toggleUIBtn');
    this.controls = document.getElementById('controls');
  }

  /**
   * Enable UI controls
   */
  public enable(): void {
    if (!this.enabled && this.scrambleBtn && this.resetBtn && this.solveBtn && this.toggleUIBtn) {
      this.scrambleBtn.addEventListener('click', this.onScramble.bind(this));
      this.resetBtn.addEventListener('click', this.onReset.bind(this));
      this.solveBtn.addEventListener('click', this.onSolve.bind(this));
      this.toggleUIBtn.addEventListener('click', this.onToggleUI.bind(this));
      this.enabled = true;
    }
  }

  /**
   * Disable UI controls
   */
  public disable(): void {
    if (this.enabled) {
      this.scrambleBtn?.removeEventListener('click', this.onScramble.bind(this));
      this.resetBtn?.removeEventListener('click', this.onReset.bind(this));
      this.solveBtn?.removeEventListener('click', this.onSolve.bind(this));
      this.toggleUIBtn?.removeEventListener('click', this.onToggleUI.bind(this));
      this.enabled = false;
    }
  }

  /**
   * Handle scramble button click
   */
  private onScramble(): void {
    this.cube.scramble(25);
  }

  /**
   * Handle reset button click
   */
  private onReset(): void {
    this.cube.reset();
  }

  /**
   * Handle solve button click
   */
  private onSolve(): void {
    
  }

  /**
   * Handle toggle UI button click
   */
  private onToggleUI(): void {
    this.uiVisible = !this.uiVisible;
    
    if (this.controls) {
      if (this.uiVisible) {
        // Show UI
        this.controls.classList.remove('hidden');
        this.removeFloatingToggle();
        if (this.toggleUIBtn) {
          (this.toggleUIBtn as HTMLButtonElement).textContent = 'Hide UI';
        }
      } else {
        // Hide UI
        this.controls.classList.add('hidden');
        this.createFloatingToggle();
      }
    }
  }

  /**
   * Create floating toggle button when UI is hidden
   */
  private createFloatingToggle(): void {
    if (this.floatingToggle) return;
    
    this.floatingToggle = document.createElement('button');
    this.floatingToggle.textContent = 'Show UI';
    this.floatingToggle.className = 'floating-toggle';
    this.floatingToggle.addEventListener('click', this.onToggleUI.bind(this));
    document.body.appendChild(this.floatingToggle);
  }

  /**
   * Remove floating toggle button
   */
  private removeFloatingToggle(): void {
    if (this.floatingToggle) {
      this.floatingToggle.removeEventListener('click', this.onToggleUI.bind(this));
      document.body.removeChild(this.floatingToggle);
      this.floatingToggle = null;
    }
  }

  /**
   * Set button states
   */
  public setButtonState(button: 'scramble' | 'reset' | 'solve', enabled: boolean): void {
    const btn = button === 'scramble' ? this.scrambleBtn :
                button === 'reset' ? this.resetBtn : this.solveBtn;
    
    if (btn) {
      (btn as HTMLButtonElement).disabled = !enabled;
    }
  }

  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    this.disable();
    this.removeFloatingToggle();
  }
}

/**
 * Main input manager that coordinates all input handlers
 */
export class InputManager {
  private handlers: InputHandler[] = [];
  private uiController: UIController | null = null;

  constructor(cube: RubiksCube, uiController?: UIController | null) {
    this.uiController = uiController || null;
    this.handlers = [
      new KeyboardController(cube, () => this.uiController?.getSaveRecordEnabled() || false, () => this.uiController?.getIsTimerRunning() || false, this.uiController),
      new UIInputController(cube)
    ];
  }

  /**
   * Enable all input handlers
   */
  public enable(): void {
    this.handlers.forEach(handler => handler.enable());
  }

  /**
   * Disable all input handlers
   */
  public disable(): void {
    this.handlers.forEach(handler => handler.disable());
  }

  /**
   * Get a specific handler by type
   */
  public getHandler<T extends InputHandler>(type: new (...args: any[]) => T): T | undefined {
    return this.handlers.find(handler => handler instanceof type) as T | undefined;
  }

  /**
   * Set UI controller reference
   */
  public setUIController(uiController: UIController): void {
    this.uiController = uiController;
    // Update UIController reference in KeyboardController
    const keyboardController = this.getKeyboardController();
    if (keyboardController) {
      (keyboardController as any).uiController = uiController;
    }
  }

  /**
   * Get the keyboard controller instance
   */
  public getKeyboardController(): KeyboardController | null {
    return this.handlers.find(handler => handler instanceof KeyboardController) as KeyboardController || null;
  }

  /**
   * Cleanup all handlers
   */
  public dispose(): void {
    this.handlers.forEach(handler => handler.dispose());
    this.handlers = [];
  }
}
