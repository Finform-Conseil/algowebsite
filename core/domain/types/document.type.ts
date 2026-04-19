import { z } from "zod";
import { createDocumentSchema, documentSchema, updateDocumentSchema, createCommentSchema } from "../schemas/document.schema";
import { QueryParams } from "./pagination.type";

export type DocumentType = z.infer<typeof documentSchema>;
export type CreateDocumentType = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentType = z.infer<typeof updateDocumentSchema>;
export type CreateCommentType = z.infer<typeof createCommentSchema>;

export interface DocumentQueryParams extends QueryParams {
  status?: 'draft' | 'review' | 'published' | 'archived';
  document_type?: 'article' | 'page' | 'template' | 'financial';
  author?: string;
}

export interface AutoSavePayload {
  content: any;
  content_html: string;
  word_count?: number;
}
