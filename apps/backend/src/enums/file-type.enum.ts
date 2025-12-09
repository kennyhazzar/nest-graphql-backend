import { registerEnumType } from '@nestjs/graphql';

/**
 * File types for categorization
 */
export enum FileType {
  USER_FILE = 'USER_FILE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

registerEnumType(FileType, {
  name: 'FileType',
  description: 'File type classification',
  valuesMap: {
    USER_FILE: { description: 'User uploaded file' },
    IMAGE: { description: 'Image file (jpg, png, gif, etc.)' },
    VIDEO: { description: 'Video file (mp4, webm, etc.)' },
    DOCUMENT: { description: 'Document file (pdf, doc, etc.)' },
    OTHER: { description: 'Other file type' },
  },
});
