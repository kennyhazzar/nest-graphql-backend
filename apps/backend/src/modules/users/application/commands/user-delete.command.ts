import { IdType } from '@/interfaces/id.type';

export class UserDeleteCommand {
  constructor(public readonly userId: IdType) {}
}
