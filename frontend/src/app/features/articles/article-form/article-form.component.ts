import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { AuthService } from '../../../core/services/auth.service';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MarkdownPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      <!-- Back link -->
      <a [routerLink]="isEditMode ? ['/articles', articleId] : '/mes-brouillons'" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ isEditMode ? 'Annuler et revenir à l\'article' : 'Retour à mes brouillons' }}
      </a>

      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
        
        <div class="flex items-center justify-between pb-6 border-b border-slate-100 mb-8">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {{ isEditMode ? 'Modifier l\'article' : 'Rédiger un nouvel article' }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              {{ isEditMode ? 'Mettez à jour le contenu de votre brouillon avant publication.' : 'Votre article sera enregistré au statut DRAFT et soumis à validation administrateur.' }}
            </p>
          </div>

          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            Statut : DRAFT
          </span>
        </div>

        @if (errorMessage()) {
          <div class="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          
          <!-- Title Input -->
          <div class="mb-6">
            <label for="title" class="block text-sm font-semibold text-slate-900 mb-2">
              Titre de l'article <span class="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="Ex: Architecture événementielle avec Spring Boot et Kafka..."
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition" />
            @if (form.get('title')?.touched && form.get('title')?.invalid) {
              <p class="text-xs text-rose-600 mt-1.5 font-medium">
                Le titre est obligatoire et ne doit pas dépasser 255 caractères.
              </p>
            }
          </div>

          <!-- Content Mode Toggle (Edit / Preview) -->
          <div class="mb-2 flex items-center justify-between">
            <label for="content" class="block text-sm font-semibold text-slate-900">
              Contenu (Markdown supporté) <span class="text-rose-500">*</span>
            </label>

            <div class="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                (click)="activeTab = 'write'"
                [ngClass]="activeTab === 'write' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                class="px-3 py-1 rounded-md transition">
                Écrire
              </button>
              <button
                type="button"
                (click)="activeTab = 'preview'"
                [ngClass]="activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                class="px-3 py-1 rounded-md transition">
                Aperçu Markdown
              </button>
            </div>
          </div>

          <!-- Content Input or Preview -->
          <div class="mb-8">
            @if (activeTab === 'write') {
              <textarea
                id="content"
                formControlName="content"
                rows="14"
                placeholder="Rédigez votre article en utilisant la syntaxe Markdown : # Titre, **gras**, code, etc."
                class="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y"></textarea>
            } @else {
              <div class="w-full min-h-[350px] p-6 bg-slate-50/70 border border-slate-200 rounded-2xl markdown-content">
                @if (form.get('content')?.value) {
                  <div [innerHTML]="form.get('content')?.value | markdown"></div>
                } @else {
                  <p class="text-slate-400 italic text-sm">Rien à prévisualiser pour le moment.</p>
                }
              </div>
            }

            @if (form.get('content')?.touched && form.get('content')?.invalid) {
              <p class="text-xs text-rose-600 mt-1.5 font-medium">
                Le contenu de l'article ne peut pas être vide.
              </p>
            }
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              [routerLink]="isEditMode ? ['/articles', articleId] : '/mes-brouillons'"
              class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || isSubmitting()"
              class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-sm hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              @if (isSubmitting()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              }
              {{ isEditMode ? 'Enregistrer les modifications' : 'Enregistrer le brouillon' }}
            </button>
          </div>

        </form>

      </div>
    </div>
  `
})
export class ArticleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articleService = inject(ArticleService);
  authService = inject(AuthService);

  isEditMode = false;
  articleId: number | null = null;
  activeTab: 'write' | 'preview' = 'write';
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    content: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.articleId = Number(idParam);
      this.loadArticle(this.articleId);
    }
  }

  loadArticle(id: number): void {
    this.articleService.getArticleById(id).subscribe({
      next: art => {
        // Règle stricte : si l'article est PUBLISHED et qu'on n'est pas admin, redirection
        if (art.status === 'PUBLISHED' && !this.authService.isAdmin()) {
          alert('Cet article est déjà publié et ne peut plus être modifié par son auteur.');
          this.router.navigate(['/articles', id]);
          return;
        }

        this.form.patchValue({
          title: art.title,
          content: art.content
        });
      },
      error: () => {
        this.errorMessage.set('Impossible de charger l\'article spécifié.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { title, content } = this.form.value;

    if (this.isEditMode && this.articleId) {
      this.articleService.updateArticle(this.articleId, { title, content }).subscribe({
        next: updated => {
          this.isSubmitting.set(false);
          this.router.navigate(['/articles', updated.id]);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour de l\'article.');
        }
      });
    } else {
      this.articleService.createArticle({ title, content }).subscribe({
        next: created => {
          this.isSubmitting.set(false);
          this.router.navigate(['/mes-brouillons']);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création de l\'article.');
        }
      });
    }
  }
}
