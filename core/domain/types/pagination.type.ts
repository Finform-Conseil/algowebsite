export interface PaginatedResponse<T> {
  links: {
    next: string | null;
    previous: string | null;
    next_num: number | null;
    previous_num: number | null;
  };
  page_size: number;
  max_page_size: number;
  count: number;
  total_pages: number;
  current_page: number;
  data: T[];
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}