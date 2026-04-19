export interface DocumentEntity {
  id: string;
  title: string;
  slug: string;
  author?: {
    id: string;
    username: string;
    email: string;
  };
  document_type: 'article' | 'page' | 'template' | 'financial';
  status: 'draft' | 'review' | 'published' | 'archived';
  content: any;
  content_html: string;
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  version: number;
  parent_id?: string;
}

export interface DocumentVersionEntity {
  id: string;
  document_id: string;
  version: number;
  content: any;
  content_html: string;
  created_at: string;
  author?: {
    id: string;
    username: string;
  };
  is_snapshot: boolean;
}

export interface DocumentCommentEntity {
  id: string;
  document_id: string;
  author: {
    id: string;
    username: string;
  };
  text: string;
  created_at: string;
  updated_at: string;
}

export interface PageEntity {
  id: string;
  document_id: string;
  page_number: number;
  content: any;
  content_html: string;
  layout_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}
