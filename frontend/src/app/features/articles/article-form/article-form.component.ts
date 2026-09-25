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
  templateUrl: './article-form.component.html'
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
