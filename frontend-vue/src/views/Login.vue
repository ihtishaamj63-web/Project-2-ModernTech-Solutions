<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <h1>ModernTech <span>Solutions</span></h1>
        <p>Human Resources Management System</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div v-if="error" class="login-error show">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ error }}
        </div>

        <div class="mb-3">
          <label for="emailInput" class="form-label">
            <i class="bi bi-envelope me-1"></i>Email Address
          </label>
          <input
            type="email"
            class="form-control"
            id="emailInput"
            v-model="email"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div class="mb-3">
          <label for="passwordInput" class="form-label">
            <i class="bi bi-lock me-1"></i>Password
          </label>
          <input
            type="password"
            class="form-control"
            id="passwordInput"
            v-model="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <i class="bi bi-box-arrow-in-right me-2"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Use your ModernTech employee credentials</p>
        <div class="demo-cred">
          <span class="cred-label">HR Admin:</span>
          <span class="cred-value">hr@moderntech.com / password123</span>
          <span class="cred-label">Employee:</span>
          <span class="cred-value">sibongile.nkosi@moderntech.com / password123</span>
        </div>
        <div class="demo-note">
          <i class="bi bi-shield-lock"></i> Demo credentials shown for testing
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';

const router = useRouter();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password.';
    return;
  }

  loading.value = true;
  error.value = '';

  const result = await login(email.value, password.value);

  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error || 'Invalid credentials. Please try again.';
  }

  loading.value = false;
}
</script>

<style scoped>
.login-container {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
}
.login-card {
  background: var(--white);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(39, 39, 87, 0.1);
}
.login-logo {
  text-align: center;
  margin-bottom: 28px;
}
.login-logo h1 {
  font-size: 26px;
  font-weight: 700;
  color: #272757;
  margin: 0;
}
.login-logo h1 span {
  color: #a8a8d0;
}
.login-logo p {
  color: #6b6b8a;
  font-size: 13px;
}
.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a2e;
}
.form-control {
  border-radius: 8px;
  border: 1.5px solid #e2e5ea;
  padding: 11px 16px;
  font-size: 15px;
}
.form-control:focus {
  border-color: #272757;
  box-shadow: 0 0 0 3px rgba(39, 39, 87, 0.1);
}
.btn-login {
  background: #272757;
  border: none;
  padding: 13px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  color: white;
  width: 100%;
  transition: 0.2s;
  cursor: pointer;
}
.btn-login:hover:not(:disabled) {
  background: #0f0e47;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(39, 39, 87, 0.25);
}
.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-error {
  background: #ffebee;
  color: #c62828;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: none;
  margin-bottom: 16px;
  border-left: 3px solid #c62828;
}
.login-error.show {
  display: block;
}
.login-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e5ea;
}
.login-footer p {
  color: #6b6b8a;
  font-size: 12px;
  margin: 0;
  text-align: center;
}
.demo-cred {
  margin-top: 8px;
  font-size: 12px;
}
.cred-label {
  color: #6b6b8a;
  font-weight: 500;
}
.cred-value {
  color: #272757;
  font-weight: 600;
  font-family: monospace;
}
.demo-note {
  text-align: center;
  color: #6b6b8a;
  font-size: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e5ea;
}
</style>