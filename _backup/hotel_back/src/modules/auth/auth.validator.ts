import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EncryptionService } from './services/encryption.service';
import { UserService } from '@modules/user/user.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class UserPasswordValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly usersService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const user = await this.usersService.findOneByArgs({
      email,
    });
    if (!user || !user?.password) return false;
    const decryptedPassword = this.encryptionService.decrypt(user?.password);
    if (decryptedPassword !== args.object['password']) return false;
    return true;
  }
  defaultMessage?(args?: ValidationArguments): string {
    return `Usuario o contraseña incorrectos.`;
  }
}

@Injectable()
@ValidatorConstraint({ async: true })
export class UserActiveValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly usersService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const user = await this.usersService.findOneByArgs({
      email,
    });
    if (user) return true;
  }
  defaultMessage?(args?: ValidationArguments): string {
    return `Usuario no se encuentra activo.`;
  }
}
