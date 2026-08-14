export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DecodedToken {
  sub?: string;
  nameid?: string;
  email?: string;
  unique_name?: string;
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  exp: number;
  iss?: string;
  aud?: string;
}
