import { RubiksCube } from '../core/RubiksCube';
import { NotificationSystem } from '../utils/NotificationSystem';
import { SceneManager } from '../core/SceneManager';
import { KeyboardController, InputManager } from './InputManager';
import { CubeStateManager } from '../services/CubeStateManager';
import { CUBE_CONFIG } from '../config/constants';
import { CubeTypeManager } from '../managers/CubeTypeManager';
import { CubeConfigurationFactory } from '../config/CubeConfigurationFactory';
import { ColorThemeManager } from '../managers/ColorThemeManager';

export class UIController {
  private cube: RubiksCube;
  private sceneManager: SceneManager;
  private keyboardController: KeyboardController;
  private cubeTypeManager: CubeTypeManager;
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

  public get scrambleSteps(): number {
    return this._scrambleSteps;
  }

  public getBlindfoldMode(): boolean {
    return this.blindfoldModeEnabled;
  }

  public getSaveRecordEnabled(): boolean {
    return this.saveRecordEnabled;
  }

  public getIsTimerRunning(): boolean {
    return this.isTimerRunning;
  }

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

    panel: {
      sidePanel: document.getElementById('sidePanel') as HTMLElement,
      panelToggle: document.getElementById('panelToggle') as HTMLElement,
      panelToggleCollapsed: document.getElementById('panelToggleCollapsed') as HTMLElement,
    },

    stats: {
      timerDisplay: document.getElementById('timerDisplay') as HTMLElement,
      timerToggle: document.getElementById('timerToggle') as HTMLButtonElement,
      moveCounter: document.getElementById('moveCounter') as HTMLElement,
      bestTime: document.getElementById('bestTime') as HTMLElement,
      averageTime: document.getElementById('averageTime') as HTMLElement,
      lastTimes: document.getElementById('lastTimes') as HTMLElement,
    },

    options: {
      scrambleSteps: document.getElementById('scrambleSteps') as HTMLInputElement,
      resetScrambleSteps: document.getElementById('resetScrambleSteps') as HTMLButtonElement,
      showClock: document.getElementById('showClock') as HTMLInputElement,
      autoTimer: document.getElementById('autoTimer') as HTMLInputElement,
    },

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
      
      // Inner slice rotation buttons (2nd layer - for 4x4x4, 5x5x5, 6x6x6)
      rotateInnerFront: document.getElementById('rotateInnerFront') as HTMLButtonElement,
      rotateInnerFrontPrime: document.getElementById('rotateInnerFrontPrime') as HTMLButtonElement,
      rotateInnerBack: document.getElementById('rotateInnerBack') as HTMLButtonElement,
      rotateInnerBackPrime: document.getElementById('rotateInnerBackPrime') as HTMLButtonElement,
      rotateInnerRight: document.getElementById('rotateInnerRight') as HTMLButtonElement,
      rotateInnerRightPrime: document.getElementById('rotateInnerRightPrime') as HTMLButtonElement,
      rotateInnerLeft: document.getElementById('rotateInnerLeft') as HTMLButtonElement,
      rotateInnerLeftPrime: document.getElementById('rotateInnerLeftPrime') as HTMLButtonElement,
      rotateInnerTop: document.getElementById('rotateInnerTop') as HTMLButtonElement,
      rotateInnerTopPrime: document.getElementById('rotateInnerTopPrime') as HTMLButtonElement,
      rotateInnerBottom: document.getElementById('rotateInnerBottom') as HTMLButtonElement,
      rotateInnerBottomPrime: document.getElementById('rotateInnerBottomPrime') as HTMLButtonElement,
      
      // Third layer rotation buttons (3rd layer - for 6x6x6 and 10x10x10)
      rotateThirdFront: document.getElementById('rotateThirdFront') as HTMLButtonElement,
      rotateThirdFrontPrime: document.getElementById('rotateThirdFrontPrime') as HTMLButtonElement,
      rotateThirdBack: document.getElementById('rotateThirdBack') as HTMLButtonElement,
      rotateThirdBackPrime: document.getElementById('rotateThirdBackPrime') as HTMLButtonElement,
      rotateThirdRight: document.getElementById('rotateThirdRight') as HTMLButtonElement,
      rotateThirdRightPrime: document.getElementById('rotateThirdRightPrime') as HTMLButtonElement,
      rotateThirdLeft: document.getElementById('rotateThirdLeft') as HTMLButtonElement,
      rotateThirdLeftPrime: document.getElementById('rotateThirdLeftPrime') as HTMLButtonElement,
      rotateThirdTop: document.getElementById('rotateThirdTop') as HTMLButtonElement,
      rotateThirdTopPrime: document.getElementById('rotateThirdTopPrime') as HTMLButtonElement,
      rotateThirdBottom: document.getElementById('rotateThirdBottom') as HTMLButtonElement,
      rotateThirdBottomPrime: document.getElementById('rotateThirdBottomPrime') as HTMLButtonElement,
      
      // Fourth layer rotation buttons (4th layer - for 10x10x10 only)
      rotateFourthFront: document.getElementById('rotateFourthFront') as HTMLButtonElement,
      rotateFourthFrontPrime: document.getElementById('rotateFourthFrontPrime') as HTMLButtonElement,
      rotateFourthBack: document.getElementById('rotateFourthBack') as HTMLButtonElement,
      rotateFourthBackPrime: document.getElementById('rotateFourthBackPrime') as HTMLButtonElement,
      rotateFourthRight: document.getElementById('rotateFourthRight') as HTMLButtonElement,
      rotateFourthRightPrime: document.getElementById('rotateFourthRightPrime') as HTMLButtonElement,
      rotateFourthLeft: document.getElementById('rotateFourthLeft') as HTMLButtonElement,
      rotateFourthLeftPrime: document.getElementById('rotateFourthLeftPrime') as HTMLButtonElement,
      rotateFourthTop: document.getElementById('rotateFourthTop') as HTMLButtonElement,
      rotateFourthTopPrime: document.getElementById('rotateFourthTopPrime') as HTMLButtonElement,
      rotateFourthBottom: document.getElementById('rotateFourthBottom') as HTMLButtonElement,
      rotateFourthBottomPrime: document.getElementById('rotateFourthBottomPrime') as HTMLButtonElement,
      
      // Fifth layer rotation buttons (5th layer - for 10x10x10 only)
      rotateFifthFront: document.getElementById('rotateFifthFront') as HTMLButtonElement,
      rotateFifthFrontPrime: document.getElementById('rotateFifthFrontPrime') as HTMLButtonElement,
      rotateFifthBack: document.getElementById('rotateFifthBack') as HTMLButtonElement,
      rotateFifthBackPrime: document.getElementById('rotateFifthBackPrime') as HTMLButtonElement,
      rotateFifthRight: document.getElementById('rotateFifthRight') as HTMLButtonElement,
      rotateFifthRightPrime: document.getElementById('rotateFifthRightPrime') as HTMLButtonElement,
      rotateFifthLeft: document.getElementById('rotateFifthLeft') as HTMLButtonElement,
      rotateFifthLeftPrime: document.getElementById('rotateFifthLeftPrime') as HTMLButtonElement,
      rotateFifthTop: document.getElementById('rotateFifthTop') as HTMLButtonElement,
      rotateFifthTopPrime: document.getElementById('rotateFifthTopPrime') as HTMLButtonElement,
      rotateFifthBottom: document.getElementById('rotateFifthBottom') as HTMLButtonElement,
      rotateFifthBottomPrime: document.getElementById('rotateFifthBottomPrime') as HTMLButtonElement,
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
    this.cubeTypeManager = CubeTypeManager.getInstance();
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
    
    // Initialize CubeTypeManager
    this.cubeTypeManager.initialize(sceneManager, cube, this.notificationSystem);
    
    // Subscribe to cube changes
    this.cubeTypeManager.onCubeChange((newCube, config) => {
      this.cube = newCube;
      this.cubeStateManager = new CubeStateManager(newCube);
      this.cubeStateManager.setColorTheme(this.currentColorTheme);
      
      // Update UI for middle layer controls based on cube type
      this.updateMiddleLayerControls();
      
      // Update input manager with new cube
      if (this.inputManager) {
        // Update the input manager with the new cube
        this.inputManager.updateCube(newCube);
        this.keyboardController = this.inputManager.getKeyboardController()!;
        
        // Apply custom key mappings to the new keyboard controller
        if (this.customKeyMappings) {
          this.keyboardController.setKeyMappings(this.customKeyMappings);
        }
      }
      
      // Update callbacks for new cube
      newCube.soundEnabledCallback = () => this.soundEnabled;
      
      // Set onMove callback to update move counter for the new cube
      newCube.onMove = () => {
        this.handleCubeMove();
      };
      
      // Set onSolveComplete callback for the new cube
      newCube.onSolveComplete = () => {
        this.handleCubeSolved();
      };
      
      // Update scramble steps based on configuration
      if (config.scrambleSteps) {
        this._scrambleSteps = config.scrambleSteps;
        if (this.elements.options.scrambleSteps) {
          this.elements.options.scrambleSteps.value = config.scrambleSteps.toString();
        }
      }
      
      this.updateUI();
    });
    
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
        // Get default scramble steps for current cube
        const currentCube = this.cubeTypeManager.getCurrentCube();
        const defaultScrambleSteps = this.getDefaultScrambleStepsForCube(currentCube);
        
        input.value = defaultScrambleSteps.toString();
        this._scrambleSteps = defaultScrambleSteps;
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
      // Get the default scramble steps for the current cube type
      const currentCube = this.cubeTypeManager.getCurrentCube();
      let defaultScrambleSteps = this.getDefaultScrambleStepsForCube(currentCube);
      
      this._scrambleSteps = defaultScrambleSteps;
      if (this.elements.options.scrambleSteps) {
        this.elements.options.scrambleSteps.value = defaultScrambleSteps.toString();
      }
      this.saveSettings();
      // No need to show warning since we're resetting to the default value
    });

    // Show clock option
    this.elements.options.showClock?.addEventListener('change', (e) => {
      this.showClock = (e.target as HTMLInputElement).checked;
      this.updateModeUI();
      this.saveSettings();
    });

    this.elements.appearance.cubeSize.addEventListener('change', async (e) => {
      const size = parseInt((e.target as HTMLSelectElement).value);
      await this.handleCubeSizeChange(size);
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
    
    // Inner slice rotation buttons (4x4x4 only)
    this.elements.rotation.rotateInnerFront?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('FRONT', true);
    });
    
    this.elements.rotation.rotateInnerFrontPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('FRONT', false);
    });
    
    this.elements.rotation.rotateInnerBack?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('BACK', true);
    });
    
    this.elements.rotation.rotateInnerBackPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('BACK', false);
    });
    
    this.elements.rotation.rotateInnerRight?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('RIGHT', true);
    });
    
    this.elements.rotation.rotateInnerRightPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('RIGHT', false);
    });
    
    this.elements.rotation.rotateInnerLeft?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('LEFT', true);
    });
    
    this.elements.rotation.rotateInnerLeftPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('LEFT', false);
    });
    
    this.elements.rotation.rotateInnerTop?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('TOP', true);
    });
    
    this.elements.rotation.rotateInnerTopPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('TOP', false);
    });
    
    this.elements.rotation.rotateInnerBottom?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('BOTTOM', true);
    });
    
    this.elements.rotation.rotateInnerBottomPrime?.addEventListener('click', async () => {
      await this.handleInnerSliceRotation('BOTTOM', false);
    });
    
    // Third layer rotation buttons (6x6x6 only)
    this.elements.rotation.rotateThirdFront?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('FRONT', true);
    });
    
    this.elements.rotation.rotateThirdFrontPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('FRONT', false);
    });
    
    this.elements.rotation.rotateThirdBack?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('BACK', true);
    });
    
    this.elements.rotation.rotateThirdBackPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('BACK', false);
    });
    
    this.elements.rotation.rotateThirdRight?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('RIGHT', true);
    });
    
    this.elements.rotation.rotateThirdRightPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('RIGHT', false);
    });
    
    this.elements.rotation.rotateThirdLeft?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('LEFT', true);
    });
    
    this.elements.rotation.rotateThirdLeftPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('LEFT', false);
    });
    
    this.elements.rotation.rotateThirdTop?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('TOP', true);
    });
    
    this.elements.rotation.rotateThirdTopPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('TOP', false);
    });
    
    this.elements.rotation.rotateThirdBottom?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('BOTTOM', true);
    });
    
    this.elements.rotation.rotateThirdBottomPrime?.addEventListener('click', async () => {
      await this.handleThirdLayerRotation('BOTTOM', false);
    });
    
    // Fourth layer rotation buttons (10x10x10 only)
    this.elements.rotation.rotateFourthFront?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('FRONT', true);
    });
    
    this.elements.rotation.rotateFourthFrontPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('FRONT', false);
    });
    
    this.elements.rotation.rotateFourthBack?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('BACK', true);
    });
    
    this.elements.rotation.rotateFourthBackPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('BACK', false);
    });
    
    this.elements.rotation.rotateFourthRight?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('RIGHT', true);
    });
    
    this.elements.rotation.rotateFourthRightPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('RIGHT', false);
    });
    
    this.elements.rotation.rotateFourthLeft?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('LEFT', true);
    });
    
    this.elements.rotation.rotateFourthLeftPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('LEFT', false);
    });
    
    this.elements.rotation.rotateFourthTop?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('TOP', true);
    });
    
    this.elements.rotation.rotateFourthTopPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('TOP', false);
    });
    
    this.elements.rotation.rotateFourthBottom?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('BOTTOM', true);
    });
    
    this.elements.rotation.rotateFourthBottomPrime?.addEventListener('click', async () => {
      await this.handleFourthLayerRotation('BOTTOM', false);
    });
    
    // Fifth layer rotation buttons (10x10x10 only)
    this.elements.rotation.rotateFifthFront?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('FRONT', true);
    });
    
    this.elements.rotation.rotateFifthFrontPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('FRONT', false);
    });
    
    this.elements.rotation.rotateFifthBack?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('BACK', true);
    });
    
    this.elements.rotation.rotateFifthBackPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('BACK', false);
    });
    
    this.elements.rotation.rotateFifthRight?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('RIGHT', true);
    });
    
    this.elements.rotation.rotateFifthRightPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('RIGHT', false);
    });
    
    this.elements.rotation.rotateFifthLeft?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('LEFT', true);
    });
    
    this.elements.rotation.rotateFifthLeftPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('LEFT', false);
    });
    
    this.elements.rotation.rotateFifthTop?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('TOP', true);
    });
    
    this.elements.rotation.rotateFifthTopPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('TOP', false);
    });
    
    this.elements.rotation.rotateFifthBottom?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('BOTTOM', true);
    });
    
    this.elements.rotation.rotateFifthBottomPrime?.addEventListener('click', async () => {
      await this.handleFifthLayerRotation('BOTTOM', false);
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
      await this.handleCubeRotationX(true);
    });
    
    this.elements.rotation.rotateCubeXPrime?.addEventListener('click', async () => {
      await this.handleCubeRotationX(false);
    });
    
    this.elements.rotation.rotateCubeY?.addEventListener('click', async () => {
      await this.handleCubeRotationY(true);
    });
    
    this.elements.rotation.rotateCubeYPrime?.addEventListener('click', async () => {
      await this.handleCubeRotationY(false);
    });
    
    this.elements.rotation.rotateCubeZ?.addEventListener('click', async () => {
      await this.handleCubeRotationZ(true);
    });
    
    this.elements.rotation.rotateCubeZPrime?.addEventListener('click', async () => {
      await this.handleCubeRotationZ(false);
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
      
      // Get current cube type to determine correct default scramble steps
      const currentCube = this.cubeTypeManager.getCurrentCube();
      const defaultScrambleSteps = this.getDefaultScrambleStepsForCube(currentCube);
      
      this._scrambleSteps = parsed.scrambleSteps ?? defaultScrambleSteps;
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
      
      // Ensure cube size selector matches the actual cube
      this.updateCubeSizeSelector();
      
      // Ensure scramble steps matches the current cube type
      this.updateScrambleStepsInput();
      
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
    // Get the current active cube
    const currentCube = this.getCurrentCube();
    
    if (currentCube.isAnimating()) {
      this.notificationSystem.error('Cube is currently rotating. Please wait for the animation to complete.');
      return;
    }

    if (this.currentMode === 'timer' && this.isTimerRunning) {
      this.stopTimer();
    }
    
    // Do not reset move counter before scrambling
    // Keep the move count intact
    
    await currentCube.scramble(this._scrambleSteps);
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
    
    // Get the current active cube
    const currentCube = this.getCurrentCube();
    
    // Store current scramble steps to preserve them
    const currentScrambleSteps = this._scrambleSteps;
    
    // Stop any ongoing animation before resetting
    currentCube.stopAnimation();
    
    // Get current cube type before resetting
    const cubeType = currentCube.getCubeType();
    
    currentCube.reset();
    this.moveCount = 0;
    this.updateMoveCounter();
    this.resetTimer();
    this.elements.appearance.blindfoldMode.checked = false;
    this.toggleBlindfoldMode(false);
    
    // Make sure UI is updated completely after reset
    this.updateUI();
    
    // Get cube type after reset to verify it's still the same
    const newCubeType = this.cube.getCubeType();
    if (cubeType !== newCubeType) {
      console.warn(`Cube type changed during reset from ${cubeType} to ${newCubeType}`);
      
      // Force update cube size selector to match the current cube
      this.updateCubeSizeSelector();
      
      // Don't update scramble steps - keep user's selected value
    }
    
    // Restore the scramble steps to their previous value
    this._scrambleSteps = currentScrambleSteps;
    if (this.elements.options.scrambleSteps) {
      this.elements.options.scrambleSteps.value = currentScrambleSteps.toString();
    }
    
    this.playSound('reset');
    this.notificationSystem.info('Cube reset to solved state');
  }

  // Space bar scramble functionality was removed from here

  /**
   * Handle solve
   */
  private handleSolve(): void {
    // Get the current active cube
    const currentCube = this.getCurrentCube();
    
    if (currentCube.isAnimating()) {
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
    
    currentCube.solve();
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
    
    // First expand any note shortcuts before validation
    const expandedSequence = this.expandNoteShortcuts(sequence);
    
    // Check for invalid number prefixes before x, y, z, M, E, S
    // Match any digit followed by x, y, z, M, E, S with various possible formats
    const invalidNumberedMoves = /(^|\s)\d+[xyzMES]('?\d*)?($|\s|')/;
    if (invalidNumberedMoves.test(expandedSequence)) {
      this.showSequenceFeedback('Invalid sequence syntax. The moves x, y, z, M, E, S cannot have numbers before them.', 'error');
      return;
    }

    // For even-layered cubes (2x2, 4x4), validate that no middle layer moves are used
    if (this.isEvenLayeredCube()) {
      // Check for middle layer moves (M, E, S)
      const invalidMovesEvenLayered = /[mes]/i;
      if (invalidMovesEvenLayered.test(expandedSequence)) {
        this.showSequenceFeedback(`Middle layer moves (M, E, S) are not supported on even-layered cubes.`, 'error');
        return;
      }
      
      // For 2x2x2, check for lowercase moves or wide moves (f, r, Fw, Rw etc.)
      // Wide moves are now allowed for 4x4x4
      if (this.is2x2Cube()) {
        const invalidMoves2x2 = /[fbruld]w|^[fbruld](?![2'])|(\s+)[fbruld](?![2'])/g;
        if (invalidMoves2x2.test(expandedSequence)) {
          this.showSequenceFeedback('Invalid moves for 2x2x2 cube. Wide moves are not supported on 2x2 cubes.', 'error');
          return;
        }
      }
    }

    // Parse and validate sequence
    const moves = this.parseSequence(expandedSequence);
    if (!moves) {
      this.showSequenceFeedback('Invalid sequence syntax', 'error');
      return;
    }

    // Additional validation for even-layered cubes (2x2, 4x4) - check for invalid moves
    if (this.isEvenLayeredCube()) {
      const invalidMove = moves.find(move => 
        // Check for middle layer moves in all even-layered cubes
        (move.type === 'middle' && move.face === 'M') || 
        (move.type === 'middle' && move.face === 'E') || 
        (move.type === 'middle' && move.face === 'S')
      );
      
      if (invalidMove) {
        this.showSequenceFeedback(`Middle layer moves (M, E, S) are not supported on even-layered cubes.`, 'error');
        return;
      }
      
      // Check for invalid wide moves and slice moves
      if (this.is2x2Cube()) {
        // For 2x2x2: Check for any wide moves
        const invalidWideMove = moves.find(move => 
          move.invalid2x2 && 
          !(move.type === 'middle' && (move.face === 'M' || move.face === 'E' || move.face === 'S'))
        );
        
        if (invalidWideMove) {
          this.showSequenceFeedback('Invalid moves for 2x2x2 cube. Wide moves are not supported on 2x2 cubes.', 'error');
          return;
        }
      } else {
        // For 4x4x4: Wide moves are now allowed
        // We don't need to check for invalid wide moves anymore
      }
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
  private parseSequence(sequence: string): Array<{type: string, face?: string, clockwise: boolean, repetition?: number, invalid2x2?: boolean}> | null {
    const moves: Array<{type: string, face?: string, clockwise: boolean, double?: boolean, invalid2x2?: boolean}> = [];
    let processedSequence = sequence;

    // Note: Note shortcuts have already been expanded in handleExecuteSequence

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
    
    // We'll check if this is an even-layered cube (2x2 or 4x4) in the parsing logic
    for (const token of tokens) {
      if (!token) continue;
      
      // Check for invalid numbered moves like 2x, 3M, etc. (digits before x, y, z, M, E, S)
      // Also detect cases like 2x2, 3M', etc.
      if (/^\d+[xyzMES]('?\d*)?$/.test(token)) {
        return null; // Will cause "Invalid sequence syntax" error
      }

      let isDoubleLayer = false;
      let baseToken = token;

      // Check for double layer notation (lowercase or uppercase + w)
      // Also handle pattern with numbers at the beginning like 3Rw, 2Uw
      if (/^(?:\d+)?[rufbld]w?$/i.test(token.replace(/['\d]+$/, ''))) {
        const cleanToken = token.replace(/['\d]+$/, '').replace(/^\d+/, ''); // Remove numbers at start and end
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
        
        // Mark double layer moves as invalid for 2x2 cubes only
        // For 4x4, allow double layer moves
        if (this.is2x2Cube()) {
          doubleMove.invalid2x2 = true;
        }
        
        moves.push(doubleMove);
        continue;
      }

      // Process regular moves
      baseToken = baseToken.toUpperCase();

      // Check for inner slice notation for 4x4x4, 5x5x5, and 6x6x6 cubes (2F, 2R, 3F, etc.)
      // Also accept more general form like 3F for 5x5/6x6 cubes
      const innerSliceMatch = baseToken.match(/^(\d+)([FBRLUDMESXYZ])('?)(\d*)('?)$/);
      if (innerSliceMatch && (this.is4x4Cube() || this.is5x5Cube() || this.is6x6Cube() || this.is10x10Cube())) {
        // This is an inner slice rotation for 4x4x4 or 5x5x5 cube
        const layerIdx = parseInt(innerSliceMatch[1]);
        const faceLetter = innerSliceMatch[2];
        
        // Reject numbers before M, E, S, X, Y, Z
        if (['M', 'E', 'S', 'X', 'Y', 'Z'].includes(faceLetter)) {
          return null; // Invalid format, will cause "Invalid sequence syntax" error
        }
        
        const isPrime = innerSliceMatch[3] === "'" || innerSliceMatch[5] === "'";
        const repetitionStr = innerSliceMatch[4] || '1';
        const repetitionNum = parseInt(repetitionStr);
        
        // For 4x4x4, 6x6x6, and 10x10x10 cubes, treat '1F' as 'F', '1U' as 'U', etc.
        if (layerIdx === 1 && (this.is4x4Cube() || this.is6x6Cube() || this.is10x10Cube())) {
          // Create a standard face move instead of an inner slice move
          const moveObj: any = {
            type: 'face',
            face: this.convertFaceLetter(faceLetter),
            clockwise: !isPrime
          };
          
          if (repetitionNum > 1) {
            moveObj.repetition = repetitionNum;
          }
          
          moves.push(moveObj);
          continue;
        }
        
        // Validate layer index for cube size
        const maxLayer = this.is10x10Cube() ? 9 : (this.is6x6Cube() ? 5 : (this.is5x5Cube() ? 4 : (this.is4x4Cube() ? 3 : 1)));
        if (layerIdx > maxLayer || layerIdx < 1) {
          // Layer index out of bounds
          return null;
        }
        
        // Determine move type based on layer index
        let moveType = 'innerSlice';
        if (this.is6x6Cube() && layerIdx === 3) {
          moveType = 'thirdLayerSlice';
        }
        
        // Create inner slice move
        const moveObj: any = {
          type: moveType,
          face: this.convertFaceLetter(faceLetter),
          clockwise: !isPrime,
          layerIndex: layerIdx - 1 // Convert to 0-based index
        };
        
        if (repetitionNum > 1) {
          moveObj.repetition = repetitionNum;
        }
        
        moves.push(moveObj);
        
        continue;
      }
      
      // Handle leading 1 as optional prefix (1U = U)
      if (baseToken.startsWith('1') && baseToken.length > 1) {
        baseToken = baseToken.substring(1);
      }

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
        
        // Mark middle layer moves as invalid for both 2x2 and 4x4 cubes
        if (this.isEvenLayeredCube()) {
          move.invalid2x2 = true;
        }
        
        // Mark middle layer moves as invalid for 2x2 cubes
        if (this.is2x2Cube()) {
          move.invalid2x2 = true;
        }
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
   * Convert face letter to face constant
   */
  private convertFaceLetter(letter: string): 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM' | string {
    switch(letter) {
      case 'F': return 'FRONT';
      case 'B': return 'BACK';
      case 'R': return 'RIGHT';
      case 'L': return 'LEFT';
      case 'U': return 'TOP';
      case 'D': return 'BOTTOM';
      case 'M': return 'M';
      case 'E': return 'E';
      case 'S': return 'S';
      case 'X': return 'X';
      case 'Y': return 'Y';
      case 'Z': return 'Z';
      default: return letter;
    }
  }
  
  /**
   * Create a double layer move object
   */
  private createDoubleLayerMove(token: string): {type: string, face?: string, clockwise: boolean, repetition?: number, invalid2x2?: boolean, layerCount?: number} | null {
    // Extract base notation, prime, and repetition
    let baseNotation = token.replace(/['\d]+$/, '');
    const isPrime = token.includes("'");
    const numberMatch = token.match(/(\d+)'?$/);
    const repetition = numberMatch ? parseInt(numberMatch[1]) : 1;
    
    // Use default layerCount based on cube type
    let layerCount = 2; // Default for most cubes
    
    // For 5x5x5 and 6x6x6, use 3 layers by default for Uw/u notation
    // Check for number prefix like 2Uw or 3Uw
    const numMatch = baseNotation.match(/^(\d+)([rufbld]w?)$/i);
    if (numMatch) {
      // If there's a number prefix like 2Uw, use that number as layer count
      layerCount = parseInt(numMatch[1]);
      // Make sure layerCount is valid for the cube size
      if (this.is10x10Cube()) {
        layerCount = Math.min(layerCount, 9); // Max 9 layers for 10x10
      } else if (this.is5x5Cube()) {
        layerCount = Math.min(layerCount, 4); // Max 4 layers for 5x5
      } else if (this.is6x6Cube()) {
        layerCount = Math.min(layerCount, 5); // Max 5 layers for 6x6
      } else if (this.is4x4Cube()) {
        layerCount = Math.min(layerCount, 3); // Max 3 layers for 4x4
      } else {
        layerCount = Math.min(layerCount, 2); // Max 2 layers for 3x3
      }
    }
    // If there's no number prefix, use default counts for 5x5x5, 6x6x6 and 10x10x10
    else if (this.is5x5Cube() || this.is6x6Cube()) {
      layerCount = 3; // Default to 3 layers for 5x5x5 and 6x6x6
    } else if (this.is10x10Cube()) {
      layerCount = 5; // Default to 5 layers for 10x10x10
    }

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
      repetition: repetition,
      layerCount: layerCount
    };
  }

  /**
   * Execute a single move
   */
  private async executeMove(move: {type: string, face?: string, clockwise: boolean, repetition?: number}): Promise<void> {
    if (move.type === 'thirdLayerSlice' && move.face && (this.is6x6Cube() || this.is10x10Cube())) {
      // Handle third layer slice rotation for 6x6x6 cube
      const repetition = move.repetition || 1;
      const cube = this.getCurrentCube() as any;
      
      // Convert face notation if needed (U -> TOP, etc.)
      const face = move.face;
      
      // For F, R, U faces, we need to invert the clockwise value to match expected behavior
      let adjustedClockwise = move.clockwise;
      if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
        adjustedClockwise = !move.clockwise;
      }
      
      for (let i = 0; i < repetition; i++) {
        await cube.rotateThirdLayerSlice(face, adjustedClockwise);
      }
      
      return;
    }
    
    if (move.type === 'innerSlice' && move.face && (this.is4x4Cube() || this.is5x5Cube() || this.is6x6Cube() || this.is10x10Cube())) {
      // Handle inner slice rotation for 4x4x4, 5x5x5, and 6x6x6 cube
      const repetition = move.repetition || 1;
      const cube = this.getCurrentCube() as any;
      const layerIndex = (move as any).layerIndex !== undefined ? (move as any).layerIndex : 1; // Default to second layer (index 1)
      
      if ((this.is5x5Cube() || this.is6x6Cube() || this.is10x10Cube()) && cube.rotateInnerSliceAtLayer) {
        // For 5x5 cube, use the specific layer rotation method
        // Convert face notation if needed (U -> TOP, etc.)
        const face = move.face;
        
        // For F, R, U faces, we need to invert the clockwise value to match expected behavior
        let adjustedClockwise = move.clockwise;
        if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
          adjustedClockwise = !move.clockwise;
        }
        
        for (let i = 0; i < repetition; i++) {
          await cube.rotateInnerSliceAtLayer(face, adjustedClockwise, layerIndex);
        }
      } else if (cube.rotateInnerSlice) {
        // For 4x4 or fallback for 5x5
        // Convert face notation if needed (U -> TOP, etc.)
        const face = move.face;
        
        // For F, R, U faces, we need to invert the clockwise value to match expected behavior
        let adjustedClockwise = move.clockwise;
        if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
          adjustedClockwise = !move.clockwise;
        }
        
        for (let i = 0; i < repetition; i++) {
          await cube.rotateInnerSlice(face, adjustedClockwise);
        }
      } else {
        throw new Error('Inner slice rotation not supported by current cube');
      }
      
      return;
    }
    else if (move.type === 'double' && move.face) {
      // Handle double layer move with repetition
      const repetition = move.repetition || 1;
      const faceNotation = move.face.toLowerCase() + (move.clockwise ? '' : "'");

      // Get the current active cube
      const currentCube = this.getCurrentCube();
      const cubeType = (currentCube as any).getCubeType?.();

      if (cubeType === '4x4x4' || cubeType === '5x5x5' || cubeType === '6x6x6' || cubeType === '10x10x10') {
        // For 4x4x4 cube, we handle wide moves by rotating both the outer face and inner slice
        // Temporarily disable onMove to prevent double counting
        const originalOnMove = currentCube.onMove;
        currentCube.onMove = undefined;

        // Convert face to format used by rotateInnerSlice
        const faceMap: Record<string, 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM'> = {
          'F': 'FRONT',
          'B': 'BACK',
          'R': 'RIGHT',
          'L': 'LEFT',
          'U': 'TOP',
          'D': 'BOTTOM'
        };

        const face = faceMap[move.face];
        
        // Understanding the rotation mechanics:
        // In RubiksCube4x4.ts executeMove(), both rotateFace and rotateInnerSlice use !isPrime
        // This means they're already inverting the input direction
        
        // For consistency with how the moves are defined, we need to:
        let outerClockwise = move.clockwise;
        let innerClockwise = move.clockwise;
        
        // For F, R, U faces, we need to invert BOTH outer and inner slices together
        // This keeps them moving in the same visual direction and consistent with input
        if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
          outerClockwise = !move.clockwise;
          innerClockwise = !move.clockwise;
        }
        

        
        for (let i = 0; i < repetition; i++) {
          // Rotate the outer face with adjusted direction
          await currentCube.rotateFace(face, outerClockwise);
          
          // Rotate inner slices with matching adjusted direction
          if (cubeType === '5x5x5' || cubeType === '6x6x6') {
            // For 5x5 and 6x6 cubes, we need to support variable layer counts
            // Get the layer count from the move object (set by createDoubleLayerMove)
            const maxLayers = (move as any).layerCount || 3; // Default to 3 if not specified
            for (let layer = 1; layer < maxLayers; layer++) {
              if ((currentCube as any).rotateInnerSliceAtLayer) {
                // We rotate the inner slice at each layer
                await (currentCube as any).rotateInnerSliceAtLayer(face, innerClockwise, layer);
              } else if (layer === 1 && (currentCube as any).rotateInnerSlice) {
                // Fallback to rotateInnerSlice for layer 1
                await (currentCube as any).rotateInnerSlice(face, innerClockwise);
              } else if (layer === 2 && (currentCube as any).rotateThirdLayerSlice) {
                // For 6x6, use rotateThirdLayerSlice for layer 2
                await (currentCube as any).rotateThirdLayerSlice(face, innerClockwise);
              }
            }
          } else if (cubeType === '10x10x10') {
            // For 10x10x10 cube, support up to 5 layers for wide moves
            const maxLayers = (move as any).layerCount || 5; // Default to 5 if not specified
            for (let layer = 1; layer < maxLayers; layer++) {
              if ((currentCube as any).rotateInnerSliceAtLayer) {
                // We rotate the inner slice at each layer
                await (currentCube as any).rotateInnerSliceAtLayer(face, innerClockwise, layer);
              } else if (layer === 1 && (currentCube as any).rotateInnerSlice) {
                // Fallback to rotateInnerSlice for layer 1
                await (currentCube as any).rotateInnerSlice(face, innerClockwise);
              } else if (layer === 2 && (currentCube as any).rotateThirdLayerSlice) {
                // For 10x10, use rotateThirdLayerSlice for layer 2
                await (currentCube as any).rotateThirdLayerSlice(face, innerClockwise);
              }
            }
          } else {
            // Default behavior for 4x4 or other cubes (just one inner slice)
            if ((currentCube as any).rotateInnerSlice) {
              await (currentCube as any).rotateInnerSlice(face, innerClockwise);
            }
          }
        }

        // Restore onMove
        currentCube.onMove = originalOnMove;
      } else {
        // For other cubes (3x3x3), use the middle layer logic
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
        const originalOnMove = currentCube.onMove;
        currentCube.onMove = undefined;

        for (let i = 0; i < repetition; i++) {
          // Execute face move
          await this.keyboardController.executeMoveByNotation(faceNotation);

          // Execute middle move
          await this.keyboardController.executeMoveByNotation(fullMiddleNotation);
        }
        
        // Restore onMove
        currentCube.onMove = originalOnMove;
      }

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
    // Get the current active cube
    const currentCube = this.getCurrentCube();
    
    const success = await currentCube.undo();
    if (success) {
      this.moveCount = Math.max(0, this.moveCount - 1);
      this.updateMoveCounter();
    }
  }

  /**
   * Handle redo
   */
  private async handleRedo(): Promise<void> {
    // Get the current active cube
    const currentCube = this.getCurrentCube();
    
    const success = await currentCube.redo();
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
  private async handleCubeSizeChange(size: number): Promise<void> {
    try {
      // Turn off blindfold mode if it's enabled
      if (this.blindfoldModeEnabled) {
        this.elements.appearance.blindfoldMode.checked = false;
        this.toggleBlindfoldMode(false);
      }
      
      const success = await this.cubeTypeManager.switchToCubeSize(size);
      if (success) {
        // Automatically reset the cube when cube size is changed
        this.cubeTypeManager.resetCube();
        this.saveSettings();
      }
    } catch (error) {
      console.error('Error changing cube size:', error);
      this.notificationSystem.show('Failed to change cube size', 'error');
    }
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
    
    // Update ColorThemeManager to ensure consistent theme when switching cube sizes
    const colorThemeManager = CubeTypeManager.getInstance().getColorThemeManager();
    colorThemeManager.setCurrentColorTheme(theme);
    
    let colors: typeof CUBE_CONFIG.colors;
    
    if (theme === 'random') {
      colors = this.generateRandomColors();
      // Show the generate random button when random theme is selected
      this.elements.appearance.generateRandomBtn.style.display = 'block';
    } else {
      // Get theme from ColorThemeManager for consistency
      const themeManager = ColorThemeManager.getInstance();
      const themeColors = themeManager.getColorScheme(theme);
      
      // If not found in ColorThemeManager, use classic as fallback
      const classicColors = themeManager.getColorScheme('classic')!;
      colors = themeColors as typeof CUBE_CONFIG.colors || classicColors;
      
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
    this.updateCubeSizeSelector();
    this.updateScrambleStepsInput();
    this.updateMiddleLayerControls();
    this.updateInnerSliceControls();
  }
  
  /**
   * Update Middle Layer Controls visibility based on cube type
   * Hide middle layer controls for even-layered cubes (2x2, 4x4)
   */
  private updateMiddleLayerControls(): void {
    // Find all control groups and locate the one with Middle Layer Rotations label
    const controlGroups = document.querySelectorAll('.control-group');
    
    controlGroups.forEach(group => {
      const label = group.querySelector('label');
      if (label && label.textContent === 'Middle Layer Rotations') {
        const section = group as HTMLElement;
        
        // For even-layered cubes like 2x2 and 4x4, hide the middle layer controls
        if (this.isEvenLayeredCube()) {
          section.style.display = 'none';
        } else {
          section.style.display = 'block';
        }
      }
    });
  }
  
  /**
   * Update Inner Slice Controls visibility based on cube type
   * Show for 4x4x4 and 5x5x5 cubes
   */
  private updateInnerSliceControls(): void {
    // Get the inner slice controls div
    const innerSliceControls = document.getElementById('innerSliceControls');
    const thirdLayerControls = document.getElementById('thirdLayerControls');
    const fourthLayerControls = document.getElementById('fourthLayerControls');
    const fifthLayerControls = document.getElementById('fifthLayerControls');
    
    if (innerSliceControls) {
      // Show inner slice controls for 4x4x4, 5x5x5, 6x6x6, and 10x10x10 cubes
      if (this.is4x4Cube() || this.is5x5Cube() || this.is6x6Cube() || this.is10x10Cube()) {
        innerSliceControls.style.display = 'block';
      } else {
        innerSliceControls.style.display = 'none';
      }
    }
    
    // Third layer controls are for 6x6x6 and 10x10x10
    if (thirdLayerControls) {
      if (this.is6x6Cube() || this.is10x10Cube()) {
        thirdLayerControls.style.display = 'block';
      } else {
        thirdLayerControls.style.display = 'none';
      }
    }
    
    // Fourth layer controls are for 10x10x10 only
    if (fourthLayerControls) {
      if (this.is10x10Cube()) {
        fourthLayerControls.style.display = 'block';
      } else {
        fourthLayerControls.style.display = 'none';
      }
    }
    
    // Fifth layer controls are for 10x10x10 only
    if (fifthLayerControls) {
      if (this.is10x10Cube()) {
        fifthLayerControls.style.display = 'block';
      } else {
        fifthLayerControls.style.display = 'none';
      }
    }
  }
  
  /**
   * Get default scramble steps for a given cube type
   */
  private getDefaultScrambleStepsForCube(cube: RubiksCube | null): number {
    if (!cube) return 25; // Default to 3x3x3 if no cube
    
    const cubeType = cube.getCubeType();
    
    // Parse cube size from type
    const size = parseInt(cubeType, 10);
    if (!isNaN(size)) {
      // Use the centralized method from CubeConfigurationFactory
      return CubeConfigurationFactory.getDefaultScrambleSteps(size);
    }
    
    return 25; // Fallback to 3x3x3 default
  }

  /**
   * Update scramble steps input to match current cube configuration
   */
  private updateScrambleStepsInput(): void {
    if (this.elements.options.scrambleSteps) {
      const currentCube = this.cubeTypeManager.getCurrentCube();
      const scrambleSteps = this.getDefaultScrambleStepsForCube(currentCube);
      
      // Update UI and internal value
      this._scrambleSteps = scrambleSteps;
      this.elements.options.scrambleSteps.value = scrambleSteps.toString();
      
      // Also update the settings manager
      const settingsManager = this.cubeTypeManager.getSettingsManager();
      if (settingsManager) {
        settingsManager.set('scrambleSteps', scrambleSteps);
      }
    }
  }
  
  /**
   * Update cube size selector to match current cube type
   */
  private updateCubeSizeSelector(): void {
    if (this.elements.appearance.cubeSize) {
      const currentCube = this.cubeTypeManager.getCurrentCube();
      if (currentCube) {
        const cubeType = currentCube.getCubeType();
        // Determine size from cube type
        const size = cubeType === '2x2x2' ? 2 : cubeType === '3x3x3' ? 3 : parseInt(cubeType, 10);
        
        // Update the cube size selector to match the actual cube displayed
        if (size && !isNaN(size) && this.elements.appearance.cubeSize.value !== size.toString()) {
          this.elements.appearance.cubeSize.value = size.toString();
          
          // Also update the settings manager to match the actual cube
          const settingsManager = this.cubeTypeManager.getSettingsManager();
          if (settingsManager) {
            settingsManager.set('cubeSize', size);
          }
        }
      }
    }
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
   * Get current active cube from CubeTypeManager
   */
  private getCurrentCube(): RubiksCube {
    return this.cubeTypeManager.getCurrentCube() || this.cube;
  }

  /**
   * Check if current cube is a 2x2x2 cube
   */
  private is2x2Cube(): boolean {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType && (currentCube as any).getCubeType() === '2x2x2';
  }
  
  /**
   * Check if current cube is a 4x4x4 cube
   */
  private is4x4Cube(): boolean {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType && (currentCube as any).getCubeType() === '4x4x4';
  }
  
  /**
   * Check if current cube is a 5x5x5 cube
   */
  private is5x5Cube(): boolean {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType && (currentCube as any).getCubeType() === '5x5x5';
  }
  
  /**
   * Check if current cube is a 6x6x6 cube
   */
  private is6x6Cube(): boolean {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType && (currentCube as any).getCubeType() === '6x6x6';
  }
  
  /**
   * Check if current cube is a 10x10x10 cube
   */
  private is10x10Cube(): boolean {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType && (currentCube as any).getCubeType() === '10x10x10';
  }
  
  /**
   * Handle inner slice rotation for 4x4x4 and 5x5x5 cubes
   */
  private async handleInnerSliceRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      if (!this.is4x4Cube() && !this.is5x5Cube() && !this.is6x6Cube() && !this.is10x10Cube()) {
        this.notificationSystem.error('Inner slice rotation is only available for 4x4x4, 5x5x5, 6x6x6, and 10x10x10 cubes');
        return;
      }
      
      const currentCube = this.getCurrentCube() as any;
      
      if (!currentCube.rotateInnerSlice) {
        this.notificationSystem.error('Inner slice rotation not supported by current cube');
        return;
      }
      
      // For F, R, U faces, we need to invert the clockwise value to match expected behavior
      let adjustedClockwise = clockwise;
      if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
        adjustedClockwise = !clockwise;
      }
      
      // Rotate the inner slice with adjusted direction
      await currentCube.rotateInnerSlice(face, adjustedClockwise);
      
      // Always increment moves count
      this.moveCount++;
      this.updateMoveCounter();
      
      // Play sound
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating inner slice:", error);
    }
  }
  
  private async handleThirdLayerRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      if (!this.is6x6Cube() && !this.is10x10Cube()) {
        this.notificationSystem.error('Third layer slice rotation is only available for 6x6x6 and 10x10x10 cubes');
        return;
      }
      
      const currentCube = this.getCurrentCube() as any;
      
      if (!currentCube.rotateThirdLayerSlice) {
        this.notificationSystem.error('Third layer slice rotation not supported by current cube');
        return;
      }
      
      // For F, R, U faces, we need to invert the clockwise value to match expected behavior
      let adjustedClockwise = clockwise;
      if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
        adjustedClockwise = !clockwise;
      }
      
      // Rotate the third layer slice with adjusted direction
      await currentCube.rotateThirdLayerSlice(face, adjustedClockwise);
      
      // Always increment moves count
      this.moveCount++;
      this.updateMoveCounter();
      
      // Play sound
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating third layer slice:", error);
    }
  }
  
  /**
   * Handle rotation of the 4th layer slice
   * Only available for 10x10x10 cube
   */
  private async handleFourthLayerRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      if (!this.is10x10Cube()) {
        this.notificationSystem.error('Fourth layer slice rotation is only available for 10x10x10 cubes');
        return;
      }
      
      const currentCube = this.getCurrentCube() as any;
      
      if (!currentCube.rotateInnerSliceAtLayer) {
        this.notificationSystem.error('Layer slice rotation not supported by current cube');
        return;
      }
      
      // For F, R, U faces, we need to invert the clockwise value to match expected behavior
      let adjustedClockwise = clockwise;
      if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
        adjustedClockwise = !clockwise;
      }
      
      // Rotate the fourth layer slice with adjusted direction (layer index 3)
      await currentCube.rotateInnerSliceAtLayer(face, adjustedClockwise, 3);
      
      // Always increment moves count
      this.moveCount++;
      this.updateMoveCounter();
      
      // Play sound
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating fourth layer slice:", error);
    }
  }
  
  /**
   * Handle rotation of the 5th layer slice
   * Only available for 10x10x10 cube
   */
  private async handleFifthLayerRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      if (!this.is10x10Cube()) {
        this.notificationSystem.error('Fifth layer slice rotation is only available for 10x10x10 cubes');
        return;
      }
      
      const currentCube = this.getCurrentCube() as any;
      
      if (!currentCube.rotateInnerSliceAtLayer) {
        this.notificationSystem.error('Layer slice rotation not supported by current cube');
        return;
      }
      
      // For F, R, U faces, we need to invert the clockwise value to match expected behavior
      let adjustedClockwise = clockwise;
      if (face === 'FRONT' || face === 'RIGHT' || face === 'TOP') {
        adjustedClockwise = !clockwise;
      }
      
      // Rotate the fifth layer slice with adjusted direction (layer index 4)
      await currentCube.rotateInnerSliceAtLayer(face, adjustedClockwise, 4);
      
      // Always increment moves count
      this.moveCount++;
      this.updateMoveCounter();
      
      // Play sound
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating fifth layer slice:", error);
    }
  }
  
  /**
   * Check if current cube has an even number of layers (2x2, 4x4, 6x6, 10x10, etc.)
   * These cubes don't support middle layer rotations
   */
  private isEvenLayeredCube(): boolean {
    return this.is2x2Cube() || this.is4x4Cube() || this.is6x6Cube() || this.is10x10Cube();
  }

  /**
   * Helper method to handle face rotation with error handling
   * Direction handling is now managed by each cube type through DirectionHandler
   */
  private async handleFaceRotation(face: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM', clockwise: boolean): Promise<void> {
    try {
      const currentCube = this.getCurrentCube();
      
      if (!currentCube) return;
      
      // Each cube type now handles its own direction conversion internally
      await currentCube.rotateFace(face, clockwise);
      
      // Always increment moves count - we need to track all moves
      this.moveCount++;
      this.updateMoveCounter();
      
      // Play sound
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating face:", error);
    }
  }
  


  /**
   * Helper method to handle middle layer rotation with error handling
   */
  private async handleMiddleRotation(clockwise: boolean): Promise<void> {
    try {
      // Check if it's an even-layered cube (2x2 or 4x4)
      if (this.isEvenLayeredCube()) {
        this.notificationSystem.show(`Middle layer rotation not available on ${this.getCurrentCubeType()} cube`, 'info');
        return;
      }
      
      const currentCube = this.getCurrentCube();
      await currentCube.rotateMiddle(clockwise);
      
      // Increment move counter
      this.moveCount++;
      this.updateMoveCounter();
    } catch (error) {
      console.error("Error rotating middle layer:", error);
    }
  }
  
  /**
   * Get current cube type string (e.g., "2x2x2", "4x4x4")
   */
  private getCurrentCubeType(): string {
    const currentCube = this.getCurrentCube();
    return (currentCube as any).getCubeType ? (currentCube as any).getCubeType() : '3x3x3';
  }

  /**
   * Helper method to handle equator rotation with error handling
   */
  private async handleEquatorRotation(clockwise: boolean): Promise<void> {
    try {
      // Check if it's an even-layered cube (2x2 or 4x4)
      if (this.isEvenLayeredCube()) {
        this.notificationSystem.show(`Equator rotation not available on ${this.getCurrentCubeType()} cube`, 'info');
        return;
      }
      
      const currentCube = this.getCurrentCube();
      await currentCube.rotateEquator(clockwise);
      
      // Increment move counter
      this.moveCount++;
      this.updateMoveCounter();
    } catch (error) {
      console.error("Error rotating equator layer:", error);
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

      // Handle async loadFromLocalStorage
      this.cubeStateManager.loadFromLocalStorage()
        .then(success => {
          if (success) {
              this.notificationSystem.show('Cube state loaded successfully!', 'success');
            // Reset move count when loading a state
            this.moveCount = 0;
            this.updateUI();
          } else {
            this.notificationSystem.show('Failed to load cube state.', 'error');
          }
        })
        .catch(error => {
          console.error('Error loading from localStorage:', error);
          this.notificationSystem.show('Failed to load cube state.', 'error');
        });
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
            
            // Turn off blindfold mode if it's enabled
            if (this.blindfoldModeEnabled) {
              this.elements.appearance.blindfoldMode.checked = false;
              this.toggleBlindfoldMode(false);
            }
            
            // Update the UI to reflect potential cube size/type change
            this.updateCubeSizeSelector();
            this.updateScrambleStepsInput();
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
      // Check if it's an even-layered cube (2x2 or 4x4)
      if (this.isEvenLayeredCube()) {
        this.notificationSystem.show(`Standing rotation not available on ${this.getCurrentCubeType()} cube`, 'info');
        return;
      }
      
      const currentCube = this.getCurrentCube();
      await currentCube.rotateStanding(clockwise);
      
      // Increment move counter
      this.moveCount++;
      this.updateMoveCounter();
    } catch (error) {
      console.error("Error rotating standing layer:", error);
    }
  }
  
  /**
   * Helper method to handle cube X rotation
   * Direction handling is now managed by each cube type through DirectionHandler
   */
  private async handleCubeRotationX(clockwise: boolean): Promise<void> {
    try {
      const currentCube = this.getCurrentCube();
      
      // Each cube type now handles its own direction conversion internally
      await currentCube.rotateCubeX(clockwise);
      
      // Play move sound (cube rotations don't increase move counter)
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating cube X:", error);
    }
  }
  
  /**
   * Helper method to handle cube Y rotation
   * Direction handling is now managed by each cube type through DirectionHandler
   */
  private async handleCubeRotationY(clockwise: boolean): Promise<void> {
    try {
      const currentCube = this.getCurrentCube();
      
      // Each cube type now handles its own direction conversion internally
      await currentCube.rotateCubeY(clockwise);
      
      // Play move sound (cube rotations don't increase move counter)
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating cube Y:", error);
    }
  }
  
  /**
   * Helper method to handle cube Z rotation
   * Direction handling is now managed by each cube type through DirectionHandler
   */
  private async handleCubeRotationZ(clockwise: boolean): Promise<void> {
    try {
      const currentCube = this.getCurrentCube();
      
      // Each cube type now handles its own direction conversion internally
      await currentCube.rotateCubeZ(clockwise);
      
      // Play move sound (cube rotations don't increase move counter)
      this.playSound('move');
    } catch (error) {
      console.error("Error rotating cube Z:", error);
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
      
      // Add shortcut class for all notes since they can all be used as shortcuts
      noteElement.classList.add('shortcut-note');

      const titleElement = document.createElement('div');
      titleElement.className = 'saved-note-title';

      const titleText = document.createElement('span');
      titleText.textContent = note.title;
      
      // Add tooltip for shortcut notes
      if (note.title.startsWith('!')) {
        titleText.title = 'This is a shortcut note. Use it in Sequence Input to expand its content.';
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-note-btn';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = () => this.deleteNote(note.id);

      titleElement.appendChild(titleText);
      titleElement.appendChild(deleteBtn);

      const contentElement = document.createElement('div');
      contentElement.className = 'saved-note-content';
      contentElement.textContent = note.content;
      contentElement.title = 'Click to copy to Sequence Input';

      noteElement.appendChild(titleElement);
      noteElement.appendChild(contentElement);
      
      // Add click event to note content to copy to sequence input
      contentElement.style.cursor = 'pointer';
      contentElement.title = 'Click to use in Sequence Input';
      contentElement.onclick = () => {
        if (this.elements.sequence.sequenceInput) {
          this.elements.sequence.sequenceInput.value = note.content;
          this.elements.sequence.sequenceInput.focus();
          // Switch to Controls tab
          this.switchTab('controls');
        }
      };
      
      // Add click event to all titles to insert shortcut reference in sequence input
      titleText.style.cursor = 'pointer';
      titleText.title = 'Click to insert shortcut reference in Sequence Input';
      titleText.onclick = (e) => {
        e.stopPropagation();
        if (this.elements.sequence.sequenceInput) {
          const currentValue = this.elements.sequence.sequenceInput.value;
          const cursorPos = this.elements.sequence.sequenceInput.selectionStart || 0;
          const textBefore = currentValue.substring(0, cursorPos);
          const textAfter = currentValue.substring(cursorPos);
          
          // Create the shortcut reference with ! prefix and add a space before it
          const shortcutRef = note.title.startsWith('!') ? note.title : `!${note.title}`;
          
          // Add a space before the shortcut if there isn't one already
          const needsSpace = textBefore.length > 0 && !textBefore.endsWith(' ');
          const spacer = needsSpace ? ' ' : '';
          
          // Insert the shortcut at cursor position with a space before if needed
          this.elements.sequence.sequenceInput.value = `${textBefore}${spacer}${shortcutRef}${textAfter}`;
          
          // Set cursor position after the inserted shortcut, accounting for the space
          const newPosition = cursorPos + shortcutRef.length + (needsSpace ? 1 : 0);
          this.elements.sequence.sequenceInput.selectionStart = newPosition;
          this.elements.sequence.sequenceInput.selectionEnd = newPosition;
          
          this.elements.sequence.sequenceInput.focus();
          // Switch to Controls tab
          this.switchTab('controls');
        }
      };

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
   * Helper function to escape special characters in a string for use in RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Expand note shortcuts in a sequence string
   * Finds all occurrences of !title (where title is the name of a note) and replaces them with the note's content
   * This is done recursively to handle nested shortcuts
   */
  private expandNoteShortcuts(sequence: string, processedShortcuts: Set<string> = new Set()): string {
    // Regular expression to match !title without spaces (!abc, !F, !123, etc.)
    const shortcutRegex = /!([^\s]+)/g;
    let result = sequence;
    
    // Track already processed shortcuts to prevent infinite recursion
    const newProcessedShortcuts = new Set(processedShortcuts);
    
    // Extract all matches first, then process them
    const matches: { fullMatch: string; title: string }[] = [];
    let match;
    
    // Collect all matches first
    while ((match = shortcutRegex.exec(sequence)) !== null) {
      const fullMatch = match[0]; // The full match including ! (e.g. !abc)
      const shortcutTitle = match[1]; // Just the title without ! (e.g. abc)
      
      // Skip if this shortcut has already been processed (prevents infinite recursion)
      if (!newProcessedShortcuts.has(shortcutTitle)) {
        matches.push({ fullMatch, title: shortcutTitle });
      }
    }
    
    // Process each match
    for (const { fullMatch, title } of matches) {
      // First try to find a note with the exact title (with !)
      let note = this.savedNotes.find(note => note.title === title);
      
      // If not found, try to find a note with the title without the ! prefix
      if (!note) {
        note = this.savedNotes.find(note => note.title === title || note.title === '!' + title);
      }
      
      if (note) {
        // Mark this shortcut as processed
        newProcessedShortcuts.add(title);
        
        // Replace all occurrences of the shortcut with the note content
        // Use a global regex to replace all instances
        result = result.replace(new RegExp(this.escapeRegExp(fullMatch), 'g'), note.content);
      }
    }
    
    // Check if we need to do another pass (if any shortcuts were expanded)
    if (result !== sequence) {
      // Recursively process the resulting string to handle nested shortcuts
      result = this.expandNoteShortcuts(result, newProcessedShortcuts);
    }
    
    return result;
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
