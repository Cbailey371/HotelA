declare namespace Auth {
  export interface AccessRefreshTokens {
    accessToken: string;
    refreshToken: string;
  }

  export interface IPayload {
    id: string;
    name: string;
    email: string;
    role: string;
    hotelId?: string;
  }
}
