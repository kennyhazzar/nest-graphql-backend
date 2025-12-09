import { registerEnumType } from '@nestjs/graphql';

/**
 * Source module for file uploads
 * Determines file storage path and access rules
 */
export enum FileFrom {
  USER = 'USER',
  PUBLIC = 'PUBLIC',
}

registerEnumType(FileFrom, {
  name: 'FileFrom',
  description: 'Source module for file upload',
  valuesMap: {
    USER: { description: 'User files (avatars, personal documents)' },
    PUBLIC: { description: 'Public files (accessible without auth)' },
  },
});
