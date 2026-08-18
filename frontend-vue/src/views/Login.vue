<!-- frontend-vue/src/views/Login.vue -->
<template>
  <div class="login-container d-flex align-items-center justify-content-center vh-100">
    <div class="card p-4 shadow" style="width: 400px;">
      <h2 class="text-center mb-4">ModernTech Login</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input v-model="username" type="text" class="form-control" placeholder="Enter your username (e.g., hr@moderntech.com)" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" placeholder="Enter your password" required />
        </div>
        
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';

const router = useRouter();
const { login } = useAuth();

const username = ref('');
const password = ref('');
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  try {
    // Pass username, not email
    const result = await login(username.value, password.value);
    if (result.success) {
      router.push('/');
    } else {
      error.value = result.error || 'Login failed';
    }
  } catch (err) {
    error.value = 'Server error. Is the backend running?';
  }
};
</script>