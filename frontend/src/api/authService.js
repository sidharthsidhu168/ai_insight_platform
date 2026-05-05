import axiosClient from './axiosClient';

export const authService = {
  login: (email, password) =>
    axiosClient.post('/auth/login', { email, password }),

  register: (name, email, password) =>
    axiosClient.post('/auth/register', { name, email, password }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};