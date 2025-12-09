import { PureAbility, AbilityBuilder, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import type { RolePermissionEntity } from '@/modules/users/infrastructure/entity/role-permission.entity';

export type AppAbility = PureAbility<[Actions, Subjects], Record<string, any>>;

@Injectable()
export class CaslAbilityFactory {
  /**
   * Creates CASL ability based on role permissions
   * @param permissions - array of role permissions
   * @returns CASL ability for permission checking
   */
  createForRolePermissions(permissions: RolePermissionEntity[]): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(PureAbility);

    permissions.forEach((permission) => {
      can(permission.action, permission.subject);
    });

    return build({
      detectSubjectType: (item: unknown) => item as ExtractSubjectType<Subjects>,
    });
  }
}
