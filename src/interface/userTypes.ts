export enum UserStatus {
  USER = "User",
  ADMIN = "Admin",
  PARTNER = "Partner",
}
export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export interface UserDataDto {
  email: string;
  password: string;
  login: string;
  userName: string;
  type: UserStatus;
}

export interface UserResponseDto {
  email: string;
  login: string;
  userName: string;
}

export interface ISessionSetup {
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenValidUntil: Date;
}

export interface ISigninService {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}
