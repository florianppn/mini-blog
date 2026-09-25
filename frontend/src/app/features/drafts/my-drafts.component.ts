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
  templateUrl: './my-drafts.component.html'
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
