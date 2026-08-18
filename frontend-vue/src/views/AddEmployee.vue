<!-- src/views/AddEmployee.vue -->
<template>
  <div class="emp-page">
    <div class="container">
      <div class="emp-page__header">
        <p class="emp-page__date">{{ today }}</p>
        <h1 class="emp-page__title">{{ isEdit ? 'Edit Employee' : 'Add New Employee' }}</h1>
        <p class="text-muted" v-if="!isEdit">New employees are automatically set to <strong>Active</strong> status.</p>
      </div>

      <div class="emp-card-wrap">
        <form class="emp-form-grid" @submit.prevent="saveEmployee">
          <!-- 1. Department -->
          <div class="emp-form-group">
            <label>1. Department <span class="required">*</span></label>
            <select v-model="form.department" required @change="updatePositions">
              <option value="">Select Department</option>
              <option>Development</option>
              <option>HR</option>
              <option>QA</option>
              <option>Sales</option>
              <option>Marketing</option>
              <option>Design</option>
              <option>IT</option>
              <option>Finance</option>
              <option>Support</option>
            </select>
          </div>

          <!-- 2. Position (Disabled until Department is chosen) -->
          <div class="emp-form-group">
            <label>2. Position <span class="required">*</span></label>
            <select v-model="form.position" required :disabled="!form.department" :class="{ 'disabled-select': !form.department }">
              <option value="">Select Position</option>
              <option v-for="pos in availablePositions" :key="pos" :value="pos">{{ pos }}</option>
            </select>
            <small v-if="!form.department" class="help-text">Select a department first.</small>
          </div>

          <!-- 3. Salary (Disabled until Position is chosen) -->
          <div class="emp-form-group">
            <label>3. Monthly Salary (R) <span class="required">*</span></label>
            <input type="number" v-model="form.salary" required min="5000" max="500000" step="1000" placeholder="e.g. 45000" :disabled="!form.position" :class="{ 'disabled-select': !form.position }" />
            <small class="help-text">Select a salary range below, or type directly. Increments of R1,000.</small>
            <select v-model="selectedSalaryTier" class="salary-range" @change="applySalaryTier" :disabled="!form.position" :class="{ 'disabled-select': !form.position }">
              <option value="">Select salary range...</option>
              <option v-for="tier in salaryTiers" :key="tier.id" :value="tier">
                {{ tier.label }}
              </option>
            </select>
          </div>

          <!-- 4. Contact Details -->
          <div class="emp-form-group">
            <label>Full Name <span class="required">*</span></label>
            <input type="text" v-model="form.name" required placeholder="e.g. Bongiwe Dube" />
          </div>

          <div class="emp-form-group">
            <label>Email <span class="required">*</span></label>
            <input type="email" v-model="form.email" required placeholder="name@moderntech.com" />
          </div>

          <div class="emp-form-group">
            <label>Start Date <span class="required">*</span></label>
            <input type="date" v-model="form.startDate" required />
          </div>

          <div class="emp-form-group emp-form-group--full">
            <label>Employment History</label>
            <textarea v-model="form.history" rows="3" placeholder="e.g. Joined in 2026, bringing 5 years of industry experience..."></textarea>
          </div>

          <div class="emp-form-actions emp-form-group--full">
            <router-link to="/employees" class="emp-btn emp-btn--ghost">
              <i class="bi bi-x-lg"></i> Cancel
            </router-link>
            <button type="submit" class="emp-btn emp-btn--primary" :disabled="saving">
              <i class="bi bi-check-lg"></i> {{ saving ? 'Saving...' : 'Save Employee' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../stores/auth';
import api from '../api/axios';

const router = useRouter();
const route = useRoute();
const { isHR } = useAuth();

const form = ref({
  name: '',
  position: '',
  department: '',
  salary: '',
  email: '',
  startDate: '',
  history: '',
});

const isEdit = ref(false);
const employeeId = ref(null);
const saving = ref(false);
const selectedSalaryTier = ref(null);

const today = new Date().toLocaleDateString('en-ZA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const positionMap = {
  Development: ['Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'Mobile Developer', 'DevOps Engineer', 'Software Architect', 'Software Engineer', 'Junior Developer', 'Senior Developer'],
  HR: ['HR Manager', 'HR Coordinator', 'Recruiter', 'Talent Acquisition Specialist', 'HR Administrator'],
  QA: ['QA Engineer', 'Test Analyst', 'Automation Engineer', 'QA Lead', 'Quality Analyst'],
  Sales: ['Sales Representative', 'Account Manager', 'Sales Engineer', 'Enterprise Sales', 'Sales Lead'],
  Marketing: ['Marketing Specialist', 'Content Strategist', 'SEO Specialist', 'Growth Marketer', 'Marketing Manager'],
  Design: ['UI/UX Designer', 'Product Designer', 'Visual Designer', 'UX Researcher', 'Graphic Designer'],
  IT: ['IT Support', 'System Administrator', 'Network Engineer', 'IT Manager'],
  Finance: ['Accountant', 'Financial Analyst', 'Payroll Specialist', 'Finance Manager'],
  Support: ['Customer Support Representative', 'Technical Support Engineer', 'Customer Success Manager', 'Support Lead'],
};

// FIX: Generate dynamic salary tiers based on department, fallback to generic
const salaryTiers = computed(() => {
  const deptTiers = {
    Development: [
      { id: 'junior', label: 'Junior Developer (R50,000 - R65,000)', min: 50000, max: 65000 },
      { id: 'mid', label: 'Mid Developer (R65,000 - R80,000)', min: 65000, max: 80000 },
      { id: 'senior', label: 'Senior Developer (R70,000 - R100,000)', min: 70000, max: 100000 },
      { id: 'lead', label: 'Lead/Architect (R100,000 - R150,000)', min: 100000, max: 150000 },
    ],
    HR: [
      { id: 'entry', label: 'Entry Level (R40,000 - R55,000)', min: 40000, max: 55000 },
      { id: 'mid', label: 'Mid Level (R55,000 - R75,000)', min: 55000, max: 75000 },
      { id: 'senior', label: 'Manager (R75,000 - R100,000)', min: 75000, max: 100000 },
    ],
  };
  
  return deptTiers[form.value.department] || [
    { id: 'entry', label: 'Entry Level (R40,000 - R55,000)', min: 40000, max: 55000 },
    { id: 'mid', label: 'Mid Level (R55,000 - R75,000)', min: 55000, max: 75000 },
    { id: 'senior', label: 'Senior Level (R75,000 - R100,000)', min: 75000, max: 100000 },
    { id: 'lead', label: 'Lead/Manager (R100,000 - R150,000)', min: 100000, max: 150000 },
  ];
});

const availablePositions = ref([]);

function updatePositions() {
  const dept = form.value.department;
  availablePositions.value = positionMap[dept] || [];
  // FIX: Reset position and salary if department changes
  form.value.position = '';
  form.value.salary = '';
  selectedSalaryTier.value = null;
}

function applySalaryTier() {
  if (selectedSalaryTier.value) {
    const tier = selectedSalaryTier.value;
    const midPoint = (Number(tier.min) + Number(tier.max)) / 2;
    // FIX: Round to the nearest 1000 so the step="1000" validation doesn't reject it
    form.value.salary = Math.round(midPoint / 1000) * 1000;
  }
}

async function loadEmployee(id) {
  try {
    const response = await api.get(`/employees/${id}`);
    const emp = response.data.data;
    
    // Fetch payroll to get salary
    let salary = '';
    try {
      const payRes = await api.get('/payroll');
      const payRecord = payRes.data.data.find(p => p.emp_id === emp.emp_id);
      if (payRecord) salary = payRecord.base_salary;
    } catch (e) {
      console.error('Could not load payroll for employee');
    }

    form.value = {
      name: `${emp.first_name} ${emp.last_name}`,
      position: emp.position,
      department: emp.department,
      salary: salary,
      email: emp.email,
      startDate: emp.hire_date ? emp.hire_date.split('T')[0] : '',
      history: emp.employment_history || '',
    };
    
    // Manually trigger position update without resetting the value
    availablePositions.value = positionMap[form.value.department] || [];
    
    employeeId.value = id;
    isEdit.value = true;
  } catch (error) {
    console.error('Error loading employee:', error);
    showToast('Failed to load employee', 'danger');
    router.push('/employees');
  }
}

async function saveEmployee() {
  if (!isHR.value) {
    showToast('Access denied. HR staff only.', 'danger');
    return;
  }

  const { name, position, department, salary, email, startDate, history } = form.value;
  if (!name || !position || !department || !salary || !email || !startDate) {
    showToast('Please fill in all required fields', 'danger');
    return;
  }

  saving.value = true;
  try {
    const data = {
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
      position,
      department,
      salary: Number(salary),
      email,
      hire_date: startDate,
      employment_history: history,
    };

    if (isEdit.value) {
      await api.put(`/employees/${employeeId.value}`, data);
      showToast(`${name} updated successfully`, 'success');
    } else {
      await api.post('/employees', data);
      showToast(`${name} added successfully`, 'success');
    }
    router.push('/employees');
  } catch (error) {
    console.error('Save error:', error);
    showToast(error.response?.data?.error || 'Failed to save employee', 'danger');
  } finally {
    saving.value = false;
  }
}

function showToast(message, type) {
  if (window.showToast) {
    window.showToast(message, type);
    return;
  }
  alert(message);
}

onMounted(() => {
  const id = route.params.id;
  if (id) {
    loadEmployee(id);
  }
});
</script>

<style scoped>
.emp-page { padding: 32px 0 64px; }
.emp-page__header { margin-bottom: 24px; }
.emp-page__date { font-size: 0.75rem; letter-spacing: 0.8px; color: #5a5a7a; margin-bottom: 10px; text-transform: uppercase; font-weight: 600; }
.emp-page__title { font-size: 2.1rem; font-weight: 800; }
.text-muted { color: #5a5a7a; font-size: 14px; margin-top: 4px; }

.emp-card-wrap { background: white; border: 1px solid #d8dce6; border-radius: 8px; padding: 24px; box-shadow: 0 4px 16px rgba(15,14,71,0.06); overflow: hidden; max-width: 800px; margin: 0 auto; }
.emp-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.emp-form-group { display: flex; flex-direction: column; gap: 8px; }
.emp-form-group--full { grid-column: 1 / -1; }
.emp-form-group label { font-size: 0.9rem; font-weight: 600; color: #505081; }
.emp-form-group input, .emp-form-group select, .emp-form-group textarea { padding: 12px 14px; border: 1.5px solid #d8dce6; border-radius: 10px; font-size: 0.95rem; font-family: inherit; background: white; transition: 0.2s; }
.emp-form-group input:focus, .emp-form-group select:focus, .emp-form-group textarea:focus { outline: none; border-color: #272757; box-shadow: 0 0 0 3px rgba(39,39,87,0.1); }

/* FIX: Styles for disabled state to enforce sequence */
.disabled-select {
  background-color: #f0f2f7 !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}

.required { color: #e53935; }
.help-text { color: #5a5a7a; font-size: 11px; margin-top: 2px; }
.salary-range { margin-top: 6px; width: 100%; padding: 12px 14px; border: 1.5px solid #d8dce6; border-radius: 10px; font-size: 0.95rem; font-family: inherit; cursor: pointer; background: white; }

.emp-form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.emp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.93rem; height: 46px; text-decoration: none; transition: 0.2s; }
.emp-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(15,14,71,0.15); }
.emp-btn--primary { background: #272757; color: #fff; }
.emp-btn--primary:hover { background: #505081; }
.emp-btn--ghost { background: white; border-color: #d8dce6; color: #1a1a2e; }
.emp-btn--ghost:hover { border-color: #505081; background: #f8f7ff; }

@media (max-width: 768px) { 
  .emp-form-grid { grid-template-columns: 1fr; } 
  .emp-form-actions { flex-direction: column; } 
  .emp-form-actions .emp-btn { width: 100%; justify-content: center; } 
}
</style>