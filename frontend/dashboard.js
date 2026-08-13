document.addEventListener("DOMContentLoaded", function () {
  if (window.ModernTech && window.ModernTech.ready) {
    window.ModernTech.ready(function () {
      initDashboard();
    });
  } else {
    let attempts = 0;
    const checkData = setInterval(function () {
      if (window.ModernTech && window.ModernTech.employeeInfo) {
        clearInterval(checkData);
        initDashboard();
      }
      attempts++;
      if (attempts > 50) {
        clearInterval(checkData);
        console.error("Dashboard: Data failed to load");
      }
    }, 100);
  }
});

function initDashboard() {
  const currentUser = getCurrentUser();
  const isHR =
    currentUser &&
    (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");
  const userEmployeeId = currentUser ? currentUser.employeeId : null;

  let employeeInfo =
    (window.ModernTech && window.ModernTech.employeeInfo) || [];
  let attendanceAndLeave =
    (window.ModernTech && window.ModernTech.attendanceAndLeave) || [];

  function refreshLocalData() {
    employeeInfo =
      (window.ModernTech && window.ModernTech.employeeInfo) ||
      employeeInfo ||
      [];
    attendanceAndLeave =
      (window.ModernTech && window.ModernTech.attendanceAndLeave) ||
      attendanceAndLeave ||
      [];
  }

  const SHARED_DATA_KEY = "sharedHRData";
  const REVIEWS_KEY = "sharedReviews";
  const dateMapping = {
    Mon: "2025-07-25",
    Tue: "2025-07-26",
    Wed: "2025-07-27",
    Thu: "2025-07-28",
    Fri: "2025-07-29",
  };
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  function getSharedAttendance() {
    const saved = localStorage.getItem(SHARED_DATA_KEY);
    const fallback = attendanceAndLeave.map((e) => ({
      employeeId: e.employeeId,
      attendance: e.attendance,
    }));
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data.attendance) && data.attendance.length > 0) {
          const savedMap = new Map(
            data.attendance.map((item) => [item.employeeId, item.attendance]),
          );
          return fallback.map((item) => ({
            employeeId: item.employeeId,
            attendance: savedMap.has(item.employeeId)
              ? savedMap.get(item.employeeId)
              : item.attendance,
          }));
        }
      } catch (e) {}
    }
    return fallback;
  }

  function getSharedLeaveRequests() {
    const saved = localStorage.getItem(SHARED_DATA_KEY);
    const fallback = attendanceAndLeave.map((e) => ({
      employeeId: e.employeeId,
      leaveRequests: e.leaveRequests,
    }));
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (
          Array.isArray(data.leaveRequests) &&
          data.leaveRequests.length > 0
        ) {
          const savedMap = new Map(
            data.leaveRequests.map((item) => [
              item.employeeId,
              item.leaveRequests,
            ]),
          );
          return fallback.map((item) => ({
            employeeId: item.employeeId,
            leaveRequests: savedMap.has(item.employeeId)
              ? savedMap.get(item.employeeId)
              : item.leaveRequests,
          }));
        }
      } catch (e) {}
    }
    return fallback;
  }

  function updateAll() {
    updateStatCards();
    renderTimeOffTable();
    renderReviewsTable();
  }
  refreshLocalData();

  // Update hero greeting and actions based on role
  try {
    const greetingEl = document.getElementById("dashGreeting");
    const subEl = document.getElementById("dashHeroSub");
    const empBtn = document.getElementById("heroEmployeesBtn");
    const payBtn = document.getElementById("heroPayrollBtn");
    if (greetingEl && currentUser) {
      greetingEl.textContent = `Welcome back, ${currentUser.name}.`;
    }
    if (!isHR) {
      if (subEl)
        subEl.textContent =
          "View your personal dashboard: attendance, time off and reviews.";
      if (empBtn) empBtn.style.display = "none";
      if (payBtn) payBtn.style.display = "none";
    } else {
      if (subEl)
        subEl.textContent =
          "Manage employee records, performance reviews and payroll from one centralized HR dashboard.";
      if (empBtn) empBtn.style.display = "inline-block";
      if (payBtn) payBtn.style.display = "inline-block";
    }
  } catch (e) {}

  function updateStatCards() {
    const sharedAtt = getSharedAttendance();
    const sharedLeave = getSharedLeaveRequests();
    const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");

    if (isHR) {
      // HR sees all company stats
      const liveEmployees = JSON.parse(
        localStorage.getItem("moderntech_employees_v1") || "[]",
      );
      document.getElementById("dashTotalEmployees").textContent =
        liveEmployees.length || employeeInfo.length;
      const payrollTotal = (window.ModernTech?.payrollData || []).reduce(
        (s, p) => s + p.finalSalary,
        0,
      );
      document.getElementById("dashPayrollTotal").textContent =
        "R " + payrollTotal.toLocaleString("en-ZA");
      let totalPresent = 0,
        totalAbsent = 0;
      dayLabels.forEach((day) => {
        const date = dateMapping[day];
        sharedAtt.forEach((emp) => {
          const r = emp.attendance?.find((a) => a.date === date);
          if (r?.status === "Present") totalPresent++;
          else if (r?.status === "Absent") totalAbsent++;
        });
      });
      document.getElementById("dashAttRate").textContent =
        (totalPresent + totalAbsent > 0
          ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
          : 0) + "%";
      let pendingCount = 0;
      sharedLeave.forEach((emp) => {
        emp.leaveRequests?.forEach((req) => {
          if (req.status === "Pending") pendingCount++;
        });
      });
      document.getElementById("dashPendingCount").textContent = pendingCount;
      document.getElementById("dashReviewCount").textContent = reviews.length;
    } else {
      // Employee sees only their own stats
      document.getElementById("dashTotalEmployees").textContent =
        employeeInfo.length;
      document.getElementById("dashPayrollTotal").textContent = "—";
      // Personal attendance rate
      const myAtt = sharedAtt.find((e) => e.employeeId === userEmployeeId);
      if (myAtt) {
        let p = 0,
          a = 0;
        dayLabels.forEach((day) => {
          const r = myAtt.attendance?.find((x) => x.date === dateMapping[day]);
          if (r?.status === "Present") p++;
          else if (r?.status === "Absent") a++;
        });
        document.getElementById("dashAttRate").textContent =
          (p + a > 0 ? Math.round((p / (p + a)) * 100) : 0) + "%";
      }
      // Personal pending requests
      const myLeave = sharedLeave.find((e) => e.employeeId === userEmployeeId);
      let myPending = 0;
      if (myLeave) {
        myLeave.leaveRequests?.forEach((req) => {
          if (req.status === "Pending") myPending++;
        });
      }
      document.getElementById("dashPendingCount").textContent = myPending;
      // Personal reviews
      const userEmp = employeeInfo.find((e) => e.employeeId === userEmployeeId);
      const myReviews = reviews.filter((r) => r.name === userEmp?.name).length;
      document.getElementById("dashReviewCount").textContent = myReviews;
    }

    const today = new Date();
    const dateEl = document.getElementById("dashTodayDate");
    if (dateEl)
      dateEl.textContent =
        "Today: " +
        today.toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  }

  function renderTimeOffTable() {
    const container = document.getElementById("dashTimeOffContainer");
    if (!container) return;
    const sharedLeave = getSharedLeaveRequests();
    const allRequests = [];
    sharedLeave.forEach((emp) => {
      const empInfo = employeeInfo.find((e) => e.employeeId === emp.employeeId);
      emp.leaveRequests?.forEach((req) => {
        // Non-HR only sees their own requests
        if (!isHR && emp.employeeId !== userEmployeeId) return;
        allRequests.push({
          employeeName: empInfo?.name || `ID:${emp.employeeId}`,
          type: req.type || "Annual",
          date: req.date,
          status: req.status,
        });
      });
    });
    if (!allRequests.length) {
      container.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No requests found</td></tr>`;
      return;
    }
    allRequests.sort((a, b) => b.date.localeCompare(a.date));
    container.innerHTML = allRequests
      .slice(0, 5)
      .map((req) => {
        const cls =
          req.status === "Approved"
            ? "att-status-badge active"
            : req.status === "Denied"
              ? "att-status-badge on-leave"
              : "att-status-badge probation";
        return `<tr><td>${req.employeeName}</td><td>${req.type}</td><td>${req.date}</td><td><span class="${cls}" style="font-size:11px;">${req.status}</span></td></tr>`;
      })
      .join("");
  }

  function renderReviewsTable() {
    const container = document.getElementById("dashReviewsContainer");
    if (!container) return;
    let reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    if (!reviews.length)
      reviews = [
        { name: "Zanele Khumalo", department: "Marketing", rating: 4 },
        { name: "Sibongile Nkosi", department: "Development", rating: 4 },
        { name: "Karabo Dlamini", department: "Finance", rating: 4 },
        { name: "Fatima Patel", department: "Support", rating: 4 },
      ];
    if (!isHR) {
      const userEmp = employeeInfo.find((e) => e.employeeId === userEmployeeId);
      reviews = reviews.filter((r) => r.name === userEmp?.name);
    }
    container.innerHTML = reviews
      .slice(-4)
      .reverse()
      .map(
        (r) =>
          `<tr><td>${r.name}</td><td>${r.department}</td><td>${"⭐".repeat(r.rating)}</td><td><button onclick="location.href='reviews.html'">View</button></td></tr>`,
      )
      .join("");
  }

  function generateWeeklyData() {
    const sharedAtt = getSharedAttendance();
    const sharedLeave = getSharedLeaveRequests();
    const present = [],
      leave = [],
      absent = [];
    dayLabels.forEach((day) => {
      const date = dateMapping[day];
      let pc = 0,
        ac = 0,
        lc = 0;
      sharedAtt.forEach((emp) => {
        if (!isHR && emp.employeeId !== userEmployeeId) return;
        const r = emp.attendance?.find((a) => a.date === date);
        if (r?.status === "Present") pc++;
        else if (r?.status === "Absent") ac++;
      });
      sharedLeave.forEach((emp) => {
        if (
          emp.leaveRequests?.some(
            (r) => r.date === date && r.status === "Approved",
          )
        )
          lc++;
      });
      present.push(pc);
      leave.push(lc);
      absent.push(ac);
    });
    return { days: dayLabels, present, leave, absent };
  }

  function renderWeeklyChart() {
    const container = document.getElementById("homeWeeklyChart");
    if (!container) return;
    const weeklyData = generateWeeklyData();
    const maxValue = Math.max(
      ...weeklyData.present,
      ...weeklyData.leave,
      ...weeklyData.absent,
      1,
    );
    const chartHeight = 180;
    const totals = {
      present: weeklyData.present.reduce((a, b) => a + b, 0),
      leave: weeklyData.leave.reduce((a, b) => a + b, 0),
      absent: weeklyData.absent.reduce((a, b) => a + b, 0),
    };
    const gridLines = [0, 1, 2, 3, 4].map((i) => (i / 4) * maxValue);
    const gridHtml = gridLines
      .map(
        (v) =>
          `<div class="att-chart-grid-line" style="top:${100 - (v / maxValue) * 100}%;"><span class="att-grid-label">${Math.round(v)}</span></div>`,
      )
      .join("");
    const barSegment = (type, value, h) =>
      value <= 0
        ? ""
        : `<div class="att-chart-bar ${type}" style="height:${Math.max(h, 4)}px" data-day-value="${value}" data-type="${type}"></div>`;
    const dayColumns = weeklyData.days
      .map((day, i) => {
        const pv = weeklyData.present[i] || 0,
          lv = weeklyData.leave[i] || 0,
          av = weeklyData.absent[i] || 0,
          dt = pv + lv + av;
        const tph =
          dt > 0
            ? (Math.min((dt / maxValue) * 100, 100) / 100) * chartHeight
            : 0;
        const bars =
          dt > 0
            ? barSegment("present", pv, dt ? (pv / dt) * tph : 0) +
              barSegment("leave", lv, dt ? (lv / dt) * tph : 0) +
              barSegment("absent", av, dt ? (av / dt) * tph : 0)
            : `<div class="att-chart-bar" style="height:6px;background:var(--border-color);"></div>`;
        return `<div class="att-chart-day"><div class="att-chart-bars">${bars}</div><span class="att-bar-percentage">${dt}</span><div class="att-chart-day-label">${day}</div></div>`;
      })
      .join("");
    container.innerHTML = `<div class="att-chart-wrapper"><div class="att-chart-grid">${gridHtml}</div><div class="att-chart-container">${dayColumns}</div><div class="att-chart-tooltip" id="homeChartTooltip"></div></div><div class="att-chart-legend"><div class="att-chart-legend-item"><span class="att-legend-dot present"></span> Present <span class="att-legend-count">${totals.present}</span></div><div class="att-chart-legend-item"><span class="att-legend-dot leave"></span> On Leave <span class="att-legend-count">${totals.leave}</span></div><div class="att-chart-legend-item"><span class="att-legend-dot absent"></span> Absent <span class="att-legend-count">${totals.absent}</span></div></div>`;
    bindChartTooltip(container);
  }

  function bindChartTooltip(c) {
    const tt = c.querySelector("#homeChartTooltip"),
      w = c.querySelector(".att-chart-wrapper");
    if (!tt || !w) return;
    c.querySelectorAll(".att-chart-bar[data-type]").forEach((b) => {
      b.addEventListener("mouseenter", function () {
        tt.textContent = `${this.dataset.type.charAt(0).toUpperCase() + this.dataset.type.slice(1)}: ${this.dataset.dayValue}`;
        tt.style.display = "block";
        const br = b.getBoundingClientRect(),
          wr = w.getBoundingClientRect();
        tt.style.left = `${br.left - wr.left + br.width / 2}px`;
        tt.style.top = `${br.top - wr.top - 8}px`;
      });
      b.addEventListener("mouseleave", () => {
        tt.style.display = "none";
      });
    });
  }

  renderWeeklyChart();
  updateAll();
  window.addEventListener("moderntech:dataUpdated", function () {
    try {
      refreshLocalData();
      updateAll();
      renderWeeklyChart();
    } catch (e) {}
  });
  window.addEventListener("storage", function (e) {
    try {
      if (!e.key) return;
      if (e.key === "moderntech_employees_v1" || e.key === "sharedHRData") {
        refreshLocalData();
        updateAll();
        renderWeeklyChart();
      }
    } catch (err) {}
  });
}
