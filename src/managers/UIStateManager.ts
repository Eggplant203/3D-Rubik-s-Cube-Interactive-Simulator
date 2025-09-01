import { 
  ColorThemeManager, 
  KeyMappingManager, 
  SettingsManager, 
  CubeTypeManager 
} from '../managers';
import { NotificationSystem } from '../utils/NotificationSystem';

/**
 * UI State Manager - Manages UI-specific state and interactions
 * Separated from UIController to reduce complexity
 */
export class UIStateManager {
  private settingsManager: SettingsManager;
  private colorThemeManager: ColorThemeManager;
  private keyMappingManager: KeyMappingManager;
  private cubeTypeManager: CubeTypeManager;
  private notificationSystem: NotificationSystem;

  // UI State
  private isTimerRunning = false;
  private timerStartTime = 0;
  private timerInterval: number | null = null;
  private moveCount = 0;

  // Solve history and notes
  private solveHistory: { time: number; moves: number; date: Date }[] = [];
  private savedNotes: { id: string; title: string; content: string; date: Date }[] = [];

  // Callbacks
  public onTimerStart?: () => void;
  public onTimerStop?: (time: number) => void;
  public onMoveCountUpdate?: (count: number) => void;
  public onThemeChange?: () => void;

  constructor(notificationSystem: NotificationSystem) {
    this.settingsManager = SettingsManager.getInstance();
    this.colorThemeManager = ColorThemeManager.getInstance();
    this.keyMappingManager = KeyMappingManager.getInstance();
    this.cubeTypeManager = CubeTypeManager.getInstance();
    this.notificationSystem = notificationSystem;

    this.loadSolveHistory();
    this.loadSavedNotes();
    this.setupSettingsSubscriptions();
  }

  /**
   * Setup settings subscriptions
   */
  private setupSettingsSubscriptions(): void {
    // Subscribe to theme changes
    this.settingsManager.subscribe(['uiTheme', 'colorTheme', 'backgroundTheme'], () => {
      this.onThemeChange?.();
    });

    // Subscribe to key mapping changes
    this.settingsManager.subscribe('keyMappings', (mappings) => {
      this.keyMappingManager.setMappings(mappings);
    });
  }

  /**
   * Timer management
   */
  public startTimer(): void {
    if (this.isTimerRunning) return;

    this.isTimerRunning = true;
    this.timerStartTime = Date.now();
    
    this.timerInterval = window.setInterval(() => {
      // Timer update logic can be handled by subscribers
    }, 10);

    this.onTimerStart?.();
  }

  public stopTimer(): number {
    if (!this.isTimerRunning) return 0;

    this.isTimerRunning = false;
    const totalTime = Date.now() - this.timerStartTime;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.onTimerStop?.(totalTime);
    return totalTime;
  }

  public resetTimer(): void {
    this.stopTimer();
    this.timerStartTime = 0;
  }

  public getTimerState(): { running: boolean; elapsed: number } {
    return {
      running: this.isTimerRunning,
      elapsed: this.isTimerRunning ? Date.now() - this.timerStartTime : 0
    };
  }

  /**
   * Move count management
   */
  public incrementMoveCount(): void {
    this.moveCount++;
    this.onMoveCountUpdate?.(this.moveCount);
  }

  public resetMoveCount(): void {
    this.moveCount = 0;
    this.onMoveCountUpdate?.(this.moveCount);
  }

  public getMoveCount(): number {
    return this.moveCount;
  }

  /**
   * Solve history management
   */
  public addSolveRecord(time: number, moves: number): void {
    const record = { time, moves, date: new Date() };
    this.solveHistory.unshift(record);
    
    // Keep only last 100 records
    if (this.solveHistory.length > 100) {
      this.solveHistory = this.solveHistory.slice(0, 100);
    }
    
    this.saveSolveHistory();
  }

  public getSolveHistory(): typeof this.solveHistory {
    return [...this.solveHistory];
  }

  public clearSolveHistory(): void {
    this.solveHistory = [];
    this.saveSolveHistory();
    this.notificationSystem.show('Solve history cleared', 'info');
  }

  public getSolveStatistics(): {
    totalSolves: number;
    bestTime: number;
    averageTime: number;
    averageMoves: number;
  } {
    if (this.solveHistory.length === 0) {
      return { totalSolves: 0, bestTime: 0, averageTime: 0, averageMoves: 0 };
    }

    const times = this.solveHistory.map(record => record.time);
    const moves = this.solveHistory.map(record => record.moves);

    return {
      totalSolves: this.solveHistory.length,
      bestTime: Math.min(...times),
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      averageMoves: moves.reduce((a, b) => a + b, 0) / moves.length
    };
  }

  /**
   * Notes management
   */
  public addNote(title: string, content: string): void {
    const note = {
      id: Date.now().toString(),
      title,
      content,
      date: new Date()
    };
    
    this.savedNotes.unshift(note);
    this.saveSavedNotes();
    this.notificationSystem.show('Note saved', 'success');
  }

  public deleteNote(id: string): void {
    this.savedNotes = this.savedNotes.filter(note => note.id !== id);
    this.saveSavedNotes();
    this.notificationSystem.show('Note deleted', 'info');
  }

  public getSavedNotes(): typeof this.savedNotes {
    return [...this.savedNotes];
  }

  public clearAllNotes(): void {
    this.savedNotes = [];
    this.saveSavedNotes();
    this.notificationSystem.show('All notes cleared', 'info');
  }

  /**
   * Theme management helpers
   */
  public switchColorTheme(themeName: string): boolean {
    const success = this.colorThemeManager.setCurrentColorTheme(themeName);
    if (success) {
      this.settingsManager.set('colorTheme', themeName);
      
      // Apply to cube if available
      const cube = this.cubeTypeManager.getCurrentCube();
      const colorScheme = this.colorThemeManager.getColorScheme(themeName);
      
      if (cube && colorScheme) {
        cube.updateColors(colorScheme);
      }
      
      this.notificationSystem.show(`Switched to ${themeName} theme`, 'success');
    } else {
      this.notificationSystem.show('Invalid theme name', 'error');
    }
    
    return success;
  }

  public generateRandomColorTheme(): void {
    const randomScheme = this.colorThemeManager.generateRandomColorScheme();
    this.colorThemeManager.addCustomColorTheme('random', randomScheme);
    this.switchColorTheme('random');
  }

  /**
   * Key mapping helpers
   */
  public updateKeyMappings(mappings: any): boolean {
    const validation = this.keyMappingManager.validateMappings(mappings);
    
    if (validation.valid) {
      const success = this.keyMappingManager.setMappings(mappings);
      if (success) {
        this.settingsManager.set('keyMappings', this.keyMappingManager.getCurrentMappings());
        this.notificationSystem.show('Key mappings updated', 'success');
        return true;
      }
    } else {
      validation.errors.forEach(error => {
        this.notificationSystem.show(error, 'error');
      });
    }
    
    return false;
  }

  public resetKeyMappings(): void {
    this.keyMappingManager.resetToDefault();
    this.settingsManager.set('keyMappings', this.keyMappingManager.getCurrentMappings());
    this.notificationSystem.show('Key mappings reset to default', 'success');
  }

  /**
   * Settings persistence
   */
  public exportSettings(): string {
    const settings = this.settingsManager.getSettings();
    const additionalData = {
      solveHistory: this.solveHistory,
      savedNotes: this.savedNotes,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify({ settings, data: additionalData }, null, 2);
  }

  public importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      
      if (imported.settings) {
        const result = this.settingsManager.importSettings(JSON.stringify(imported.settings));
        if (!result.success) {
          result.errors.forEach(error => {
            this.notificationSystem.show(error, 'error');
          });
          return false;
        }
      }
      
      if (imported.data) {
        if (imported.data.solveHistory) {
          this.solveHistory = imported.data.solveHistory;
          this.saveSolveHistory();
        }
        
        if (imported.data.savedNotes) {
          this.savedNotes = imported.data.savedNotes;
          this.saveSavedNotes();
        }
      }
      
      this.notificationSystem.show('Settings imported successfully', 'success');
      return true;
    } catch (error) {
      this.notificationSystem.show('Failed to import settings', 'error');
      return false;
    }
  }

  /**
   * Storage helpers
   */
  private loadSolveHistory(): void {
    try {
      const stored = localStorage.getItem('rubiks-cube-solve-history');
      if (stored) {
        this.solveHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load solve history:', error);
    }
  }

  private saveSolveHistory(): void {
    try {
      localStorage.setItem('rubiks-cube-solve-history', JSON.stringify(this.solveHistory));
    } catch (error) {
      console.error('Failed to save solve history:', error);
    }
  }

  private loadSavedNotes(): void {
    try {
      const stored = localStorage.getItem('rubiks-cube-saved-notes');
      if (stored) {
        this.savedNotes = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load saved notes:', error);
    }
  }

  private saveSavedNotes(): void {
    try {
      localStorage.setItem('rubiks-cube-saved-notes', JSON.stringify(this.savedNotes));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }
}
