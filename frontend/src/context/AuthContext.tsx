'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { AuthUser, DecodedToken, LoginResponse } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

const mapTokenToUser = (decoded: DecodedToken): AuthUser => {
  return {
    id: decoded.sub || decoded.nameid || '',
    email: decoded.email || '',
    name: decoded.unique_name || decoded.email || '',
    role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || ''
  };
};

interface AuthContextType extends AuthState {
  login: (data: LoginResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          // Check expiration
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
          }
          setAuthState({
            isAuthenticated: true,
            user: mapTokenToUser(decoded),
            token,
            isLoading: false,
          });
        } catch (error) {
          // Invalid or expired token
          localStorage.removeItem('token');
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });
      }
    };
    
    checkToken();
  }, []);

  const login = (data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    const decoded = jwtDecode<DecodedToken>(data.token);
    const authUser = mapTokenToUser(decoded);
    setAuthState({
      isAuthenticated: true,
      user: authUser,
      token: data.token,
      isLoading: false,
    });
    
    // Redirect based on role
    const role = authUser.role.toLowerCase();
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'teacher') router.push('/teacher/dashboard');
    else if (role === 'student') router.push('/student/dashboard');
    else router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
