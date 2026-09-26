import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { UserService } from '../../core/services/user.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Article, ArticleStatus } from '../../core/models/article.model';
import { User, Role } from '../../core/models/user.model';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, MarkdownPipe],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private articleService = inject(ArticleService);
  private userService = inject(UserService);
  private confirmDialog = inject(ConfirmDialogService);

  activeSection = signal<'articles' | 'users'>('articles');

  articles = signal<Article[]>([]);
  totalArticlesCount = signal<number>(0);
  pendingCount = signal<number>(0);
  publishedCount = signal<number>(0);

  users = signal<User[]>([]);
  usersLoading = signal<boolean>(false);
  userActionLoadingId = signal<number | null>(null);
  userSearchQuery = '';
  selectedRole = signal<string | undefined>(undefined);

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
    this.loadUsers();
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
      confirmText: 'Valider et publier',
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

  loadUsers(): void {
    this.usersLoading.set(true);
    this.userService.getUsers().subscribe({
      next: data => {
        this.users.set(data);
        this.usersLoading.set(false);
      },
      error: () => {
        this.usersLoading.set(false);
      }
    });
  }

  countModerators(): number {
    return this.users().filter(u => u.role === 'ROLE_MODERATOR').length;
  }

  countAuthors(): number {
    return this.users().filter(u => u.role === 'ROLE_USER').length;
  }

  countAdmins(): number {
    return this.users().filter(u => u.role === 'ROLE_ADMIN').length;
  }

  setRoleFilter(role: string | undefined): void {
    this.selectedRole.set(role);
  }

  filteredUsers(): User[] {
    let list = this.users();
    if (this.selectedRole()) {
      list = list.filter(u => u.role === this.selectedRole());
    }
    if (this.userSearchQuery.trim()) {
      const q = this.userSearchQuery.toLowerCase();
      list = list.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return list;
  }

  isUserActionLoading(id: number): boolean {
    return this.userActionLoadingId() === id;
  }

  async promoteToModerator(user: User): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Promouvoir en Modérateur',
      message: `Souhaitez-vous accorder les privilèges de modération à l'utilisateur ${user.email} ? Il pourra supprimer n'importe quel commentaire sur l'ensemble de la plateforme tout en conservant ses droits d'auteur.`,
      confirmText: 'Promouvoir Modérateur',
      variant: 'info'
    });
    if (!confirmed) return;

    this.userActionLoadingId.set(user.id);
    this.userService.updateUserRole(user.id, 'ROLE_MODERATOR').subscribe({
      next: updated => {
        this.actionMessage.set(`L'utilisateur ${user.email} est désormais Modérateur.`);
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.userActionLoadingId.set(null);
      },
      error: () => this.userActionLoadingId.set(null)
    });
  }

  async demoteToAuthor(user: User): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Rétrograder en Auteur',
      message: `Êtes-vous sûr de vouloir retirer les privilèges de modérateur de l'utilisateur ${user.email} ? Il redeviendra un simple Auteur sans droit de modération sur les commentaires tiers.`,
      confirmText: 'Rétrograder en Auteur',
      variant: 'warning'
    });
    if (!confirmed) return;

    this.userActionLoadingId.set(user.id);
    this.userService.updateUserRole(user.id, 'ROLE_USER').subscribe({
      next: updated => {
        this.actionMessage.set(`L'utilisateur ${user.email} a été rétrogradé au rôle d'Auteur.`);
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.userActionLoadingId.set(null);
      },
      error: () => this.userActionLoadingId.set(null)
    });
  }
}

