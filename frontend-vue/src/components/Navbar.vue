<!-- src/components/Navbar.vue -->
<template>
  <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #272757;">
    <div class="container-fluid">
      <router-link class="navbar-brand fw-bold" to="/">ModernTech Solutions</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Dashboard</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/employees">Employees</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/payroll">Payroll</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/attendance">Attendance</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/timeoff">Time Off</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/reviews">Reviews</router-link>
          </li>
        </ul>
        <div class="d-flex align-items-center text-white">
          <div class="me-3 text-end">
            <div class="fw-bold">{{ state.user?.first_name || 'User' }}</div>
            <small>{{ state.user?.role || 'Employee' }} · ModernTech</small>
          </div>
          <button class="btn btn-outline-light btn-sm" @click="handleLogout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuth } from '../stores/auth';
import { useRouter } from 'vue-router';

const { state, logout } = useAuth();
const router = useRouter();

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar-nav .router-link-exact-active {
  color: #fff;
  font-weight: 700;
  border-bottom: 2px solid #fff;
}
.navbar-nav .nav-link {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 5px;
}
.navbar-nav .nav-link:hover {
  color: #fff;
}
</style>