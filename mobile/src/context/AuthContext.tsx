import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfficerUser } from '../types';
import { apiService, DEFAULT_API_URL } from '../services/api';

const STORAGE_KEY_USER = '@kavach_officer_session';

interface AuthContextType {
  user: OfficerUser | null;
  isLoading: boolean;
  serverUrl: string;
  login: (id: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<OfficerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_API_URL);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await apiService.init();
        setServerUrl(apiService.getBaseUrl());

        const savedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.warn('Failed restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (id: string, pass: string) => {
    setIsLoading(true);
    try {
      const officer = await apiService.loginOfficer(id, pass);
      setUser(officer);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(officer));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  };

  const updateServerUrl = async (url: string) => {
    const clean = await apiService.setBaseUrl(url);
    setServerUrl(clean);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        serverUrl,
        login,
        logout,
        updateServerUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
