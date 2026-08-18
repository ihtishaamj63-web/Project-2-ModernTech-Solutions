<!-- src/views/Attendance.vue -->
<template>
  <div class="att-main-content">
    <div class="att-page-header">
      <div>
        <h1 class="att-page-title">Attendance Tracking</h1>
        <p class="att-page-subtitle"><i class="bi bi-calendar3 me-1"></i> {{ today }}</p>
      </div>
      <div class="att-header-actions" v-if="isHR">
        <button class="btn btn-outline-primary" @click="exportAttendance">
          <i class="bi bi-download me-1"></i> Export CSV
        </button>
        <button class="btn btn-primary" @click="openLogModal">
          <i class="bi bi-plus-lg me-1"></i> Log Attendance
        </button>
      </div>
    </div>

    <!-- HR View: Stats & Chart -->
    <template v-if="isHR">
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="att-summary-card">
            <div class="att-summary-icon present"><i class="bi bi-check-circle-fill"></i></div>
            <div class="att-summary-info">
              <span class="att-summary-label">Present Today</span>
              <span class="att-summary-number">{{ stats.present }}</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="att-summary-card">
            <div class="att-summary-icon absent"><i class="bi bi-x-circle-fill"></i></div>
            <div class="att-summary-info">
              <span class="att-summary-label">Absent Today</span>
              <span class="att-summary-number">{{ stats.absent }}</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="att-summary-card">
            <div class="att-summary-icon leave"><i class="bi bi-clock-fill"></i></div>
            <div class="att-summary-info">
              <span class="att-summary-label">On Leave Today</span>
              <span class="att-summary-number">{{ stats.leave }}</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="att-summary-card">
            <div class="att-summary-icon rate"><i class="bi bi-graph-up"></i></div>
            <div class="att-summary-info">
              <span class="att-summary-label">Attendance Rate (14d)</span>
              <span class="att-summary-number">{{ stats.rate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic 14-Day Chart -->
      <div class="att-card card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="att-card-title mb-3"><i class="bi bi-bar-chart-line-fill"></i> Last 14 Days Overview</h5>
          <div class="chart-container">
            <div v-for="day in chartData" :key="day.date" class="chart-day">
              <div class="chart-bars">
                <div class="chart-bar present" :style="{ height: (day.present * 10) + 'px' }" :title="`Present: ${day.present}`"></div>
                <div class="chart-bar leave" :style="{ height: (day.leave * 10) + 'px' }" :title="`On Leave: ${day.leave}`"></div>
                <div class="chart-bar absent" :style="{ height: (day.absent * 10) + 'px' }" :title="`Absent: ${day.absent}`"></div>
              </div>
              <span class="chart-label">{{ day.shortDate }}</span>
            </div>
          </div>
          <div class="chart-legend mt-3">
            <span><span class="legend-dot present"></span> Present</span>
            <span><span class="legend-dot leave"></span> On Leave</span>
            <span><span class="legend-dot absent"></span> Absent</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Main Table Area -->
    <div class="att-card card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 class="att-card-title mb-0">
            <i class="bi bi-list-ul"></i> 
            {{ isHR ? "Today's Employee Roster" : 'My Attendance History' }}
          </h5>
          <div class="att-search-box">
            <input type="text" v-model="search" placeholder="Search employee..." v-if="isHR" />
          </div>
        </div>

        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>

        <div v-else class="table-responsive">
          <table class="att-table table table-hover">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>{{ isHR ? 'Today Status' : 'Date' }}</th>
                <th>{{ isHR ? 'Check In' : 'Status' }}</th>
                <th v-if="!isHR">Check Out</th>
                <th v-if="!isHR">Hours</th>
                <th v-if="isHR">Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- HR View: One row per employee for TODAY -->
              <template v-if="isHR">
                <tr v-for="emp in filteredRoster" :key="emp.emp_id">
                  <td>
                    <div class="att-employee-cell">
                      <div class="att-employee-avatar" :style="{ background: emp.color }">{{ emp.initials }}</div>
                      <span class="att-employee-name">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td>{{ emp.department }}</td>
                  <td>
                    <span class="att-status-badge" :class="statusClass(emp.todayStatus)">
                      <span class="att-status-dot"></span> {{ formatStatus(emp.todayStatus) }}
                    </span>
                  </td>
                  <td>{{ emp.checkIn ? formatTime(emp.checkIn) : '—' }}</td>
                  <td><button class="btn btn-sm btn-outline-primary" @click="viewHistory(emp)"><i class="bi bi-eye"></i> History</button></td>
                </tr>
              </template>

              <!-- Employee View: All their past records -->
              <template v-else>
                <tr v-for="record in myHistory" :key="record.attendance_id">
                  <td>
                    <div class="att-employee-cell">
                      <div class="att-employee-avatar" :style="{ background: record.color }">{{ record.initials }}</div>
                      <span class="att-employee-name">{{ record.employeeName }}</span>
                    </div>
                  </td>
                  <td>{{ record.department }}</td>
                  <td>{{ formatDate(record.attendance_date) }}</td>
                  <td>
                    <span class="att-status-badge" :class="statusClass(record.status)">
                      <span class="att-status-dot"></span> {{ formatStatus(record.status) }}
                    </span>
                  </td>
                  <td>{{ record.check_out_time ? formatTime(record.check_out_time) : '—' }}</td>
                  <td>{{ record.hours_worked ? record.hours_worked + 'h' : '—' }}</td>
                </tr>
                <tr v-if="myHistory.length === 0">
                  <td colspan="6" class="text-center text-muted py-4">No attendance records found for you.</td>
                </tr>
              </template>
            </tbody>
          </table>
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
                  <option v-for="emp in employeeList" :key="emp.emp_id" :value="emp.emp_id">{{ emp.name }} ({{ emp.department }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Date</label>
                <input type="date" class="form-control" v-model="logForm.date" required :max="todayStr" />
                <small class="text-muted">Future dates are not allowed.</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Status</label>
                <select class="form-select" v-model="logForm.status" required @change="handleStatusChange">
                  <option value="">Select status...</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              
              <!-- FIX: Strict Dropdown Selects instead of clunky Time Wheels -->
              <div class="row" v-if="logForm.status === 'present' || logForm.status === 'late' || logForm.status === 'half_day'">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">Check In Time</label>
                  <select class="form-select" v-model="logForm.checkIn">
                    <option value="">Select time...</option>
                    <option v-for="t in checkInTimes" :key="t" :value="t">{{ formatTime(t) }}</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">Check Out Time</label>
                  <select class="form-select" v-model="logForm.checkOut">
                    <option value="">Select time...</option>
                    <option v-for="t in checkOutTimes" :key="t" :value="t">{{ formatTime(t) }}</option>
                  </select>
                </div>
                <div class="col-12 mb-3 text-muted text-center">
                  <small>Calculated Hours: <strong>{{ calculatedHours }}h</strong></small>
                </div>
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

    <!-- Employee History Modal (For HR) -->
    <div class="modal fade" id="attHistoryModal" tabindex="-1" ref="historyModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header" style="background:#272757;color:white;">
            <h5 class="modal-title"><i class="bi bi-clock-history me-2"></i>History: {{ selectedEmp?.name }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  <tr v-for="rec in selectedEmpHistory" :key="rec.attendance_id">
                    <td>{{ formatDate(rec.attendance_date) }}</td>
                    <td><span class="badge" :class="statusClass(rec.status)">{{ formatStatus(rec.status) }}</span></td>
                    <td>{{ formatTime(rec.check_in_time) }}</td>
                    <td>{{ formatTime(rec.check_out_time) }}</td>
                    <td>{{ rec.hours_worked || 0 }}h</td>
                  </tr>
                  <tr v-if="selectedEmpHistory.length === 0">
                    <td colspan="5" class="text-center text-muted">No history found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
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

const { isHR, state } = useAuth();

const loading = ref(false);
const saving = ref(false);
const employeeList = ref([]);
const allRecords = ref([]);
const search = ref('');
const selectedEmp = ref(null);

const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// FIX: Generate today's date locally to prevent UTC timezone shifting
const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayStr = getLocalTodayStr();

const checkInTimes = ['07:00:00', '07:30:00', '08:00:00', '08:30:00', '09:00:00', '09:30:00', '10:00:00'];
const checkOutTimes = ['16:00:00', '16:30:00', '17:00:00', '17:30:00', '18:00:00', '18:30:00', '19:00:00'];

const logForm = ref({
  employeeId: '',
  date: todayStr,
  status: '',
  checkIn: '',
  checkOut: '',
});

const stats = ref({ present: 0, absent: 0, leave: 0, rate: 0 });

const filteredRoster = computed(() => {
  if (!search.value) return employeeList.value;
  const q = search.value.toLowerCase();
  return employeeList.value.filter(e => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
});

const myHistory = computed(() => {
  if (!state.user) return [];
  const myEmp = employeeList.value.find(e => e.user_id === state.user.user_id);
  if (!myEmp) return [];
  
  return allRecords.value
    .filter(r => r.emp_id === myEmp.emp_id)
    .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
});

const selectedEmpHistory = computed(() => {
  if (!selectedEmp.value) return [];
  return allRecords.value
    .filter(r => r.emp_id === selectedEmp.value.emp_id)
    .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
});

const chartData = computed(() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Local YYYY-MM-DD for chart comparison
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayRecords = allRecords.value.filter(r => r.attendance_date === dateStr);
    
    days.push({
      date: dateStr,
      shortDate: d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit' }),
      present: dayRecords.filter(r => r.status === 'present' || r.status === 'late').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      leave: dayRecords.filter(r => r.status === 'on_leave' || r.status === 'half_day').length,
    });
  }
  return days;
});

// FIX: Calculate hours dynamically based on strict dropdown selections
const calculatedHours = computed(() => {
  if (!logForm.value.checkIn || !logForm.value.checkOut) return 0;
  const [inH, inM] = logForm.value.checkIn.split(':').map(Number);
  const [outH, outM] = logForm.value.checkOut.split(':').map(Number);
  const diff = (outH + outM / 60) - (inH + inM / 60);
  return diff > 0 ? diff.toFixed(1) : 0;
});

// FIX: Robust date formatter that forces local time parsing
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && dateInput.length === 10) return dateInput;
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const normalized = normalizeDate(dateStr);
  if (!normalized) return '—';
  // Create a local date object to display it properly
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  // Format HH:MM:SS to HH:MM
  return String(timeStr).substring(0, 5);
}

function formatStatus(status) {
  if (!status) return 'Not Recorded';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function statusClass(status) {
  if (status === 'present') return 'active';
  if (status === 'absent') return 'absent';
  if (status === 'on_leave' || status === 'half_day') return 'on-leave';
  if (status === 'late') return 'late';
  return 'probation';
}

function getDepartmentColor(dept) {
  const colors = {
    Development: '#4CAF50', HR: '#2196F3', QA: '#FF9800', Sales: '#E74C5E',
    Marketing: '#9C27B0', Design: '#00BCD4', IT: '#607D8B', Finance: '#795548', Support: '#3F51B5'
  };
  return colors[dept] || '#8686AC';
}

function handleStatusChange() {
  // If status doesn't require times, clear them
  if (logForm.value.status === 'absent' || logForm.value.status === 'on_leave') {
    logForm.value.checkIn = '';
    logForm.value.checkOut = '';
  }
}

function openLogModal() {
  logForm.value = { employeeId: '', date: todayStr, status: '', checkIn: '', checkOut: '' };
  const modal = new Modal(document.getElementById('attLogModal'));
  modal.show();
}

function viewHistory(emp) {
  selectedEmp.value = emp;
  const modal = new Modal(document.getElementById('attHistoryModal'));
  modal.show();
}

function showToast(message, type) {
  if (window.showToast) window.showToast(message, type);
  else alert(message);
}

async function submitAttendance() {
  const { employeeId, date, status, checkIn, checkOut } = logForm.value;
  if (!employeeId || !date || !status) {
    showToast('Please fill in all required fields', 'danger');
    return;
  }

  // FIX: Prevent logging attendance for weekends
  const dateObj = new Date(date);
  const day = dateObj.getDay();
  if (day === 0 || day === 6) {
    showToast('Cannot log attendance for weekends', 'danger');
    return;
  }

  // If Present/Late, ensure times are selected
  if ((status === 'present' || status === 'late' || status === 'half_day') && (!checkIn || !checkOut)) {
    showToast('Please select Check In and Check Out times', 'danger');
    return;
  }

  saving.value = true;
  try {
    await api.post('/attendance', {
      emp_id: employeeId,
      attendance_date: date,
      status: status,
      check_in_time: checkIn || null,
      check_out_time: checkOut || null,
      hours_worked: calculatedHours.value || 0,
    });
    
    showToast('Attendance logged successfully', 'success');
    const modal = Modal.getInstance(document.getElementById('attLogModal'));
    if (modal) modal.hide();
    
    await loadData();
  } catch (error) {
    console.error('Submit error:', error);
    showToast(error.response?.data?.error || 'Failed to log attendance. Record might already exist.', 'danger');
  } finally {
    saving.value = false;
  }
}

function exportAttendance() {
  try {
    const headers = ['Employee Name', 'Date', 'Status', 'Check In', 'Check Out', 'Hours'];
    const rows = allRecords.value.map(r => {
      const emp = employeeList.value.find(e => e.emp_id === r.emp_id);
      return [
        `"${emp ? emp.name : 'Unknown'}"`,
        `"${formatDate(r.attendance_date)}"`,
        `"${formatStatus(r.status)}"`,
        `"${formatTime(r.check_in_time)}"`,
        `"${formatTime(r.check_out_time)}"`,
        r.hours_worked || 0
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    link.download = `attendance_report_${todayStr}.csv`;
    link.click();
    showToast('Attendance exported successfully', 'success');
  } catch (error) {
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
        ...emp,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
        initials: (emp.first_name?.[0] || '') + (emp.last_name?.[0] || ''),
        color: getDepartmentColor(emp.department),
        todayStatus: 'not_recorded',
        checkIn: null,
      }));
    }

    if (attResponse.data.success) {
      // FIX: Normalize dates right when we fetch them using local time
      allRecords.value = attResponse.data.data.map(r => ({
        ...r,
        attendance_date: normalizeDate(r.attendance_date)
      }));
      
      let present = 0, absent = 0, leave = 0;
      
      employeeList.value.forEach(emp => {
        const todayRec = allRecords.value.find(r => r.emp_id === emp.emp_id && r.attendance_date === todayStr);
        if (todayRec) {
          emp.todayStatus = todayRec.status;
          emp.checkIn = todayRec.check_in_time;
          
          if (todayRec.status === 'present' || todayRec.status === 'late') present++;
          else if (todayRec.status === 'absent') absent++;
          else if (todayRec.status === 'on_leave' || todayRec.status === 'half_day') leave++;
        }
      });

      let totalRecords = 0;
      let presentRecords = 0;
      chartData.value.forEach(day => {
        totalRecords += day.present + day.absent + day.leave;
        presentRecords += day.present;
      });
      
      stats.value = {
        present,
        absent,
        leave,
        rate: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
      };
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
.att-main-content { padding: 28px 36px 40px; }
.att-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.att-header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.att-page-title { font-size: 24px; font-weight: 700; color: #272757; margin: 0; }
.att-page-subtitle { font-size: 14px; color: #5a5a7a; margin: 2px 0 0; }
.att-card { border: none; border-radius: 12px; background: white; box-shadow: 0 2px 8px rgba(39,39,87,0.08); }
.att-card .card-body { padding: 24px 28px; }
.att-card-title { font-size: 15px; font-weight: 600; color: #272757; margin: 0; }
.att-card-title i { color: #8686ac; margin-right: 8px; }

.att-summary-card { background: white; border-radius: 12px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(39,39,87,0.08); display: flex; align-items: center; gap: 16px; border-left: 3px solid #8686ac; }
.att-summary-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; color: white; }
.att-summary-icon.present { background: #43a047; }
.att-summary-icon.absent { background: #e53935; }
.att-summary-icon.leave { background: #fb8c00; }
.att-summary-icon.rate { background: #272757; }
.att-summary-info { display: flex; flex-direction:column; gap: 4px; }
.att-summary-label { font-size: 13px; color: #5a5a7a; font-weight: 500; }
.att-summary-number { font-size: 24px; font-weight: 700; color: #1a1a2e; }

.chart-container { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; height: 180px; padding-top: 20px; }
.chart-day { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
.chart-bars { display: flex; align-items: flex-end; gap: 2px; height: 100%; width: 100%; justify-content: center; }
.chart-bar { width: 6px; min-height: 2px; border-radius: 2px 2px 0 0; transition: height 0.3s ease; }
.chart-bar.present { background: #43a047; }
.chart-bar.leave { background: #fb8c00; }
.chart-bar.absent { background: #e53935; }
.chart-label { font-size: 10px; color: #5a5a7a; font-weight: 600; }
.chart-legend { display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #5a5a7a; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.legend-dot.present { background: #43a047; }
.legend-dot.leave { background: #fb8c00; }
.legend-dot.absent { background: #e53935; }

.att-table { margin: 0; }
.att-table thead th { background: #f0f2f7; color: #1a1a2e; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #d8dce6; padding: 10px 14px; }
.att-table tbody td { padding: 12px 14px; vertical-align: middle; border-bottom: 1px solid #d8dce6; font-size: 14px; }

.att-employee-cell { display: flex; align-items: center; gap: 10px; }
.att-employee-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: white; flex-shrink: 0; }
.att-employee-name { font-weight: 500; }

.att-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
.att-status-badge .att-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.att-status-badge.active { background: #e8f5e9; color: #1b5e20; }
.att-status-badge.active .att-status-dot { background: #43a047; }
.att-status-badge.absent { background: #ffebee; color: #b71c1c; }
.att-status-badge.absent .att-status-dot { background: #e53935; }
.att-status-badge.on-leave { background: #fff3e0; color: #bf360c; }
.att-status-badge.on-leave .att-status-dot { background: #fb8c00; }
.att-status-badge.late { background: #e3f2fd; color: #0d47a1; }
.att-status-badge.late .att-status-dot { background: #1a73e8; }
.att-status-badge.probation { background: #f0f2f7; color: #5a5a7a; }
.att-status-badge.probation .att-status-dot { background: #8686ac; }
</style>