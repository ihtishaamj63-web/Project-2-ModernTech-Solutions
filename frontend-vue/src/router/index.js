// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../stores/auth';

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/employees', name: 'Employees', component: () => import('../views/Employees.vue'), meta: { requiresAuth: true } },
  { path: '/add-employee', name: 'AddEmployee', component: () => import('../views/AddEmployee.vue'), meta: { requiresAuth: true } },
  { path: '/add-employee/:id', name: 'EditEmployee', component: () => import('../views/AddEmployee.vue'), meta: { requiresAuth: true } },
  { path: '/payroll', name: 'Payroll', component: () => import('../views/Payroll.vue'), meta: { requiresAuth: true } },
  { path: '/timeoff', name: 'TimeOff', component: () => import('../views/TimeOff.vue'), meta: { requiresAuth: true } },
  { path: '/attendance', name: 'Attendance', component: () => import('../views/Attendance.vue'), meta: { requiresAuth: true } },
  { path: '/reviews', name: 'Reviews', component: () => import('../views/Reviews.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useAuth();
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login');
  } else {
    next();
  }
});

export default router;