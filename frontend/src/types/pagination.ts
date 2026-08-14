export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  search?: string;
  page?: number;
  pageSize?: number;
}
