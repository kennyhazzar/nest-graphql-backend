import { IdType } from '@/interfaces/id.type';
import { Gender } from '@/enums/gender.enum';
import { Theme } from '@/enums/theme.enum';
import { IUser, UserCreateData } from '../interfaces/user.interface';
import { IUserRole } from '../interfaces/user-role.interface';

export type { IUser, UserCreateData, IUserRole };

/**
 * Domain User entity — pure TypeScript, no ORM dependency.
 */
export class User implements IUser {
  id!: IdType;
  email!: string;
  forgotConfirmKey!: string | null;
  emailConfirmKey!: string | null;
  verified!: boolean;
  password?: string;
  name!: string;
  surname!: string;
  middleName?: string;
  phone?: string;
  role?: IUserRole;
  roleId!: string;
  gender!: Gender;
  birthday?: Date;
  blocked!: boolean;
  country!: string;
  language!: string;
  locale!: string;
  theme!: Theme;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  static create(data: UserCreateData): User {
    const user = new User();
    Object.assign(user, {
      forgotConfirmKey: null,
      emailConfirmKey: null,
      verified: false,
      blocked: false,
      ...data,
    });
    return user;
  }
}

/**
 * Users aggregate
 */
export class Users extends Array<User> {
  totalCount: number = 0;

  static create(users: User[], totalCount?: number): Users {
    const aggregate = new Users();
    aggregate.push(...users);
    aggregate.totalCount = totalCount ?? users.length;
    return aggregate;
  }
}
