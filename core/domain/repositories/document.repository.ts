import { DocumentEntity, DocumentVersionEntity, DocumentCommentEntity } from "../entities/document.entity";
import { CreateDocumentType, UpdateDocumentType, DocumentQueryParams, AutoSavePayload, CreateCommentType } from "../types/document.type";
import { PaginatedResponse } from "../types/pagination.type";

export interface IDocumentRepository {
  createDocument(document: CreateDocumentType): Promise<DocumentEntity>;
  updateDocument(id: string, document: UpdateDocumentType): Promise<DocumentEntity>;
  autoSaveDocument(id: string, payload: AutoSavePayload): Promise<{ status: string }>;
  getAllDocuments(params?: DocumentQueryParams): Promise<PaginatedResponse<DocumentEntity>>;
  getDocumentById(id: string): Promise<DocumentEntity>;
  deleteDocument(id: string): Promise<void>;
  duplicateDocument(id: string): Promise<DocumentEntity>;
  publishDocument(id: string): Promise<DocumentEntity>;
  getDocumentVersions(id: string): Promise<DocumentVersionEntity[]>;
  uploadImage(formData: FormData): Promise<{ image_url: string }>;
  createComment(comment: CreateCommentType): Promise<DocumentCommentEntity>;
  getDocumentComments(documentId: string): Promise<DocumentCommentEntity[]>;
}
