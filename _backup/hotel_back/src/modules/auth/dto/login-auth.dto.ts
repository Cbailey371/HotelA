import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Validate,
} from 'class-validator';
import {
  UserActiveValidatorConstraint,
  UserPasswordValidatorConstraint,
} from '@modules/auth/auth.validator';

export class LoginAuthDto {
  @ApiProperty({
    type: String,
    description: 'Correo electrónico del usuario',
    example: 'admin@sistema.com',
    required: true,
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail(
    {},
    {
      message: 'Por favor ingrese un correo electrónico válido',
    },
  )
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Formato de email inválido',
  })
  @Length(5, 100, {
    message: 'El email debe tener entre 5 y 100 caracteres',
  })
  @Validate(UserActiveValidatorConstraint)
  @Validate(UserPasswordValidatorConstraint)
  email: string;

  @ApiProperty({
    type: String,
    description: 'Contraseña del usuario',
    example: 'Password123$',
    required: true,
    minLength: 8,
    maxLength: 16,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 16, {
    message: 'La contraseña debe tener entre 8 y 16 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
    {
      message:
        'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial',
    },
  )
  password: string;
}
