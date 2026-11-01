import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the session expired, send the user back to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return error.response?.data?.error || 'Could not reach the server. Please try again.';
}

export function saveSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export default api;