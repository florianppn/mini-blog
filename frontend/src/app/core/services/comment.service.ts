import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CommentCreateRequest, CommentUpdateRequest } from '../models/comment.model';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private http = inject(HttpClient);

  getComments(articleId: number, page = 0, size = 20): Observable<Page<Comment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<Comment>>(`/api/articles/${articleId}/comments`, { params });
  }

  addComment(articleId: number, content: string): Observable<Comment> {
    const body: CommentCreateRequest = { content };
    return this.http.post<Comment>(`/api/articles/${articleId}/comments`, body);
  }

  updateComment(commentId: number, content: string): Observable<Comment> {
    const body: CommentUpdateRequest = { content };
    return this.http.put<Comment>(`/api/comments/${commentId}`, body);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`/api/comments/${commentId}`);
  }
}
