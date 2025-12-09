import { AuthServiceAdapter } from '../../infrastructure/adapters/auth-service.adapter';
import { UserEntity } from '../../infrastructure/entity';

/**
 * Domain User entity with business logic
 */
export class User extends UserEntity {
  /**
   * Factory method to create a new user with hashed password
   */
  static create(data: Partial<UserEntity>): User {
    const user = new User();
    Object.assign(user, data);

    if (data.password) {
      user.password = AuthServiceAdapter.hashPassword(data.password);
    }

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
