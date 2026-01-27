import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EncryptionService } from '@modules/auth/services/encryption.service';
import { UserService } from './user.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class UniqueEmailValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly userService: UserService) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const user = await this.userService.findOneByArgs({
      email,
    });

    return !user;
  }
  defaultMessage?(args?: ValidationArguments): string {
    return `El email: '${args.value}' ya se encuentra registrado.`;
  }
}

@Injectable()
@ValidatorConstraint({ async: true })
export class PasswordValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async validate(
    currentPassword: string,
    args: ValidationArguments,
  ): Promise<boolean> {
    const user = await this.userService.findOne({
      where: { id: args.object['user_id'] as string },
    });

    if (!user || !user?.password) return false;
    const decryptedPassword = this.encryptionService.decrypt(user?.password);

    if (decryptedPassword !== currentPassword) return false;
    return true;
  }
  defaultMessage?(args?: ValidationArguments): string {
    return `Current password incorrect`;
  }
}
