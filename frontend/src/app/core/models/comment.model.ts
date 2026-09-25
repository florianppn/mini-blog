import { User } from './user.model';

export interface Comment {
  id: number;
  content: string;
  articleId: number;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}
