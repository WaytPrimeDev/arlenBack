export interface UserDataDto {
  email: string;
  password: string;
  login: string;
  userName: string;
  type: "User" | "Admin" | "Partner";
}

export interface UserResponseDto {
  email: string;
  login: string;
  userName: string;
}
