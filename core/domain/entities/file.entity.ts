export interface FileEntity {
  id: string;
  name: string | null;
  type: string | null;
  file_type: 'document' | 'audio' | 'video' | 'image' | 'url' | 'others';
  thumbnail: string | null;
  file: string;
  url: string | null;
  size: number | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}
