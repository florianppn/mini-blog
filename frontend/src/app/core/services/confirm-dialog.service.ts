import { Injectable, signal } from '@angular/core';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private state = signal<DialogState | null>(null);

  readonly activeDialog = this.state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        ...options,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        variant: options.variant || 'info',
        resolve
      });
    });
  }

  handleConfirm(): void {
    const current = this.state();
    if (current) {
      current.resolve(true);
      this.state.set(null);
    }
  }

  handleCancel(): void {
    const current = this.state();
    if (current) {
      current.resolve(false);
      this.state.set(null);
    }
  }
}
