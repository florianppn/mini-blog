import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../core/services/article.service';
import { CommentService } from '../../../core/services/comment.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { Article } from '../../../core/models/article.model';
import { Comment } from '../../../core/models/comment.model';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, MarkdownPipe],
  templateUrl: './article-detail.component.html'
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articleService = inject(ArticleService);
  private commentService = inject(CommentService);
  private confirmDialog = inject(ConfirmDialogService);
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

  async submitForReview(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Soumettre pour validation',
      message: 'Votre article sera transmis à l\'équipe d\'administration pour relecture. Vous ne pourrez plus le modifier pendant cette phase d\'examen (sauf en annulant la soumission).',
      confirmText: 'Soumettre l\'article',
      variant: 'info'
    });
    if (!confirmed) return;

    this.articleService.submitArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  async cancelReview(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Annuler la soumission',
      message: 'L\'article sera retiré de la file de validation et repassera en brouillon privé afin que vous puissiez le modifier à nouveau.',
      confirmText: 'Repasser en brouillon',
      variant: 'info'
    });
    if (!confirmed) return;

    this.articleService.cancelSubmission(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  async publishByAdmin(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Valider et publier l\'article',
      message: `L'article "${art.title}" va être rendu public et visible par tous les visiteurs.`,
      confirmText: 'Valider et publier',
      variant: 'success'
    });
    if (!confirmed) return;

    this.articleService.publishArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  async rejectByAdmin(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Renvoyer en brouillon',
      message: `L'article "${art.title}" sera renvoyé à son auteur afin qu'il puisse y apporter des modifications.`,
      confirmText: 'Renvoyer en brouillon',
      variant: 'warning'
    });
    if (!confirmed) return;

    this.articleService.rejectArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  async unpublishByAdmin(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Dépublier l\'article',
      message: `L'article "${art.title}" ne sera plus accessible aux lecteurs et sera retiré du flux public.`,
      confirmText: 'Dépublier l\'article',
      variant: 'warning'
    });
    if (!confirmed) return;

    this.articleService.unpublishArticle(art.id).subscribe({
      next: updated => this.article.set(updated)
    });
  }

  async deleteArticle(): Promise<void> {
    const art = this.article();
    if (!art) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer cet article',
      message: 'Cette action est irréversible. L\'article ainsi que l\'ensemble de ses commentaires associés seront définitivement supprimés.',
      confirmText: 'Supprimer définitivement',
      variant: 'danger'
    });
    if (!confirmed) return;

    this.articleService.deleteArticle(art.id).subscribe({
      next: () => {
        this.router.navigate(['/articles']);
      }
    });
  }

  canDeleteComment(comment: Comment): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (this.authService.isAdmin() || this.authService.isModerator()) return true;
    return comment.author.id === user.id;
  }

  async deleteComment(commentId: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le commentaire',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement ce commentaire ?',
      confirmText: 'Supprimer',
      variant: 'danger'
    });
    if (!confirmed) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update(list => list.filter(c => c.id !== commentId));
      }
    });
  }
}
