// ModernTech Solutions - Time Off Module
// Role-based access, attendance sync, date validation, custom modals, auto-expiry

document.addEventListener("DOMContentLoaded", function () {
  window.ModernTech.ready(function () {
    initTimeOff();
  });
});

function initTimeOff() {
  const { employeeInfo, attendanceAndLeave, today } = window.ModernTech;
  const { getInitials, getDepartmentColor, showToast } = window.ModernTechUtils;

  const SHARED_DATA_KEY = "sharedHRData";

  const currentUser = getCurrentUser();
  const isHR =
    currentUser &&
    (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");
  const userEmployeeId = currentUser ? currentUser.employeeId : null;

  let pendingReverseAction = null;
  let pendingCancelAction = null;

  // Set dynamic date
  const toPageDate = document.getElementById("toPageDate");
  if (toPageDate) {
    toPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function buildEmployees() {
    return employeeInfo.map((emp) => {
      const attData = attendanceAndLeave.find(
        (a) => a.employeeId === emp.employeeId,
      );
      return {
        ...emp,
        initials: getInitials(emp.name),
        color: getDepartmentColor(emp.department),
        leaveRequests: attData
          ? JSON.parse(JSON.stringify(attData.leaveRequests))
          : [],
        attendance: attData
          ? JSON.parse(JSON.stringify(attData.attendance))
          : [],
      };
    });
  }

  let employees = buildEmployees();

  const savedData = localStorage.getItem(SHARED_DATA_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      employees = employees.map((emp) => {
        const savedLeave = parsed.leaveRequests?.find(
          (l) => l.employeeId === emp.employeeId,
        );
        const savedAtt = parsed.attendance?.find(
          (a) => a.employeeId === emp.employeeId,
        );
        if (savedLeave) emp.leaveRequests = savedLeave.leaveRequests;
        if (savedAtt) emp.attendance = savedAtt.attendance;
        return emp;
      });
    } catch (e) {}
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let autoDenied = false;

  employees.forEach((emp) => {
    emp.leaveRequests.forEach((req) => {
      if (req.status === "Pending") {
        const reqDate = new Date(req.date);
        if (reqDate < thirtyDaysAgo) {
          req.status = "Denied";
          req.reason = (req.reason || "") + " (Auto-denied: expired)";
          autoDenied = true;
        }
      }
    });
  });

  function saveData() {
    const data = {
      leaveRequests: employees.map((emp) => ({
        employeeId: emp.employeeId,
        leaveRequests: emp.leaveRequests,
      })),
      attendance: employees.map((emp) => ({
        employeeId: emp.employeeId,
        attendance: emp.attendance,
      })),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(data));
  }

  if (autoDenied) {
    saveData();
    console.log("✅ Auto-denied expired leave requests");
  }

  function syncAttendanceOnApproval(emp, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const existing = emp.attendance.find((a) => a.date === dateStr);
      if (existing) {
        existing.status = "Absent";
      } else {
        emp.attendance.push({ date: dateStr, status: "Absent" });
      }
    }
  }

  function syncAttendanceOnReverse(emp, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      emp.attendance = emp.attendance.filter(
        (a) => !(a.date === dateStr && a.status === "Absent"),
      );
    }
  }

  let currentFilter = "all";

  function getCounts() {
    let total = 0,
      pending = 0,
      approved = 0,
      denied = 0;
    employees.forEach((emp) => {
      if (!isHR && emp.employeeId !== userEmployeeId) return;
      emp.leaveRequests.forEach((req) => {
        total++;
        if (req.status === "Pending") pending++;
        else if (req.status === "Approved") approved++;
        else if (req.status === "Denied") denied++;
      });
    });
    return { total, pending, approved, denied };
  }

  function updateTabCounts() {
    const counts = getCounts();
    document.getElementById("toTabAll").textContent = counts.total;
    document.getElementById("toTabPending").textContent = counts.pending;
    document.getElementById("toTabApproved").textContent = counts.approved;
    document.getElementById("toTabDenied").textContent = counts.denied;
  }

  function renderAllRequests() {
    const container = document.getElementById("toRequestsContainer");
    if (!container) return;
    let allRequests = [];
    employees.forEach((emp) =>
      emp.leaveRequests.forEach((req) =>
        allRequests.push({
          ...req,
          employeeName: emp.name,
          position: emp.position,
          initials: emp.initials,
          color: emp.color,
          employeeId: emp.employeeId,
        }),
      ),
    );

    if (currentFilter !== "all")
      allRequests = allRequests.filter((req) => req.status === currentFilter);
    if (!isHR && userEmployeeId)
      allRequests = allRequests.filter(
        (req) => req.employeeId === userEmployeeId,
      );

    allRequests.sort((a, b) => b.date?.localeCompare(a.date));

    if (!allRequests.length) {
      const emptyMessage = isHR
        ? `No ${currentFilter === "all" ? "" : currentFilter.toLowerCase()} requests found.`
        : "You have no time off requests.";
      container.innerHTML = `<div class="to-empty-state"><i class="bi bi-inbox"></i><p class="text-muted">${emptyMessage}</p></div>`;
      return;
    }

    let html = "";
    allRequests.forEach((req) => {
      const days = req.days || "—",
        type = req.type || "Annual",
        dateRange = req.date || "—";
      const statusClass = req.status.toLowerCase();
      let badgeClass = "",
        icon = "";
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
        <div class="to-request-header"><div class="to-request-employee"><div class="to-request-avatar" style="background:${req.color}">${req.initials}</div><div><div class="to-request-name">${req.employeeName}</div><div class="to-request-position">${req.position}</div></div></div><span class="to-request-status ${badgeClass}">${icon} ${req.status}</span></div>
        <div class="to-request-details"><span class="to-detail-label">TYPE</span><span class="to-detail-value">${type}</span><span class="to-detail-label">DATES</span><span class="to-detail-value">${dateRange}</span><span class="to-detail-label">DAYS</span><span class="to-detail-value">${days}</span></div>
        <div class="to-request-reason">"${req.reason}"</div>
        <div class="to-request-actions">${actions}</div>
      </div>`;
    });
    container.innerHTML = html;
    updateTabCounts();
  }

  window.handleApprove = function (employeeId, date) {
    if (!isHR) {
      showToast("Only HR staff can approve requests.", "danger");
      return;
    }
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    const request = emp.leaveRequests.find(
      (r) => r.date === date && r.status === "Pending",
    );
    if (!request) return;
    request.status = "Approved";
    syncAttendanceOnApproval(
      emp,
      request.date,
      request.endDate || request.date,
    );
    saveData();
    renderAllRequests();
    showToast(`✓ Leave approved for ${emp.name}`, "success");
  };

  window.handleDeny = function (employeeId, date) {
    if (!isHR) {
      showToast("Only HR staff can deny requests.", "danger");
      return;
    }
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    const request = emp.leaveRequests.find(
      (r) => r.date === date && r.status === "Pending",
    );
    if (!request) return;
    request.status = "Denied";
    saveData();
    renderAllRequests();
    showToast(`✗ Leave denied for ${emp.name}`, "danger");
  };

  window.handleCancel = function (employeeId, date) {
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    if (!isHR && userEmployeeId !== employeeId) {
      showToast("You can only cancel your own requests.", "danger");
      return;
    }
    pendingCancelAction = { employeeId, date };
    const msgEl = document.getElementById("toCancelMessage");
    if (msgEl)
      msgEl.textContent = `Cancel this leave request for ${emp.name} on ${date}? This will permanently delete it.`;
    const modalEl = document.getElementById("toCancelModal");
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  };

  window.handleReverse = function (employeeId, date) {
    if (!isHR) {
      showToast("Only HR staff can reverse decisions.", "danger");
      return;
    }
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    const request = emp.leaveRequests.find(
      (r) => r.date === date && r.status !== "Pending",
    );
    if (!request) return;
    pendingReverseAction = { employeeId, date };
    const msgEl = document.getElementById("toReverseMessage");
    if (msgEl)
      msgEl.textContent = `Reverse the "${request.status}" decision for ${emp.name}'s leave on ${date}? This will change it back to Pending.`;
    const modalEl = document.getElementById("toReverseModal");
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  };

  setTimeout(() => {
    const reverseBtn = document.getElementById("toConfirmReverse");
    if (reverseBtn) {
      reverseBtn.addEventListener("click", function () {
        if (!pendingReverseAction) return;
        const { employeeId, date } = pendingReverseAction;
        const emp = employees.find((e) => e.employeeId === employeeId);
        if (!emp) return;
        const request = emp.leaveRequests.find(
          (r) => r.date === date && r.status !== "Pending",
        );
        if (!request) return;
        const prev = request.status;
        if (prev === "Approved")
          syncAttendanceOnReverse(
            emp,
            request.date,
            request.endDate || request.date,
          );
        request.status = "Pending";
        saveData();
        renderAllRequests();
        bootstrap.Modal.getInstance(
          document.getElementById("toReverseModal"),
        )?.hide();
        pendingReverseAction = null;
        showToast(`↻ Reversed for ${emp.name} (was ${prev})`, "success");
      });
    }

    const cancelBtn = document.getElementById("toConfirmCancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (!pendingCancelAction) return;
        const { employeeId, date } = pendingCancelAction;
        const emp = employees.find((e) => e.employeeId === employeeId);
        if (!emp) return;
        emp.leaveRequests = emp.leaveRequests.filter(
          (r) => !(r.date === date && r.status === "Pending"),
        );
        saveData();
        renderAllRequests();
        bootstrap.Modal.getInstance(
          document.getElementById("toCancelModal"),
        )?.hide();
        pendingCancelAction = null;
        showToast(`Leave request cancelled for ${emp.name}`, "success");
      });
    }
  }, 100);

  function submitNewRequest() {
    const employeeId = parseInt(
      document.getElementById("toEmployeeSelect").value,
    );
    const type = document.getElementById("toTypeSelect").value;
    const startDate = document.getElementById("toStartDate").value;
    const endDate = document.getElementById("toEndDate").value;
    const reason =
      document.getElementById("toReason").value || "No reason provided";

    if (!employeeId) {
      showToast("Please select an employee.", "danger");
      return;
    }
    if (!type) {
      showToast("Please select a leave type.", "danger");
      return;
    }
    if (!startDate || !endDate) {
      showToast("Please select both dates.", "danger");
      return;
    }
    if (endDate < startDate) {
      showToast("End date must be after start date.", "danger");
      return;
    }
    if (!isHR && employeeId !== userEmployeeId) {
      showToast("You can only submit requests for yourself.", "danger");
      return;
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (start < todayDate) {
      showToast("Cannot request leave for past dates.", "danger");
      return;
    }

    const days =
      Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
      ) + 1;
    if (days > 30) {
      showToast("Maximum 30 days per leave request.", "danger");
      return;
    }

    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;

    const currentYear = new Date().getFullYear();
    const totalDaysThisYear = emp.leaveRequests
      .filter((req) => {
        const reqDate = new Date(req.date);
        return (
          reqDate.getFullYear() === currentYear &&
          (req.status === "Approved" || req.status === "Pending")
        );
      })
      .reduce((sum, req) => sum + (req.days || 1), 0);

    if (totalDaysThisYear + days > 60) {
      showToast(
        `This would exceed the 60-day annual limit. ${totalDaysThisYear} days already used/requested.`,
        "danger",
      );
      return;
    }

    emp.leaveRequests.push({
      date: startDate,
      reason,
      status: "Pending",
      type,
      days,
      endDate,
    });
    saveData();
    bootstrap.Modal.getInstance(
      document.getElementById("toNewRequestModal"),
    )?.hide();
    document.getElementById("toRequestForm").reset();
    renderAllRequests();
    showToast(
      isHR
        ? `✓ New request submitted for ${emp.name}`
        : `✓ Your leave request has been submitted for approval`,
      "success",
    );
  }

  function populateEmployeeSelect() {
    const select = document.getElementById("toEmployeeSelect");
    if (!select) return;
    if (isHR) {
      select.innerHTML =
        '<option value="">Select employee...</option>' +
        employees
          .map(
            (emp) =>
              `<option value="${emp.employeeId}">${emp.name} (${emp.position})</option>`,
          )
          .join("");
      select.disabled = false;
    } else {
      const userEmp = employees.find((e) => e.employeeId === userEmployeeId);
      if (userEmp) {
        select.innerHTML = `<option value="${userEmp.employeeId}" selected>${userEmp.name} (${userEmp.position})</option>`;
        select.disabled = true;
      }
    }
  }

  function setupFilterTabs() {
    document.querySelectorAll(".to-filter-tab").forEach((tab) =>
      tab.addEventListener("click", function () {
        document
          .querySelectorAll(".to-filter-tab")
          .forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.dataset.filter;
        renderAllRequests();
      }),
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const startDateInput = document.getElementById("toStartDate");
  const endDateInput = document.getElementById("toEndDate");
  if (startDateInput) startDateInput.setAttribute("min", todayStr);
  if (endDateInput) endDateInput.setAttribute("min", todayStr);

  renderAllRequests();
  populateEmployeeSelect();
  setupFilterTabs();
  document
    .getElementById("toSubmitBtn")
    .addEventListener("click", submitNewRequest);
  console.log(
    `✅ Time Off module initialized (${isHR ? "HR Admin" : "Employee"} view)`,
  );
}
