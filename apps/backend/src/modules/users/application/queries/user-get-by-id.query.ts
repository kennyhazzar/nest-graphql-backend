import { IdType } from '@/interfaces/id.type';

export class UserGetByIdQuery {
  constructor(public readonly userId: IdType) {}
}
