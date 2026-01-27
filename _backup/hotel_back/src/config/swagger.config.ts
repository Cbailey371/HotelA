import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  user: process.env.SWAGGER_USER || 'admin',
  password: process.env.SWAGGER_PASSWORD || 'admin',
}));
