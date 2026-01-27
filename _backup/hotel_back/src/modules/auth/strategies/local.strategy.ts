// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-local';
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { AuthService } from '@modules/auth/auth.service';

// @Injectable()
// export class LocalStrategy extends PassportStrategy(Strategy, 'local-user') {
//   constructor(private readonly authService: AuthService) {
//     super({
//       usernameField: 'usernameOrEmail',
//       passwordField: 'password',
//     });
//   }

//   /* async validate(
//     username: string,
//     password: string,
//   ): Promise<Omit<Users, 'password'> | null> {
//     const user = await this.authService.validateUser(username, password);

//     if (!user) {
//       throw new UnauthorizedException();
//     }
//     return user;
//   } */

//   async validate(
//     username: string,
//     password: string,
//   ) {
//    return false;
//   }
// }
