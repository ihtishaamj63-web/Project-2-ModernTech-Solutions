// Payroll module - uses API only
// API_URL is defined in auth.js

document.addEventListener("DOMContentLoaded", function () {
    initPayroll();
});

async function getPayrollFromAPI() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/payroll`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching payroll:', error);
        return [];
    }
}

async function calculatePayslipAPI(emp_id, period_start, period_end) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/payroll/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ emp_id, period_start, period_end })
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error calculating payslip:', error);
        return null;
    }
}

async function loadEmployeesFromAPI() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        return [];
    }
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
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    alert(message);
}

function getInitials(name) {
    if (!name) return "";
    return name.split(' ').map(word => word[0]).join('');
}

async function initPayroll() {
    try {
        const currentUser = getCurrentUser();
        const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin" || currentUser.role === "hr_staff");
        const userEmployeeId = currentUser ? currentUser.employeeId : null;

        const payPageDate = document.getElementById("payPageDate");
        if (payPageDate) {
            payPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
        }

        // Load employees
        const employees = await loadEmployeesFromAPI();
        if (!employees || employees.length === 0) {
            document.getElementById("payBody").innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No employees found.</td></tr>';
            return;
        }

        // Load payroll data
        const payrollData = await getPayrollFromAPI();

        // Build payroll list - FIXED: Add name field
        const visibleEmployees = isHR ? employees : employees.filter(e => e.emp_id === userEmployeeId);
        
        const payroll = visibleEmployees.map((emp) => {
            const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown';
            const existingPayroll = payrollData.find(p => p.emp_id === emp.emp_id);
            if (existingPayroll) {
                const baseSalary = parseFloat(existingPayroll.base_salary);
                const taxRate = parseFloat(existingPayroll.tax_rate) / 100;
                const gross = baseSalary;
                const tax = gross * taxRate;
                const net = gross - tax;
                return {
                    ...emp,
                    name: name,  // ← FIXED: Add name field
                    id: "MT-" + String(emp.emp_id).padStart(3, "0"),
                    hoursWorked: 160,
                    leaveDeductions: 0,
                    finalSalary: baseSalary,
                    hourlyRate: Math.round(baseSalary / 160),
                    gross: gross,
                    deductions: tax,
                    net: net,
                    taxRate: taxRate,
                    color: getDepartmentColor(emp.department)
                };
            } else {
                const salary = 50000;
                return {
                    ...emp,
                    name: name,  // ← FIXED: Add name field
                    id: "MT-" + String(emp.emp_id).padStart(3, "0"),
                    hoursWorked: 0,
                    leaveDeductions: 0,
                    finalSalary: salary,
                    hourlyRate: 0,
                    gross: 0,
                    deductions: 0,
                    net: 0,
                    taxRate: 0,
                    color: getDepartmentColor(emp.department)
                };
            }
        });

        let query = "";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                query = e.target.value;
                renderTable();
            });
        }

        function fmt(n) {
            return "R " + n.toLocaleString("en-ZA");
        }

        function renderTable() {
            const tbody = document.getElementById("payBody");
            if (!tbody) return;
            const q = query.trim().toLowerCase();

            const filtered = payroll.filter(p =>
                !q || p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
            );

            tbody.innerHTML = filtered.length ? filtered.map((p) => `
                <tr onclick="openPayslip(${p.emp_id})" style="cursor:pointer;">
                    <td>
                        <div class="pay-slip-emp" style="margin:0;padding:0;border:none;">
                            <div class="pay-slip-avatar" style="background:${p.color}">${getInitials(p.name)}</div>
                            <div>
                                <div class="pay-emp-name">${p.name}</div>
                                <div class="pay-emp-id">${p.id} · ${p.position}</div>
                                <span class="pay-dept-tag">${p.department}</span>
                            </div>
                        </div>
                    </td>
                    <td>${p.hoursWorked}h</td>
                    <td>${fmt(p.hourlyRate)}</td>
                    <td>${fmt(p.gross)}</td>
                    <td>- ${fmt(p.deductions)}</td>
                    <td class="pay-net-cell">${fmt(p.net)}</td>
                </tr>
            `).join("") : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);cursor:default;padding:20px;">No payslips found.</td></tr>`;

            const footer = document.getElementById("tableFooter");
            if (footer) footer.textContent = `Showing ${filtered.length} of ${payroll.length} payslips`;

            document.getElementById("totalGross").textContent = fmt(payroll.reduce((s, p) => s + p.gross, 0));
            document.getElementById("totalCount").textContent = payroll.length;

            const subtitle = document.querySelector(".pay-card-sub");
            if (subtitle) subtitle.textContent = isHR ? "Click a row to preview the digital payslip" : "Your payslip - click to view details";
        }

        window.openPayslip = function (employeeId) {
            const p = payroll.find(x => x.emp_id === employeeId);
            if (!p) return;
            const modal = document.getElementById("payslipModal");
            const body = document.getElementById("payslipBody");
            if (!modal || !body) return;

            body.innerHTML = `
                <div class="pay-slip-emp">
                    <div class="pay-slip-avatar" style="background:${p.color}">${getInitials(p.name)}</div>
                    <div>
                        <div style="font-weight:700;color:var(--text-dark)">${p.name}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${p.position} · ${p.id} · ${p.department}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${p.email || ""}</div>
                    </div>
                </div>
                <div class="pay-row"><span>Hours worked</span><span>${p.hoursWorked}h</span></div>
                <div class="pay-row"><span>Hourly rate</span><span>${fmt(p.hourlyRate)}</span></div>
                <div class="pay-row"><span>Gross pay</span><span>${fmt(p.gross)}</span></div>
                <div class="pay-row"><span>Tax (${Math.round(p.taxRate * 100)}%)</span><span>- ${fmt(p.deductions)}</span></div>
                <div class="pay-net-bar">
                    <div>
                        <div style="font-size:12px;opacity:.8">Net pay</div>
                        <div style="font-size:20px;font-weight:700">${fmt(p.net)}</div>
                    </div>
                </div>`;
            modal.classList.add("open");
            modal.onclick = (e) => { if (e.target === modal) closePayslip(); };
        };

        window.closePayslip = function () {
            document.getElementById("payslipModal")?.classList.remove("open");
        };
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePayslip(); });

        window.exportCSV = function () {
            if (!isHR) {
                showToast("Only HR staff can export payroll data.", "danger");
                return;
            }
            const rows = payroll.map((p) => ({
                Employee: p.name,
                ID: p.id,
                Position: p.position,
                Department: p.department,
                "Hours Worked": p.hoursWorked,
                "Hourly Rate": p.hourlyRate,
                "Gross Pay": p.gross,
                Deductions: p.deductions,
                "Net Pay": p.net,
            }));
            const wb = XLSX.utils.book_new();
            const ws1 = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws1, "Payslip Register");
            XLSX.writeFile(wb, `payroll_report_${new Date().toISOString().split("T")[0]}.xlsx`);
            showToast(`Excel report exported.`, "success");
        };

        renderTable();
        console.log(`✅ Payroll module initialized (${isHR ? "HR Admin" : "Employee"} view)`);
    } catch (error) {
        console.error('Error initializing payroll:', error);
        document.getElementById("payBody").innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Error loading payroll data. Is the server running?</td></tr>';
    }
}