<!-- src/views/Attendance.vue -->
<template>
  <div class="att-main-content">
    <div class="att-page-header">
      <div>
        <h1 class="att-page-title">Attendance</h1>
        <p class="att-page-subtitle"><i class="bi bi-calendar3 me-1"></i> {{ today }}</p>
      </div>
      <div class="att-header-actions">
        <button class="btn btn-outline-primary" @click="exportAttendance" v-if="isHR">
          <i class="bi bi-download me-1"></i> Export
        </button>
        <button class="btn btn-primary" @click="openLogModal" v-if="isHR">
          <i class="bi bi-plus-lg me-1"></i> Log Attendance
        </button>
      </div>
    </div>

    <!-- Weekly Chart -->
    <div class="att-card card shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="att-card-title"><i class="bi bi-graph-up-arrow"></i> This week at a glance</h5>
          <span class="badge bg-secondary">Stacked by status, {{ employeeList.length }} employees</span>
        </div>
        <div class="att-weekly-chart">
          <div class="att-chart-wrapper">
            <div class="att-chart-container">
              <div v-for="(day, index) in dayLabels" :key="day" class="att-chart-day">
                <div class="att-chart-bars">
                  <div class="att-chart-bar present" :style="{ height: getBarHeight(day, 'present') + 'px' }"></div>
                  <div class="att-chart-bar leave" :style="{ height: getBarHeight(day, 'leave') + 'px' }"></div>
                  <div class="att-chart-bar absent" :style="{ height: getBarHeight(day, 'absent') + 'px' }"></div>
                </div>
                <span class="att-bar-percentage">{{ getDayTotal(day) }}</span>
                <div class="att-chart-day-label">{{ day }}</div>
              </div>
            </div>
          </div>
          <div class="att-chart-legend">
            <div class="att-chart-legend-item"><span class="att-legend-dot present"></span> Present <span class="att-legend-count">{{ weeklyTotals.present }}</span></div>
            <div class="att-chart-legend-item"><span class="att-legend-dot leave"></span> On Leave <span class="att-legend-count">{{ weeklyTotals.leave }}</span></div>
            <div class="att-chart-legend-item"><span class="att-legend-dot absent"></span> Absent <span class="att-legend-count">{{ weeklyTotals.absent }}</span></div>
          </div>
          <div class="att-chart-stats">
            <div class="att-chart-stat"><i class="bi bi-bar-chart-line att-stat-icon"></i><span class="att-stat-label">Total Records:</span><span class="att-stat-value">{{ weeklyTotals.present + weeklyTotals.leave + weeklyTotals.absent }}</span></div>
            <div class="att-chart-stat"><i class="bi bi-check2-circle att-stat-icon"></i><span class="att-stat-label">Attendance Rate:</span><span class="att-stat-value">{{ attendanceRate }}%</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="att-summary-card">
          <div class="att-summary-icon present"><i class="bi bi-check-circle-fill"></i></div>
          <div class="att-summary-info">
            <span class="att-summary-label">Present This Week</span>
            <span class="att-summary-number">{{ weeklyTotals.present }}</span>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="att-summary-card">
          <div class="att-summary-icon absent"><i class="bi bi-x-circle-fill"></i></div>
          <div class="att-summary-info">
            <span class="att-summary-label">Absent This Week</span>
            <span class="att-summary-number">{{ weeklyTotals.absent }}</span>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="att-summary-card">
          <div class="att-summary-icon leave"><i class="bi bi-clock-fill"></i></div>
          <div class="att-summary-info">
            <span class="att-summary-label">On Leave This Week</span>
            <span class="att-summary-number">{{ weeklyTotals.leave }}</span>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="att-summary-card">
          <div class="att-summary-icon rate"><i class="bi bi-percent"></i></div>
          <div class="att-summary-info">
            <span class="att-summary-label">Attendance Rate</span>
            <span class="att-summary-number">{{ attendanceRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Today's Check-ins -->
    <div class="att-card card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 class="att-card-title"><i class="bi bi-clock-history"></i> Today's check-ins</h5>
          <div class="d-flex align-items-center gap-3">
            <div class="att-live-feed-badge">
              <span class="att-live-dot"></span>
              <span class="att-live-text">Live feed</span>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="showHistory = !showHistory">
              <i class="bi" :class="showHistory ? 'bi-arrow-left' : 'bi-calendar-week'"></i>
              {{ showHistory ? 'Back to Today' : 'View Full History' }}
            </button>
          </div>
        </div>

        <!-- Today View -->
        <div v-if="!showHistory">
          <div class="table-responsive">
            <table class="att-table table table-hover">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Today's Status</th>
                  <th>This Week</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in todayView" :key="emp.id">
                  <td>
                    <div class="att-employee-cell">
                      <div class="att-employee-avatar" :style="{ background: emp.color }">{{ emp.initials }}</div>
                      <span class="att-employee-name">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td>{{ emp.department }}</td>
                  <td>
                    <span class="att-status-badge" :class="statusClass(emp.status)">
                      <span class="att-status-dot"></span> {{ emp.status }}
                    </span>
                  </td>
                  <td>
                    <span class="att-week-summary">{{ emp.weekPresent }} Present, {{ emp.weekAbsent }} Absent</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" @click="viewEmployeeDetails(emp.id)">
                      <i class="bi bi-eye"></i> View
                    </button>
                  </td>
                </tr>
                <tr v-if="todayView.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">No employees found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- History View -->
        <div v-else>
          <div class="table-responsive">
            <table class="att-table table table-hover">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th v-for="day in dayLabels" :key="day">{{ day }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in historyView" :key="emp.id">
                  <td>
                    <div class="att-employee-cell">
                      <div class="att-employee-avatar" :style="{ background: emp.color }">{{ emp.initials }}</div>
                      <span class="att-employee-name">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td>{{ emp.department }}</td>
                  <td v-for="day in dayLabels" :key="day">
                    <span class="att-status-cell" :class="getHistoryStatusClass(emp, day)">
                      {{ getHistoryStatusLabel(emp, day) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="historyView.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">No attendance records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Attendance Modal -->
    <div class="modal fade" id="attLogModal" tabindex="-1" ref="logModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background:#272757;color:white;">
            <h5 class="modal-title"><i class="bi bi-calendar-check me-2"></i>Log Attendance</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitAttendance">
              <div class="mb-3">
                <label class="form-label fw-semibold">Employee</label>
                <select class="form-select" v-model="logForm.employeeId" required>
                  <option value="">Select employee...</option>
                  <option v-for="emp in employeeList" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Date</label>
                <input type="date" class="form-control" v-model="logForm.date" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Status</label>
                <select class="form-select" v-model="logForm.status" required>
                  <option value="">Select status...</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Notes (optional)</label>
                <textarea class="form-control" v-model="logForm.notes" rows="2" placeholder="Add any notes..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitAttendance" :disabled="saving">
              <i class="bi bi-check-lg me-1"></i> {{ saving ? 'Saving...' : 'Log Attendance' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Employee Details Modal -->
    <div class="modal fade" id="attEmployeeModal" tabindex="-1" ref="detailsModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content att-modal-content">
          <div class="modal-header att-modal-header">
            <h5 class="modal-title att-modal-title"><i class="bi bi-person-badge"></i> {{ selectedEmployee?.name || 'Employee Details' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body att-modal-body">
            <div v-if="selectedEmployee" class="p-3">
              <div class="att-detail-section">
                <div class="att-detail-section-title"><i class="bi bi-person-badge"></i> Employee Information</div>
                <div class="att-detail-grid">
                  <div class="att-detail-item"><span class="att-detail-label">Name</span><span class="att-detail-value">{{ selectedEmployee.name }}</span></div>
                  <div class="att-detail-item"><span class="att-detail-label">Department</span><span class="att-detail-value">{{ selectedEmployee.department }}</span></div>
                  <div class="att-detail-item"><span class="att-detail-label">Position</span><span class="att-detail-value">{{ selectedEmployee.position }}</span></div>
                  <div class="att-detail-item"><span class="att-detail-label">Today's Status</span><span class="att-detail-value" :class="selectedEmployee.status === 'Active' ? 'present' : 'absent'">{{ selectedEmployee.status }}</span></div>
                </div>
              </div>
              <div class="att-detail-section">
                <div class="att-detail-section-title"><i class="bi bi-calendar-week"></i> Weekly Attendance</div>
                <div class="att-detail-grid">
                  <div v-for="day in dayLabels" :key="day" class="att-detail-item">
                    <span class="att-detail-label">{{ day }}</span>
                    <span class="att-detail-value">{{ getWeekDayStatus(selectedEmployee, day) }}</span>
                  </div>
                  <div class="att-detail-item" style="grid-column:1/-1;border-top:2px solid #d8dce6;padding-top:10px;">
                    <span class="att-detail-label" style="font-weight:700;">Summary</span>
                    <span class="att-detail-value">{{ selectedEmployee.weekPresent || 0 }} Present, {{ selectedEmployee.weekAbsent || 0 }} Absent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer att-modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '../stores/auth';
import api from '../api/axios';
import { Modal } from 'bootstrap';

const { isHR } = useAuth();

const loading = ref(false);
const saving = ref(false);
const showHistory = ref(false);
const employeeList = ref([]);
const attendanceRecords = ref([]);
const selectedEmployee = ref(null);
const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const logForm = ref({
  employeeId: '',
  date: new Date().toISOString().split('T')[0],
  status: '',
  notes: '',
});

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const dateMapping = {
  Mon: getDateForDay('Monday'),
  Tue: getDateForDay('Tuesday'),
  Wed: getDateForDay('Wednesday'),
  Thu: getDateForDay('Thursday'),
  Fri: getDateForDay('Friday'),
};

function getDateForDay(dayName) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (dayName === 'Monday' ? 1 : dayName === 'Tuesday' ? 2 : dayName === 'Wednesday' ? 3 : dayName === 'Thursday' ? 4 : 5);
  const date = new Date(now.setDate(diff));
  return date.toISOString().split('T')[0];
}

const todayView = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0];
  return employeeList.value.map(emp => {
    const todayRecord = emp.attendance?.find(a => a.attendance_date === todayStr);
    const weekRecords = emp.attendance?.filter(a => Object.values(dateMapping).includes(a.attendance_date)) || [];
    const present = weekRecords.filter(a => a.status === 'present').length;
    const absent = weekRecords.filter(a => a.status === 'absent').length;
    let status = 'Not Checked In';
    if (todayRecord) {
      status = todayRecord.status === 'absent' ? 'On Leave' : 
               todayRecord.status === 'present' ? 'Active' : 'Not Checked In';
    }
    return {
      ...emp,
      status,
      weekPresent: present,
      weekAbsent: absent,
    };
  });
});

const historyView = computed(() => {
  return employeeList.value.map(emp => ({
    ...emp,
    weekRecords: emp.attendance?.filter(a => Object.values(dateMapping).includes(a.attendance_date)) || [],
  }));
});

const weeklyTotals = computed(() => {
  let present = 0, leave = 0, absent = 0;
  employeeList.value.forEach(emp => {
    const records = emp.attendance?.filter(a => Object.values(dateMapping).includes(a.attendance_date)) || [];
    records.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'on_leave') leave++;
      else if (r.status === 'absent') absent++;
    });
  });
  return { present, leave, absent };
});

const attendanceRate = computed(() => {
  const total = weeklyTotals.value.present + weeklyTotals.value.leave + weeklyTotals.value.absent;
  return total > 0 ? Math.round((weeklyTotals.value.present / total) * 100) : 0;
});

function getBarHeight(day, type) {
  const date = dateMapping[day];
  let count = 0;
  employeeList.value.forEach(emp => {
    const record = emp.attendance?.find(a => a.attendance_date === date);
    if (record) {
      if (type === 'present' && record.status === 'present') count++;
      else if (type === 'leave' && record.status === 'on_leave') count++;
      else if (type === 'absent' && (record.status === 'absent' || record.status === 'absent')) count++;
    }
  });
  return Math.min(count * 15, 150) || 4;
}

function getDayTotal(day) {
  const date = dateMapping[day];
  let count = 0;
  employeeList.value.forEach(emp => {
    const record = emp.attendance?.find(a => a.attendance_date === date);
    if (record) count++;
  });
  return count;
}

function statusClass(status) {
  if (status === 'Active') return 'active';
  if (status === 'On Leave') return 'on-leave';
  return 'probation';
}

function getHistoryStatusClass(emp, day) {
  const date = dateMapping[day];
  const record = emp.weekRecords?.find(a => a.attendance_date === date);
  if (!record) return '';
  if (record.status === 'present') return 'present';
  if (record.status === 'absent') return 'absent';
  return '';
}

function getHistoryStatusLabel(emp, day) {
  const date = dateMapping[day];
  const record = emp.weekRecords?.find(a => a.attendance_date === date);
  if (!record) return '—';
  if (record.status === 'present') return '✅ Present';
  if (record.status === 'absent') return '❌ Absent';
  return '—';
}

function getWeekDayStatus(emp, day) {
  const date = dateMapping[day];
  const record = emp.attendance?.find(a => a.attendance_date === date);
  return record ? record.status || '—' : '—';
}

function getDepartmentColor(dept) {
  const colors = {
    Development: '#4CAF50',
    HR: '#2196F3',
    QA: '#FF9800',
    Sales: '#E74C5E',
    Marketing: '#9C27B0',
    Design: '#00BCD4',
    IT: '#607D8B',
    Finance: '#795548',
    Support: '#3F51B5'
  };
  return colors[dept] || '#8686AC';
}

function viewEmployeeDetails(id) {
  const emp = employeeList.value.find(e => e.id === id);
  if (emp) {
    selectedEmployee.value = emp;
    const modal = new Modal(document.getElementById('attEmployeeModal'));
    modal.show();
  }
}

function openLogModal() {
  logForm.value.date = new Date().toISOString().split('T')[0];
  const modal = new Modal(document.getElementById('attLogModal'));
  modal.show();
}

function showToast(message, type) {
  if (window.showToast) window.showToast(message, type);
  else alert(message);
}

async function submitAttendance() {
  const { employeeId, date, status, notes } = logForm.value;
  if (!employeeId || !date || !status) {
    showToast('Please fill in all required fields', 'danger');
    return;
  }

  saving.value = true;
  try {
    await api.post('/attendance', {
      emp_id: employeeId,
      attendance_date: date,
      status: status.toLowerCase(),
      hours_worked: 8.0,
      notes: notes || null,
    });
    showToast('Attendance logged successfully', 'success');
    const modal = Modal.getInstance(document.getElementById('attLogModal'));
    if (modal) modal.hide();
    await loadData();
    logForm.value = { employeeId: '', date: new Date().toISOString().split('T')[0], status: '', notes: '' };
  } catch (error) {
    console.error('Submit error:', error);
    showToast(error.response?.data?.error || 'Failed to log attendance', 'danger');
  } finally {
    saving.value = false;
  }
}

// FIX: Implemented actual CSV Export for Attendance
function exportAttendance() {
  if (!isHR.value) {
    showToast('Only HR staff can export attendance data.', 'danger');
    return;
  }

  try {
    const headers = ['Employee Name', 'Department', 'Position', 'Total Present', 'Total Absent', 'Total On Leave'];
    const rows = employeeList.value.map(emp => {
      const present = emp.attendance.filter(a => a.status === 'present').length;
      const absent = emp.attendance.filter(a => a.status === 'absent').length;
      const leave = emp.attendance.filter(a => a.status === 'on_leave').length;
      
      return [
        `"${emp.name}"`,
        `"${emp.department}"`,
        `"${emp.position}"`,
        present,
        absent,
        leave
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast('Attendance exported successfully', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Failed to export attendance', 'danger');
  }
}

async function loadData() {
  loading.value = true;
  try {
    const empResponse = await api.get('/employees');
    const attResponse = await api.get('/attendance');

    if (empResponse.data.success) {
      employeeList.value = empResponse.data.data.map(emp => ({
        id: emp.emp_id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        department: emp.department || 'Unknown',
        position: emp.position || 'N/A',
        initials: (emp.first_name?.[0] || '') + (emp.last_name?.[0] || ''),
        color: getDepartmentColor(emp.department),
        attendance: [],
      }));
    }

    if (attResponse.data.success) {
      const records = attResponse.data.data;
      employeeList.value.forEach(emp => {
        emp.attendance = records.filter(r => r.emp_id === emp.id);
      });
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Failed to load attendance data', 'danger');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* FIX: Updated header classes to prevent button overlap */
.att-main-content { padding: 28px 36px 40px; }
.att-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.att-header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.att-page-title { font-size: 24px; font-weight: 700; color: #272757; margin: 0; }
.att-page-subtitle { font-size: 14px; color: #5a5a7a; margin: 2px 0 0; }
.att-card { border: none; border-radius: 12px; background: white; box-shadow: 0 2px 8px rgba(39,39,87,0.08); }
.att-card .card-body { padding: 24px 28px; }
.att-card-title { font-size: 15px; font-weight: 600; color: #272757; margin: 0; }
.att-card-title i { color: #8686ac; margin-right: 8px; }

.att-chart-wrapper { padding: 20px 12px 12px; background: white; border-radius: 8px; border: 1px solid #d8dce6; margin-bottom: 16px; }
.att-chart-container { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; height: 180px; padding: 0 4px 0 36px; }
.att-chart-day { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; min-width: 40px; }
.att-chart-bars { display: flex; flex-direction: column-reverse; align-items: center; flex: 1 1 auto; min-height: 0; width: 100%; justify-content: flex-end; gap: 2px; }
.att-chart-bar { width: 65%; max-width: 36px; min-height: 4px; border-radius: 2px 2px 0 0; transition: all 0.3s ease; }
.att-chart-bar.present { background: #43a047; }
.att-chart-bar.leave { background: #fb8c00; }
.att-chart-bar.absent { background: #e53935; }
.att-bar-percentage { font-size: 10px; font-weight: 600; color: #5a5a7a; margin-top: 2px; }
.att-chart-day-label { font-size: 12px; font-weight: 500; color: #5a5a7a; padding-top: 4px; border-top: 1px solid #d8dce6; width: 100%; text-align: center; }

.att-chart-legend { display: flex; justify-content: center; gap: 32px; padding: 12px 20px; background: #f0f2f7; border-radius: 8px; flex-wrap: wrap; border: 1px solid #d8dce6; margin-top: 12px; }
.att-chart-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #1a1a2e; }
.att-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.att-legend-dot.present { background: #43a047; }
.att-legend-dot.leave { background: #fb8c00; }
.att-legend-dot.absent { background: #e53935; }
.att-legend-count { font-weight: 700; color: #272757; margin-left: 2px; font-size: 14px; }

.att-chart-stats { display: flex; justify-content: space-around; padding: 12px 16px; margin-top: 12px; background: white; border-radius: 8px; border: 1px solid #d8dce6; flex-wrap: wrap; gap: 8px; }
.att-chart-stat { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.att-chart-stat .att-stat-icon { font-size: 16px; color: #5a5a7a; }
.att-chart-stat .att-stat-value { font-weight: 700; color: #272757; font-size: 15px; }
.att-chart-stat .att-stat-label { color: #5a5a7a; }

.att-summary-card { background: white; border-radius: 12px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(39,39,87,0.08); display: flex; align-items: center; gap: 16px; border-left: 3px solid #8686ac; }
.att-summary-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; color: white; }
.att-summary-icon.present { background: #43a047; }
.att-summary-icon.absent { background: #e53935; }
.att-summary-icon.leave { background: #fb8c00; }
.att-summary-icon.rate { background: #272757; }
.att-summary-info { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%; }
.att-summary-label { font-size: 13px; color: #5a5a7a; font-weight: 500; }
.att-summary-number { font-size: 24px; font-weight: 700; color: #1a1a2e; }

.att-live-dot { width: 7px; height: 7px; background: #43a047; border-radius: 50%; display: inline-block; animation: att-pulse-dot 1.5s ease-in-out infinite; }
@keyframes att-pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
.att-live-text { font-weight: 500; font-size: 13px; color: #5a5a7a; }

.att-table { margin: 0; }
.att-table thead th { background: #f0f2f7; color: #1a1a2e; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #d8dce6; padding: 10px 14px; }
.att-table tbody td { padding: 12px 14px; vertical-align: middle; border-bottom: 1px solid #d8dce6; font-size: 14px; }

.att-employee-cell { display: flex; align-items: center; gap: 10px; }
.att-employee-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: white; flex-shrink: 0; }
.att-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
.att-status-badge .att-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.att-status-badge.active { background: #e8f5e9; color: #1b5e20; }
.att-status-badge.active .att-status-dot { background: #43a047; }
.att-status-badge.on-leave { background: #fff3e0; color: #bf360c; }
.att-status-badge.on-leave .att-status-dot { background: #fb8c00; }
.att-status-badge.probation { background: #e3f2fd; color: #0d47a1; }
.att-status-badge.probation .att-status-dot { background: #1a73e8; }

.att-status-cell { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
.att-status-cell.present { background: #e8f5e9; color: #1b5e20; }
.att-status-cell.absent { background: #ffebee; color: #b71c1c; }

.att-detail-section { margin-bottom: 20px; }
.att-detail-section:last-child { margin-bottom: 0; }
.att-detail-section-title { font-size: 13px; font-weight: 600; color: #272757; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #d8dce6; display: flex; align-items: center; gap: 8px; }
.att-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
.att-detail-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #d8dce6; }
.att-detail-item .att-detail-label { font-weight: 500; color: #5a5a7a; font-size: 13px; }
.att-detail-item .att-detail-value { font-weight: 600; color: #1a1a2e; font-size: 14px; }
.att-detail-item .att-detail-value.present { color: #1b5e20; }
.att-detail-item .att-detail-value.absent { color: #b71c1c; }

.att-modal-content { border-radius: 12px; border: none; overflow: hidden; box-shadow: 0 24px 80px rgba(15,14,71,0.2); }
.att-modal-header { background: #272757; color: white; padding: 18px 28px; border-bottom: none; }
.att-modal-title { font-weight: 700; font-size: 19px; color: white; }
.att-modal-body { padding: 28px; background: white; }
.att-modal-footer { background: #f0f2f7; border-top: 1px solid #d8dce6; padding: 16px 28px; }

@media (max-width: 768px) {
  .att-main-content { padding: 20px; }
  .att-chart-container { height: 140px; gap: 4px; padding-left: 24px; }
  .att-chart-bar { width: 50%; max-width: 24px; min-height: 3px; }
  .att-chart-legend { gap: 10px; padding: 8px 10px; margin-top: 8px; }
  .att-chart-legend-item { font-size: 11px; }
  .att-chart-stats { flex-direction: column; align-items: center; gap: 4px; }
  .att-detail-grid { grid-template-columns: 1fr; gap: 0; }
  .att-summary-card { padding: 10px 14px; }
  .att-summary-number { font-size: 18px; }
  .att-summary-icon { width: 32px; height: 32px; font-size: 14px; }
}
</style>