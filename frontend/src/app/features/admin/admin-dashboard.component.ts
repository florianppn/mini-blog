import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Article, ArticleStatus } from '../../core/models/article.model';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, MarkdownPipe],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private articleService = inject(ArticleService);
  private confirmDialog = inject(ConfirmDialogService);

  articles = signal<Article[]>([]);
  totalArticlesCount = signal<number>(0);
  pendingCount = signal<number>(0);
  publishedCount = signal<number>(0);

  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(true);

  selectedStatus = signal<ArticleStatus | undefined>(undefined);
  searchQuery = '';

  previewArticle = signal<Article | null>(null);
  actionLoadingId = signal<number | null>(null);
  actionMessage = signal<string>('');

  ngOnInit(): void {
    this.loadPage(0);
    this.refreshMetrics();
  }

  refreshMetrics(): void {
    this.articleService.getArticles(undefined, 0, 1000).subscribe({
      next: res => {
        const items = res.content || [];
        this.totalArticlesCount.set(items.length);
        this.pendingCount.set(items.filter(a => a.status === 'PENDING_REVIEW').length);
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

  async publishArticle(article: Article): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Valider et publier l\'article',
      message: `L'article "${article.title}" va être rendu public. Il apparaîtra immédiatement sur la page d'accueil et le flux d'articles pour l'ensemble des visiteurs et des lecteurs.`,
      confirmText: 'Valider & Publier',
      variant: 'success'
    });
    if (!confirmed) return;

    this.actionLoadingId.set(article.id);
    this.articleService.publishArticle(article.id).subscribe({
      next: updated => {
        this.actionMessage.set(`L'article "${article.title}" a été validé et publié avec succès.`);
        this.updateItemInList(updated);
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  async rejectArticle(article: Article): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Renvoyer en brouillon',
      message: `L'article "${article.title}" sera renvoyé à son auteur afin qu'il puisse y apporter des modifications. Il disparaîtra de la file d'attente de validation.`,
      confirmText: 'Renvoyer en brouillon',
      variant: 'warning'
    });
    if (!confirmed) return;

    this.actionLoadingId.set(article.id);
    this.articleService.rejectArticle(article.id).subscribe({
      next: () => {
        this.actionMessage.set(`L'article "${article.title}" a été renvoyé en brouillon à son auteur.`);
        this.articles.update(list => list.filter(a => a.id !== article.id));
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  async unpublishArticle(article: Article): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Dépublier l\'article',
      message: `L'article "${article.title}" ne sera plus accessible aux lecteurs. Il repassera au statut de révision et sera retiré du flux public.`,
      confirmText: 'Dépublier l\'article',
      variant: 'warning'
    });
    if (!confirmed) return;

    this.actionLoadingId.set(article.id);
    this.articleService.unpublishArticle(article.id).subscribe({
      next: () => {
        this.actionMessage.set(`L'article "${article.title}" a été dépublié et renvoyé en révision.`);
        this.articles.update(list => list.filter(a => a.id !== article.id));
        this.refreshMetrics();
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null)
    });
  }

  async deleteArticle(article: Article): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer définitivement cet article',
      message: `Confirmez-vous la suppression définitive de l'article "${article.title}" ? Ses commentaires seront également effacés et cette action est irréversible.`,
      confirmText: 'Supprimer définitivement',
      variant: 'danger'
    });
    if (!confirmed) return;

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
