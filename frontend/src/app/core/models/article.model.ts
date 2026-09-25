import { User } from './user.model';

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';

export interface Article {
  id: number;
  title: string;
  content: string;
  status: ArticleStatus;
  author: User;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface ArticleCreateRequest {
  title: string;
  content: string;
}

export interface ArticleUpdateRequest {
  title: string;
  content: string;
}
