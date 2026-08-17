// Time-off module - uses API only
const API_URL = 'http://localhost:3000';

// GET time-off from API
async function loadTimeOffFromAPI() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/timeoff`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
}

// POST submit time-off to API
async function submitTimeOffToAPI(emp_id, start_date, end_date, type, reason) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/timeoff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            emp_id,
            start_date,
            end_date,
            timeoff_type: type,
            reason: reason || null
        })
    });
    return response.json();
}

// PUT approve time-off
async function approveTimeOffAPI(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/timeoff/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

// PUT deny time-off
async function denyTimeOffAPI(id, reason) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/timeoff/${id}/deny`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ denial_reason: reason || null })
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
    if (window.ModernTechUtils && window.ModernTechUtils.showToast) {
        window.ModernTechUtils.showToast(message, type);
        return;
    }
    alert(message);
}

document.addEventListener("DOMContentLoaded", function () {
    initTimeOff();
});

async function initTimeOff() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const currentUser = getCurrentUser();
        const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");
        const userEmployeeId = currentUser ? currentUser.employeeId : null;

        const toPageDate = document.getElementById("toPageDate");
        if (toPageDate) {
            toPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
        }

        // Load employees
        const employees = await loadEmployeesFromAPI();
        const employeeList = employees.map(emp => ({
            ...emp,
            employeeId: emp.emp_id,
            name: emp.first_name + ' ' + emp.last_name,
            initials: (emp.first_name?.[0] || '') + (emp.last_name?.[0] || ''),
            color: getDepartmentColor(emp.department),
            leaveRequests: [],
            attendance: []
        }));

        // Load timeoff
        const timeoffData = await loadTimeOffFromAPI();
        
        if (timeoffData) {
            timeoffData.forEach(record => {
                const emp = employeeList.find(e => e.employeeId === record.emp_id);
                if (emp) {
                    emp.leaveRequests.push({
                        date: record.start_date,
                        reason: record.reason,
                        status: record.status,
                        type: record.timeoff_type,
                        days: 1,
                        endDate: record.end_date,
                        timeoff_id: record.timeoff_id
                    });
                }
            });
        }

        let visibleEmployees = employeeList;
        if (!isHR && userEmployeeId) {
            visibleEmployees = employeeList.filter(e => e.employeeId === userEmployeeId);
        }

        renderAllRequests(visibleEmployees, isHR, userEmployeeId);
        populateEmployeeSelect(visibleEmployees, isHR, userEmployeeId);
        setupFilterTabs(visibleEmployees, isHR, userEmployeeId);

        const submitBtn = document.getElementById("toSubmitBtn");
        if (submitBtn) {
            submitBtn.addEventListener("click", function() {
                submitNewRequest(visibleEmployees, isHR, userEmployeeId);
            });
        }

        console.log(`✅ Time Off module initialized with API (${isHR ? "HR Admin" : "Employee"} view)`);
    } catch (error) {
        console.error('Error initializing timeoff:', error);
    }
}

function renderAllRequests(employees, isHR, userEmployeeId) {
    const container = document.getElementById("toRequestsContainer");
    if (!container) return;

    let allRequests = [];
    employees.forEach(emp => {
        emp.leaveRequests.forEach(req => {
            allRequests.push({
                ...req,
                employeeName: emp.name,
                position: emp.position,
                initials: emp.initials,
                color: emp.color,
                employeeId: emp.employeeId
            });
        });
    });

    if (!allRequests.length) {
        container.innerHTML = `<div class="to-empty-state"><i class="bi bi-inbox"></i><p class="text-muted">No time off requests found.</p></div>`;
        return;
    }

    allRequests.sort((a, b) => b.date?.localeCompare(a.date));

    let html = "";
    allRequests.forEach((req) => {
        const days = req.days || "—";
        const type = req.type || "Annual";
        const dateRange = req.date || "—";
        const statusClass = req.status.toLowerCase();
        
        let badgeClass = "", icon = "";
        if (req.status === "Approved") {
            badgeClass = "approved";
            icon = "✓";
        } else if (req.status === "Denied") {
            badgeClass = "denied";
            icon = "✗";
        } else {
            badgeClass = "pending";
            icon = "⏳";
        }

        let actions = "";
        if (req.status === "Pending") {
            if (isHR) {
                actions = `<button class="to-btn-approve" onclick="handleApprove(${req.employeeId}, '${req.date}')"><i class="bi bi-check-lg me-1"></i>Approve</button>
                     <button class="to-btn-deny" onclick="handleDeny(${req.employeeId}, '${req.date}')"><i class="bi bi-x-lg me-1"></i>Deny</button>
                     <button onclick="handleCancel(${req.employeeId}, '${req.date}')" style="background:#6b6b8a;color:white;border:none;padding:5px 16px;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='#4a4a6a'" onmouseout="this.style.background='#6b6b8a'"><i class="bi bi-trash me-1"></i>Cancel</button>`;
            } else {
                actions = `<button onclick="handleCancel(${req.employeeId}, '${req.date}')" style="background:#6b6b8a;color:white;border:none;padding:5px 16px;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='#4a4a6a'" onmouseout="this.style.background='#6b6b8a'"><i class="bi bi-trash me-1"></i>Cancel Request</button>`;
            }
        } else if (isHR) {
            actions = `<button class="to-btn-reverse" onclick="handleReverse(${req.employeeId}, '${req.date}')"><i class="bi bi-arrow-counterclockwise me-1"></i>Reverse</button>`;
        }

        html += `<div class="to-request-card status-${statusClass}">
            <div class="to-request-header">
                <div class="to-request-employee">
                    <div class="to-request-avatar" style="background:${req.color}">${req.initials}</div>
                    <div>
                        <div class="to-request-name">${req.employeeName}</div>
                        <div class="to-request-position">${req.position}</div>
                    </div>
                </div>
                <span class="to-request-status ${badgeClass}">${icon} ${req.status}</span>
            </div>
            <div class="to-request-details">
                <span class="to-detail-label">TYPE</span>
                <span class="to-detail-value">${type}</span>
                <span class="to-detail-label">DATES</span>
                <span class="to-detail-value">${dateRange}</span>
                <span class="to-detail-label">DAYS</span>
                <span class="to-detail-value">${days}</span>
            </div>
            <div class="to-request-reason">"${req.reason}"</div>
            <div class="to-request-actions">${actions}</div>
        </div>`;
    });
    container.innerHTML = html;
}

function populateEmployeeSelect(employees, isHR, userEmployeeId) {
    const select = document.getElementById("toEmployeeSelect");
    if (!select) return;
    if (isHR) {
        select.innerHTML = '<option value="">Select employee...</option>' +
            employees.map(emp => `<option value="${emp.employeeId}">${emp.name} (${emp.position})</option>`).join('');
        select.disabled = false;
    } else {
        const userEmp = employees.find(e => e.employeeId === userEmployeeId);
        if (userEmp) {
            select.innerHTML = `<option value="${userEmp.employeeId}" selected>${userEmp.name} (${userEmp.position})</option>`;
            select.disabled = true;
        }
    }
}

function setupFilterTabs(employees, isHR, userEmployeeId) {
    document.querySelectorAll(".to-filter-tab").forEach((tab) =>
        tab.addEventListener("click", function () {
            document.querySelectorAll(".to-filter-tab").forEach((t) => t.classList.remove("active"));
            this.classList.add("active");
            const filter = this.dataset.filter;
            const container = document.getElementById("toRequestsContainer");
            const cards = container.querySelectorAll(".to-request-card");
            cards.forEach(card => {
                if (filter === "all") {
                    card.style.display = "block";
                } else {
                    const status = card.className.match(/status-(\w+)/);
                    if (status && status[1] === filter.toLowerCase()) {
                        card.style.display = "block";
                    } else {
                        card.style.display = "none";
                    }
                }
            });
        })
    );
}

async function submitNewRequest(employees, isHR, userEmployeeId) {
    const employeeId = parseInt(document.getElementById("toEmployeeSelect").value);
    const type = document.getElementById("toTypeSelect").value;
    const startDate = document.getElementById("toStartDate").value;
    const endDate = document.getElementById("toEndDate").value;
    const reason = document.getElementById("toReason").value || "No reason provided";

    if (!employeeId) { showToast("Please select an employee.", "danger"); return; }
    if (!type) { showToast("Please select a leave type.", "danger"); return; }
    if (!startDate || !endDate) { showToast("Please select both dates.", "danger"); return; }
    if (endDate < startDate) { showToast("End date must be after start date.", "danger"); return; }
    if (!isHR && employeeId !== userEmployeeId) { showToast("You can only submit requests for yourself.", "danger"); return; }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (start < todayDate) { showToast("Cannot request leave for past dates.", "danger"); return; }

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 30) { showToast("Maximum 30 days per leave request.", "danger"); return; }

    const emp = employees.find(e => e.employeeId === employeeId);
    if (!emp) return;

    try {
        const result = await submitTimeOffToAPI(employeeId, startDate, endDate, type, reason);
        if (result.success) {
            emp.leaveRequests.push({
                date: startDate,
                reason,
                status: "Pending",
                type,
                days,
                endDate,
                timeoff_id: result.data.timeoff_id
            });
            document.getElementById("toRequestForm").reset();
            renderAllRequests(employees, isHR, userEmployeeId);
            showToast("✓ Request submitted successfully", "success");
        } else {
            showToast(result.error || "Failed to submit request", "danger");
        }
    } catch (error) {
        showToast("Error submitting request", "danger");
    }
}

// Global handlers for buttons
window.handleApprove = async function(employeeId, date) {
    const emp = window._employees ? window._employees.find(e => e.employeeId === employeeId) : null;
    if (!emp) return;
    const request = emp.leaveRequests.find(r => r.date === date && r.status === "Pending");
    if (!request) return;

    try {
        const result = await approveTimeOffAPI(request.timeoff_id);
        if (result.success) {
            request.status = "Approved";
            renderAllRequests(window._employees || [], true, null);
            showToast("✓ Request approved", "success");
        } else {
            showToast(result.error || "Failed to approve", "danger");
        }
    } catch (error) {
        showToast("Error approving request", "danger");
    }
};

window.handleDeny = async function(employeeId, date) {
    const emp = window._employees ? window._employees.find(e => e.employeeId === employeeId) : null;
    if (!emp) return;
    const request = emp.leaveRequests.find(r => r.date === date && r.status === "Pending");
    if (!request) return;

    try {
        const result = await denyTimeOffAPI(request.timeoff_id, "Denied by HR");
        if (result.success) {
            request.status = "Denied";
            renderAllRequests(window._employees || [], true, null);
            showToast("✗ Request denied", "danger");
        } else {
            showToast(result.error || "Failed to deny", "danger");
        }
    } catch (error) {
        showToast("Error denying request", "danger");
    }
};

window.handleCancel = function(employeeId, date) {
    const emp = window._employees ? window._employees.find(e => e.employeeId === employeeId) : null;
    if (!emp) return;
    emp.leaveRequests = emp.leaveRequests.filter(r => !(r.date === date && r.status === "Pending"));
    renderAllRequests(window._employees || [], true, null);
    showToast("Request cancelled", "success");
};

window.handleReverse = function(employeeId, date) {
    const emp = window._employees ? window._employees.find(e => e.employeeId === employeeId) : null;
    if (!emp) return;
    const request = emp.leaveRequests.find(r => r.date === date && r.status !== "Pending");
    if (request) {
        request.status = "Pending";
        renderAllRequests(window._employees || [], true, null);
        showToast("↻ Reversed", "success");
    }
};