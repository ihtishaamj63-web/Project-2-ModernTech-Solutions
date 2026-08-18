// frontend-vue/src/stores/auth.js
import { reactive } from 'vue';
import api from '../api/axios';

const state = reactive({
  user: JSON.parse(localStorage.getItem('authUser') || 'null'),
  token: localStorage.getItem('token'),
});

export function useAuth() {
  function login(username, password) {
    return api.post('/auth/login', { username, password })
      .then(response => {
        if (response.data.success) {
          state.token = response.data.data.token;
          state.user = response.data.data.user;
          localStorage.setItem('token', state.token);
          localStorage.setItem('authUser', JSON.stringify(state.user));
          return { success: true };
        }
      })
      .catch(error => {
        return { success: false, error: error.response?.data?.error || 'Server error' };
      });
  }

  function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
  }

  const isHR = () => state.user?.role === 'hr_staff' || state.user?.role === 'HR Manager' || state.user?.role === 'HR Admin';

  return { state, login, logout, isHR };
}