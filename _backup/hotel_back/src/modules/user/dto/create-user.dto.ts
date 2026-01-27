import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  Length,
  IsEmail,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    type: String,
    default: 'Juan',
    description: 'Primer nombre del usuario',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Correo electronico del usuario',
    default: 'user@default.com',
  })
  @IsString()
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
  email: string;

  @ApiProperty({
    type: String,
    description: 'Password del usuario',
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
