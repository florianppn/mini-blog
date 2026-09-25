import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../core/services/article.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Article } from '../../../core/models/article.model';
import { Comment } from '../../../core/models/comment.model';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, MarkdownPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      <!-- Back navigation button -->
      <div class="mb-6">
        <a routerLink="/articles" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux articles
        </a>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-24">
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (article()) {
        <article class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm mb-10">
          
          <!-- Article Meta Header -->
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div class="flex items-center gap-3">
              @if (isAuthorOrAdmin()) {
                @if (article()!.status === 'PUBLISHED') {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Publié
                  </span>
                } @else if (article()!.status === 'PENDING_REVIEW') {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    En attente de validation
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    Brouillon
                  </span>
                }
              }

              <span class="text-xs text-slate-400">
                {{ article()!.status === 'PUBLISHED' ? 'Publié le ' : 'Mis à jour le ' }}
                {{ article()!.updatedAt | date:'dd MMMM yyyy à HH:mm' }}
              </span>
            </div>

            <!-- Actions (Workflow, Edit, Delete) -->
            <div class="flex items-center gap-2 flex-wrap">
              @if (isAuthor() && article()!.status === 'DRAFT') {
                <a
                  [routerLink]="['/articles', article()!.id, 'editer']"
                  class="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
                  Modifier
                </a>
                <button
                  (click)="submitForReview()"
                  class="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm">
                  Soumettre pour validation
                </button>
                <button
                  (click)="deleteArticle()"
                  class="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                  Supprimer
                </button>
              }

              @if (isAuthor() && article()!.status === 'PENDING_REVIEW') {
                <button
                  (click)="cancelReview()"
                  class="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition">
                  Annuler la soumission
                </button>
              }

              @if (authService.isAdmin()) {
                @if (article()!.status === 'PENDING_REVIEW') {
                  <button
                    (click)="publishByAdmin()"
                    class="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm">
                    Valider & Publier
                  </button>
                  <button
                    (click)="rejectByAdmin()"
                    class="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition">
                    Renvoyer en brouillon
                  </button>
                } @else if (article()!.status === 'PUBLISHED') {
                  <button
                    (click)="unpublishByAdmin()"
                    class="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition">
                    Dépublier
                  </button>
                }
                <button
                  (click)="deleteArticle()"
                  class="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                  Supprimer
                </button>
              }
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-6 leading-tight">
            {{ article()!.title }}
          </h1>

          <!-- Author Box -->
          <div class="flex items-center gap-3 mt-4 mb-8">
            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
              {{ article()!.author.email.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-900">{{ article()!.author.email }}</div>
            </div>
          </div>

          <!-- Content (Markdown Rendered) -->
          <div class="markdown-content text-slate-700 leading-relaxed text-base pt-4 border-t border-slate-100" [innerHTML]="article()!.content | markdown">
          </div>

        </article>

        <!-- Comments Section -->
        <section class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
          <div class="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              Commentaires
              <span class="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-semibold">
                {{ comments().length }}
              </span>
            </h3>
          </div>

          <!-- Add Comment Form -->
          @if (article()!.status === 'PUBLISHED') {
            @if (authService.isAuthenticated()) {
              <form (ngSubmit)="submitComment()" class="mb-8">
                <div class="mb-3">
                  <label for="commentInput" class="block text-xs font-medium text-slate-700 mb-1">
                    Ajouter un commentaire
                  </label>
                  <textarea
                    id="commentInput"
                    [(ngModel)]="newCommentText"
                    name="comment"
                    rows="3"
                    required
                    placeholder="Partagez votre avis, vos questions ou vos retours sur cet article..."
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"></textarea>
                </div>
                <div class="flex justify-end">
                  <button
                    type="submit"
                    [disabled]="!newCommentText.trim() || isSubmittingComment()"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition shadow-sm hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isSubmittingComment() ? 'Envoi...' : 'Publier le commentaire' }}
                  </button>
                </div>
              </form>
            } @else {
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center mb-8">
                <p class="text-xs text-slate-600">
                  <a routerLink="/login" class="text-indigo-600 font-semibold hover:underline">Connectez-vous</a> pour participer à la discussion et laisser un commentaire.
                </p>
              </div>
            }
          } @else {
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center mb-8">
              <p class="text-xs text-amber-800">
                Cet article n'est pas encore publié. Les commentaires seront autorisés dès sa validation par un administrateur.
              </p>
            </div>
          }

          <!-- Comments List -->
          @if (comments().length > 0) {
            <div class="space-y-4">
              @for (comment of comments(); track comment.id) {
                <div class="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3 flex-1 min-w-0">
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {{ comment.author.email.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-slate-900 truncate">{{ comment.author.email }}</span>
                        <span class="text-[10px] text-slate-400">{{ comment.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <p class="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                        {{ comment.content }}
                      </p>
                    </div>
                  </div>

                  @if (canDeleteComment(comment)) {
                    <button
                      (click)="deleteComment(comment.id)"
                      class="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Supprimer le commentaire">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="text-center text-sm text-slate-400 py-6">
              Aucun commentaire pour le moment. Soyez le premier à réagir !
            </p>
          }
        </section>
      } @else {
        <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Article introuvable</h2>
          <p class="text-slate-500 text-sm mb-6">Cet article n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
          <a routerLink="/articles" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Retour aux articles
          </a>
        </div>
      }

    </div>
  `
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articleService = inject(ArticleService);
  private commentService = inject(CommentService);
  public authService = inject(AuthService);

  article = signal<Article | null>(null);
  comments = signal<Comment[]>([]);
  isLoading = signal<boolean>(true);
  isSubmittingComment = signal<boolean>(false);
  newCommentText = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.loadArticle(id);
    }
  }

  loadArticle(id: number): void {
    this.isLoading.set(true);
    this.articleService.getArticleById(id).subscribe({
      next: art => {
        this.article.set(art);
        this.isLoading.set(false);
        this.loadComments(id);
      },
      error: () => {
        this.article.set(null);
        this.isLoading.set(false);
      }
    });
  }

  loadComments(articleId: number): void {
    this.commentService.getComments(articleId).subscribe({
      next: res => {
        this.comments.set(res.content || []);
      }
    });
  }

  submitComment(): void {
    const art = this.article();
    if (!art || !this.newCommentText.trim()) return;

    this.isSubmittingComment.set(true);
    this.commentService.addComment(art.id, this.newCommentText.trim()).subscribe({
      next: created => {
        this.comments.update(list => [created, ...list]);
        this.newCommentText = '';
        this.isSubmittingComment.set(false);
      },
      error: () => {
        this.isSubmittingComment.set(false);
      }
    });
  }

  isAuthor(): boolean {
    const art = this.article();
    const user = this.authService.currentUser();
    if (!art || !user) return false;
    return art.author.id === user.id;
  }

  isAuthorOrAdmin(): boolean {
    const art = this.article();
    const user = this.authService.currentUser();
    if (!art || !user) return false;
    return this.authService.isAdmin() || art.author.id === user.id;
  }

  submitForReview(): void {
    const art = this.article();
    if (!art) return;
    this.articleService.submitArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  cancelReview(): void {
    const art = this.article();
    if (!art) return;
    this.articleService.cancelSubmission(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  publishByAdmin(): void {
    const art = this.article();
    if (!art) return;
    this.articleService.publishArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  rejectByAdmin(): void {
    const art = this.article();
    if (!art) return;
    this.articleService.rejectArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  unpublishByAdmin(): void {
    const art = this.article();
    if (!art) return;
    this.articleService.unpublishArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  deleteArticle(): void {
    const art = this.article();
    if (!art) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articleService.deleteArticle(art.id).subscribe({
        next: () => {
          this.router.navigate(['/articles']);
        }
      });
    }
  }

  canDeleteComment(comment: Comment): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (this.authService.isAdmin()) return true;
    return comment.author.id === user.id;
  }

  deleteComment(commentId: number): void {
    if (confirm('Voulez-vous supprimer ce commentaire ?')) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments.update(list => list.filter(c => c.id !== commentId));
        }
      });
    }
  }
}
