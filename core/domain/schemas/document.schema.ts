import { z } from 'zod';

export const documentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Le titre est requis"),
  slug: z.string(),
  document_type: z.enum(['article', 'page', 'template', 'financial']),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  content: z.any(),
  content_html: z.string(),
  word_count: z.number().int().min(0),
  reading_time: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().optional().nullable(),
  version: z.number().int().min(1),
  parent_id: z.string().uuid().optional().nullable(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  document_type: z.enum(['article', 'page', 'template', 'financial']).default('article'),
  content: z.any().optional(),
  content_html: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  content: z.any().optional(),
  content_html: z.string().optional(),
  word_count: z.number().int().min(0).optional(),
});

export const documentCommentSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  text: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createCommentSchema = z.object({
  document_id: z.string().uuid(),
  text: z.string().min(1, "Le commentaire ne peut pas être vide"),
});
