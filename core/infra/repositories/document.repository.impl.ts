import { documentApi } from "../store/api/document.api";
import { IDocumentRepository } from "../../domain/repositories/document.repository";
import { DocumentEntity, DocumentVersionEntity, DocumentCommentEntity } from "../../domain/entities/document.entity";
import { CreateDocumentType, UpdateDocumentType, DocumentQueryParams, AutoSavePayload, CreateCommentType } from "../../domain/types/document.type";
import { PaginatedResponse } from "../../domain/types/pagination.type";
import { useAppDispatch } from "../store/hooks";

export const useDocumentRepository = (): IDocumentRepository => {
  const dispatch = useAppDispatch();
  const [createDocumentMutation] = documentApi.useCreateDocumentMutation();
  const [updateDocumentMutation] = documentApi.useUpdateDocumentMutation();
  const [autoSaveDocumentMutation] = documentApi.useAutoSaveDocumentMutation();
  const [deleteDocumentMutation] = documentApi.useDeleteDocumentMutation();
  const [duplicateDocumentMutation] = documentApi.useDuplicateDocumentMutation();
  const [publishDocumentMutation] = documentApi.usePublishDocumentMutation();
  const [uploadImageMutation] = documentApi.useUploadImageMutation();
  const [createCommentMutation] = documentApi.useCreateCommentMutation();

  const createDocument = async (document: CreateDocumentType): Promise<DocumentEntity> => {
    const result = await createDocumentMutation(document).unwrap();
    return result;
  };

  const updateDocument = async (id: string, document: UpdateDocumentType): Promise<DocumentEntity> => {
    const result = await updateDocumentMutation({ id, ...document }).unwrap();
    return result;
  };

  const autoSaveDocument = async (id: string, payload: AutoSavePayload): Promise<{ status: string }> => {
    const result = await autoSaveDocumentMutation({ id, ...payload }).unwrap();
    return result;
  };

  const getAllDocuments = async (params?: DocumentQueryParams): Promise<PaginatedResponse<DocumentEntity>> => {
    const result = await dispatch(documentApi.endpoints.getAllDocuments.initiate(params)).unwrap();
    return result;
  };

  const getDocumentById = async (id: string): Promise<DocumentEntity> => {
    const result = await dispatch(documentApi.endpoints.getDocumentById.initiate({ id })).unwrap();
    return result;
  };

  const deleteDocument = async (id: string): Promise<void> => {
    await deleteDocumentMutation(id).unwrap();
  };

  const duplicateDocument = async (id: string): Promise<DocumentEntity> => {
    const result = await duplicateDocumentMutation(id).unwrap();
    return result;
  };

  const publishDocument = async (id: string): Promise<DocumentEntity> => {
    const result = await publishDocumentMutation(id).unwrap();
    return result;
  };

  const getDocumentVersions = async (id: string): Promise<DocumentVersionEntity[]> => {
    const result = await dispatch(documentApi.endpoints.getDocumentVersions.initiate({ id })).unwrap();
    return result;
  };

  const uploadImage = async (formData: FormData): Promise<{ image_url: string }> => {
    const result = await uploadImageMutation(formData).unwrap();
    return result;
  };

  const createComment = async (comment: CreateCommentType): Promise<DocumentCommentEntity> => {
    const result = await createCommentMutation(comment).unwrap();
    return result;
  };

  const getDocumentComments = async (documentId: string): Promise<DocumentCommentEntity[]> => {
    const result = await dispatch(documentApi.endpoints.getDocumentComments.initiate({ document_id: documentId })).unwrap();
    return result;
  };

  return {
    createDocument,
    updateDocument,
    autoSaveDocument,
    getAllDocuments,
    getDocumentById,
    deleteDocument,
    duplicateDocument,
    publishDocument,
    getDocumentVersions,
    uploadImage,
    createComment,
    getDocumentComments,
  };
};
