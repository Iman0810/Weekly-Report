import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',  
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request (if user is logged in)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(
            'http://localhost:8000/api/auth/token/refresh/',
            { refresh: refreshToken }
          );
          
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;