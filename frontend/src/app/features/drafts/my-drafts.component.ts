import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Article } from '../../core/models/article.model';

@Component({
  selector: 'app-my-drafts',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Mes Articles en cours
            <span class="px-2.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 font-bold">
              {{ drafts().length }}
            </span>
          </h1>
          <p class="text-sm text-slate-600 mt-1">
            Gérez vos brouillons et suivez vos articles soumis pour validation.
          </p>
        </div>

        <a
          routerLink="/articles/nouveau"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-sm hover:shadow-indigo-500/25">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel article
        </a>
      </div>

      <!-- Info Alert Box -->
      <div class="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-slate-700">
        <svg class="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-xs leading-relaxed">
          <p class="font-semibold text-slate-900 mb-0.5">Cycle de vie des articles :</p>
          <ul class="list-disc pl-4 space-y-1 text-slate-600">
            <li><strong>Brouillon</strong> : visible uniquement par vous. Vous pouvez le modifier, le supprimer ou le soumettre pour validation.</li>
            <li><strong>En attente de validation</strong> : gelé en cours d'examen par l'administrateur. Vous pouvez annuler la soumission à tout moment pour reprendre vos modifications.</li>
            <li><strong>Publié</strong> : validé par l'administrateur et accessible à tous les lecteurs sur le site.</li>
          </ul>
        </div>
      </div>

      <!-- Drafts List -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (drafts().length > 0) {
        <div class="space-y-4">
          @for (draft of drafts(); track draft.id) {
            <div class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  @if (draft.status === 'PENDING_REVIEW') {
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                      En attente de validation
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Brouillon
                    </span>
                  }
                  <span class="text-xs text-slate-400">
                    Dernière modification : {{ draft.updatedAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>

                <h3 class="text-lg font-bold text-slate-900 hover:text-indigo-600 transition truncate">
                  <a [routerLink]="['/articles', draft.id]">
                    {{ draft.title }}
                  </a>
                </h3>

                <p class="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {{ draft.content }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
                <a
                  [routerLink]="['/articles', draft.id]"
                  class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  title="Consulter l'article">
                  Consulter
                </a>

                @if (draft.status === 'DRAFT') {
                  <a
                    [routerLink]="['/articles', draft.id, 'editer']"
                    class="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
                    Modifier
                  </a>
                  <button
                    (click)="submitForReview(draft.id)"
                    class="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                    title="Soumettre pour validation à l'administrateur">
                    Soumettre pour validation
                  </button>
                  <button
                    (click)="deleteDraft(draft.id)"
                    class="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                    Supprimer
                  </button>
                } @else if (draft.status === 'PENDING_REVIEW') {
                  <button
                    (click)="cancelReview(draft.id)"
                    class="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                    title="Annuler la soumission pour modifier le brouillon">
                    Annuler la soumission
                  </button>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Aucun article en cours</h3>
          <p class="text-slate-500 text-sm mt-1 mb-6">
            Vous n'avez aucun article au statut brouillon ou en attente. Commencez à rédiger dès maintenant !
          </p>
          <a routerLink="/articles/nouveau" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Créer un article
          </a>
        </div>
      }

    </div>
  `
})
export class MyDraftsComponent implements OnInit {
  private articleService = inject(ArticleService);
  private confirmDialog = inject(ConfirmDialogService);

  drafts = signal<Article[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.isLoading.set(true);
    this.articleService.getMyArticles(0, 50).subscribe({
      next: res => {
        this.drafts.set(res.content || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  async submitForReview(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Soumettre pour validation',
      message: 'Votre article sera transmis à l\'équipe d\'administration pour relecture. Vous ne pourrez plus le modifier pendant cette phase d\'examen (sauf en annulant la soumission).',
      confirmText: 'Soumettre l\'article',
      variant: 'info'
    });
    if (!confirmed) return;

    this.articleService.submitArticle(id).subscribe({
      next: updated => {
        this.drafts.update(list => list.map(d => d.id === id ? updated : d));
      }
    });
  }

  async cancelReview(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Annuler la soumission',
      message: 'L\'article sera retiré de la file de validation et repassera en brouillon privé afin que vous puissiez le modifier à nouveau.',
      confirmText: 'Repasser en brouillon',
      variant: 'info'
    });
    if (!confirmed) return;

    this.articleService.cancelSubmission(id).subscribe({
      next: updated => {
        this.drafts.update(list => list.map(d => d.id === id ? updated : d));
      }
    });
  }

  async deleteDraft(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer ce brouillon',
      message: 'Cette action est irréversible. Le brouillon et toutes ses données associées seront définitivement supprimés.',
      confirmText: 'Supprimer définitivement',
      variant: 'danger'
    });
    if (!confirmed) return;

    this.articleService.deleteArticle(id).subscribe({
      next: () => {
        this.drafts.update(list => list.filter(d => d.id !== id));
      }
    });
  }
}
