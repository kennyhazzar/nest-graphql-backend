import { UserRole, Roles } from '../../domain/entities';
import { UserRoleEntity } from '../../infrastructure/entity';
import { UserRoleDto, UserRolesDto } from '../dtos';

export class UserRoleMapper {
  static toDto(role: UserRole): UserRoleDto {
    const dto = new UserRoleDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.description = role.description;
    dto.type = role.type;
    dto.createdAt = role.createdAt;
    dto.updatedAt = role.updatedAt;
    return dto;
  }

  static toDtoList(roles: Roles): UserRolesDto {
    const dto = new UserRolesDto();
    dto.nodes = roles.map((role) => UserRoleMapper.toDto(role));
    dto.totalCount = roles.totalCount ?? roles.length;
    return dto;
  }

  static toDomain(entity: UserRoleEntity): UserRole {
    const role = new UserRole();
    Object.assign(role, entity);
    return role;
  }

  static toDomainList(entities: UserRoleEntity[], totalCount?: number): Roles {
    const roles = new Roles();
    roles.push(...entities.map((entity) => UserRoleMapper.toDomain(entity)));
    roles.totalCount = totalCount ?? entities.length;
    return roles;
  }

  static toEntity(role: UserRole): UserRoleEntity {
    const entity = new UserRoleEntity();
    Object.assign(entity, role);
    return entity;
  }
}
