<!-- src/components/Navbar.vue -->
<template>
  <nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <span class="brand-text">ModernTech <span>Solutions</span></span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <div class="mx-auto">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link to="/" class="nav-link" active-class="active">
                <i class="bi bi-grid-1x2-fill"></i> Dashboard
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/employees" class="nav-link" active-class="active">
                <i class="bi bi-people-fill"></i> Employees
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/payroll" class="nav-link" active-class="active">
                <i class="bi bi-wallet2"></i> Payroll
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/timeoff" class="nav-link" active-class="active">
                <i class="bi bi-clock-fill"></i> Time Off
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/attendance" class="nav-link" active-class="active">
                <i class="bi bi-calendar-check-fill"></i> Attendance
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/reviews" class="nav-link" active-class="active">
                <i class="bi bi-star-fill"></i> Review
              </router-link>
            </li>
          </ul>
        </div>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-toggle" @click="toggleNightMode" title="Toggle Night Mode">
            <i class="bi bi-moon-fill"></i>
          </button>
          <div class="user-profile">
            <div class="user-avatar">{{ getInitials(userName) }}</div>
            <div class="user-info">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
          </div>
          <button class="btn btn-logout" @click="handleLogout" title="Logout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';

const router = useRouter();
const { state, logout, userName } = useAuth();

const userRole = computed(() => {
  const role = state.user?.role;
  if (role === 'hr_staff') return 'HR Staff · ModernTech';
  return (role || 'Employee') + ' · ModernTech';
});

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function toggleNightMode() {
  document.body.classList.toggle('dark-mode');
}

function handleLogout() {
  logout();
}
</script>

<style scoped>
.navbar {
  background: #272757;
  padding: 10px 32px;
  box-shadow: 0 2px 8px rgba(39, 39, 87, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
}
.navbar-brand {
  color: white !important;
  font-weight: 700;
  font-size: 20px;
}
.navbar-brand .brand-text span {
  color: #a8a8d0;
}
.navbar-nav {
  gap: 8px;
}
.nav-link {
  color: rgba(255, 255, 255, 0.75) !important;
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
}
.nav-link:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}
.nav-link.active {
  color: white !important;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}
.btn-toggle, .btn-logout {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid transparent;
  color: white;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  font-size: 17px;
  cursor: pointer;
}
.btn-toggle:hover, .btn-logout:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}
.user-avatar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
}
.user-name {
  color: white;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
}
.user-role {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>