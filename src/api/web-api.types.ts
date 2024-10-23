export type LoginResponse = {
  token: string;
  refreshToken: string;
};

/**
 * User properties encoded in the JWT token.
 */
export type UserPayload = {
  email: string;
  id: number;
  roles: Array<string>;
};

export type UserProfile = {
  user: UserPayload;
};

export type UserRole = 'ADMIN';
