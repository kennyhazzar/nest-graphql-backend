import { Column, Entity, ManyToOne, JoinColumn, RelationId, Unique } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { defaultCountry, defaultLanguage, defaultLocale } from '@/i18n/default-language';
import { Gender } from '@/enums/gender.enum';
import { Theme } from '@/enums/theme.enum';
import { UserRoleEntity } from './user-role.entity';

@Entity('user', { comment: 'Users' })
@Unique('uniq_user_email', ['email'])
export class UserEntity extends BaseUUIDMixin('user') {
  @Column({ type: 'varchar', length: 100, comment: 'User email' })
  email!: string;

  @Column({ type: 'varchar', nullable: true, select: false, comment: 'Password recovery key' })
  forgotConfirmKey!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    select: false,
    comment: 'Email confirmation key',
  })
  emailConfirmKey!: string | null;

  @Column({ type: 'boolean', default: false, comment: 'Email verified' })
  verified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'User password (nullable for OAuth-only users)' })
  password?: string;

  @Column({ type: 'varchar', length: 100, comment: 'First name' })
  name!: string;

  @Column({ type: 'varchar', length: 100, comment: 'Last name' })
  surname!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Middle name' })
  middleName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Phone number' })
  phone?: string;

  @ManyToOne(() => UserRoleEntity, (role) => role.users, { onDelete: 'SET NULL', eager: true })
  @JoinColumn()
  role!: UserRoleEntity;

  @Column({ type: 'uuid', comment: 'User role ID' })
  @RelationId((user: UserEntity) => user.role)
  roleId!: string;

  @Column({ type: 'enum', enum: Gender, enumName: 'Gender', default: Gender.MALE, comment: 'Gender' })
  gender!: Gender;

  @Column({ type: 'timestamptz', nullable: true, comment: 'Birthday' })
  birthday?: Date;

  @Column({ type: 'boolean', default: false, comment: 'User blocked' })
  blocked!: boolean;

  @Column({ type: 'varchar', length: 2, comment: 'Country', default: defaultCountry })
  country!: string;

  @Column({ type: 'varchar', length: 6, comment: 'Preferred language', default: defaultLanguage })
  language!: string;

  @Column({ type: 'varchar', length: 6, comment: 'Locale settings', default: defaultLocale })
  locale!: string;

  @Column({
    type: 'enum',
    enum: Theme,
    enumName: 'Theme',
    default: Theme.LIGHT,
    comment: 'User interface theme',
  })
  theme!: Theme;
}
