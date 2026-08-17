// Attendance module - uses API only
// API_URL is defined in auth.js

// GET attendance from API
async function loadAttendanceFromAPI() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
}

// POST log attendance to API
async function logAttendanceToAPI(emp_id, date, status, hours, notes) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/attendance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            emp_id,
            attendance_date: date,
            status: status.toLowerCase(),
            hours_worked: hours,
            notes: notes || null
        })
    });
    return response.json();
}

// Load employees from API
async function loadEmployeesFromAPI() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
}

function getDepartmentColor(dept) {
    const colors = {
        'Development': '#4CAF50',
        'HR': '#2196F3',
        'QA': '#FF9800',
        'Sales': '#E74C5E',
        'Marketing': '#9C27B0',
        'Design': '#00BCD4',
        'IT': '#607D8B',
        'Finance': '#795548',
        'Support': '#3F51B5'
    };
    return colors[dept] || '#8686AC';
}

function showToast(message, type) {
    if (window.ModernTechUtils && typeof window.ModernTechUtils.showToast === 'function') {
        window.ModernTechUtils.showToast(message, type);
        return;
    }
    alert(message);
}

document.addEventListener("DOMContentLoaded", function () {
    initAttendance();
});

async function initAttendance() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const employees = await loadEmployeesFromAPI();
        if (!employees || employees.length === 0) {
            console.log('No employees found');
            return;
        }

        const currentUser = getCurrentUser();
        const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin" || currentUser.role === "hr_staff");
        const userEmployeeId = currentUser ? currentUser.employeeId : null;

        const attendanceData = await loadAttendanceFromAPI();

        const employeeList = employees.map(emp => {
            const empAttendance = attendanceData ? attendanceData.filter(a => a.emp_id === emp.emp_id) : [];
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = empAttendance.find(a => a.attendance_date === today);
            
            let status = "Not Checked In";
            if (todayRecord) {
                status = todayRecord.status === "absent" ? "On Leave" : 
                         todayRecord.status === "present" ? "Active" : "Not Checked In";
            }

            return {
                id: emp.emp_id,
                name: emp.first_name + ' ' + emp.last_name,
                first_name: emp.first_name,
                last_name: emp.last_name,
                department: emp.department,
                position: emp.position,
                initials: (emp.first_name?.[0] || '') + (emp.last_name?.[0] || ''),
                status: status,
                color: getDepartmentColor(emp.department),
                attendance: empAttendance,
                leaveRequests: []
            };
        });

        let visibleEmployees = employeeList;
        if (!isHR && userEmployeeId) {
            visibleEmployees = employeeList.filter(e => e.id === userEmployeeId);
        }

        renderTodayView(visibleEmployees);
        populateEmployeeSelect(employeeList);

        const dateInput = document.getElementById("attDate");
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        if (!isHR) {
            const logBtn = document.querySelector('[data-bs-target="#attLogModal"]');
            if (logBtn) logBtn.style.display = "none";
            const exportBtn = document.getElementById("attExportBtn");
            if (exportBtn) exportBtn.style.display = "none";
        }

        document.getElementById("attSubmitBtn").addEventListener("click", function() {
            logAttendance(employeeList);
        });

        console.log("✅ Attendance module initialized");
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load attendance data', 'danger');
    }
}

function renderTodayView(employees) {
    const container = document.getElementById("attCheckinsContainer");
    if (!container) return;

    if (!employees || employees.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No employees found.</td></tr>`;
        return;
    }

    const statusOrder = { Active: 0, "On Leave": 1, "Not Checked In": 2 };
    const sorted = [...employees].sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

    container.innerHTML = sorted.map((emp) => {
        const statusClass = emp.status === "Active" ? "active" : emp.status === "On Leave" ? "on-leave" : "probation";
        const weekRecords = emp.attendance.slice(0, 5);
        const presentCount = weekRecords.filter(a => a.status === 'present').length;
        const absentCount = weekRecords.filter(a => a.status === 'absent').length;

        let weekDisplay = '';
        if (weekRecords.length > 0) {
            weekDisplay = `<span class="att-week-summary">${presentCount} Present, ${absentCount} Absent</span>`;
        } else {
            weekDisplay = `<span class="att-week-summary" style="color: var(--text-muted); font-style: italic;">No records</span>`;
        }

        return `<tr>
            <td>
                <div class="att-employee-cell">
                    <div class="att-employee-avatar" style="background:${emp.color}">${emp.initials}</div>
                    <span class="att-employee-name">${emp.name}</span>
                </div>
            </td>
            <td>${emp.department}</td>
            <td><span class="att-status-badge ${statusClass}"><span class="att-status-dot"></span>${emp.status}</span></td>
            <td>${weekDisplay}</td>
            <td><button class="btn btn-sm btn-outline-primary view-details-btn" data-employee-id="${emp.id}">View</button></td>
        </tr>`;
    }).join("");

    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.employeeId);
            const emp = employees.find(e => e.id === id);
            if (emp) {
                const modal = document.getElementById("attModalBody");
                if (modal) {
                    modal.innerHTML = `<div class="p-3">
                        <h5>${emp.name}</h5>
                        <p><strong>Department:</strong> ${emp.department}</p>
                        <p><strong>Position:</strong> ${emp.position}</p>
                        <p><strong>Status:</strong> ${emp.status}</p>
                        <p><strong>Total Records:</strong> ${emp.attendance.length}</p>
                    </div>`;
                }
                new bootstrap.Modal(document.getElementById("attEmployeeModal")).show();
            }
        });
    });
}

function populateEmployeeSelect(employees) {
    const select = document.getElementById("attEmployeeSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select employee...</option>' +
        employees.map(e => `<option value="${e.id}">${e.name} (${e.position})</option>`).join('');
}

async function logAttendance(employeeList) {
    const employeeId = parseInt(document.getElementById("attEmployeeSelect").value);
    const date = document.getElementById("attDate").value;
    const status = document.getElementById("attStatusSelect").value;
    const notes = document.getElementById("attNotes").value;

    if (!employeeId) { showToast("Please select an employee.", "danger"); return; }
    if (!date) { showToast("Please select a date.", "danger"); return; }
    if (!status) { showToast("Please select a status.", "danger"); return; }

    try {
        const result = await logAttendanceToAPI(employeeId, date, status, 8.0, notes);
        if (result.success) {
            showToast("Attendance logged", "success");
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(result.error || "Failed", "danger");
        }
    } catch (error) {
        showToast("Error logging attendance", "danger");
    }
}