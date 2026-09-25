import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  passwordMismatch(): boolean {
    const p1 = this.registerForm.get('password')?.value;
    const p2 = this.registerForm.get('confirmPassword')?.value;
    return !!p2 && p1 !== p2;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.registerForm.value;

    this.authService.register({ email, password }).subscribe({
      next: () => {
        // Automatically log in after registration
        this.authService.login({ email, password }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/articles']);
          },
          error: () => {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
          }
        });
      },
      error: err => {
        this.isLoading.set(false);
        if (err.status === 409 || (err.error?.message && err.error.message.includes('déjà utilisé'))) {
          this.errorMessage.set('Cette adresse email est déjà associée à un compte.');
        } else {
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création du compte.');
        }
      }
    });
  }
}
