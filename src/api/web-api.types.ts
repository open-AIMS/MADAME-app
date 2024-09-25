export type LoginResponse = {
  token: string;
  refreshToken: string;
};

export type UserProfile = {
  user: {
    email: string;
    id: number;
    roles: Array<string>;
  }
}
