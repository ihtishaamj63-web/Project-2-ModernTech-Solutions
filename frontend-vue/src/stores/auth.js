// src/stores/auth.js
import { reactive, computed } from 'vue';
import api from '../api/axios';

const state = reactive({
  user: JSON.parse(localStorage.getItem('authUser') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
});

export function useAuth() {
  async function login(username, password) {
    state.loading = true;
    state.error = null;
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token, user } = response.data.data;
        state.token = token;
        state.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('authUser', JSON.stringify(user));
        return { success: true };
      }
    } catch (error) {
      state.error = error.response?.data?.error || 'Login failed';
      return { success: false, error: state.error };
    } finally {
      state.loading = false;
    }
  }

  function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
  }

  function isLoggedIn() {
    return state.token !== null;
  }

  const isHR = computed(() => {
    const role = state.user?.role;
    return role === 'hr_staff' || role === 'HR Manager' || role === 'HR Admin';
  });

  const userName = computed(() => {
    if (state.user) {
      return state.user.name || state.user.username || 'User';
    }
    return 'User';
  });

  return {
    state,
    login,
    logout,
    isLoggedIn,
    isHR,
    userName,
  };
}