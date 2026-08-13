document.addEventListener("DOMContentLoaded", function () {
  window.ModernTech.ready(function () {
    initAttendance();
  });
});

function initAttendance() {
  const { employeeInfo, attendanceAndLeave, today } = window.ModernTech;
  const { getInitials, getDepartmentColor, showToast } = window.ModernTechUtils;

  const SHARED_DATA_KEY = "sharedHRData";

  const dateMapping = {
    Mon: "2025-07-25", Tue: "2025-07-26", Wed: "2025-07-27",
    Thu: "2025-07-28", Fri: "2025-07-29",
  };
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const attPageDate = document.getElementById("attPageDate");
  if (attPageDate) {
    attPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function loadSharedData() {
    const saved = localStorage.getItem(SHARED_DATA_KEY);
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return null;
  }

  function saveSharedData(employees) {
    const data = {
      leaveRequests: employees.map((emp) => ({ employeeId: emp.id, leaveRequests: emp.leaveRequests })),
      attendance: employees.map((emp) => ({ employeeId: emp.id, attendance: emp.attendance })),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(data));
  }

  function buildEmployees() {
    return employeeInfo.map((emp) => {
      const attData = attendanceAndLeave.find((a) => a.employeeId === emp.employeeId);
      const todayRecord = attData ? attData.attendance.find((a) => a.date === today) : null;
      let status = "Not Checked In";
      if (todayRecord) {
        status = todayRecord.status === "Absent" ? "On Leave" : todayRecord.status === "Present" ? "Active" : status;
      }
      return {
        id: emp.employeeId, name: emp.name, department: emp.department,
        position: emp.position, initials: getInitials(emp.name),
        status: status, color: getDepartmentColor(emp.department),
        attendance: attData ? JSON.parse(JSON.stringify(attData.attendance)) : [],
        leaveRequests: attData ? JSON.parse(JSON.stringify(attData.leaveRequests)) : [],
      };
    });
  }

  let employees = buildEmployees();

  // Role-based access: non-HR only sees their own attendance
  const currentUser = getCurrentUser();
  const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");
  const userEmployeeId = currentUser ? currentUser.employeeId : null;

  if (!isHR && userEmployeeId) {
    employees = employees.filter(e => e.id === userEmployeeId);
  }

  const savedData = loadSharedData();
  if (savedData) {
    employees = employees.map((emp) => {
      const savedLeave = savedData.leaveRequests?.find((l) => l.employeeId === emp.id);
      const savedAtt = savedData.attendance?.find((a) => a.employeeId === emp.id);
      if (savedLeave) emp.leaveRequests = savedLeave.leaveRequests;
      if (savedAtt) emp.attendance = savedAtt.attendance;
      const todayRecord = emp.attendance.find((a) => a.date === today);
      if (todayRecord) {
        emp.status = todayRecord.status === "Absent" ? "On Leave" : todayRecord.status === "Present" ? "Active" : emp.status;
      }
      return emp;
    });
  }

  function saveData() { saveSharedData(employees); }

  function getWeekRecords(emp) {
    return dayLabels.map((day) => {
      const date = dateMapping[day];
      const record = emp.attendance.find((a) => a.date === date);
      const leaveReq = emp.leaveRequests.find((r) => r.date === date);
      return { day, date, status: record ? record.status : null, leaveReq };
    });
  }

  function getWeekSummary(emp) {
    const week = getWeekRecords(emp);
    const present = week.filter((r) => r.status === "Present").length;
    return { week, present, absent: 5 - present, hasRecords: emp.attendance && emp.attendance.length > 0 };
  }

  function getAbsenceDetails(emp) {
    return getWeekRecords(emp).filter((r) => r.status === "Absent").map((r) => ({
      day: r.day, date: r.date,
      reason: r.leaveReq ? r.leaveReq.reason : "Unrecorded absence",
      status: r.leaveReq ? r.leaveReq.status : "N/A",
    }));
  }

  function generateWeeklyData() {
    const present = [], leave = [], absent = [];
    dayLabels.forEach((day) => {
      const date = dateMapping[day];
      let presentCount = 0, absentCount = 0, leaveCount = 0;
      employees.forEach((emp) => {
        const record = emp.attendance.find((a) => a.date === date);
        if (record?.status === "Present") presentCount++;
        else if (record?.status === "Absent") absentCount++;
        if (emp.leaveRequests.some((r) => r.date === date && r.status === "Approved")) leaveCount++;
      });
      present.push(presentCount); leave.push(leaveCount); absent.push(absentCount);
    });
    return { days: dayLabels, present, leave, absent };
  }

  let weeklyData = generateWeeklyData();

  function calculateSummaryStats() {
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalDays = 0;
    employees.forEach((emp) => {
      const { present, absent } = getWeekSummary(emp);
      totalPresent += present; totalAbsent += absent; totalDays += 5;
      totalLeave += emp.leaveRequests.filter((r) => r.status === "Approved" && dayLabels.some((d) => dateMapping[d] === r.date)).length;
    });
    return { totalPresent, totalAbsent, totalLeave, attendanceRate: totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0 };
  }

  function updateSummaryCards() {
    const stats = calculateSummaryStats();
    document.getElementById("attTotalPresent").textContent = stats.totalPresent;
    document.getElementById("attTotalAbsent").textContent = stats.totalAbsent;
    document.getElementById("attTotalLeave").textContent = stats.totalLeave;
    document.getElementById("attAttendanceRate").textContent = stats.attendanceRate + "%";
  }

  function showEmployeeDetails(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) { showToast("Employee not found.", "danger"); return; }
    document.getElementById("attModalEmployeeName").textContent = emp.name;
    const { week, present: presentCount, absent: absentCount, hasRecords } = getWeekSummary(emp);

    let html = `<div class="att-detail-section"><div class="att-detail-section-title"><i class="bi bi-person-badge"></i> Employee Information</div><div class="att-detail-grid"><div class="att-detail-item"><span class="att-detail-label">Name</span><span class="att-detail-value">${emp.name}</span></div><div class="att-detail-item"><span class="att-detail-label">Department</span><span class="att-detail-value">${emp.department}</span></div><div class="att-detail-item"><span class="att-detail-label">Position</span><span class="att-detail-value">${emp.position}</span></div><div class="att-detail-item"><span class="att-detail-label">Today's Status</span><span class="att-detail-value ${emp.status === "Active" ? "present" : emp.status === "On Leave" ? "absent" : ""}">${emp.status}</span></div></div></div>`;

    if (hasRecords) {
      const weekRows = week.map((r) => { const status = r.status || "—"; const cls = r.status === "Present" ? "present" : r.status === "Absent" ? "absent" : ""; return `<div class="att-detail-item"><span class="att-detail-label">${r.day}</span><span class="att-detail-value ${cls}">${status}</span></div>`; }).join("");
      html += `<div class="att-detail-section"><div class="att-detail-section-title"><i class="bi bi-calendar-week"></i> Weekly Attendance</div><div class="att-detail-grid">${weekRows}<div class="att-detail-item" style="grid-column:1/-1;border-top:2px solid var(--border-color);padding-top:10px;"><span class="att-detail-label" style="font-weight:700;">Summary</span><span class="att-detail-value">${presentCount} Present, ${absentCount} Absent</span></div></div></div>`;
    } else {
      html += `<div class="att-detail-section"><div class="att-detail-section-title"><i class="bi bi-calendar-week"></i> Weekly Attendance</div><p style="color:var(--text-muted);font-style:italic;padding:10px 0;">New employee - no attendance records yet.</p></div>`;
    }

    const absences = getAbsenceDetails(emp);
    if (absences.length) { html += `<div class="att-detail-section"><div class="att-detail-section-title"><i class="bi bi-exclamation-triangle"></i> Absence Details</div><div class="att-detail-grid">${absences.map((a) => `<div class="att-detail-item"><span class="att-detail-label">${a.day} (${a.date})</span><span class="att-detail-value absent">${a.reason} <span class="att-status-chip ${a.status.toLowerCase()}">${a.status}</span></span></div>`).join("")}</div></div>`; }
    if (emp.leaveRequests.length) { html += `<div class="att-detail-section"><div class="att-detail-section-title"><i class="bi bi-clock-history"></i> Leave Requests</div><div class="att-detail-grid">${emp.leaveRequests.map((req) => `<div class="att-detail-item"><span class="att-detail-label">${req.date}</span><span class="att-detail-value">${req.reason} <span class="att-status-chip ${req.status.toLowerCase()}">${req.status}</span></span></div>`).join("")}</div></div>`; }

    document.getElementById("attModalBody").innerHTML = html;
    new bootstrap.Modal(document.getElementById("attEmployeeModal")).show();
  }

  function renderWeeklyChart() {
    const container = document.getElementById("attWeeklyChart");
    if (!container) return;
    const maxValue = Math.max(...weeklyData.present, ...weeklyData.leave, ...weeklyData.absent, 1);
    const chartHeight = 180;
    const gridLines = [0, 1, 2, 3, 4].map((i) => (i / 4) * maxValue);
    const totals = { present: weeklyData.present.reduce((a, b) => a + b, 0), leave: weeklyData.leave.reduce((a, b) => a + b, 0), absent: weeklyData.absent.reduce((a, b) => a + b, 0) };
    const grandTotal = totals.present + totals.leave + totals.absent;
    const gridHtml = gridLines.map((value) => `<div class="att-chart-grid-line" style="top: ${100 - (value / maxValue) * 100}%;"><span class="att-grid-label">${Math.round(value)}</span></div>`).join("");
    const barSegment = (type, value, pixelHeight) => { if (value <= 0) return ""; return `<div class="att-chart-bar ${type}" style="height:${Math.max(pixelHeight, 4)}px" data-day-value="${value}" data-type="${type}"></div>`; };
    const dayColumns = weeklyData.days.map((day, i) => {
      const presentVal = weeklyData.present[i] || 0, leaveVal = weeklyData.leave[i] || 0, absentVal = weeklyData.absent[i] || 0;
      const dayTotal = presentVal + leaveVal + absentVal;
      const totalPixelHeight = dayTotal > 0 ? (Math.min((dayTotal / maxValue) * 100, 100) / 100) * chartHeight : 0;
      const presentPx = dayTotal ? (presentVal / dayTotal) * totalPixelHeight : 0;
      const leavePx = dayTotal ? (leaveVal / dayTotal) * totalPixelHeight : 0;
      const absentPx = dayTotal ? (absentVal / dayTotal) * totalPixelHeight : 0;
      const bars = dayTotal > 0 ? barSegment("present", presentVal, presentPx) + barSegment("leave", leaveVal, leavePx) + barSegment("absent", absentVal, absentPx) : `<div class="att-chart-bar" style="height:6px;background:var(--border-color);cursor:default;"></div>`;
      return `<div class="att-chart-day" data-day="${day}"><div class="att-chart-bars">${bars}</div><span class="att-bar-percentage">${dayTotal}</span><div class="att-chart-day-label">${day}</div></div>`;
    }).join("");
    const attendanceRate = grandTotal > 0 ? ((totals.present / grandTotal) * 100).toFixed(1) : 0;
    container.innerHTML = `<div class="att-chart-wrapper"><div class="att-chart-grid">${gridHtml}</div><div class="att-chart-container">${dayColumns}</div><div class="att-chart-tooltip" id="attChartTooltip"></div></div><div class="att-chart-legend"><div class="att-chart-legend-item"><span class="att-legend-dot present"></span> Present <span class="att-legend-count">${totals.present}</span></div><div class="att-chart-legend-item"><span class="att-legend-dot leave"></span> On Leave <span class="att-legend-count">${totals.leave}</span></div><div class="att-chart-legend-item"><span class="att-legend-dot absent"></span> Absent <span class="att-legend-count">${totals.absent}</span></div></div><div class="att-chart-stats"><div class="att-chart-stat"><i class="bi bi-bar-chart-line att-stat-icon"></i><span class="att-stat-label">Total Records:</span><span class="att-stat-value">${grandTotal}</span></div><div class="att-chart-stat"><i class="bi bi-check2-circle att-stat-icon"></i><span class="att-stat-label">Attendance Rate:</span><span class="att-stat-value">${attendanceRate}%</span></div><div class="att-chart-stat"><i class="bi bi-graph-up-arrow att-stat-icon"></i><span class="att-stat-label">Best Day:</span><span class="att-stat-value">${getBestDay()}</span></div><div class="att-chart-stat"><i class="bi bi-graph-down-arrow att-stat-icon"></i><span class="att-stat-label">Worst Day:</span><span class="att-stat-value">${getWorstDay()}</span></div></div>`;
    bindChartTooltip(container);
    updateSummaryCards();
  }

  function bindChartTooltip(container) {
    const tooltip = container.querySelector("#attChartTooltip"), wrapper = container.querySelector(".att-chart-wrapper");
    container.querySelectorAll(".att-chart-bar[data-type]").forEach((bar) => {
      bar.addEventListener("mouseenter", function () { tooltip.textContent = `${this.dataset.type.charAt(0).toUpperCase() + this.dataset.type.slice(1)}: ${this.dataset.dayValue}`; tooltip.style.display = "block"; const barRect = bar.getBoundingClientRect(), wrapperRect = wrapper.getBoundingClientRect(); tooltip.style.left = `${barRect.left - wrapperRect.left + barRect.width / 2}px`; tooltip.style.top = `${barRect.top - wrapperRect.top - 8}px`; });
      bar.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    });
  }

  function getBestDay() { let bestIndex = 0, bestRate = 0; dayLabels.forEach((_, i) => { const total = (weeklyData.present[i] || 0) + (weeklyData.leave[i] || 0) + (weeklyData.absent[i] || 0); const rate = total > 0 ? ((weeklyData.present[i] || 0) / total) * 100 : 0; if (rate > bestRate) { bestRate = rate; bestIndex = i; } }); return `${dayLabels[bestIndex]} (${Math.round(bestRate)}%)`; }
  function getWorstDay() { let worstIndex = 0, worstRate = 100; dayLabels.forEach((_, i) => { const total = (weeklyData.present[i] || 0) + (weeklyData.leave[i] || 0) + (weeklyData.absent[i] || 0); const rate = total > 0 ? ((weeklyData.present[i] || 0) / total) * 100 : 0; if (rate < worstRate) { worstRate = rate; worstIndex = i; } }); return `${dayLabels[worstIndex]} (${Math.round(worstRate)}%)`; }

  function renderTodayView() {
    const container = document.getElementById("attCheckinsContainer");
    if (!container) return;
    if (!employees.length) { container.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No employees found.</td></tr>`; return; }
    const statusOrder = { Active: 0, "On Leave": 1, "Not Checked In": 2 };
    const sorted = [...employees].sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
    container.innerHTML = sorted.map((emp) => {
      const statusClass = emp.status === "Active" ? "active" : emp.status === "On Leave" ? "on-leave" : "probation";
      const { week, present, absent, hasRecords } = getWeekSummary(emp);
      const absenceReason = week.filter((r) => r.status === "Absent").map((r) => `${r.day}: ${r.leaveReq ? r.leaveReq.reason : "Unrecorded absence"}`).join("; ");
      const weekDisplay = hasRecords ? `<span class="att-week-summary">${present} Present, ${absent} Absent</span>${absenceReason ? `<br><span class="att-absence-reason"><i class="bi bi-info-circle"></i> ${absenceReason}</span>` : ""}` : `<span class="att-week-summary" style="color: var(--text-muted); font-style: italic;">New employee - no records</span>`;
      return `<tr><td><div class="att-employee-cell"><div class="att-employee-avatar" style="background:${emp.color}">${emp.initials}</div><span class="att-employee-name">${emp.name}</span></div></td><td>${emp.department}</td><td><span class="att-status-badge ${statusClass}"><span class="att-status-dot"></span>${emp.status}</span></td><td>${weekDisplay}</td><td><button class="btn btn-sm btn-outline-primary view-details-btn" data-employee-id="${emp.id}"><i class="bi bi-eye"></i> View Details</button></td></tr>`;
    }).join("");
    container.querySelectorAll(".view-details-btn").forEach((btn) => btn.addEventListener("click", () => showEmployeeDetails(parseInt(btn.dataset.employeeId, 10))));
  }

  function renderHistoryView() {
    const container = document.getElementById("attHistoryContainer");
    if (!container) return;
    if (!employees.length) { container.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No employees found.</td></tr>`; return; }
    const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = sorted.map((emp) => {
      const hasRecords = emp.attendance && emp.attendance.length > 0;
      const cells = hasRecords ? getWeekRecords(emp).map((r) => { const label = r.status === "Present" ? "✅ Present" : r.status === "Absent" ? "❌ Absent" : "—"; const cls = r.status === "Present" ? "present" : r.status === "Absent" ? "absent" : ""; return `<td><span class="att-status-cell ${cls}">${label}</span></td>`; }).join("") : `<td colspan="5" style="color:var(--text-muted);font-style:italic;text-align:center;">No attendance records</td>`;
      return `<tr><td><div class="att-employee-cell"><div class="att-employee-avatar" style="background:${emp.color}">${emp.initials}</div><span class="att-employee-name">${emp.name}</span></div></td><td>${emp.department}</td>${cells}</tr>`;
    }).join("");
  }

  function toggleView() {
    const todayView = document.getElementById("attTodayView"), historyView = document.getElementById("attHistoryView"), toggleBtn = document.getElementById("attToggleHistoryBtn");
    const showingToday = todayView.style.display !== "none";
    todayView.style.display = showingToday ? "none" : "block";
    historyView.style.display = showingToday ? "block" : "none";
    toggleBtn.innerHTML = showingToday ? '<i class="bi bi-arrow-left"></i> Back to Today' : '<i class="bi bi-calendar-week"></i> View Full History';
    if (showingToday) renderHistoryView();
  }

  function populateEmployeeSelect() {
    const select = document.getElementById("attEmployeeSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select employee...</option>' + employeeInfo.map((e) => `<option value="${e.employeeId}">${e.name} (${e.position})</option>`).join("");
  }

  function logAttendance() {
    const employeeId = parseInt(document.getElementById("attEmployeeSelect").value);
    const date = document.getElementById("attDate").value;
    const status = document.getElementById("attStatusSelect").value;
    if (!employeeId) { showToast("Please select an employee.", "danger"); return; }
    if (!date) { showToast("Please select a date.", "danger"); return; }
    if (!status) { showToast("Please select a status.", "danger"); return; }
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const existing = emp.attendance.find((a) => a.date === date);
    if (existing) existing.status = status;
    else emp.attendance.push({ date, status });
    if (date === today) emp.status = status === "Absent" ? "On Leave" : status === "Present" ? "Active" : emp.status;
    saveData();
    weeklyData = generateWeeklyData();
    bootstrap.Modal.getInstance(document.getElementById("attLogModal"))?.hide();
    document.getElementById("attForm").reset();
    document.getElementById("attDate").value = today;
    renderTodayView(); renderWeeklyChart();
    showToast(`Attendance logged for ${emp.name}`, "success");
  }

  function exportAttendance() {
    if (!employees.length) { showToast("No data to export.", "danger"); return; }
    try {
      const allDates = [...new Set(employees.flatMap((e) => e.attendance.map((a) => a.date)))].sort();
      const summaryRows = employees.map((emp) => { const present = emp.attendance.filter((r) => r.status === "Present").length; const absent = emp.attendance.filter((r) => r.status === "Absent").length; return { Employee: emp.name, Department: emp.department, "Total Present": present, "Total Absent": absent, "Attendance Rate": present + absent > 0 ? present / (present + absent) : 0 }; });
      const detailRows = employees.map((emp) => { const row = { Employee: emp.name, Department: emp.department, Position: emp.position }; allDates.forEach((date) => { const record = emp.attendance.find((a) => a.date === date); row[date] = record ? record.status : "—"; }); return row; });
      const leaveRows = employees.flatMap((emp) => emp.leaveRequests.map((req) => ({ Employee: emp.name, Department: emp.department, Date: req.date, Reason: req.reason, Status: req.status })));
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(summaryRows); const ws2 = XLSX.utils.json_to_sheet(detailRows); const ws3 = XLSX.utils.json_to_sheet(leaveRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Summary"); XLSX.utils.book_append_sheet(wb, ws2, "Detailed Attendance"); XLSX.utils.book_append_sheet(wb, ws3, "Leave Requests");
      XLSX.writeFile(wb, `attendance_report_${new Date().toISOString().split("T")[0]}.xlsx`);
      showToast(`Attendance report exported for ${employees.length} employees.`, "success");
    } catch (error) { showToast("Export failed.", "danger"); }
  }

  renderWeeklyChart(); renderTodayView(); populateEmployeeSelect();
  document.getElementById("attDate").value = today;

  // Hide admin buttons for non-HR
  if (!isHR) {
    const logBtn = document.querySelector('[data-bs-target="#attLogModal"]');
    if (logBtn) logBtn.style.display = "none";
    const exportBtn = document.getElementById("attExportBtn");
    if (exportBtn) exportBtn.style.display = "none";
  }

  document.getElementById("attSubmitBtn").addEventListener("click", logAttendance);
  document.getElementById("attExportBtn").addEventListener("click", exportAttendance);
  document.getElementById("attToggleHistoryBtn").addEventListener("click", toggleView);
  console.log("✅ Attendance module initialized");
}