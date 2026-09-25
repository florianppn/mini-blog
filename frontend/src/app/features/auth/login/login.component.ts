import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Connexion à votre compte</h2>
          <p class="mt-2 text-sm text-slate-600">
            Ou
            <a routerLink="/register" class="font-semibold text-indigo-600 hover:text-indigo-500 transition">
              créez un nouveau compte auteur gratuitement
            </a>
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5">
          
          <!-- Error alert -->
          @if (errorMessage()) {
            <div class="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <svg class="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Adresse Email
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="votre@email.com"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition" />
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <p class="text-rose-600 text-xs mt-1">Veuillez renseigner un email valide.</p>
              }
            </div>

            <div>
              <label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition" />
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <p class="text-rose-600 text-xs mt-1">Le mot de passe est obligatoire.</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading()"
              class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl transition shadow-md hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              @if (isLoading()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion en cours...</span>
              } @else {
                <span>Se connecter</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
            </button>
          </form>

          <!-- Quick Fill Demo Shortcut -->
          <div class="mt-8 pt-6 border-t border-slate-100">
            <p class="text-xs text-slate-500 mb-3 text-center font-medium">Comptes de test rapide :</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="fillCredentials('admin@miniblog.com', 'adminPassword123!')"
                class="py-2 px-3 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition text-center">
                👑 Admin Seed
              </button>
              <button
                type="button"
                (click)="fillCredentials('author@miniblog.com', 'authorPassword123!')"
                class="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-center">
                ✍️ Remplir Auteur
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  fillCredentials(email: string, pass: string): void {
    this.loginForm.patchValue({ email, password: pass });
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: res => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user?.role === 'ROLE_ADMIN' || this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/articles']);
        }
      },
      error: err => {
        this.isLoading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
        } else {
          this.errorMessage.set(err.error?.message || 'Erreur lors de la connexion. Veuillez réessayer.');
        }
      }
    });
  }
}
