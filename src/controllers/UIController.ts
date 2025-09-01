import { RubiksCube } from '../core/RubiksCube';
import { NotificationSystem } from '../utils/NotificationSystem';
import { SceneManager } from '../core/SceneManager';
import { KeyboardController, InputManager } from './InputManager';
import { CubeStateManager } from '../services/CubeStateManager';
import { CUBE_CONFIG } from '../config/constants';

/**
 * UI Controller - Manages all UI interactions and states
 */
export class UIController {
  private cube: RubiksCube;
  private sceneManager: SceneManager;
  private keyboardController: KeyboardController;
  private isTimerRunning = false;
  private timerStartTime = 0;
  private timerInterval: number | null = null;
  private moveCount = 0;
  private _scrambleSteps = 25;
  private currentMode: 'practice' | 'timer' = 'practice';
  private theme: 'light' | 'dark' = 'light';
  private currentColorTheme: string = 'classic';
  private solveHistory: { time: number; moves: number; date: Date }[] = [];
  private savedNotes: { id: string; title: string; content: string; date: Date }[] = [];
  private uiHidden = false;
  private panelCollapsed = false;
  private soundEnabled = true;
  private blindfoldModeEnabled = false;
  private showClock = true;
  private saveRecordEnabled = false;
  private notificationSystem: NotificationSystem;
  private cubeStateManager: CubeStateManager;
  private inputManager: InputManager | null = null;

  // Custom key mappings
  private customKeyMappings = {
    front: 'f',
    back: 'b',
    right: 'r',
    left: 'l',
    up: 'u',
    down: 'd',
    middle: 'm',
    equator: 'e',
    standing: 'S',
    cubeX: 'X',
    cubeY: 'Y',
    cubeZ: 'Z',
    shift: 'SHIFT'
  };

  /**
   * Get the current scramble steps
   */
  public get scrambleSteps(): number {
    return this._scrambleSteps;
  }

  /**
   * Get the current blindfold mode status
   */
  public getBlindfoldMode(): boolean {
    return this.blindfoldModeEnabled;
  }

  /**
   * Get the current save record status
   */
  public getSaveRecordEnabled(): boolean {
    return this.saveRecordEnabled;
  }

  /**
   * Get the current timer running status
   */
  public getIsTimerRunning(): boolean {
    return this.isTimerRunning;
  }

  // Color themes for cube
  private colorThemes = {
    classic: {
      front: '#3366ff',   // Blue
      back: '#33cc33',    // Green
      right: '#ff3333',   // Red
      left: '#ff9900',    // Orange
      top: '#ffff33',     // Yellow
      bottom: '#ffffff'   // White
    },
    neon: {
      front: '#00ffff',   // Cyan
      back: '#ff00ff',    // Magenta
      right: '#ff0080',   // Pink
      left: '#80ff00',    // Lime
      top: '#ffff00',     // Yellow
      bottom: '#ffffff'   // White
    },
    pastel: {
      front: '#a8d5e2',   // Pastel blue
      back: '#b8e6b8',    // Pastel green
      right: '#f4a4a4',   // Pastel red
      left: '#f9d5a7',    // Pastel orange
      top: '#fff2a8',     // Pastel yellow
      bottom: '#f5f5f5'   // Light gray
    },
    earth: {
      front: '#8b4513',   // Brown
      back: '#228b22',    // Forest green
      right: '#dc143c',   // Crimson
      left: '#daa520',    // Goldenrod
      top: '#ffd700',     // Gold
      bottom: '#f5f5dc'   // Beige
    },
    ocean: {
      front: '#1e90ff',   // Dodger blue
      back: '#008080',    // Teal
      right: '#ff6347',   // Coral
      left: '#20b2aa',    // Light sea green
      top: '#87ceeb',     // Sky blue
      bottom: '#e0ffff'   // Light cyan
    },
    fire: {
      front: '#ff4500',   // Orange red
      back: '#ff1493',    // Deep pink
      right: '#dc143c',   // Crimson
      left: '#ff8c00',    // Dark orange
      top: '#ffd700',     // Gold
      bottom: '#fff8dc'   // Cornsilk
    },
    rainbow: {
      front: '#ff0000',   // Red
      back: '#ff7f00',    // Orange
      right: '#ffff00',   // Yellow
      left: '#00ff00',    // Green
      top: '#0000ff',     // Blue
      bottom: '#8b00ff'   // Violet
    },
    monochrome: {
      front: '#2c2c2c',   // Dark gray
      back: '#404040',    // Medium gray
      right: '#595959',   // Light gray
      left: '#737373',    // Silver
      top: '#8c8c8c',     // Light silver
      bottom: '#a6a6a6'   // Pale silver
    }
  };

  // DOM Elements grouped by category
  private elements = {
    // Header controls
    header: {
      modeSelect: document.getElementById('modeSelect') as HTMLSelectElement,
      themeToggle: document.getElementById('themeToggle') as HTMLButtonElement,
    },

    // Main controls
    main: {
      scrambleBtn: document.getElementById('scrambleBtn') as HTMLButtonElement,
      resetBtn: document.getElementById('resetBtn') as HTMLButtonElement,
      solveBtn: document.getElementById('solveBtn') as HTMLButtonElement,
      undoBtn: document.getElementById('undoBtn') as HTMLButtonElement,
      redoBtn: document.getElementById('redoBtn') as HTMLButtonElement,
      resetViewBtn: document.getElementById('resetViewBtn') as HTMLButtonElement,
      toggleUIBtn: document.getElementById('toggleUIBtn') as HTMLButtonElement,
    },

    // Side Panel
    panel: {
      sidePanel: document.getElementById('sidePanel') as HTMLElement,
      panelToggle: document.getElementById('panelToggle') as HTMLElement,
      panelToggleCollapsed: document.getElementById('panelToggleCollapsed') as HTMLElement,
    },

    // Statistics
    stats: {
      timerDisplay: document.getElementById('timerDisplay') as HTMLElement,
      timerToggle: document.getElementById('timerToggle') as HTMLButtonElement,
      moveCounter: document.getElementById('moveCounter') as HTMLElement,
      bestTime: document.getElementById('bestTime') as HTMLElement,
      averageTime: document.getElementById('averageTime') as HTMLElement,
      lastTimes: document.getElementById('lastTimes') as HTMLElement,
    },

    // Options
    options: {
      scrambleSteps: document.getElementById('scrambleSteps') as HTMLInputElement,
      resetScrambleSteps: document.getElementById('resetScrambleSteps') as HTMLButtonElement,
      showClock: document.getElementById('showClock') as HTMLInputElement,
      autoTimer: document.getElementById('autoTimer') as HTMLInputElement,
    },

    // Appearance
    appearance: {
      cubeSize: document.getElementById('cubeSize') as HTMLSelectElement,
      animationSpeed: document.getElementById('animationSpeed') as HTMLSelectElement,
      colorTheme: document.getElementById('colorTheme') as HTMLSelectElement,
      backgroundTheme: document.getElementById('backgroundTheme') as HTMLSelectElement,
      blindfoldMode: document.getElementById('blindfoldMode') as HTMLInputElement,
      generateRandomBtn: document.getElementById('generateRandomBtn') as HTMLButtonElement,
    },

    // Rotation controls
    rotation: {
      rotateFront: document.getElementById('rotateFront') as HTMLButtonElement,
      rotateFrontPrime: document.getElementById('rotateFrontPrime') as HTMLButtonElement,
      rotateBack: document.getElementById('rotateBack') as HTMLButtonElement,
      rotateBackPrime: document.getElementById('rotateBackPrime') as HTMLButtonElement,
      rotateRight: document.getElementById('rotateRight') as HTMLButtonElement,
      rotateRightPrime: document.getElementById('rotateRightPrime') as HTMLButtonElement,
      rotateLeft: document.getElementById('rotateLeft') as HTMLButtonElement,
      rotateLeftPrime: document.getElementById('rotateLeftPrime') as HTMLButtonElement,
      rotateTop: document.getElementById('rotateTop') as HTMLButtonElement,
      rotateTopPrime: document.getElementById('rotateTopPrime') as HTMLButtonElement,
      rotateBottom: document.getElementById('rotateBottom') as HTMLButtonElement,
      rotateBottomPrime: document.getElementById('rotateBottomPrime') as HTMLButtonElement,
      rotateMiddle: document.getElementById('rotateMiddle') as HTMLButtonElement,
      rotateMiddlePrime: document.getElementById('rotateMiddlePrime') as HTMLButtonElement,
      rotateEquator: document.getElementById('rotateEquator') as HTMLButtonElement,
      rotateEquatorPrime: document.getElementById('rotateEquatorPrime') as HTMLButtonElement,
      rotateStanding: document.getElementById('rotateStanding') as HTMLButtonElement,
      rotateStandingPrime: document.getElementById('rotateStandingPrime') as HTMLButtonElement,
      rotateCubeX: document.getElementById('rotateCubeX') as HTMLButtonElement,
      rotateCubeXPrime: document.getElementById('rotateCubeXPrime') as HTMLButtonElement,
      rotateCubeY: document.getElementById('rotateCubeY') as HTMLButtonElement,
      rotateCubeYPrime: document.getElementById('rotateCubeYPrime') as HTMLButtonElement,
      rotateCubeZ: document.getElementById('rotateCubeZ') as HTMLButtonElement,
      rotateCubeZPrime: document.getElementById('rotateCubeZPrime') as HTMLButtonElement,
    },

    // Sequence Input
    sequence: {
      sequenceInput: document.getElementById('sequenceInput') as HTMLInputElement,
      executeSequenceBtn: document.getElementById('executeSequenceBtn') as HTMLButtonElement,
      sequenceFeedback: document.getElementById('sequenceFeedback') as HTMLElement,
    },

    // Notes
    notes: {
      noteTitle: document.getElementById('noteTitle') as HTMLInputElement,
      noteContent: document.getElementById('noteContent') as HTMLTextAreaElement,
      saveNoteBtn: document.getElementById('saveNoteBtn') as HTMLButtonElement,
      clearNoteBtn: document.getElementById('clearNoteBtn') as HTMLButtonElement,
      exportNotesBtn: document.getElementById('exportNotesBtn') as HTMLButtonElement,
      importNotesBtn: document.getElementById('importNotesBtn') as HTMLButtonElement,
      savedNotes: document.getElementById('savedNotes') as HTMLElement,
    },

    // Bottom Bar
    bottom: {
      soundToggle: document.getElementById('soundToggle') as HTMLButtonElement,
      fullscreenToggle: document.getElementById('fullscreenToggle') as HTMLButtonElement,
      saveScrambleBtn: document.getElementById('saveScrambleBtn') as HTMLButtonElement,
      loadScrambleBtn: document.getElementById('loadScrambleBtn') as HTMLButtonElement,
      tutorialBtn: document.getElementById('tutorialBtn') as HTMLButtonElement,
    },

    // Modal
    modal: {
      successModal: document.getElementById('successModal') as HTMLElement,
      modalCloseBtn: document.getElementById('modalCloseBtn') as HTMLButtonElement,
      solveTime: document.getElementById('solveTime') as HTMLElement,
      solveMoves: document.getElementById('solveMoves') as HTMLElement,
      tutorialModal: document.getElementById('tutorialModal') as HTMLElement,
      tutorialCloseBtn: document.getElementById('tutorialCloseBtn') as HTMLButtonElement,
      saveRecordWarningModal: document.getElementById('saveRecordWarningModal') as HTMLElement,
      saveRecordWarningCancelBtn: document.getElementById('saveRecordWarningCancelBtn') as HTMLButtonElement,
      saveRecordWarningContinueBtn: document.getElementById('saveRecordWarningContinueBtn') as HTMLButtonElement,
      customizeControlsModal: document.getElementById('customizeControlsModal') as HTMLElement,
      customizeControlsClose: document.getElementById('customizeControlsClose') as HTMLElement,
    },

    // Controls
    controls: {
      customizeControlsBtn: document.getElementById('customizeControlsBtn') as HTMLButtonElement,
      resetControlsBtn: document.getElementById('resetControlsBtn') as HTMLButtonElement,
      applyControlsBtn: document.getElementById('applyControlsBtn') as HTMLButtonElement,
      keyFront: document.getElementById('keyFront') as HTMLInputElement,
      keyBack: document.getElementById('keyBack') as HTMLInputElement,
      keyRight: document.getElementById('keyRight') as HTMLInputElement,
      keyLeft: document.getElementById('keyLeft') as HTMLInputElement,
      keyUp: document.getElementById('keyUp') as HTMLInputElement,
      keyDown: document.getElementById('keyDown') as HTMLInputElement,
      keyMiddle: document.getElementById('keyMiddle') as HTMLInputElement,
      keyEquator: document.getElementById('keyEquator') as HTMLInputElement,
      keyStanding: document.getElementById('keyStanding') as HTMLInputElement,
      keyCubeX: document.getElementById('keyCubeX') as HTMLInputElement,
      keyCubeY: document.getElementById('keyCubeY') as HTMLInputElement,
      keyCubeZ: document.getElementById('keyCubeZ') as HTMLInputElement,
      keyShift: document.getElementById('keyShift') as HTMLInputElement,
    },

    // Others
    floatingToggle: document.getElementById('floatingToggle') as HTMLElement,
    app: document.getElementById('app') as HTMLElement
  };

  constructor(cube: RubiksCube, sceneManager: SceneManager, inputManager?: InputManager) {
    this.cube = cube;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager || null;
    // Get keyboard controller from input manager if available
    if (this.inputManager) {
      this.keyboardController = this.inputManager.getKeyboardController()!;
    } else {
      // Fallback: create keyboard controller directly (for backward compatibility)
      this.keyboardController = new KeyboardController(cube, () => this.getSaveRecordEnabled(), () => this.getIsTimerRunning());
    }
    this.notificationSystem = new NotificationSystem();
    this.cubeStateManager = new CubeStateManager(cube);
    
    // Set sound callback for cube
    this.cube.soundEnabledCallback = () => this.soundEnabled;
    
    this.initializeEventListeners();
    this.initializeTheme();
    this.updateUI();
    this.loadSettings();
    this.loadNotesFromStorage();
    this.renderSavedNotes();
    
    // Update keyboard controller with loaded scramble steps
    // KeyboardController now uses callback to get scramble steps directly
    
    // Update keyboard controller with custom mappings
    this.updateKeyboardControllerMappings();
    
    // Set initial theme for CubeStateManager
    this.cubeStateManager.setColorTheme(this.currentColorTheme);
  }

  /**
   * Initialize all event listeners
   */
  private initializeEventListeners(): void {
    // Header controls
    this.elements.header.modeSelect.addEventListener('change', (e) => {
      this.handleModeChange((e.target as HTMLSelectElement).value as any);
    });
    
    this.elements.header.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Main controls
    this.elements.main.scrambleBtn.addEventListener('click', () => {
      this.handleScramble();
    });
    
    this.elements.main.resetBtn.addEventListener('click', () => {
      this.handleReset();
    });
    
    this.elements.main.solveBtn.addEventListener('click', () => {
      this.handleSolve();
    });
    
    this.elements.main.undoBtn.addEventListener('click', () => {
      this.handleUndo();
    });
    
    this.elements.main.redoBtn.addEventListener('click', () => {
      this.handleRedo();
    });
    
    this.elements.main.resetViewBtn.addEventListener('click', () => {
      this.handleResetView();
    });
    
    this.elements.main.toggleUIBtn.addEventListener('click', () => {
      this.toggleUI();
    });

    // Panel controls
    this.elements.panel.panelToggle.addEventListener('click', () => {
      this.togglePanel();
    });

    // Panel toggle collapsed (when sidebar is closed)
    this.elements.panel.panelToggleCollapsed.addEventListener('click', () => {
      this.togglePanel();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Timer controls
    this.elements.stats.timerToggle?.addEventListener('click', () => {
      this.toggleTimer();
    });

    // Scramble steps controls
    this.elements.options.scrambleSteps?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (value >= 1) {
        this._scrambleSteps = value;
        this.saveSettings();
      }
    });

    this.elements.options.scrambleSteps?.addEventListener('blur', (e) => {
      const input = e.target as HTMLInputElement;
      const value = parseInt(input.value);
      if (!input.value || input.value.trim() === '' || value < 1) {
        input.value = '25';
        this._scrambleSteps = 25;
        this.saveSettings();
      } else {
        // Check if we need to show warning when scramble steps become too low
        if (this.currentMode === 'timer' && value < 25) {
          this.showSaveRecordWarningModal();
        }
      }
    });

    // Check scramble steps when user presses Enter
    this.elements.options.scrambleSteps?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = e.target as HTMLInputElement;
        const value = parseInt(input.value);
        if (value >= 1 && this.currentMode === 'timer' && value < 25) {
          this.showSaveRecordWarningModal();
        }
        // Trigger blur to save the value
        input.blur();
      }
    });

    this.elements.options.resetScrambleSteps?.addEventListener('click', () => {
      this._scrambleSteps = 25;
      if (this.elements.options.scrambleSteps) {
        this.elements.options.scrambleSteps.value = '25';
      }
      this.saveSettings();
      // No need to show warning since we're resetting to 25
    });

    // Show clock option
    this.elements.options.showClock?.addEventListener('change', (e) => {
      this.showClock = (e.target as HTMLInputElement).checked;
      this.updateModeUI();
      this.saveSettings();
    });

    // Appearance controls
    this.elements.appearance.cubeSize.addEventListener('change', (e) => {
      const size = parseInt((e.target as HTMLSelectElement).value);
      this.handleCubeSizeChange(size);
    });
    
    this.elements.appearance.animationSpeed.addEventListener('change', (e) => {
      const speed = (e.target as HTMLSelectElement).value;
      this.handleAnimationSpeedChange(speed);
    });
    
    this.elements.appearance.colorTheme.addEventListener('change', (e) => {
      if (this.elements.appearance.blindfoldMode.checked) {
        // Prevent color theme change when blindfold mode is active
        this.notificationSystem.show('Cannot change color theme while Blindfold Mode is active. Please disable Blindfold Mode first.', 'error');
        // Reset to current value
        const currentTheme = this.elements.appearance.colorTheme.value;
        setTimeout(() => {
          this.elements.appearance.colorTheme.value = currentTheme;
        }, 0);
        return;
      }
      
      const theme = (e.target as HTMLSelectElement).value;
      this.handleColorThemeChange(theme);
    });
    
    this.elements.appearance.backgroundTheme.addEventListener('change', (e) => {
      if (this.elements.appearance.blindfoldMode.checked) {
        // Prevent background theme change when blindfold mode is active
        this.notificationSystem.show('Cannot change background theme while Blindfold Mode is active. Please disable Blindfold Mode first.', 'error');
        // Reset to current value
        const currentTheme = this.elements.appearance.backgroundTheme.value;
        setTimeout(() => {
          this.elements.appearance.backgroundTheme.value = currentTheme;
        }, 0);
        return;
      }
      
      const theme = (e.target as HTMLSelectElement).value;
      this.handleBackgroundThemeChange(theme);
    });
    
    this.elements.appearance.blindfoldMode.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.toggleBlindfoldMode(enabled);
    });

    // Generate new random colors button
    this.elements.appearance.generateRandomBtn.addEventListener('click', () => {
      if (this.elements.appearance.blindfoldMode.checked) {
        this.notificationSystem.show('Cannot generate random colors while Blindfold Mode is active. Please disable Blindfold Mode first.', 'error');
        return;
      }
      this.handleColorThemeChange('random');
    });

    // Controls
    this.elements.rotation.rotateFront?.addEventListener('click', async () => {
      await this.handleFaceRotation('FRONT', false);
    });
    
    this.elements.rotation.rotateFrontPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('FRONT', true);
    });
    
    this.elements.rotation.rotateBack?.addEventListener('click', async () => {
      await this.handleFaceRotation('BACK', true);
    });
    
    this.elements.rotation.rotateBackPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('BACK', false);
    });
    
    this.elements.rotation.rotateRight?.addEventListener('click', async () => {
      await this.handleFaceRotation('RIGHT', false);
    });
    
    this.elements.rotation.rotateRightPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('RIGHT', true);
    });
    
    this.elements.rotation.rotateLeft?.addEventListener('click', async () => {
      await this.handleFaceRotation('LEFT', true);
    });
    
    this.elements.rotation.rotateLeftPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('LEFT', false);
    });
    
    this.elements.rotation.rotateTop?.addEventListener('click', async () => {
      await this.handleFaceRotation('TOP', false);
    });
    
    this.elements.rotation.rotateTopPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('TOP', true);
    });
    
    this.elements.rotation.rotateBottom?.addEventListener('click', async () => {
      await this.handleFaceRotation('BOTTOM', true);
    });
    
    this.elements.rotation.rotateBottomPrime?.addEventListener('click', async () => {
      await this.handleFaceRotation('BOTTOM', false);
    });
    
    this.elements.rotation.rotateMiddle?.addEventListener('click', async () => {
      await this.handleMiddleRotation(true);
    });
    
    this.elements.rotation.rotateMiddlePrime?.addEventListener('click', async () => {
      await this.handleMiddleRotation(false);
    });
    
    this.elements.rotation.rotateEquator?.addEventListener('click', async () => {
      await this.handleEquatorRotation(true);
    });
    
    this.elements.rotation.rotateEquatorPrime?.addEventListener('click', async () => {
      await this.handleEquatorRotation(false);
    });
    
    this.elements.rotation.rotateStanding?.addEventListener('click', async () => {
      await this.handleStandingRotation(false);
    });
    
    this.elements.rotation.rotateStandingPrime?.addEventListener('click', async () => {
      await this.handleStandingRotation(true);
    });
    
    this.elements.rotation.rotateCubeX?.addEventListener('click', async () => {
      await this.cube.rotateCubeX(true);
    });
    
    this.elements.rotation.rotateCubeXPrime?.addEventListener('click', async () => {
      await this.cube.rotateCubeX(false);
    });
    
    this.elements.rotation.rotateCubeY?.addEventListener('click', async () => {
      await this.cube.rotateCubeY(true);
    });
    
    this.elements.rotation.rotateCubeYPrime?.addEventListener('click', async () => {
      await this.cube.rotateCubeY(false);
    });
    
    this.elements.rotation.rotateCubeZ?.addEventListener('click', async () => {
      await this.cube.rotateCubeZ(true);
    });
    
    this.elements.rotation.rotateCubeZPrime?.addEventListener('click', async () => {
      await this.cube.rotateCubeZ(false);
    });

    // Sequence Input
    this.elements.sequence.executeSequenceBtn?.addEventListener('click', () => {
      this.handleExecuteSequence();
    });

    this.elements.sequence.sequenceInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleExecuteSequence();
      }
    });

    // Note controls
    this.elements.notes.saveNoteBtn?.addEventListener('click', () => {
      this.handleSaveNote();
    });

    this.elements.notes.clearNoteBtn?.addEventListener('click', () => {
      this.handleClearNote();
    });

    this.elements.notes.exportNotesBtn?.addEventListener('click', () => {
      this.handleExportNotes();
    });

    this.elements.notes.importNotesBtn?.addEventListener('click', () => {
      this.handleImportNotes();
    });

    // Bottom bar controls
    this.elements.bottom.soundToggle.addEventListener('click', () => {
      this.toggleSound();
    });
    
    this.elements.bottom.fullscreenToggle.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Save and Load buttons
    this.elements.bottom.saveScrambleBtn.title = 'Export cube state to file (Ctrl+click to save to localStorage)';
    this.elements.bottom.saveScrambleBtn.addEventListener('click', (event) => {
      if (event.ctrlKey || event.shiftKey) {
        this.saveCubeState();
      } else {
        this.exportCubeState();
      }
    });

    this.elements.bottom.loadScrambleBtn.title = 'Import cube state from file (Ctrl+click to load from localStorage)';
    this.elements.bottom.loadScrambleBtn.addEventListener('click', (event) => {
      if (event.ctrlKey || event.shiftKey) {
        this.loadCubeState();
      } else {
        this.importCubeState();
      }
    });

    // Modal controls
    this.elements.modal.modalCloseBtn.addEventListener('click', () => {
      this.handleReset();
      this.hideSuccessModal();
    });

    // Tutorial modal controls
    this.elements.bottom.tutorialBtn.addEventListener('click', () => {
      this.showTutorialModal();
    });

    this.elements.modal.tutorialCloseBtn.addEventListener('click', () => {
      this.hideTutorialModal();
    });

    // Save record warning modal controls
    this.elements.modal.saveRecordWarningCancelBtn.addEventListener('click', () => {
      this.hideSaveRecordWarningModal();
      // Reset scramble steps to 25 when cancelled
      this._scrambleSteps = 25;
      if (this.elements.options.scrambleSteps) {
        this.elements.options.scrambleSteps.value = '25';
      }
      this.saveSettings();
    });

    this.elements.modal.saveRecordWarningContinueBtn.addEventListener('click', () => {
      this.hideSaveRecordWarningModal();
      // Continue with current scramble steps
    });

    // Customize Controls
    this.elements.controls.customizeControlsBtn.addEventListener('click', () => {
      this.showCustomizeControlsModal();
    });

    this.elements.modal.customizeControlsClose.addEventListener('click', () => {
      this.hideCustomizeControlsModal();
    });

    // Close modal when clicking outside
    this.elements.modal.customizeControlsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal.customizeControlsModal) {
        this.hideCustomizeControlsModal();
      }
    });

    this.elements.controls.resetControlsBtn.addEventListener('click', () => {
      this.resetControlsToDefault();
    });

    this.elements.controls.applyControlsBtn.addEventListener('click', () => {
      this.applyCustomControls();
    });

    // Add key input handlers for better UX
    const keyInputs = [
      this.elements.controls.keyFront,
      this.elements.controls.keyBack,
      this.elements.controls.keyRight,
      this.elements.controls.keyLeft,
      this.elements.controls.keyUp,
      this.elements.controls.keyDown,
      this.elements.controls.keyMiddle,
      this.elements.controls.keyEquator,
      this.elements.controls.keyStanding,
      this.elements.controls.keyCubeX,
      this.elements.controls.keyCubeY,
      this.elements.controls.keyCubeZ
    ];

    keyInputs.forEach(input => {
      // Add focus event to show instruction
      input.addEventListener('focus', () => {
        this.notificationSystem.show('Press any key to assign it to this control', 'info');
      });

      input.addEventListener('keydown', (e) => {
        e.preventDefault();

        // List of special keys to exclude
        const excludedKeys = [
          'Escape',
          'Meta', 'Alt', 'Control', 'Shift', 'CapsLock', 'Tab', 'Enter', 'Backspace',
          'NumLock', 'ScrollLock', 'Pause'
        ];

        // Skip excluded keys
        if (excludedKeys.includes(e.key)) {
          return;
        }

        // Accept various types of keys
        let keyValue = e.key;

        // Handle special cases
        if (e.key === ' ') {
          keyValue = 'SPACE';
        } else if (e.key.startsWith('Arrow')) {
          keyValue = e.key.replace('Arrow', '').toUpperCase(); // ArrowUp -> UP, etc.
        } else if (e.key.length === 1) {
          keyValue = e.key.toUpperCase();
        }

        input.value = keyValue;
      });
    });

    // Special handling for Shift input
    this.elements.controls.keyShift.addEventListener('focus', () => {
      this.notificationSystem.show('Press the Shift key to assign it for reverse rotations', 'info');
    });

    this.elements.controls.keyShift.addEventListener('keydown', (e) => {
      e.preventDefault();

      // Only accept Shift key for this input
      if (e.key === 'Shift') {
        this.elements.controls.keyShift.value = 'SHIFT';
      } else {
        this.notificationSystem.show('Only Shift key is allowed for this control', 'error');
      }
    });

    // Floating toggle
    this.elements.floatingToggle.addEventListener('click', () => {
      this.toggleUI();
    });

    // Global keyboard shortcuts disabled to prevent conflicts with cube rotation controls
    // document.addEventListener('keydown', (e) => {
    //   this.handleKeydown(e);
    // });

    // Middle-click for camera reset
    document.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        this.handleResetView();
      }
    });

    // Cube solve detection
    this.cube.onSolveComplete = () => {
      this.handleCubeSolved();
    };

    this.cube.onMove = () => {
      this.handleCubeMove();
    };
  }

  /**
   * Initialize theme
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('rubik-theme') as 'light' | 'dark' || 'light';
    this.theme = savedTheme;
    document.body.dataset.theme = this.theme;
    this.updateThemeIcon();
  }

  /**
   * Load saved settings
   */
  private loadSettings(): void {
    const settings = localStorage.getItem('rubik-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.soundEnabled = parsed.soundEnabled ?? true;
      this.panelCollapsed = parsed.panelCollapsed ?? false;
      this._scrambleSteps = parsed.scrambleSteps ?? 25;
      this.showClock = parsed.showClock ?? true;
      // Load custom key mappings
      this.customKeyMappings = parsed.customKeyMappings ?? this.customKeyMappings;
      
      // saveRecordEnabled is now determined by mode, not loaded from storage
      
      // Set scramble steps for keyboard controller
      // KeyboardController now uses callback to get scramble steps directly
      
      // Update scramble steps input value
      if (this.elements.options.scrambleSteps) {
        this.elements.options.scrambleSteps.value = this._scrambleSteps.toString();
      }
      
      // Update show clock checkbox
      if (this.elements.options.showClock) {
        this.elements.options.showClock.checked = this.showClock;
      }
      
      // Load appearance settings
      this.elements.appearance.colorTheme.value = parsed.colorTheme ?? 'classic';
      this.currentColorTheme = parsed.colorTheme ?? 'classic'; // Update current theme
      this.elements.appearance.backgroundTheme.value = parsed.backgroundTheme ?? 'dark';
      this.elements.appearance.animationSpeed.value = parsed.animationSpeed ?? 'normal';
      this.elements.appearance.blindfoldMode.checked = false; // Force to false
      
      if (this.panelCollapsed) {
        this.elements.panel.sidePanel.classList.add('collapsed');
        this.elements.app.classList.add('panel-collapsed');
      }
      
      // Apply loaded settings
      this.toggleBlindfoldMode(false);
      this.updateSoundIcon();
      this.handleColorThemeChange(this.elements.appearance.colorTheme.value);
      this.handleBackgroundThemeChange(this.elements.appearance.backgroundTheme.value);
      this.handleAnimationSpeedChange(this.elements.appearance.animationSpeed.value);
      this.updateModeUI();
      // Update keyboard controller with loaded mappings
      this.updateKeyboardControllerMappings();
    } else {
      // No saved settings, set defaults
      this.elements.appearance.blindfoldMode.checked = false;
      this.elements.appearance.colorTheme.value = 'classic';
      this.elements.appearance.backgroundTheme.value = 'dark';
      this.elements.appearance.animationSpeed.value = 'normal';
      this._scrambleSteps = 20;
      this.showClock = true;
      // saveRecordEnabled is set based on currentMode
      this.saveRecordEnabled = this.currentMode === 'timer';
      if (this.elements.options.showClock) {
        this.elements.options.showClock.checked = true;
      }
      this.toggleBlindfoldMode(false);
      this.updateModeUI();
    }

    // Update scramble steps input
    if (this.elements.options.scrambleSteps) {
      this.elements.options.scrambleSteps.value = this.scrambleSteps.toString();
    }

    // Load solve history
    const history = localStorage.getItem('rubik-history');
    if (history) {
      this.solveHistory = JSON.parse(history).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
      this.updateStatistics();
    }

    // Ensure saveRecordEnabled is set correctly based on current mode
    this.saveRecordEnabled = this.currentMode === 'timer';
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    const settings = {
      soundEnabled: this.soundEnabled,
      panelCollapsed: this.panelCollapsed,
      scrambleSteps: this._scrambleSteps,
      showClock: this.showClock,
      customKeyMappings: this.customKeyMappings,
      blindfoldMode: this.elements.appearance.blindfoldMode.checked,
      colorTheme: this.elements.appearance.colorTheme.value,
      backgroundTheme: this.elements.appearance.backgroundTheme.value,
      animationSpeed: this.elements.appearance.animationSpeed.value
    };
    localStorage.setItem('rubik-settings', JSON.stringify(settings));
    localStorage.setItem('rubik-theme', this.theme);
    localStorage.setItem('rubik-history', JSON.stringify(this.solveHistory));
  }

  /**
   * Handle mode change
   */
  private handleModeChange(mode: 'practice' | 'timer'): void {
    this.currentMode = mode;
    // Set saveRecordEnabled based on mode
    this.saveRecordEnabled = mode === 'timer';
    // Set showClock based on mode
    if (mode === 'timer') {
      this.showClock = true;
      // Reset scramble steps to 25 if less than 25 when entering timer mode
      if (this._scrambleSteps < 25) {
        this._scrambleSteps = 25;
        if (this.elements.options.scrambleSteps) {
          this.elements.options.scrambleSteps.value = '25';
        }
      }
    } else if (mode === 'practice') {
      // When switching to practice mode, set showClock based on the Show Timer checkbox
      // If checkbox doesn't exist or is not initialized, default to false
      this.showClock = this.elements.options.showClock ? this.elements.options.showClock.checked : false;
    }
    this.updateModeUI();
    this.saveSettings();
  }

  /**
   * Update UI based on current mode
   */
  private updateModeUI(): void {
    const timerSection = document.querySelector('.timer-section') as HTMLElement;
    
    if (timerSection) {
      timerSection.style.display = this.showClock ? 'flex' : 'none';
    }

    // Hide timer toggle button when save record is enabled
    if (this.elements.stats.timerToggle) {
      this.elements.stats.timerToggle.style.display = this.saveRecordEnabled ? 'none' : 'inline-flex';
    }

    // Hide autoTimer checkbox since it's now controlled by mode
    if (this.elements.options.autoTimer) {
      (this.elements.options.autoTimer.closest('.control-group') as HTMLElement)!.style.display = 'none';
    }

    // Hide showClock checkbox in timer mode
    if (this.elements.options.showClock) {
      (this.elements.options.showClock.closest('.control-group') as HTMLElement)!.style.display = this.currentMode === 'timer' ? 'none' : 'block';
      // Sync checkbox value with showClock when in practice mode
      if (this.currentMode === 'practice') {
        this.elements.options.showClock.checked = this.showClock;
      }
    }

    switch (this.currentMode) {
      case 'timer':
        this.elements.main.solveBtn.style.display = 'none';
        break;
      default:
        this.elements.main.solveBtn.style.display = 'inline-flex';
        this.elements.main.scrambleBtn.style.display = 'inline-flex';
        this.elements.main.solveBtn.innerHTML = '<i class="fas fa-magic"></i> Reversed';
        break;
    }

    // Switch to statistics tab when in timer mode
    if (this.currentMode === 'timer') {
      this.switchTab('statistics');
    }

    // Update reset button appearance
    this.updateResetButton();
  }

  private updateResetButton(): void {
    if (this.saveRecordEnabled && this.isTimerRunning) {
      // Change to "Stop and Reset" with stop icon and red color
      this.elements.main.resetBtn.innerHTML = '<i class="fas fa-stop"></i> Stop and Reset';
      this.elements.main.resetBtn.className = 'btn btn-secondary btn-danger';
    } else {
      // Reset to normal "Reset" button
      this.elements.main.resetBtn.innerHTML = '<i class="fas fa-undo"></i> Reset';
      this.elements.main.resetBtn.className = 'btn btn-secondary';
    }
  }

  /**
   * Toggle theme between light and dark
   */
  private toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = this.theme;
    this.updateThemeIcon();
    this.saveSettings();
  }

  /**
   * Update save record checkbox availability based on show clock setting
   */
  /**
   * Update theme icon
   */
  private updateThemeIcon(): void {
    const icon = this.elements.header.themeToggle.querySelector('i');
    if (icon) {
      icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  /**
   * Handle scramble
   */
  private async handleScramble(): Promise<void> {
    if (this.cube.isAnimating()) {
      this.notificationSystem.error('Cube is currently rotating. Please wait for the animation to complete.');
      return;
    }

    if (this.currentMode === 'timer' && this.isTimerRunning) {
      this.stopTimer();
    }
    
    await this.cube.scramble(this._scrambleSteps);
    this.playSound('scramble');
    this.notificationSystem.info('Cube scrambled!');
    
    // Auto start timer after scramble is complete in timer mode
    if (this.currentMode === 'timer' && !this.isTimerRunning) {
      this.startTimer();
    }

    // Switch to statistics tab if in timer mode and not already on statistics tab
    if (this.currentMode === 'timer') {
      const activeTab = document.querySelector('.tab-btn.active') as HTMLElement;
      if (activeTab && activeTab.dataset.tab !== 'statistics') {
        this.switchTab('statistics');
      }
    }
  }

  /**
   * Handle reset
   */
  private handleReset(): void {
    if (this.isTimerRunning) {
      this.stopTimer();
    }
    
    // Stop any ongoing animation before resetting
    this.cube.stopAnimation();
    
    this.cube.reset();
    this.moveCount = 0;
    this.updateMoveCounter();
    this.resetTimer();
    this.elements.appearance.blindfoldMode.checked = false;
    this.toggleBlindfoldMode(false);
    
    this.playSound('reset');
    this.notificationSystem.info('Cube reset to solved state');
  }

  /**
   * Handle keyboard scramble (space key)
   */
  public async handleKeyboardScramble(): Promise<void> {
    if (this.cube.isAnimating()) {
      return; // Don't show notification for keyboard input to avoid spam
    }

    if (this.currentMode === 'timer' && this.isTimerRunning) {
      this.stopTimer();
    }
    
    await this.cube.scramble(this._scrambleSteps);
    this.playSound('scramble');
    this.notificationSystem.info('Cube scrambled!');
    
    // Auto start timer after scramble is complete in timer mode
    if (this.currentMode === 'timer' && !this.isTimerRunning) {
      this.startTimer();
    }

    // Switch to statistics tab if in timer mode and not already on statistics tab
    if (this.currentMode === 'timer') {
      const activeTab = document.querySelector('.tab-btn.active') as HTMLElement;
      if (activeTab && activeTab.dataset.tab !== 'statistics') {
        this.switchTab('statistics');
      }
    }
  }

  /**
   * Handle solve
   */
  private handleSolve(): void {
    if (this.cube.isAnimating()) {
      this.notificationSystem.error('Cube is currently rotating. Please wait for the animation to complete.');
      return;
    }

    // Check if save record is enabled and timer is running
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.showNotification('Cannot auto-solve while timer is running in Save Record mode', 'error', 3000);
      return;
    }
    
    // Auto solve
    if (this.isTimerRunning) {
      this.stopTimer();
    }
    
    this.cube.solve();
    this.playSound('solve');
    this.notificationSystem.success('Cube auto-solved!');
  }

  /**
   * Handle reset camera view
   */
  private handleResetView(): void {
    this.sceneManager.resetCameraView();
    this.notificationSystem.info('Camera view reset');
  }

  /**
   * Handle sequence execution
   */
  private async handleExecuteSequence(): Promise<void> {
    // Check if save record is enabled and timer is running
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.showSequenceFeedback('Cannot execute sequence while timer is running in Save Record mode', 'error');
      return;
    }

    const sequence = this.elements.sequence.sequenceInput?.value.trim();
    if (!sequence) {
      this.showSequenceFeedback('Please enter a sequence', 'error');
      return;
    }

    // Parse and validate sequence
    const moves = this.parseSequence(sequence);
    if (!moves) {
      this.showSequenceFeedback('Invalid sequence syntax', 'error');
      return;
    }

    if (this.currentMode === 'timer' && this.isTimerRunning) {
      this.stopTimer();
    }

    try {
      this.showSequenceFeedback('Executing sequence...', 'success');
      
      // Execute moves sequentially
      let totalMovesExecuted = 0;
      for (const move of moves) {
        await this.executeMove(move);
        // Count the actual number of moves executed
        totalMovesExecuted += move.repetition || 1;
      }

      this.showSequenceFeedback(`Executed ${totalMovesExecuted} moves successfully!`, 'success');
      this.playSound('move');
    } catch (error) {
      this.showSequenceFeedback('Error executing sequence', 'error');
    }
  }

  /**
   * Parse sequence string into moves
   */
  private parseSequence(sequence: string): Array<{type: string, face?: string, clockwise: boolean, repetition?: number}> | null {
    const moves: Array<{type: string, face?: string, clockwise: boolean, double?: boolean}> = [];
    let processedSequence = sequence;

    // Replace grouped moves with repetition for both () and []
    processedSequence = processedSequence.replace(/\(\s*([^)]+)\s*\)(\d+)?/g, (_, group, rep) => {
      const repetition = rep ? parseInt(rep) : 1;
      const moves = group.trim();
      return (moves + ' ').repeat(repetition).trim();
    });

    processedSequence = processedSequence.replace(/\[\s*([^\]]+)\s*\](\d+)?/g, (_, group, rep) => {
      const repetition = rep ? parseInt(rep) : 1;
      const moves = group.trim();
      return (moves + ' ').repeat(repetition).trim();
    });

    const tokens = processedSequence.split(/\s+/);

    const validFaces = ['F', 'B', 'R', 'L', 'U', 'D'];
    const validMiddle = ['M', 'E', 'S'];
    const validCube = ['X', 'Y', 'Z'];

    // Check for empty sequence
    if (tokens.length === 0 || (tokens.length === 1 && !tokens[0])) {
      return null;
    }

    for (const token of tokens) {
      if (!token) continue;

      let isDoubleLayer = false;
      let baseToken = token;

      // Check for double layer notation (lowercase or uppercase + w)
      if (/^[rufbld]w?$/i.test(token.replace(/['\d]+$/, ''))) {
        const cleanToken = token.replace(/['\d]+$/, '');
        if (cleanToken.length === 1 && cleanToken === cleanToken.toLowerCase()) {
          // Lowercase letter (e.g., r, u)
          isDoubleLayer = true;
        } else if (cleanToken.length === 2 && cleanToken[1].toLowerCase() === 'w') {
          // Uppercase + w (e.g., Rw, Uw)
          isDoubleLayer = true;
        }
      }

      if (isDoubleLayer) {
        // Create a single double layer move
        const doubleMove = this.createDoubleLayerMove(token);
        if (!doubleMove) {
          return null; // Invalid double layer move
        }
        moves.push(doubleMove);
        continue;
      }

      // Process regular moves
      baseToken = baseToken.toUpperCase();

      // Validate token format using regex
      const validPattern = /^[FBRLUDMESXYZ]'?\d*'?$|^\d*'?\d*$/;
      if (!validPattern.test(baseToken)) {
        return null; // Invalid format
      }

      let move: any = {};
      let notation = baseToken;
      let repetition = 1;

      // Check for number
      const numberMatch = notation.match(/(\d+)/);
      if (numberMatch) {
        repetition = parseInt(numberMatch[1]);
        notation = notation.replace(/(\d+)/, '');
      }

      // Check for prime move (')
      if (notation.endsWith("'")) {
        move.clockwise = false;
        notation = notation.slice(0, -1);
      } else {
        move.clockwise = true;
      }

      move.repetition = repetition;

      // Determine move type
      if (validFaces.includes(notation)) {
        move.type = 'face';
        move.face = notation;
      } else if (validMiddle.includes(notation)) {
        move.type = 'middle';
        move.face = notation;
      } else if (validCube.includes(notation)) {
        move.type = 'cube';
        move.face = notation;
      } else {
        return null; // Invalid notation
      }

      moves.push(move);
    }

    return moves.length > 0 ? moves : null;
  }

  /**
   * Create a double layer move object
   */
  private createDoubleLayerMove(token: string): {type: string, face?: string, clockwise: boolean, repetition?: number} | null {
    // Extract base notation, prime, and repetition
    let baseNotation = token.replace(/['\d]+$/, '');
    const isPrime = token.includes("'");
    const numberMatch = token.match(/(\d+)'?$/);
    const repetition = numberMatch ? parseInt(numberMatch[1]) : 1;

    // Normalize base notation
    let face = '';
    if (baseNotation.length === 1) {
      // Lowercase (r, u, l, f, b, d)
      face = baseNotation.toUpperCase();
    } else if (baseNotation.length === 2 && baseNotation[1].toLowerCase() === 'w') {
      // Uppercase + w (Rw, Uw, etc.)
      face = baseNotation[0].toUpperCase();
    } else {
      return null; // Invalid
    }

    return {
      type: 'double',
      face: face,
      clockwise: !isPrime,
      repetition: repetition
    };
  }

  /**
   * Execute a single move
   */
  private async executeMove(move: {type: string, face?: string, clockwise: boolean, repetition?: number}): Promise<void> {
    if (move.type === 'double' && move.face) {
      // Handle double layer move with repetition
      const repetition = move.repetition || 1;
      const faceNotation = move.face.toLowerCase() + (move.clockwise ? '' : "'");

      // Determine middle notation
      let middleNotation = '';
      let middleClockwise = true;
      switch (move.face) {
        case 'R':
          middleNotation = 'm';
          middleClockwise = false; // M' for r
          break;
        case 'U':
          middleNotation = 'e';
          middleClockwise = false; // E' for u
          break;
        case 'L':
          middleNotation = 'm';
          middleClockwise = true; // M for l
          break;
        case 'F':
          middleNotation = 's';
          middleClockwise = true; // S for f
          break;
        case 'B':
          middleNotation = 's';
          middleClockwise = false; // S' for b
          break;
        case 'D':
          middleNotation = 'e';
          middleClockwise = true; // E for d
          break;
        default:
          throw new Error(`Unknown double face: ${move.face}`);
      }

      const middlePrime = move.clockwise ? (middleClockwise ? '' : "'") : (!middleClockwise ? '' : "'");
      const fullMiddleNotation = middleNotation + middlePrime;

      // Temporarily disable onMove to prevent double counting
      const originalOnMove = this.cube.onMove;
      this.cube.onMove = undefined;

      for (let i = 0; i < repetition; i++) {
        // Execute face move
        await this.keyboardController.executeMoveByNotation(faceNotation);

        // Execute middle move
        await this.keyboardController.executeMoveByNotation(fullMiddleNotation);
      }

      // Restore onMove
      this.cube.onMove = originalOnMove;

      // Manually increase moveCount by the repetition count
      this.moveCount += repetition;
      this.updateMoveCounter();
    } else {
      // Convert move to notation and use keyboard controller
      let notation = '';

      if (move.type === 'face' && move.face) {
        const faceMap: {[key: string]: string} = {
          'FRONT': 'f',
          'BACK': 'b',
          'RIGHT': 'r',
          'LEFT': 'l',
          'TOP': 'u',
          'BOTTOM': 'd'
        };
        notation = faceMap[move.face] || move.face.toLowerCase();
      } else if (move.type === 'middle') {
        if (move.face === 'E') {
          notation = 'e';
        } else if (move.face === 'S') {
          notation = 's';
        } else {
          notation = 'm';
        }
      } else if (move.type === 'cube' && move.face) {
        notation = move.face.toLowerCase();
      }

      if (!move.clockwise) {
        notation += "'";
      }

      // Temporarily disable onMove to prevent double counting
      const originalOnMove = this.cube.onMove;
      this.cube.onMove = undefined;

      if (move.repetition && move.repetition > 1) {
        notation += move.repetition.toString();
      }

      await this.keyboardController.executeMoveByNotation(notation);

      // Restore onMove
      this.cube.onMove = originalOnMove;

      // Manually increase moveCount by the repetition count
      const repetition = move.repetition || 1;
      this.moveCount += repetition;
      this.updateMoveCounter();
    }
  }

  /**
   * Show sequence feedback
   */
  private showSequenceFeedback(message: string, type: 'success' | 'error'): void {
    if (this.elements.sequence.sequenceFeedback) {
      this.elements.sequence.sequenceFeedback.textContent = message;
      this.elements.sequence.sequenceFeedback.className = `sequence-feedback ${type}`;
      
      // Clear feedback after 3 seconds for success messages
      if (type === 'success') {
        setTimeout(() => {
          if (this.elements.sequence.sequenceFeedback) {
            this.elements.sequence.sequenceFeedback.textContent = '';
            this.elements.sequence.sequenceFeedback.className = 'sequence-feedback';
          }
        }, 3000);
      }
    }
  }
  private async handleUndo(): Promise<void> {
    const success = await this.cube.undo();
    if (success) {
      this.moveCount = Math.max(0, this.moveCount - 1);
      this.updateMoveCounter();
    }
  }

  /**
   * Handle redo
   */
  private async handleRedo(): Promise<void> {
    const success = await this.cube.redo();
    if (success) {
      this.moveCount++;
      this.updateMoveCounter();
    }
  }

  /**
   * Toggle UI visibility
   */
  private toggleUI(): void {
    this.uiHidden = !this.uiHidden;
    
    if (this.uiHidden) {
      this.elements.app.classList.add('ui-hidden');
      // Floating toggle sẽ hiện thông qua CSS: #app.ui-hidden .floating-toggle
    } else {
      this.elements.app.classList.remove('ui-hidden');
    }
    
    this.saveSettings();
  }

  /**
   * Toggle side panel
   */
  private togglePanel(): void {
    this.panelCollapsed = !this.panelCollapsed;
    
    if (this.panelCollapsed) {
      this.elements.panel.sidePanel.classList.add('collapsed');
      this.elements.app.classList.add('panel-collapsed');
    } else {
      this.elements.panel.sidePanel.classList.remove('collapsed');
      this.elements.app.classList.remove('panel-collapsed');
    }
    
    // Update scene size immediately (ResizeObserver will handle the rest)
    this.sceneManager.updateSize();
    
    this.saveSettings();
  }

  /**
   * Public method to toggle panel (used by keyboard shortcuts)
   */
  public togglePanelPublic(): void {
    this.togglePanel();
  }

  /**
   * Switch tab in side panel
   */
  private switchTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const element = btn as HTMLElement;
      element.classList.toggle('active', element.dataset.tab === tabName);
    });
    
    // Update sections
    document.querySelectorAll('.panel-section').forEach(section => {
      const element = section as HTMLElement;
      element.classList.toggle('active', element.dataset.tab === tabName);
    });
  }

  /**
   * Timer functions
   */
  private startTimer(): void {
    this.timerStartTime = Date.now();
    this.isTimerRunning = true;
    
    this.timerInterval = window.setInterval(() => {
      this.updateTimerDisplay();
    }, 10);
    
    this.updateTimerToggleButton();
    this.updateButtonStatesForTimer();

    // Update reset button appearance
    this.updateResetButton();
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.isTimerRunning = false;
    
    this.updateTimerToggleButton();
    this.updateButtonStatesForTimer();

    // Update reset button appearance
    this.updateResetButton();
  }

  private resetTimer(): void {
    this.stopTimer();
    this.timerStartTime = 0;
    if (this.elements.stats.timerDisplay) {
      this.elements.stats.timerDisplay.textContent = '00:00.00';
    }
  }

  private toggleTimer(): void {
    if (this.isTimerRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  private updateTimerDisplay(): void {
    if (!this.isTimerRunning || !this.elements.stats.timerDisplay) return;
    
    const elapsed = Date.now() - this.timerStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const centiseconds = Math.floor((elapsed % 1000) / 10);
    
    this.elements.stats.timerDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  private updateTimerToggleButton(): void {
    if (!this.elements.stats.timerToggle) return;
    
    if (this.isTimerRunning) {
      this.elements.stats.timerToggle.textContent = 'Stop';
      this.elements.stats.timerToggle.className = 'btn btn-small btn-danger';
    } else {
      this.elements.stats.timerToggle.textContent = 'Start';
      this.elements.stats.timerToggle.className = 'btn btn-small btn-success';
    }
  }

  /**
   * Update button states based on timer running status in timer mode
   */
  private updateButtonStatesForTimer(): void {
    const isTimerMode = this.currentMode === 'timer';
    const shouldDisable = isTimerMode && this.isTimerRunning;
    
    // Disable/enable main control buttons
    if (this.elements.main.scrambleBtn) {
      this.elements.main.scrambleBtn.disabled = shouldDisable;
      this.elements.main.scrambleBtn.style.opacity = shouldDisable ? '0.5' : '1';
    }
    
    if (this.elements.main.undoBtn) {
      this.elements.main.undoBtn.disabled = shouldDisable;
      this.elements.main.undoBtn.style.opacity = shouldDisable ? '0.5' : '1';
    }
    
    if (this.elements.main.redoBtn) {
      this.elements.main.redoBtn.disabled = shouldDisable;
      this.elements.main.redoBtn.style.opacity = shouldDisable ? '0.5' : '1';
    }
    
    // Disable/enable bottom panel buttons
    if (this.elements.bottom?.loadScrambleBtn) {
      this.elements.bottom.loadScrambleBtn.disabled = shouldDisable;
      this.elements.bottom.loadScrambleBtn.style.opacity = shouldDisable ? '0.5' : '1';
    }
  }

  /**
   * Handle cube move
   */
  private handleCubeMove(): void {
    this.moveCount++;
    this.updateMoveCounter();
    
    this.playSound('move');
  }

  /**
   * Handle cube solved
   */
  private handleCubeSolved(): void {
    const solveTime = this.isTimerRunning ? Date.now() - this.timerStartTime : 0;
    
    // Auto stop timer if save record is enabled
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.stopTimer();
    } else if (this.isTimerRunning) {
      this.stopTimer();
    }
    
    // Record solve for timer mode or when save record is enabled (only if time > 0)
    if ((this.currentMode === 'timer' || this.saveRecordEnabled) && solveTime > 0) {
      this.solveHistory.push({
        time: solveTime,
        moves: this.moveCount,
        date: new Date()
      });
      
      // Keep only last 100 solves
      if (this.solveHistory.length > 100) {
        this.solveHistory = this.solveHistory.slice(-100);
      }
      
      this.updateStatistics();
    }
    
    // Show success modal for non-practice modes or when save record is enabled
    if (this.currentMode !== 'practice' || this.saveRecordEnabled) {
      this.showSuccessModal(solveTime, this.moveCount);
    }
    
    this.playSound('success');
    this.saveSettings();
    
    // Additional logic for different modes
    this.handleModeSpecificCompletion();
  }

  /**
   * Handle mode-specific completion logic
   */
  private handleModeSpecificCompletion(): void {
    switch (this.currentMode) {
      case 'timer':
        // Timer mode: show detailed statistics
        this.showTimerModeCompletion();
        break;
      case 'practice':
        // Practice mode: just show a simple notification
        this.notificationSystem.show('Cube solved! Keep practicing!', 'success');
        break;
    }
  }

  /**
   * Handle timer mode completion
   */
  private showTimerModeCompletion(): void {
    // Additional timer-specific logic can be added here
    // For now, the success modal already shows time and moves
  }

  /**
   * Show success modal
   */
  private showSuccessModal(time: number, moves: number): void {
    if (this.elements.modal.solveTime && time > 0) {
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      const centiseconds = Math.floor((time % 1000) / 10);
      this.elements.modal.solveTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    } else {
      this.elements.modal.solveTime.textContent = '--:--';
    }
    
    if (this.elements.modal.solveMoves) {
      this.elements.modal.solveMoves.textContent = moves.toString();
    }
    
    this.elements.modal.successModal.classList.add('show');
  }

  /**
   * Hide success modal
   */
  private hideSuccessModal(): void {
    this.elements.modal.successModal.classList.remove('show');
  }

  /**
   * Show tutorial modal
   */
  private showTutorialModal(): void {
    this.elements.modal.tutorialModal.classList.add('show');
  }

  /**
   * Hide tutorial modal
   */
  private hideTutorialModal(): void {
    this.elements.modal.tutorialModal.classList.remove('show');
  }

  /**
   * Show save record warning modal
   */
  private showSaveRecordWarningModal(): void {
    this.elements.modal.saveRecordWarningModal.classList.add('show');
  }

  /**
   * Hide save record warning modal
   */
  private hideSaveRecordWarningModal(): void {
    this.elements.modal.saveRecordWarningModal.classList.remove('show');
  }

  /**
   * Update move counter
   */
  private updateMoveCounter(): void {
    if (this.elements.stats.moveCounter) {
      this.elements.stats.moveCounter.textContent = this.moveCount.toString();
    }
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    if (this.solveHistory.length === 0) return;
    
    const times = this.solveHistory.map(solve => solve.time);
    const bestTime = Math.min(...times);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const last5Times = times.slice(-5);
    
    // Update best time
    if (this.elements.stats.bestTime) {
      const minutes = Math.floor(bestTime / 60000);
      const seconds = Math.floor((bestTime % 60000) / 1000);
      const centiseconds = Math.floor((bestTime % 1000) / 10);
      this.elements.stats.bestTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    // Update average time
    if (this.elements.stats.averageTime) {
      const minutes = Math.floor(averageTime / 60000);
      const seconds = Math.floor((averageTime % 60000) / 1000);
      const centiseconds = Math.floor((averageTime % 1000) / 10);
      this.elements.stats.averageTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    // Update last 5 times
    if (this.elements.stats.lastTimes) {
      const last5Formatted = last5Times.map(time => {
        const seconds = Math.floor((time % 60000) / 1000);
        const centiseconds = Math.floor((time % 1000) / 10);
        return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
      }).join(', ');
      this.elements.stats.lastTimes.textContent = last5Formatted;
    }
  }

  /**
   * Handle appearance settings
   */
  private handleCubeSizeChange(_size: number): void {
    this.notificationSystem.show('Cube size change not yet implemented', 'info');
  }

  private handleAnimationSpeedChange(speed: string): void {
    switch (speed) {
      case 'slow':
        CUBE_CONFIG.animation.transitionDuration = 800;
        break;
      case 'normal':
        CUBE_CONFIG.animation.transitionDuration = 500;
        break;
      case 'fast':
        CUBE_CONFIG.animation.transitionDuration = 300;
        break;
      case 'ultra':
        CUBE_CONFIG.animation.transitionDuration = 100;
        break;
      case 'robot':
        CUBE_CONFIG.animation.transitionDuration = 0;
        break;
    }
    this.saveSettings();
  }

  private handleColorThemeChange(theme: string): void {
    this.currentColorTheme = theme; // Store current theme
    
    // Update CubeStateManager with current theme
    this.cubeStateManager.setColorTheme(theme);
    
    let colors: typeof CUBE_CONFIG.colors;
    
    if (theme === 'random') {
      colors = this.generateRandomColors();
      // Show the generate random button when random theme is selected
      this.elements.appearance.generateRandomBtn.style.display = 'block';
    } else {
      colors = this.colorThemes[theme as keyof typeof this.colorThemes];
      // Hide the generate random button for other themes
      this.elements.appearance.generateRandomBtn.style.display = 'none';
    }
    
    if (colors) {
      this.cube.updateColors(colors);
      this.saveSettings();
    }
  }

  private handleBackgroundThemeChange(theme: string): void {
    this.sceneManager.updateBackground(theme);
    this.saveSettings();
  }

  private toggleBlindfoldMode(enabled: boolean): void {
    this.blindfoldModeEnabled = enabled;
    
    if (enabled) {
      this.cube.setBlindfoldMode(true);
      // Disable theme selections
      this.elements.appearance.colorTheme.disabled = true;
      this.elements.appearance.colorTheme.style.opacity = '0.5';
      this.elements.appearance.colorTheme.style.cursor = 'not-allowed';
      this.elements.appearance.backgroundTheme.disabled = true;
      this.elements.appearance.backgroundTheme.style.opacity = '0.5';
      this.elements.appearance.backgroundTheme.style.cursor = 'not-allowed';
      this.elements.appearance.generateRandomBtn.disabled = true;
      this.elements.appearance.generateRandomBtn.style.opacity = '0.5';
      this.elements.appearance.generateRandomBtn.style.cursor = 'not-allowed';
    } else {
      this.cube.setBlindfoldMode(false);
      // Enable theme selections
      this.elements.appearance.colorTheme.disabled = false;
      this.elements.appearance.colorTheme.style.opacity = '1';
      this.elements.appearance.colorTheme.style.cursor = 'pointer';
      this.elements.appearance.backgroundTheme.disabled = false;
      this.elements.appearance.backgroundTheme.style.opacity = '1';
      this.elements.appearance.backgroundTheme.style.cursor = 'pointer';
      this.elements.appearance.generateRandomBtn.disabled = false;
      this.elements.appearance.generateRandomBtn.style.opacity = '1';
      this.elements.appearance.generateRandomBtn.style.cursor = 'pointer';

      // Re-apply visibility based on current theme
      const currentTheme = this.elements.appearance.colorTheme.value;
      if (currentTheme === 'random') {
        this.elements.appearance.generateRandomBtn.style.display = 'block';
      } else {
        this.elements.appearance.generateRandomBtn.style.display = 'none';
      }
    }
  }

  /**
   * Handle bottom bar controls
   */
  private toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.updateSoundIcon();
    this.saveSettings();
  }

  private updateSoundIcon(): void {
    const icon = this.elements.bottom.soundToggle.querySelector('i');
    if (icon) {
      icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  /**
   * Play sound effect
   */
  private playSound(_type: 'move' | 'scramble' | 'reset' | 'solve' | 'success'): void {
    if (!this.soundEnabled) return;
    
  }

  /**
   * Update UI state
   */
  public updateUI(): void {
    this.updateMoveCounter();
    this.updateTimerDisplay();
    this.updateStatistics();
    this.updateModeUI();
    this.updateTimerToggleButton();
    this.updateButtonStatesForTimer();
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.notificationSystem.dispose();
    this.saveSettings();
  }

  /**
   * Generate 6 unique random colors for cube faces
   */
  private generateRandomColors(): typeof CUBE_CONFIG.colors {
    const colors: string[] = [];
    const usedColors = new Set<string>();

    // Generate 6 unique colors
    while (colors.length < 6) {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
      const lightness = 40 + Math.floor(Math.random() * 20); // 40-60%
      
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // Ensure uniqueness by checking if color is already used
      if (!usedColors.has(color)) {
        colors.push(color);
        usedColors.add(color);
      }
    }

    return {
      front: colors[0],
      back: colors[1],
      left: colors[2],
      right: colors[3],
      top: colors[4],
      bottom: colors[5]
    };
  }

  /**
   * Helper method to handle face rotation with error handling
   */
  private async handleFaceRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      await this.cube.rotateFace(face, clockwise);
    } catch (error) {
    }
  }

  /**
   * Helper method to handle middle layer rotation with error handling
   */
  private async handleMiddleRotation(clockwise: boolean): Promise<void> {
    try {
      await this.cube.rotateMiddle(clockwise);
    } catch (error) {
    }
  }

  /**
   * Helper method to handle equator rotation with error handling
   */
  private async handleEquatorRotation(clockwise: boolean): Promise<void> {
    try {
      await this.cube.rotateEquator(clockwise);
    } catch (error) {
    }
  }

  /**
   * Save current cube state
   */
  private saveCubeState(): void {
    try {
      this.cubeStateManager.saveToLocalStorage();
      this.notificationSystem.show('Cube state saved successfully!', 'success');
    } catch (error) {
      this.notificationSystem.show('Failed to save cube state.', 'error');
    }
  }

  /**
   * Load cube state
   */
  private loadCubeState(): void {
    // Check if save record is enabled and timer is running
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.showNotification('Cannot load cube state while timer is running in Save Record mode', 'error', 3000);
      return;
    }

    if (!this.cubeStateManager.hasSavedState()) {
      this.notificationSystem.show('No saved cube state found.', 'info');
      return;
    }

    try {
      const success = this.cubeStateManager.loadFromLocalStorage();
      if (success) {
        this.notificationSystem.show('Cube state loaded successfully!', 'success');
        // Reset move count when loading a state
        this.moveCount = 0;
        this.updateUI();
      } else {
        this.notificationSystem.show('Failed to load cube state.', 'error');
      }
    } catch (error) {
      this.notificationSystem.show('Failed to load cube state.', 'error');
    }
  }

  /**
   * Export cube state to file
   */
  private exportCubeState(): void {
    try {
      this.cubeStateManager.exportToFile();
      this.notificationSystem.show('Cube state exported successfully!', 'success');
    } catch (error) {
      this.notificationSystem.show('Failed to export cube state.', 'error');
    }
  }

  /**
   * Import cube state from file
   */
  private importCubeState(): void {
    // Check if save record is enabled and timer is running
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.showNotification('Cannot import cube state while timer is running in Save Record mode', 'error', 3000);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.cubeStateManager.importFromFile(file)
          .then(() => {
            this.notificationSystem.show('Cube state imported successfully!', 'success');
            // Reset move count when importing a state
            this.moveCount = 0;
            this.updateUI();
          })
          .catch((error) => {
            this.notificationSystem.show('Failed to import cube state: ' + error.message, 'error');
          });
      }
    };
    input.click();
  }

  /**
   * Helper method to handle standing rotation with error handling
   */
  private async handleStandingRotation(clockwise: boolean): Promise<void> {
    try {
      await this.cube.rotateStanding(clockwise);
    } catch (error) {
    }
  }

  /**
   * Handle save note
   */
  private handleSaveNote(): void {
    const title = this.elements.notes.noteTitle?.value.trim();
    const content = this.elements.notes.noteContent?.value.trim();

    if (!title || !content) {
      this.notificationSystem.show('Please enter both title and content for the note.', 'error');
      return;
    }

    const note = {
      id: Date.now().toString(),
      title,
      content,
      date: new Date()
    };

    this.savedNotes.unshift(note); // Add to beginning of array

    // Keep only last 50 notes
    if (this.savedNotes.length > 50) {
      this.savedNotes = this.savedNotes.slice(0, 50);
    }

    this.saveNotesToStorage();
    this.renderSavedNotes();
    this.clearNoteForm();

    this.notificationSystem.show('Note saved successfully!', 'success');
  }

  /**
   * Handle clear note
   */
  private handleClearNote(): void {
    this.clearNoteForm();
  }

  /**
   * Clear note form
   */
  private clearNoteForm(): void {
    if (this.elements.notes.noteTitle) {
      this.elements.notes.noteTitle.value = '';
    }
    if (this.elements.notes.noteContent) {
      this.elements.notes.noteContent.value = '';
    }
  }

  /**
   * Save notes to localStorage
   */
  private saveNotesToStorage(): void {
    localStorage.setItem('rubik-notes', JSON.stringify(this.savedNotes));
  }

  /**
   * Load notes from localStorage
   */
  private loadNotesFromStorage(): void {
    const notes = localStorage.getItem('rubik-notes');
    if (notes) {
      this.savedNotes = JSON.parse(notes).map((note: any) => ({
        ...note,
        date: new Date(note.date)
      }));
    }
  }

  /**
   * Render saved notes
   */
  private renderSavedNotes(): void {
    if (!this.elements.notes.savedNotes) return;

    this.elements.notes.savedNotes.innerHTML = '';

    if (this.savedNotes.length === 0) {
      this.elements.notes.savedNotes.innerHTML = '<p style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 40px 20px;">No saved notes yet. Add your first formula below!</p>';
      return;
    }

    this.savedNotes.forEach(note => {
      const noteElement = document.createElement('div');
      noteElement.className = 'saved-note-item';

      const titleElement = document.createElement('div');
      titleElement.className = 'saved-note-title';

      const titleText = document.createElement('span');
      titleText.textContent = note.title;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-note-btn';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = () => this.deleteNote(note.id);

      titleElement.appendChild(titleText);
      titleElement.appendChild(deleteBtn);

      const contentElement = document.createElement('div');
      contentElement.className = 'saved-note-content';
      contentElement.textContent = note.content;

      noteElement.appendChild(titleElement);
      noteElement.appendChild(contentElement);

      this.elements.notes.savedNotes.appendChild(noteElement);
    });
  }

  /**
   * Delete a note
   */
  private deleteNote(noteId: string): void {
    this.savedNotes = this.savedNotes.filter(note => note.id !== noteId);
    this.saveNotesToStorage();
    this.renderSavedNotes();
    this.notificationSystem.show('Note deleted successfully!', 'success');
  }

  /**
   * Handle export notes
   */
  private handleExportNotes(): void {
    if (this.savedNotes.length === 0) {
      this.notificationSystem.show('No notes to export.', 'info');
      return;
    }

    try {
      const dataStr = JSON.stringify(this.savedNotes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      link.download = `rubik-notes-${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.notificationSystem.show('Notes exported successfully!', 'success');
    } catch (error) {
      this.notificationSystem.show('Failed to export notes.', 'error');
    }
  }

  /**
   * Handle import notes
   */
  private handleImportNotes(): void {
    // Check if save record is enabled and timer is running
    if (this.saveRecordEnabled && this.isTimerRunning) {
      this.showNotification('Cannot import notes while timer is running in Save Record mode', 'error', 3000);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedNotes = JSON.parse(content);

          if (!Array.isArray(importedNotes)) {
            throw new Error('Invalid file format');
          }

          // Validate structure
          const validNotes = importedNotes.filter(note =>
            note.id && note.title && note.content && note.date
          ).map(note => ({
            ...note,
            date: new Date(note.date)
          }));

          if (validNotes.length === 0) {
            throw new Error('No valid notes found in file');
          }

          // Ask user if they want to replace or merge
          const shouldReplace = confirm(
            `Found ${validNotes.length} notes in file. Do you want to replace all current notes? Click OK to replace, Cancel to merge.`
          );

          if (shouldReplace) {
            this.savedNotes = validNotes;
          } else {
            // Merge notes, avoid duplicates by title
            const existingTitles = new Set(this.savedNotes.map(note => note.title));
            const newNotes = validNotes.filter(note => !existingTitles.has(note.title));
            this.savedNotes.unshift(...newNotes);
          }

          // Keep only last 50 notes
          if (this.savedNotes.length > 50) {
            this.savedNotes = this.savedNotes.slice(0, 50);
          }

          this.saveNotesToStorage();
          this.renderSavedNotes();
          this.notificationSystem.show(`Successfully imported ${validNotes.length} notes!`, 'success');

        } catch (error) {
          this.notificationSystem.show('Failed to import notes. Please check the file format.', 'error');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }

  /**
   * Show a notification message
   */
  public showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    this.notificationSystem.show(message, type, duration);
  }

  /**
   * Show customize controls modal
   */
  private showCustomizeControlsModal(): void {
    // Load current mappings into inputs
    this.elements.controls.keyFront.value = this.customKeyMappings.front.toUpperCase();
    this.elements.controls.keyBack.value = this.customKeyMappings.back.toUpperCase();
    this.elements.controls.keyRight.value = this.customKeyMappings.right.toUpperCase();
    this.elements.controls.keyLeft.value = this.customKeyMappings.left.toUpperCase();
    this.elements.controls.keyUp.value = this.customKeyMappings.up.toUpperCase();
    this.elements.controls.keyDown.value = this.customKeyMappings.down.toUpperCase();
    this.elements.controls.keyMiddle.value = this.customKeyMappings.middle.toUpperCase();
    this.elements.controls.keyEquator.value = this.customKeyMappings.equator.toUpperCase();
    this.elements.controls.keyStanding.value = this.customKeyMappings.standing.toUpperCase();
    this.elements.controls.keyCubeX.value = this.customKeyMappings.cubeX.toUpperCase();
    this.elements.controls.keyCubeY.value = this.customKeyMappings.cubeY.toUpperCase();
    this.elements.controls.keyCubeZ.value = this.customKeyMappings.cubeZ.toUpperCase();
    this.elements.controls.keyShift.value = 'SHIFT';

    this.elements.modal.customizeControlsModal.classList.add('show');
  }

  /**
   * Hide customize controls modal
   */
  private hideCustomizeControlsModal(): void {
    this.elements.modal.customizeControlsModal.classList.remove('show');
  }

  /**
   * Reset controls to default
   */
  private resetControlsToDefault(): void {
    this.customKeyMappings = {
      front: 'F',
      back: 'B',
      right: 'R',
      left: 'L',
      up: 'U',
      down: 'D',
      middle: 'M',
      equator: 'E',
      standing: 'S',
      cubeX: 'X',
      cubeY: 'Y',
      cubeZ: 'Z',
      shift: 'SHIFT'
    };

    // Update inputs
    this.elements.controls.keyFront.value = 'F';
    this.elements.controls.keyBack.value = 'B';
    this.elements.controls.keyRight.value = 'R';
    this.elements.controls.keyLeft.value = 'L';
    this.elements.controls.keyUp.value = 'U';
    this.elements.controls.keyDown.value = 'D';
    this.elements.controls.keyMiddle.value = 'M';
    this.elements.controls.keyEquator.value = 'E';
    this.elements.controls.keyStanding.value = 'S';
    this.elements.controls.keyCubeX.value = 'X';
    this.elements.controls.keyCubeY.value = 'Y';
    this.elements.controls.keyCubeZ.value = 'Z';
    this.elements.controls.keyShift.value = 'SHIFT';

    this.saveSettings();
    this.notificationSystem.show('Controls reset to default!', 'success');
    
    // Apply the reset controls
    this.applyCustomControls();
  }

  /**
   * Apply custom controls
   */
  private applyCustomControls(): void {
    // Get values from inputs
    const newMappings = {
      front: this.elements.controls.keyFront.value.toLowerCase(),
      back: this.elements.controls.keyBack.value.toLowerCase(),
      right: this.elements.controls.keyRight.value.toLowerCase(),
      left: this.elements.controls.keyLeft.value.toLowerCase(),
      up: this.elements.controls.keyUp.value.toLowerCase(),
      down: this.elements.controls.keyDown.value.toLowerCase(),
      middle: this.elements.controls.keyMiddle.value.toLowerCase(),
      equator: this.elements.controls.keyEquator.value.toLowerCase(),
      standing: this.elements.controls.keyStanding.value.toLowerCase(),
      cubeX: this.elements.controls.keyCubeX.value.toLowerCase(),
      cubeY: this.elements.controls.keyCubeY.value.toLowerCase(),
      cubeZ: this.elements.controls.keyCubeZ.value.toLowerCase(),
      shift: this.elements.controls.keyShift.value
    };

    // Check for duplicates
    const values = Object.values(newMappings);
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    
    if (duplicates.length > 0) {
      this.notificationSystem.show(`Duplicate keys detected: ${duplicates.join(', ')}. Please use unique keys.`, 'error');
      return;
    }

    // Apply mappings
    this.customKeyMappings = newMappings;

    // Update keyboard controller with new mappings
    this.updateKeyboardControllerMappings();

    // Update display to show uppercase
    this.elements.controls.keyFront.value = this.elements.controls.keyFront.value.toUpperCase();
    this.elements.controls.keyBack.value = this.elements.controls.keyBack.value.toUpperCase();
    this.elements.controls.keyRight.value = this.elements.controls.keyRight.value.toUpperCase();
    this.elements.controls.keyLeft.value = this.elements.controls.keyLeft.value.toUpperCase();
    this.elements.controls.keyUp.value = this.elements.controls.keyUp.value.toUpperCase();
    this.elements.controls.keyDown.value = this.elements.controls.keyDown.value.toUpperCase();
    this.elements.controls.keyMiddle.value = this.elements.controls.keyMiddle.value.toUpperCase();
    this.elements.controls.keyEquator.value = this.elements.controls.keyEquator.value.toUpperCase();
    this.elements.controls.keyStanding.value = this.elements.controls.keyStanding.value.toUpperCase();
    this.elements.controls.keyCubeX.value = this.elements.controls.keyCubeX.value.toUpperCase();
    this.elements.controls.keyCubeY.value = this.elements.controls.keyCubeY.value.toUpperCase();
    this.elements.controls.keyCubeZ.value = this.elements.controls.keyCubeZ.value.toUpperCase();
    this.elements.controls.keyShift.value = 'SHIFT';

    this.saveSettings();
    this.hideCustomizeControlsModal();
    this.notificationSystem.show('Custom controls applied successfully!', 'success');
  }

  /**
   * Update keyboard controller with custom mappings
   */
  private updateKeyboardControllerMappings(): void {
    this.keyboardController.setKeyMappings(this.customKeyMappings);
  }
}
