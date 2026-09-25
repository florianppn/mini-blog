import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article, ArticleCreateRequest, ArticleStatus, ArticleUpdateRequest } from '../models/article.model';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/articles';

  getArticles(status?: ArticleStatus, page = 0, size = 10): Observable<Page<Article>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Page<Article>>(this.baseUrl, { params });
  }

  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/${id}`);
  }

  createArticle(request: ArticleCreateRequest): Observable<Article> {
    return this.http.post<Article>(this.baseUrl, request);
  }

  updateArticle(id: number, request: ArticleUpdateRequest): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/${id}`, request);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  publishArticle(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.baseUrl}/${id}/publish`, {});
  }

  unpublishArticle(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.baseUrl}/${id}/unpublish`, {});
  }
}
