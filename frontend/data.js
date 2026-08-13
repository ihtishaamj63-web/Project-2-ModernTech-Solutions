/**
 * ============================================================
 * MODERNTECH SOLUTIONS - DATA LOADER
 * Loads data from data.json and exposes it via window.ModernTech
 * Single source of truth - all pages read from here
 * ============================================================
 */

(function () {
  window.ModernTech = window.ModernTech || {};

  let _resolveReady;
  window.ModernTech._readyPromise = new Promise((resolve) => {
    _resolveReady = resolve;
  });

  window.ModernTech.ready = function (callback) {
    window.ModernTech._readyPromise.then(() => callback(window.ModernTech));
  };

  // Check localStorage for live data first (from employees page), then fall back to data.json
  const storedEmployees = localStorage.getItem("moderntech_employees_v1");
  const storedLeaveRequests = localStorage.getItem("sharedHRData");

  fetch("data.json")
    .then((response) => {
      if (!response.ok)
        throw new Error(`Failed to load data.json: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      // Use live employee data if available, otherwise use seed data
      if (storedEmployees) {
        try {
          const liveEmployees = JSON.parse(storedEmployees);
          window.ModernTech.employeeInfo = liveEmployees;
        } catch (e) {
          window.ModernTech.employeeInfo = data.employeeInfo;
        }
      } else {
        window.ModernTech.employeeInfo = data.employeeInfo;
      }

      // Use live leave requests if available
      if (storedLeaveRequests) {
        try {
          const liveLeave = JSON.parse(storedLeaveRequests);
          const mergedAttendance = data.attendanceAndLeave.map((emp) => {
            const liveEmp = liveLeave.leaveRequests?.find(
              (l) => l.employeeId === emp.employeeId,
            );
            const liveAtt = liveLeave.attendance?.find(
              (a) => a.employeeId === emp.employeeId,
            );
            return {
              ...emp,
              leaveRequests: liveEmp?.leaveRequests || emp.leaveRequests,
              attendance: liveAtt?.attendance || emp.attendance,
            };
          });
          window.ModernTech.attendanceAndLeave = mergedAttendance;
        } catch (e) {
          window.ModernTech.attendanceAndLeave = data.attendanceAndLeave;
        }
      } else {
        window.ModernTech.attendanceAndLeave = data.attendanceAndLeave;
      }

      window.ModernTech.payrollData = data.payrollData;
      window.ModernTech.today = data.today;
      window.ModernTech._ready = true;

      console.log("✅ Data loaded - single source of truth active");
      console.log(
        `   ${window.ModernTech.employeeInfo.length} employees (live data)`,
      );
      console.log(`   Today: ${window.ModernTech.today}`);

      _resolveReady(window.ModernTech);
    })
    .catch((error) => {
      console.error("❌ Failed to load data:", error);
      document.addEventListener("DOMContentLoaded", function () {
        document
          .querySelectorAll(
            ".main-content, .att-main-content, .to-main-content, .pay-container, .emp-page, .rev-main",
          )
          .forEach((el) => {
            el.innerHTML = `<div class="text-center py-5"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i><h3 class="mt-3 text-danger">Data Load Error</h3><p class="text-muted">Failed to load data.json. Please run a local server.</p></div>`;
          });
      });
    });
})();
