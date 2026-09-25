import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  isBackendDown = signal<boolean>(false);
  errorMessage = signal<string>('Le serveur backend est actuellement indisponible.');
  retryCountdown = signal<number>(0);
  private timerId: any = null;

  setBackendDown(message?: string) {
    if (message) {
      this.errorMessage.set(message);
    }
    this.isBackendDown.set(true);

    if (this.retryCountdown() <= 0) {
      this.startCountdown(15);
    }
  }

  setBackendUp() {
    this.isBackendDown.set(false);
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.retryCountdown.set(0);
  }

  private startCountdown(seconds: number) {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.retryCountdown.set(seconds);
    this.timerId = setInterval(() => {
      const current = this.retryCountdown();
      if (current <= 1) {
        clearInterval(this.timerId);
        this.timerId = null;
        this.retryCountdown.set(0);
        // Déclencher une tentative automatique
        window.location.reload();
      } else {
        this.retryCountdown.set(current - 1);
      }
    }, 1000);
  }

  manualRetry() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.retryCountdown.set(0);
    window.location.reload();
  }
}
