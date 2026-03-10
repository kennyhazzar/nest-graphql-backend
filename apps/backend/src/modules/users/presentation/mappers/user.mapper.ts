import { User, Users } from '../../domain/entities';
import { UserEntity } from '../../infrastructure/entity';
import { UserDto, UsersDto } from '../dtos';
import { UserRoleMapper } from './user-role.mapper';

export class UserMapper {
  static toDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.surname = user.surname;
    dto.middleName = user.middleName;
    dto.phone = user.phone;
    dto.gender = user.gender;
    dto.birthday = user.birthday;
    dto.verified = user.verified;
    dto.blocked = user.blocked;
    dto.country = user.country;
    dto.language = user.language;
    dto.locale = user.locale;
    dto.theme = user.theme;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    if (user.role) {
      dto.role = UserRoleMapper.toDto(user.role);
    }

    return dto;
  }

  static toDtoList(users: Users): UsersDto {
    const dto = new UsersDto();
    dto.nodes = users.map((user) => UserMapper.toDto(user));
    dto.totalCount = users.totalCount ?? users.length;
    return dto;
  }

  static toDomain(entity: UserEntity): User {
    const user = new User();
    user.id = entity.id;
    user.email = entity.email;
    user.forgotConfirmKey = entity.forgotConfirmKey;
    user.emailConfirmKey = entity.emailConfirmKey;
    user.verified = entity.verified;
    user.password = entity.password;
    user.name = entity.name;
    user.surname = entity.surname;
    user.middleName = entity.middleName;
    user.phone = entity.phone;
    user.roleId = entity.roleId;
    user.gender = entity.gender;
    user.birthday = entity.birthday;
    user.blocked = entity.blocked;
    user.country = entity.country;
    user.language = entity.language;
    user.locale = entity.locale;
    user.theme = entity.theme;
    user.createdAt = entity.createdAt;
    user.updatedAt = entity.updatedAt;
    user.deletedAt = entity.deletedAt;
    if (entity.role) {
      user.role = UserRoleMapper.toDomain(entity.role);
    }
    return user;
  }

  static toDomainList(entities: UserEntity[], totalCount?: number): Users {
    const users = new Users();
    users.push(...entities.map((entity) => UserMapper.toDomain(entity)));
    users.totalCount = totalCount ?? entities.length;
    return users;
  }
}
