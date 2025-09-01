/**
 * Notification System
 * Shows toast notifications to the user
 */
export class NotificationSystem {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show a notification
   */
  public show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas ${this.getIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    this.container.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto hide
    setTimeout(() => {
      this.hide(notification);
    }, duration);

    // Manual hide on click
    notification.addEventListener('click', () => {
      this.hide(notification);
    });
  }

  /**
   * Hide a notification
   */
  private hide(notification: HTMLElement): void {
    notification.classList.remove('show');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Get icon for notification type
   */
  private getIcon(type: 'success' | 'error' | 'info'): string {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'info':
      default:
        return 'fa-info-circle';
    }
  }

  /**
   * Show success notification
   */
  public success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  public error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show info notification
   */
  public info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /**
   * Clear all notifications
   */
  public clear(): void {
    const notifications = this.container.querySelectorAll('.notification');
    notifications.forEach(notification => {
      this.hide(notification as HTMLElement);
    });
  }

  /**
   * Dispose of the notification system
   */
  public dispose(): void {
    this.clear();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
