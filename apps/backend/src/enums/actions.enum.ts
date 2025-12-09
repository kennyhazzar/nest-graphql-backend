import { registerEnumType } from '@nestjs/graphql';

export enum Actions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

registerEnumType(Actions, {
  name: 'Actions',
  description: 'CASL Actions',
  valuesMap: {
    CREATE: { description: 'Create' },
    READ: { description: 'Read' },
    UPDATE: { description: 'Update' },
    DELETE: { description: 'Delete' },
  },
});
