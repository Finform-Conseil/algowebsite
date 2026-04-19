export type FileType = 'document' | 'audio' | 'video' | 'image' | 'url' | 'others';

export interface CreateFileType {
  file?: File;
  url?: string;
  name?: string;
}

export interface FileQueryParams {
  type?: string;
  file_type?: FileType;
  page?: number;
  page_size?: number;
}

export interface UploadFileResponse {
  id: string;
  name: string | null;
  type: string | null;
  file_type: FileType;
  file: string;
  url: string | null;
  size: number | null;
  thumbnail: string | null;
}
