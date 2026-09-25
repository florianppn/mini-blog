import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.component.html'
})
export class AccountSettingsComponent {
  accountService = inject(AccountService);
  authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  // Formulaire Email
  newEmail = '';
  emailCurrentPassword = '';
  emailLoading = signal<boolean>(false);
  emailSuccess = signal<string>('');
  emailError = signal<string>('');

  // Formulaire Mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = signal<boolean>(false);
  passwordSuccess = signal<string>('');
  passwordError = signal<string>('');

  // Formulaire Suppression de compte
  deletePassword = '';
  deleteLoading = signal<boolean>(false);
  deleteError = signal<string>('');

  updateEmail(): void {
    this.emailError.set('');
    this.emailSuccess.set('');

    if (!this.newEmail.trim()) {
      this.emailError.set('Veuillez renseigner une nouvelle adresse email.');
      return;
    }
    if (!this.emailCurrentPassword) {
      this.emailError.set('Veuillez saisir votre mot de passe actuel pour valider ce changement.');
      return;
    }

    this.emailLoading.set(true);
    this.accountService.changeEmail({
      newEmail: this.newEmail.trim(),
      currentPassword: this.emailCurrentPassword
    }).subscribe({
      next: () => {
        this.emailLoading.set(false);
        this.emailSuccess.set('Votre adresse email a été modifiée avec succès.');
        this.newEmail = '';
        this.emailCurrentPassword = '';
      },
      error: err => {
        this.emailLoading.set(false);
        this.emailError.set(err.error?.message || 'Une erreur est survenue lors du changement d\'email.');
      }
    });
  }

  updatePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (!this.currentPassword) {
      this.passwordError.set('Veuillez saisir votre mot de passe actuel.');
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.passwordError.set('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    this.passwordLoading.set(true);
    this.accountService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordSuccess.set('Votre mot de passe a été mis à jour avec succès.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: err => {
        this.passwordLoading.set(false);
        this.passwordError.set(err.error?.message || 'Une erreur est survenue lors du changement de mot de passe.');
      }
    });
  }

  async deleteAccount(): Promise<void> {
    this.deleteError.set('');

    if (!this.deletePassword) {
      this.deleteError.set('Veuillez saisir votre mot de passe pour confirmer la suppression.');
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer définitivement mon compte',
      message: 'Êtes-vous absolument sûr ? Cette action est irréversible : votre compte sera supprimé, ainsi que l\'intégralité de vos articles (publiés et brouillons) et tous vos commentaires.',
      confirmText: 'Supprimer mon compte et mes données',
      variant: 'danger'
    });
    if (!confirmed) return;

    this.deleteLoading.set(true);
    this.accountService.deleteAccount({ currentPassword: this.deletePassword }).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.router.navigate(['/login'], {
          queryParams: { deleted: 'true' }
        });
      },
      error: err => {
        this.deleteLoading.set(false);
        this.deleteError.set(err.error?.message || 'Échec de la suppression du compte.');
      }
    });
  }
}
