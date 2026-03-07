import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  console.log('[API] Request', config.method?.toUpperCase(), config.url, config.data ? '(body)' : '');
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log('[API] Response', res.status, res.config.url);
    return res;
  },
  (err) => {
    console.log('[API] Error', err.response?.status || err.code, err.config?.url, err.message);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
