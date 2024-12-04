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

export type Polygon = any;

export type Note = any;

export interface User {
  id: number;
  email: string;
  roles: UserRole[];
}

export type UserAction = 'LOGIN' | 'LOGOUT' | 'CHANGE_PASSWORD' | 'UPDATED';

export interface UserLogs {
  logs: {
    id: number;
    userId: number;
    time: Date;
    action: UserAction;
    metadata: any;
    user: User;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
