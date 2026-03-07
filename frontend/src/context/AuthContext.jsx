import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] useEffect: checking token...');
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Auth] No token, loading=false');
      setLoading(false);
      return;
    }
    console.log('[Auth] Token found, calling GET /auth/me...');
    api
      .get('/auth/me')
      .then((res) => {
        console.log('[Auth] GET /auth/me success', res.data?._id);
        setUser(res.data);
      })
      .catch((err) => {
        console.log('[Auth] GET /auth/me failed', err.message || err.code);
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    console.log('[Auth] login() called');
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    console.log('[Auth] signup() called', { name, email: email ? '(set)' : '' });
    const res = await api.post('/auth/signup', { name, email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
