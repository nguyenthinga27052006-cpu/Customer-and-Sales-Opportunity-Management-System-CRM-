import { SetMetadata } from '@nestjs/common';
import { VaiTroEnum } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: VaiTroEnum[]) => SetMetadata(ROLES_KEY, roles);
