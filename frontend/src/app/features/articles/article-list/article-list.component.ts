import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../core/services/article.service';
import { Article } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './article-list.component.html'
})
export class ArticleListComponent implements OnInit {
  private articleService = inject(ArticleService);

  articles = signal<Article[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  searchQuery = '';

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.isLoading.set(true);
    this.articleService.getArticles('PUBLISHED', page, 9).subscribe({
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

  filteredArticles(): Article[] {
    if (!this.searchQuery.trim()) {
      return this.articles();
    }
    const q = this.searchQuery.toLowerCase();
    return this.articles().filter(a =>
      a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }
}
