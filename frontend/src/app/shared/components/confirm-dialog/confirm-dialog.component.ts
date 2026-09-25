import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService, ConfirmVariant } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.dialogService.activeDialog()) {
      this.dialogService.handleCancel();
    }
  }

  @HostListener('window:keydown.enter')
  onEnter(): void {
    if (this.dialogService.activeDialog()) {
      this.dialogService.handleConfirm();
    }
  }

  getBadgeClass(variant?: ConfirmVariant): string {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border border-rose-100';
      case 'warning':
        return 'bg-amber-50 border border-amber-100';
      case 'success':
        return 'bg-emerald-50 border border-emerald-100';
      case 'info':
      default:
        return 'bg-indigo-50 border border-indigo-100';
    }
  }

  getButtonClass(variant?: ConfirmVariant): string {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20';
    }
  }
}
