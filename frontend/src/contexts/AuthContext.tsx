import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { NguoiDungHienTai, VaiTroEnum } from '../types';

interface AuthContextType {
  user: NguoiDungHienTai | null;
  loading: boolean;
  login: (email: string, matKhau: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: VaiTroEnum) => boolean;
  hasAnyRole: (roles: VaiTroEnum[]) => boolean;
  isDirectorOrAdmin: () => boolean;
  isTeamLead: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<NguoiDungHienTai | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/ho-so');
      setUser(res.data);
      localStorage.setItem('crm_user', JSON.stringify(res.data));
    } catch (e) {
      setUser(null);
      localStorage.removeItem('crm_access_token');
      localStorage.removeItem('crm_refresh_token');
      localStorage.removeItem('crm_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('crm_access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, matKhau: string) => {
    const res = await api.post('/auth/dang-nhap', { email, matKhau });
    localStorage.setItem('crm_access_token', res.data.accessToken);
    localStorage.setItem('crm_refresh_token', res.data.refreshToken);
    setUser(res.data.nguoiDung);
    localStorage.setItem('crm_user', JSON.stringify(res.data.nguoiDung));
    return res.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('crm_refresh_token');
      await api.post('/auth/dang-xuat', { refreshToken });
    } catch (e) {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      localStorage.removeItem('crm_access_token');
      localStorage.removeItem('crm_refresh_token');
      localStorage.removeItem('crm_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const hasRole = (role: VaiTroEnum) => {
    if (!user) return false;
    if (user.roles.includes(VaiTroEnum.ADMIN)) return true;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: VaiTroEnum[]) => {
    if (!user) return false;
    if (user.roles.includes(VaiTroEnum.ADMIN)) return true;
    return roles.some((r) => user.roles.includes(r));
  };

  const isDirectorOrAdmin = () => {
    if (!user) return false;
    return (
      user.roles.includes(VaiTroEnum.ADMIN) ||
      user.roles.includes(VaiTroEnum.DIRECTOR)
    );
  };

  const isTeamLead = () => {
    if (!user) return false;
    return user.roles.includes(VaiTroEnum.TEAM_LEAD);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshProfile,
        hasRole,
        hasAnyRole,
        isDirectorOrAdmin,
        isTeamLead,
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
