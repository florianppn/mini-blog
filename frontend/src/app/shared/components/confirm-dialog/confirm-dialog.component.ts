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
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'info':
      default:
        return 'bg-zinc-100 text-zinc-800 border border-zinc-200';
    }
  }

  getButtonClass(variant?: ConfirmVariant): string {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success':
      case 'info':
      default:
        return 'bg-zinc-900 hover:bg-zinc-800 text-white';
    }
  }
}
