import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('crm_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/lam-moi-token', { refreshToken });
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('crm_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('crm_access_token');
          localStorage.removeItem('crm_refresh_token');
          localStorage.removeItem('crm_user');
          window.location.href = '/login?expired=1';
          return Promise.reject(refreshErr);
        }
      }
    }

    const errorMessage =
      error.response?.data?.thongDiep ||
      error.response?.data?.message ||
      'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.';

    return Promise.reject({
      ...error,
      userFriendlyMessage: errorMessage,
    });
  },
);

export default api;
