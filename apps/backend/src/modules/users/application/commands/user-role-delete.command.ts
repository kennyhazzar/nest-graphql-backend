import { IdType } from '@/interfaces/id.type';

export class UserRoleDeleteCommand {
  constructor(public readonly roleId: IdType) {}
}
