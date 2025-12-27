import { UserEntity } from '../../infrastructure/entity';

/**
 * Domain User entity with business logic
 */
export class User extends UserEntity {
  /**
   * Factory method to create a new user
   * @param data - User data (password must be already hashed by caller)
   */
  static create(data: Partial<UserEntity>): User {
    const user = new User();
    Object.assign(user, data);
    // Password should be already hashed by calling code using PasswordService
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
