export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  content: T[];
  page?: PageMetadata;
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}
