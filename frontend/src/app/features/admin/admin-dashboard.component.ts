import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { Article, ArticleStatus } from '../../core/models/article.model';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, MarkdownPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-purple-100 text-purple-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Panneau d'Administration</h1>
          </div>
          <p class="text-slate-600 mt-1">Supervisez, validez et modérez l'ensemble des articles du MiniBlog.</p>
        </div>

        <a
          routerLink="/articles/nouveau"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl transition shadow-sm hover:shadow-indigo-500/25 text-sm self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel article
        </a>
      </div>

      <!-- Notification message -->
      @if (actionMessage()) {
        <div class="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ actionMessage() }}</span>
          </div>
          <button (click)="actionMessage.set('')" class="text-emerald-600 hover:text-emerald-900">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }

      <!-- Quick Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            {{ totalArticlesCount() }}
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Articles</div>
            <div class="text-lg font-bold text-slate-800">Toutes catégories</div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            {{ draftCount() }}
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider font-semibold text-slate-400">En attente / Brouillons</div>
            <div class="text-lg font-bold text-slate-800">À valider</div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            {{ publishedCount() }}
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider font-semibold text-slate-400">En Ligne</div>
            <div class="text-lg font-bold text-slate-800">Articles publiés</div>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            (click)="setStatusFilter(undefined)"
            [ngClass]="selectedStatus() === undefined ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900 font-medium'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition">
            Tous
          </button>
          <button
            (click)="setStatusFilter('DRAFT')"
            [ngClass]="selectedStatus() === 'DRAFT' ? 'bg-white text-amber-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900 font-medium'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            Brouillons ({{ draftCount() }})
          </button>
          <button
            (click)="setStatusFilter('PUBLISHED')"
            [ngClass]="selectedStatus() === 'PUBLISHED' ? 'bg-white text-emerald-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900 font-medium'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Publiés ({{ publishedCount() }})
          </button>
        </div>

        <!-- Search input -->
        <div class="relative w-full md:w-80">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Filtrer titre, contenu, auteur..."
            class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition" />
        </div>

      </div>

      <!-- Articles Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        @if (isLoading()) {
          <div class="flex justify-center items-center py-20">
            <div class="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          @if (filteredArticles().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th class="py-3.5 px-4">Article</th>
                    <th class="py-3.5 px-4">Auteur</th>
                    <th class="py-3.5 px-4">Statut</th>
                    <th class="py-3.5 px-4">Date</th>
                    <th class="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                  @for (article of filteredArticles(); track article.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      
                      <!-- Title & Details -->
                      <td class="py-4 px-4 max-w-sm">
                        <div class="font-bold text-slate-900 hover:text-purple-600 transition-colors cursor-pointer" (click)="openPreview(article)">
                          {{ article.title }}
                        </div>
                        <div class="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {{ article.content }}
                        </div>
                      </td>

                      <!-- Author -->
                      <td class="py-4 px-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {{ article.author.email.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <div class="text-xs font-medium text-slate-800">{{ article.author.email }}</div>
                            <span class="text-[10px] text-slate-400 font-semibold">{{ article.author.role }}</span>
                          </div>
                        </div>
                      </td>

                      <!-- Status -->
                      <td class="py-4 px-4 whitespace-nowrap">
                        @if (article.status === 'PUBLISHED') {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Publié
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Brouillon
                          </span>
                        }
                      </td>

                      <!-- Date -->
                      <td class="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        {{ article.createdAt | date:'dd/MM/yyyy HH:mm' }}
                      </td>

                      <!-- Actions -->
                      <td class="py-4 px-4 whitespace-nowrap text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          
                          <!-- Quick preview button -->
                          <button
                            (click)="openPreview(article)"
                            title="Aperçu rapide"
                            class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <!-- Publish / Unpublish button -->
                          @if (article.status === 'DRAFT') {
                            <button
                              (click)="publishArticle(article)"
                              [disabled]="isActionLoading(article.id)"
                              class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:opacity-50">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Publier
                            </button>
                          } @else {
                            <button
                              (click)="unpublishArticle(article)"
                              [disabled]="isActionLoading(article.id)"
                              class="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:opacity-50">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Dépublier
                            </button>
                          }

                          <!-- Edit button -->
                          <a
                            [routerLink]="['/articles', article.id, 'editer']"
                            title="Modifier l'article"
                            class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </a>

                          <!-- Delete button -->
                          <button
                            (click)="deleteArticle(article)"
                            [disabled]="isActionLoading(article.id)"
                            title="Supprimer l'article"
                            class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                        </div>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <span class="text-xs text-slate-500">
                  Page {{ currentPage() + 1 }} sur {{ totalPages() }}
                </span>
                <div class="flex items-center gap-2">
                  <button
                    (click)="loadPage(currentPage() - 1)"
                    [disabled]="currentPage() === 0"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-40 transition">
                    Précédent
                  </button>
                  <button
                    (click)="loadPage(currentPage() + 1)"
                    [disabled]="currentPage() >= totalPages() - 1"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-40 transition">
                    Suivant
                  </button>
                </div>
              </div>
            }
          } @else {
            <div class="py-16 text-center">
              <p class="text-slate-500 text-sm">Aucun article ne correspond aux filtres.</p>
            </div>
          }
        }
      </div>

      <!-- Preview Modal -->
      @if (previewArticle()) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                @if (previewArticle()!.status === 'PUBLISHED') {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Publié</span>
                } @else {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Brouillon</span>
                }
                <span class="text-xs text-slate-400">Par {{ previewArticle()!.author.email }}</span>
              </div>
              
              <button (click)="closePreview()" class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto flex-1">
              <h2 class="text-2xl font-extrabold text-slate-900 mb-4">{{ previewArticle()!.title }}</h2>
              <div class="markdown-content text-slate-700 leading-relaxed text-sm" [innerHTML]="previewArticle()!.content | markdown"></div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <a [routerLink]="['/articles', previewArticle()!.id]" (click)="closePreview()" class="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                Accéder à la page complète
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <div class="flex items-center gap-2">
                @if (previewArticle()!.status === 'DRAFT') {
                  <button
                    (click)="publishArticle(previewArticle()!); closePreview()"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">
                    Valider & Publier
                  </button>
                } @else {
                  <button
                    (click)="unpublishArticle(previewArticle()!); closePreview()"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition">
                    Dépublier
                  </button>
                }
                <button (click)="closePreview()" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition">
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private articleService = inject(ArticleService);

  articles = signal<Article[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  selectedStatus = signal<ArticleStatus | undefined>(undefined);
  searchQuery = '';
  actionMessage = signal<string>('');
  actionLoadingId = signal<number | null>(null);
  previewArticle = signal<Article | null>(null);

  totalArticlesCount = signal<number>(0);
  draftCount = signal<number>(0);
  publishedCount = signal<number>(0);

  ngOnInit(): void {
    this.loadPage(0);
    this.refreshMetrics();
  }

  refreshMetrics(): void {
    // Fetch count metrics
    this.articleService.getArticles(undefined, 0, 1000).subscribe({
      next: res => {
        const items = res.content || [];
        this.totalArticlesCount.set(items.length);
        this.draftCount.set(items.filter(a => a.status === 'DRAFT').length);
        this.publishedCount.set(items.filter(a => a.status === 'PUBLISHED').length);
      }
    });
  }

  loadPage(page: number): void {
    this.isLoading.set(true);
    this.articleService.getArticles(this.selectedStatus(), page, 15).subscribe({
      next: res => {
        this.articles.set(res.content || []);
        this.currentPage.set(res.page?.number ?? res.number ?? page);
        this.totalPages.set(res.page?.totalPages ?? res.totalPages ?? 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setStatusFilter(status?: ArticleStatus): void {
    this.selectedStatus.set(status);
    this.loadPage(0);
  }

  filteredArticles(): Article[] {
    let list = this.articles();
    if (this.selectedStatus()) {
      list = list.filter(a => a.status === this.selectedStatus());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.author.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  isActionLoading(id: number): boolean {
    return this.actionLoadingId() === id;
  }

  publishArticle(article: Article): void {
    this.actionLoadingId.set(article.id);
    this.articleService.publishArticle(article.id).subscribe({
      next: updated => {
        this.actionMessage.set(`L'article "${article.title}" a été publié avec succès.`);
        this.updateItemInList(updated);
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  unpublishArticle(article: Article): void {
    this.actionLoadingId.set(article.id);
    this.articleService.unpublishArticle(article.id).subscribe({
      next: updated => {
        this.actionMessage.set(`L'article "${article.title}" a été repassé au statut brouillon.`);
        this.updateItemInList(updated);
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  deleteArticle(article: Article): void {
    if (!confirm(`Confirmez-vous la suppression définitive de l'article "${article.title}" ? Ses commentaires seront également effacés.`)) {
      return;
    }
    this.actionLoadingId.set(article.id);
    this.articleService.deleteArticle(article.id).subscribe({
      next: () => {
        this.actionMessage.set(`L'article "${article.title}" a été supprimé.`);
        this.articles.update(list => list.filter(a => a.id !== article.id));
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  openPreview(article: Article): void {
    this.previewArticle.set(article);
  }

  closePreview(): void {
    this.previewArticle.set(null);
  }

  private updateItemInList(updated: Article): void {
    this.articles.update(list => list.map(a => a.id === updated.id ? updated : a));
  }
}
