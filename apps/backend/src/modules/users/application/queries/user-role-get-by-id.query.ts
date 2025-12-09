import { IdType } from '@/interfaces/id.type';

export class UserRoleGetByIdQuery {
  constructor(public readonly roleId: IdType) {}
}
