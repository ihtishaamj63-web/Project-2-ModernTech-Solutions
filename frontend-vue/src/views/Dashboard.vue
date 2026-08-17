<!-- src/views/Dashboard.vue -->
<template>
  <div class="dash-container">
    <!-- Hero Section -->
    <section class="dash-hero">
      <h5>MODERNTECH SOLUTIONS</h5>
      <h1>Welcome back, {{ userName }}.</h1>
      <p>
        <i class="bi bi-calendar3 me-1"></i> {{ today }}
      </p>
      <p>{{ isHR ? 'Manage employee records, performance reviews and payroll from one centralized HR dashboard.' : 'View your personal dashboard: attendance, time off and reviews.' }}</p>
      <div class="dash-hero-buttons">
        <button v-if="isHR" @click="router.push('/employees')">Employee Records</button>
        <button v-if="isHR" @click="router.push('/payroll')">Open Payroll</button>
      </div>
    </section>

    <!-- Stats -->
    <section class="dash-stats">
      <div class="dash-stat-card">
        <div class="dash-stat-icon blue"><i class="fa-solid fa-users"></i></div>
        <h4>Total Employees</h4>
        <h2>{{ stats.total_employees || 0 }}</h2>
        <a href="#" @click.prevent="router.push('/employees')" class="dash-stat-link blue-link">View Employees →</a>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon purple"><i class="fa-solid fa-calendar-check"></i></div>
        <h4>Attendance Rate</h4>
        <h2>{{ stats.attendance_rate || 0 }}%</h2>
        <p>This Week</p>
        <a href="#" @click.prevent="router.push('/attendance')" class="dash-stat-link purple-link">View Attendance →</a>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon orange"><i class="fa-solid fa-clock"></i></div>
        <h4>Pending Requests</h4>
        <h2>{{ stats.pending_timeoff || 0 }}</h2>
        <p>Time Off</p>
        <a href="#" @click.prevent="router.push('/timeoff')" class="dash-stat-link orange-link">Manage Requests →</a>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon green"><i class="fa-solid fa-star"></i></div>
        <h4>Completed Reviews</h4>
        <h2>{{ stats.total_reviews || 0 }}</h2>
        <p>This Quarter</p>
        <a href="#" @click.prevent="router.push('/reviews')" class="dash-stat-link green-link">View Reviews →</a>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon blue"><i class="fa-solid fa-money-bill-wave"></i></div>
        <h4>Payroll Summary</h4>
        <h2>R {{ (stats.payroll_total || 0).toLocaleString('en-ZA') }}</h2>
        <p>{{ stats.total_employees || 0 }} Employees Paid</p>
        <a href="#" @click.prevent="router.push('/payroll')" class="dash-stat-link blue-link">Open Payroll →</a>
      </div>
    </section>

    <!-- Chart -->
    <div class="dash-chart-card">
      <div class="dash-chart-header">
        <h2>This Week at a Glance</h2>
        <div>
          <span class="badge bg-secondary">{{ stats.total_employees || 0 }} employees</span>
          <a href="#" @click.prevent="router.push('/attendance')">View Full Report →</a>
        </div>
      </div>
      <div class="att-chart-wrapper">
        <div class="att-chart-container">
          <div v-for="(day, index) in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']" :key="day" class="att-chart-day">
            <div class="att-chart-bars">
              <div class="att-chart-bar present" :style="{ height: getBarHeight(day) + 'px' }"></div>
            </div>
            <span class="att-bar-percentage">{{ getBarValue(day) }}</span>
            <div class="att-chart-day-label">{{ day }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';
import api from '../api/axios';

const router = useRouter();
const { state, isHR, userName } = useAuth();

const stats = ref({});
const today = ref('');

const getBarHeight = (day) => {
  const map = { Mon: 8, Tue: 7, Wed: 9, Thu: 6, Fri: 8 };
  return map[day] * 15;
};

const getBarValue = (day) => {
  const map = { Mon: 8, Tue: 7, Wed: 9, Thu: 6, Fri: 8 };
  return map[day];
};

onMounted(async () => {
  today.value = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  try {
    const response = await api.get('/dashboard/stats');
    if (response.data.success) {
      stats.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
});
</script>

<style scoped>
.dash-container {
  padding: 20px;
}
.dash-hero {
  margin-bottom: 40px;
  background: linear-gradient(135deg, #272757, #0f0e47);
  color: white;
  border-radius: 20px;
  padding: 50px;
}
.dash-hero h5 {
  letter-spacing: 2px;
  margin-bottom: 10px;
  color: #a8a8d0;
  font-size: 14px;
}
.dash-hero h1 {
  font-size: 42px;
  margin-bottom: 15px;
}
.dash-hero p {
  width: 60%;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
}
.dash-hero-buttons {
  margin-top: 30px;
}
.dash-hero-buttons button {
  padding: 13px 28px;
  border: none;
  border-radius: 12px;
  margin-right: 15px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: 0.2s;
}
.dash-hero-buttons button:first-child {
  background: #505081;
  color: white;
}
.dash-hero-buttons button:first-child:hover {
  background: #272757;
  transform: translateY(-2px);
}
.dash-hero-buttons button:last-child {
  background: rgba(255, 255, 255, 0.95);
  color: #0f0e47;
}
.dash-hero-buttons button:last-child:hover {
  background: white;
  transform: translateY(-2px);
}
.dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}
.dash-stat-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}
.dash-stat-card:hover {
  transform: translateY(-8px);
}
.dash-stat-icon {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  margin-bottom: 20px;
  font-size: 24px;
}
.dash-stat-icon.blue { background: #3b82f6; }
.dash-stat-icon.green { background: #10b981; }
.dash-stat-icon.orange { background: #f59e0b; }
.dash-stat-icon.purple { background: #8b5cf6; }
.dash-stat-card h4 {
  color: #666;
  margin-bottom: 8px;
}
.dash-stat-card h2 {
  font-size: 34px;
  margin-bottom: 5px;
}
.dash-stat-card p {
  color: #888;
}
.dash-stat-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: 0.2s;
}
.dash-stat-link:hover {
  text-decoration: underline;
}
.dash-stat-link.blue-link { color: #3b82f6; }
.dash-stat-link.purple-link { color: #8b5cf6; }
.dash-stat-link.orange-link { color: #f59e0b; }
.dash-stat-link.green-link { color: #10b981; }
.dash-chart-card {
  background: white;
  border-radius: 18px;
  padding: 30px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}
.dash-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.dash-chart-header h2 {
  margin: 0;
  font-size: 20px;
}
.dash-chart-header a {
  text-decoration: none;
  color: #272757;
  font-weight: 600;
  font-size: 13px;
  transition: 0.2s;
}
.dash-chart-header a:hover {
  color: #505081;
  text-decoration: underline;
}
.dash-chart-header .badge {
  margin-right: 15px;
}
.att-chart-wrapper {
  position: relative;
  padding: 20px 12px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #d8dce6;
}
.att-chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  height: 200px;
  padding: 0 4px 0 36px;
}
.att-chart-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-width: 40px;
}
.att-chart-bars {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  justify-content: flex-end;
  gap: 2px;
}
.att-chart-bar {
  width: 65%;
  max-width: 36px;
  min-height: 4px;
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
  background: #43a047;
}
.att-bar-percentage {
  font-size: 10px;
  font-weight: 600;
  color: #5a5a7a;
  margin-top: 2px;
}
.att-chart-day-label {
  font-size: 12px;
  font-weight: 500;
  color: #5a5a7a;
  padding-top: 4px;
  border-top: 1px solid #d8dce6;
  width: 100%;
  text-align: center;
}
</style>