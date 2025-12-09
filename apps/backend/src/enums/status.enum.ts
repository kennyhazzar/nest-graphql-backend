import { registerEnumType } from '@nestjs/graphql';

export enum Status {
  OK = 'OK',
  ERROR = 'ERROR',
}

registerEnumType(Status, {
  name: 'Status',
  description: 'Operation status',
  valuesMap: {
    OK: { description: 'Success' },
    ERROR: { description: 'Error' },
  },
});
