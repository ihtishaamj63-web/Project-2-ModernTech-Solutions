// Employee management - uses API only
const EMPLOYEE_STORAGE_KEY = "moderntech_employees_v1";
let employeeAll = [];
let employeeCurrentFilter = "All";
let employeeToDelete = null;
let employeeToEdit = null;

const currentUser = getCurrentUser();
const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin" || currentUser.role === "hr_staff");
const userEmployeeId = currentUser ? currentUser.employeeId : null;

document.addEventListener("DOMContentLoaded", () => {
    employeeSetDate();
    employeeSetupModal();
    if (document.getElementById("employee-list")) {
        employeeInitPage();
    }
    if (document.getElementById("employee-addForm")) {
        if (!isHR) {
            employeeShowToast("Access denied. HR staff only.", "error");
            setTimeout(() => { window.location.href = "employees.html"; }, 1500);
            return;
        }
        employeeInitAddPage();
    }
});

const POSITION_MAP = {
    Development: [
        "Frontend Developer",
        "Backend Developer",
        "Fullstack Developer",
        "Mobile Developer",
        "DevOps Engineer",
        "Software Architect",
        "Software Engineer",
        "Junior Developer",
        "Senior Developer"
    ],
    HR: [
        "HR Manager",
        "HR Coordinator",
        "Recruiter",
        "Talent Acquisition Specialist",
        "HR Administrator"
    ],
    QA: [
        "QA Engineer",
        "Test Analyst",
        "Automation Engineer",
        "QA Lead",
        "Quality Analyst"
    ],
    Sales: [
        "Sales Representative",
        "Account Manager",
        "Sales Engineer",
        "Enterprise Sales",
        "Sales Lead"
    ],
    Marketing: [
        "Marketing Specialist",
        "Content Strategist",
        "SEO Specialist",
        "Growth Marketer",
        "Marketing Manager"
    ],
    Design: [
        "UI/UX Designer",
        "Product Designer",
        "Visual Designer",
        "UX Researcher",
        "Graphic Designer"
    ],
    IT: [
        "IT Support",
        "System Administrator",
        "Network Engineer",
        "IT Manager"
    ],
    Finance: [
        "Accountant",
        "Financial Analyst",
        "Payroll Specialist",
        "Finance Manager"
    ],
    Support: [
        "Customer Support Representative",
        "Technical Support Engineer",
        "Customer Success Manager",
        "Support Lead"
    ],
};

const SALARY_TIERS = {
    Development: [
        { id: "junior", label: "Junior Developer (R50,000 - R65,000)", min: 50000, max: 65000 },
        { id: "mid", label: "Mid Developer (R65,000 - R80,000)", min: 65000, max: 80000 },
        { id: "senior", label: "Senior Developer (R70,000 - R100,000)", min: 70000, max: 100000 },
        { id: "lead", label: "Lead/Architect (R100,000 - R150,000)", min: 100000, max: 150000 },
    ],
    HR: [
        { id: "entry", label: "Entry Level (R40,000 - R55,000)", min: 40000, max: 55000 },
        { id: "mid", label: "Mid Level (R55,000 - R75,000)", min: 55000, max: 75000 },
        { id: "senior", label: "Manager (R75,000 - R100,000)", min: 75000, max: 100000 },
    ],
    QA: [
        { id: "junior", label: "Junior QA (R40,000 - R50,000)", min: 40000, max: 50000 },
        { id: "mid", label: "Mid QA (R50,000 - R65,000)", min: 50000, max: 65000 },
        { id: "senior", label: "Senior QA (R55,000 - R80,000)", min: 55000, max: 80000 },
    ],
    Sales: [
        { id: "rep", label: "Representative (R45,000 - R55,000)", min: 45000, max: 55000 },
        { id: "acct", label: "Account Manager (R55,000 - R75,000)", min: 55000, max: 75000 },
        { id: "lead", label: "Sales Lead (R60,000 - R90,000)", min: 60000, max: 90000 },
    ],
    Marketing: [
        { id: "junior", label: "Junior (R40,000 - R50,000)", min: 40000, max: 50000 },
        { id: "mid", label: "Mid Level (R50,000 - R65,000)", min: 50000, max: 65000 },
        { id: "senior", label: "Senior (R58,000 - R80,000)", min: 58000, max: 80000 },
    ],
    Design: [
        { id: "junior", label: "Junior Designer (R45,000 - R55,000)", min: 45000, max: 55000 },
        { id: "mid", label: "Mid Designer (R55,000 - R70,000)", min: 55000, max: 70000 },
        { id: "senior", label: "Senior Designer (R65,000 - R85,000)", min: 65000, max: 85000 },
    ],
    IT: [
        { id: "support", label: "IT Support (R45,000 - R60,000)", min: 45000, max: 60000 },
        { id: "sysadmin", label: "SysAdmin (R60,000 - R80,000)", min: 60000, max: 80000 },
        { id: "senior", label: "Senior IT (R72,000 - R100,000)", min: 72000, max: 100000 },
    ],
    Finance: [
        { id: "junior", label: "Junior (R45,000 - R55,000)", min: 45000, max: 55000 },
        { id: "mid", label: "Mid Level (R55,000 - R70,000)", min: 55000, max: 70000 },
        { id: "senior", label: "Senior (R62,000 - R90,000)", min: 62000, max: 90000 },
    ],
    Support: [
        { id: "rep", label: "Representative (R40,000 - R50,000)", min: 40000, max: 50000 },
        { id: "senior", label: "Senior Support (R50,000 - R70,000)", min: 50000, max: 70000 },
    ],
};

function employeeSetDate() {
    const dateEl = document.getElementById("empPageDate") || document.getElementById("employee-todayDate");
    if (!dateEl) return;
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function employeeShowToast(message, type = "success") {
    if (window.ModernTechUtils && window.ModernTechUtils.showToast) {
        window.ModernTechUtils.showToast(message, type);
        return;
    }
    const container = document.getElementById("employee-toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `employee-toast employee-toast--${type}`;
    toast.innerHTML = `<span class="employee-toast__icon">${type === "success" ? "✓" : "!"}</span><span class="employee-toast__msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function employeeSetupModal() {
    const modal = document.getElementById("employee-deleteModal");
    if (!modal) return;
    document.getElementById("employee-cancelDelete")?.addEventListener("click", () => { modal.classList.add("hidden"); employeeToDelete = null; });
    document.getElementById("employee-confirmDelete")?.addEventListener("click", () => {
        if (employeeToDelete !== null) {
            employeeDeleteFromAPI(employeeToDelete);
            modal.classList.add("hidden");
            employeeToDelete = null;
        }
    });
    modal.querySelector(".emp-modal__backdrop")?.addEventListener("click", () => { modal.classList.add("hidden"); employeeToDelete = null; });
}

// ---- API Functions ----

async function employeeLoadFromAPI() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            employeeAll = [];
            return;
        }

        // 1. Get employees
        const empResponse = await fetch(`${API_URL}/api/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const empData = await empResponse.json();

        // 2. Get payroll data for salaries
        const payResponse = await fetch(`${API_URL}/api/payroll`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payData = await payResponse.json();

        // 3. Build salary map
        const salaryMap = {};
        if (payData.success && payData.data) {
            payData.data.forEach(p => {
                salaryMap[p.emp_id] = p.base_salary || 0;
            });
        }

        // 4. Map employees with salaries
        if (empData.success && empData.data) {
            employeeAll = empData.data.map(emp => ({
                employeeId: emp.emp_id,
                name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
                first_name: emp.first_name || '',
                last_name: emp.last_name || '',
                position: emp.position || 'N/A',
                department: emp.department || 'N/A',
                email: emp.email || '',
                contact: emp.email || '',
                phone: emp.phone || '',
                salary: salaryMap[emp.emp_id] || 0,
                status: emp.employment_status || 'active',
                employment_status: emp.employment_status || 'active',
                hire_date: emp.hire_date || '',
                startDate: emp.hire_date || '',
                employmentHistory: emp.employment_history || '',
                is_deleted: emp.is_deleted || false,
                user_id: emp.user_id || null
            }));
            employeeSaveToLocal();
            console.log('✅ Employees loaded with salaries:', employeeAll);
            return;
        }
        employeeAll = [];
    } catch (error) {
        console.error('Error loading employees:', error);
        employeeAll = [];
    }
}

function employeeSaveToLocal() {
    localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employeeAll));
}

async function employeeAddToAPI(newEmployee) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                first_name: newEmployee.name.split(' ')[0],
                last_name: newEmployee.name.split(' ').slice(1).join(' '),
                email: newEmployee.contact,
                phone: newEmployee.phone || null,
                position: newEmployee.position,
                department: newEmployee.department,
                hire_date: newEmployee.startDate || new Date().toISOString().split('T')[0],
                employment_status: newEmployee.status || 'active'
            })
        });
        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        throw new Error(data.error || 'Failed to add employee');
    } catch (error) {
        console.error('Error adding employee:', error);
        throw error;
    }
}

async function employeeUpdateFromAPI(employeeId, updatedData) {
    try {
        const token = localStorage.getItem('token');

        // 1. Update employee info
        const empResponse = await fetch(`${API_URL}/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                first_name: updatedData.first_name,
                last_name: updatedData.last_name,
                email: updatedData.email,
                position: updatedData.position,
                department: updatedData.department,
                employment_status: updatedData.employment_status || 'active'
            })
        });
        const empResult = await empResponse.json();
        if (!empResult.success) {
            throw new Error(empResult.error || 'Failed to update employee');
        }

        // 2. Update salary in payroll table
        if (updatedData.salary) {
            // First check if payroll record exists
            const checkResponse = await fetch(`${API_URL}/api/payroll/employee/${employeeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const checkResult = await checkResponse.json();

            if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
                // Update existing payroll
                const payrollId = checkResult.data[0].payroll_id;
                await fetch(`${API_URL}/api/payroll/${payrollId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        base_salary: updatedData.salary
                    })
                });
            } else {
                // Create new payroll record
                await fetch(`${API_URL}/api/payroll`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        emp_id: employeeId,
                        base_salary: updatedData.salary,
                        effective_date: new Date().toISOString().split('T')[0]
                    })
                });
            }
        }

        return empResult;
    } catch (error) {
        console.error('Error updating employee:', error);
        throw error;
    }
}

async function employeeDeleteFromAPI(employeeId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/employees/${employeeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            employeeAll = employeeAll.filter(e => e.employeeId !== employeeId);
            employeeSaveToLocal();
            employeeApplyFilters();
            employeeShowToast("Employee removed", "success");
        } else {
            throw new Error(data.error || 'Failed to delete employee');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        employeeShowToast("Error deleting employee", "error");
    }
}

// ---- Page Functions ----

async function employeeInitPage() {
    await employeeLoadFromAPI();
    employeeRenderFilters();
    employeeRenderCard(employeeAll);
    employeeSetupSearch();
    if (!isHR) {
        const addBtn = document.querySelector(".emp-toolbar__actions");
        if (addBtn) addBtn.style.display = "none";
    }
}

function employeeRenderFilters() {
    const filterContainer = document.getElementById("employee-deptFilters");
    if (!filterContainer) return;
    const departments = ["All", ...new Set(employeeAll.map((e) => e.department))];
    filterContainer.innerHTML = departments.map((dept) => `<button class="emp-filter ${dept === "All" ? "active" : ""}" data-dept="${dept}">${dept}</button>`).join("");
    filterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("emp-filter")) {
            document.querySelectorAll(".emp-filter").forEach((btn) => btn.classList.remove("active"));
            e.target.classList.add("active");
            employeeCurrentFilter = e.target.dataset.dept;
            employeeApplyFilters();
        }
    });
}

function employeeGetInitials(name) {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();
}

function employeeStatusBadge(status) {
    const map = { Active: "emp-badge--active", "On Leave": "emp-badge--leave", Terminated: "emp-badge--term" };
    return `<span class="emp-badge ${map[status] || "emp-badge--active"}">${status}</span>`;
}

function employeeRenderCard(employees) {
    const count = document.getElementById("employee-count");
    const list = document.getElementById("employee-list");
    if (!count || !list) return;
    count.textContent = `${employees.length} employee${employees.length !== 1 ? "s" : ""}`;
    if (!employees || employees.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No employees found.</p>`;
        return;
    }

    let headerCols = "<div>Name</div><div>Dept</div><div>Position</div>";
    if (isHR) headerCols += "<div>ID</div><div>Contact</div><div>Salary</div>";
    headerCols += "<div>Status</div>";
    if (isHR) headerCols += "<div>Action</div>";

    list.innerHTML = `
        <div class="emp-row__head emp-row">${headerCols}</div>
        ${employees.map((emp) => {
            const avatarBg = window.ModernTechUtils ? window.ModernTechUtils.getDepartmentColor(emp.department) : 'var(--primary)';
            let rowCols = `
                <div class="emp-row__name" data-label="Name">
                    <div class="emp-row__avatar" style="background:${avatarBg}">${employeeGetInitials(emp.name)}</div>
                    <span>${emp.name || 'Unknown'}</span>
                </div>
                <div class="emp-row__muted" data-label="Dept">${emp.department || 'N/A'}</div>
                <div class="emp-row__muted" data-label="Position">${emp.position || 'N/A'}</div>`;
            if (isHR) {
                rowCols += `
                <div class="emp-row__muted" data-label="ID">MT-${String(emp.employeeId).padStart(3, "0")}</div>
                <div data-label="Contact"><a class="emp-row__link" href="mailto:${emp.email || '#'}">${emp.email || 'N/A'}</a></div>
                <div class="emp-row__muted" data-label="Salary" style="font-weight:600;">R ${(emp.salary || 0).toLocaleString("en-ZA")}</div>`;
            }
            rowCols += `<div data-label="Status">${employeeStatusBadge(emp.employment_status || 'active')}</div>`;
            if (isHR) {
                rowCols += `<div data-label="Action" style="display:flex;gap:6px;">
                    <button class="emp-btn emp-btn--ghost" style="padding:6px 10px;font-size:12px;height:auto;" onclick="employeeRequestEdit(${emp.employeeId})">Edit</button>
                    <button class="emp-btn emp-btn--danger" onclick="employeeRequestDelete(${emp.employeeId})">Delete</button>
                </div>`;
            }
            return `<div class="emp-row">${rowCols}</div>`;
        }).join("")}
    `;
}

window.employeeRequestDelete = function (id) {
    if (!isHR) { employeeShowToast("Access denied. HR staff only.", "error"); return; }
    employeeToDelete = id;
    document.getElementById("employee-deleteModal").classList.remove("hidden");
};

window.employeeRequestEdit = function (id) {
    if (!isHR) { employeeShowToast("Access denied. HR staff only.", "error"); return; }
    const emp = employeeAll.find(e => e.employeeId === id);
    if (!emp) return;
    localStorage.setItem("editingEmployee", JSON.stringify(emp));
    window.location.href = "add-employee.html?edit=" + id;
};

function employeeApplyFilters() {
    const searchInput = document.getElementById("employee-searchInput");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    let filtered = employeeAll;
    if (employeeCurrentFilter !== "All") filtered = filtered.filter((emp) => emp.department === employeeCurrentFilter);
    if (searchTerm) {
        filtered = filtered.filter((emp) =>
            (emp.name || '').toLowerCase().includes(searchTerm) ||
            (emp.position || '').toLowerCase().includes(searchTerm) ||
            String(emp.employeeId).includes(searchTerm) ||
            (emp.department || '').toLowerCase().includes(searchTerm)
        );
    }
    employeeRenderCard(filtered);
}

function employeeSetupSearch() {
    document.getElementById("employee-searchInput")?.addEventListener("input", employeeApplyFilters);
}

function employeeInitAddPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    if (editId) {
        const stored = JSON.parse(localStorage.getItem("editingEmployee") || "null");
        if (stored && stored.employeeId == editId) {
            document.querySelector(".emp-page__title").textContent = "Edit Employee";
            document.getElementById("employee-name").value = stored.name || "";
            document.getElementById("employee-department").value = stored.department || "";
            document.getElementById("employee-salary").value = stored.salary || "";
            document.getElementById("employee-contact").value = stored.contact || "";
            document.getElementById("employee-startDate").value = stored.startDate || "";
            document.getElementById("employee-history").value = stored.employmentHistory || "";
            employeeToEdit = stored;
        }
    }
    
    const form = document.getElementById("employee-addForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            console.log("Form submitted, employeeToEdit:", employeeToEdit);
            if (employeeToEdit) {
                employeeUpdate(employeeToEdit.employeeId);
            } else {
                employeeAdd();
            }
        });
    }
    
    const dept = document.getElementById("employee-department");
    if (dept) {
        dept.addEventListener("change", function () {
            populatePositionSelect(this.value);
            populateSalaryRanges(this.value);
        });
        if (dept.value) {
            populatePositionSelect(dept.value);
            populateSalaryRanges(dept.value);
        }
    }
    if (employeeToEdit && employeeToEdit.position) {
        setTimeout(() => {
            const posSelect = document.getElementById("employee-position");
            if (posSelect && posSelect.tagName === "SELECT") {
                posSelect.value = employeeToEdit.position;
            }
        }, 200);
    }
}

async function employeeUpdate(employeeId) {
    console.log("employeeUpdate called for ID:", employeeId);
    
    const name = document.getElementById("employee-name").value.trim();
    const position = document.getElementById("employee-position")?.value?.trim() || "";
    const department = document.getElementById("employee-department").value;
    const salary = Number(document.getElementById("employee-salary").value);
    const contact = document.getElementById("employee-contact").value.trim();
    const startDate = document.getElementById("employee-startDate").value;
    const history = document.getElementById("employee-history").value.trim();

    if (!name || !position || !department || !salary || !contact) {
        employeeShowToast("Please fill in all required fields", "error");
        return;
    }

    try {
        const stored = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
        employeeAll = stored ? JSON.parse(stored) : [];
        const index = employeeAll.findIndex(e => e.employeeId === employeeId);

        console.log("Updating employee:", { employeeId, name, position, department, salary, contact });
        
        await employeeUpdateFromAPI(employeeId, {
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' '),
            email: contact,
            position: position,
            department: department,
            salary: salary,
            employment_status: 'active'
        });

        if (index !== -1) {
            employeeAll[index] = {
                ...employeeAll[index],
                name,
                position,
                department,
                salary,
                contact,
                startDate: startDate || employeeAll[index].startDate,
                employmentHistory: history || employeeAll[index].employmentHistory
            };
            employeeSaveToLocal();
        }

        employeeShowToast(`${name} updated successfully`, "success");

        // FORCE REDIRECT - Multiple methods for reliability
        console.log("Redirecting to employees.html");
        
        // Method 1: Use setTimeout with location.replace
        setTimeout(function() {
            window.location.replace("employees.html");
        }, 800);
        
        // Method 2: Fallback redirect after 2 seconds
        setTimeout(function() {
            if (window.location.pathname.includes("add-employee.html")) {
                window.location.href = "employees.html";
            }
        }, 2000);

    } catch (error) {
        console.error('Update error:', error);
        employeeShowToast("Error updating employee: " + error.message, "error");
    }
}

async function employeeAdd() {
    const name = document.getElementById("employee-name").value.trim();
    const position = document.getElementById("employee-position")?.value?.trim() || "";
    const department = document.getElementById("employee-department").value;
    const salary = Number(document.getElementById("employee-salary").value);
    const contact = document.getElementById("employee-contact").value.trim();
    const startDate = document.getElementById("employee-startDate").value;
    const history = document.getElementById("employee-history").value.trim();

    if (!name || !position || !department || !salary || !contact || !startDate) {
        employeeShowToast("Please fill in all required fields", "error");
        return;
    }

    try {
        const result = await employeeAddToAPI({
            name,
            position,
            department,
            salary,
            contact,
            startDate,
            history,
            status: "Active"
        });

        const stored = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
        employeeAll = stored ? JSON.parse(stored) : [];
        const newId = employeeAll.length > 0 ? Math.max(...employeeAll.map((e) => e.employeeId)) + 1 : 1;
        const newEmployee = {
            employeeId: newId,
            name,
            position,
            department,
            salary,
            contact,
            status: "Active",
            employmentHistory: history || `Joined in ${new Date(startDate).getFullYear()}`,
            startDate
        };
        employeeAll.push(newEmployee);
        employeeSaveToLocal();

        employeeShowToast(`${name} added successfully`, "success");
        setTimeout(() => {
            window.location.href = "employees.html";
        }, 1000);

    } catch (error) {
        console.error('Add error:', error);
        employeeShowToast("Error adding employee", "error");
    }
}

function populatePositionSelect(dept) {
    const posSelect = document.getElementById("employee-position");
    if (!posSelect) return;
    posSelect.innerHTML = "<option value=''>Select Position</option>";
    let options = dept ? (POSITION_MAP[dept] || []).slice() : [];
    if (!options.length) {
        const set = new Set();
        Object.values(POSITION_MAP).forEach((arr) => arr.forEach((p) => set.add(p)));
        options = Array.from(set);
    }
    options.forEach((p) => {
        const o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        posSelect.appendChild(o);
    });
    if (employeeToEdit && employeeToEdit.position) {
        posSelect.value = employeeToEdit.position;
    }
}

function populateSalaryRanges(department) {
    const existingSel = document.getElementById("employee-salaryRange");
    if (existingSel) existingSel.remove();
    const container = document.getElementById("employee-salary");
    if (!container) return;

    const select = document.createElement("select");
    select.id = "employee-salaryRange";
    select.style.marginTop = "6px";
    select.style.width = "100%";
    select.style.padding = "12px 14px";
    select.style.border = "1.5px solid var(--border-color)";
    select.style.borderRadius = "10px";
    select.style.fontSize = "0.95rem";
    select.style.fontFamily = "inherit";
    select.style.cursor = "pointer";

    const tiers = SALARY_TIERS[department] || [
        { id: "entry", label: "Entry Level (R40,000 - R55,000)", min: 40000, max: 55000 },
        { id: "mid", label: "Mid Level (R55,000 - R75,000)", min: 55000, max: 75000 },
        { id: "senior", label: "Senior Level (R75,000 - R100,000)", min: 75000, max: 100000 },
        { id: "lead", label: "Lead/Manager (R100,000 - R150,000)", min: 100000, max: 150000 },
    ];

    select.innerHTML = "<option value=''>Select salary range...</option>" +
        tiers.map((t) => `<option value='${t.id}' data-min='${t.min}' data-max='${t.max}'>${t.label}</option>`).join("");

    container.parentNode.insertBefore(select, container.nextSibling);

    select.addEventListener("change", function () {
        const opt = this.selectedOptions[0];
        if (!opt || !opt.dataset.min) return;
        const salaryInput = document.getElementById("employee-salary");
        if (salaryInput) {
            salaryInput.value = Math.round((Number(opt.dataset.min) + Number(opt.dataset.max)) / 2);
            salaryInput.style.borderColor = "var(--green)";
            setTimeout(() => {
                salaryInput.style.borderColor = "var(--border-color)";
            }, 1500);
        }
    });
}