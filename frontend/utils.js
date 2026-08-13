/**
 * ============================================================
 * MODERNTECH SOLUTIONS - SHARED UTILITIES
 * Reusable functions used across multiple pages
 * ============================================================
 */

/**
 * Get initials from a full name
 * Example: "Sibongile Nkosi" → "SN"
 */
function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("");
}

/**
 * Get employee by ID
 */
function getEmployeeById(id) {
  if (window.ModernTech && window.ModernTech.employeeInfo) {
    return window.ModernTech.employeeInfo.find((e) => e.employeeId === id);
  }
  return null;
}

/**
 * Get attendance data for an employee
 */
function getEmployeeAttendance(employeeId) {
  if (window.ModernTech && window.ModernTech.attendanceAndLeave) {
    const record = window.ModernTech.attendanceAndLeave.find(
      (a) => a.employeeId === employeeId,
    );
    return record ? record.attendance : [];
  }
  return [];
}

/**
 * Get leave requests for an employee
 */
function getEmployeeLeaveRequests(employeeId) {
  if (window.ModernTech && window.ModernTech.attendanceAndLeave) {
    const record = window.ModernTech.attendanceAndLeave.find(
      (a) => a.employeeId === employeeId,
    );
    return record ? record.leaveRequests : [];
  }
  return [];
}

/**
 * Get today's status for an employee
 */
function getTodayStatus(employeeId) {
  const attendance = getEmployeeAttendance(employeeId);
  if (!attendance || attendance.length === 0) return "Not Recorded";

  const today = window.ModernTech ? window.ModernTech.today : "2025-07-29";
  const todayRecord = attendance.find((a) => a.date === today);
  return todayRecord ? todayRecord.status : "Not Recorded";
}

/**
 * Calculate days between two dates
 */
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Department colors
 */
const departmentColors = {
  Development: "#4CAF50",
  HR: "#2196F3",
  QA: "#FF9800",
  Sales: "#E74C5E",
  Marketing: "#9C27B0",
  Design: "#00BCD4",
  IT: "#607D8B",
  Finance: "#795548",
  Support: "#3F51B5",
};

/**
 * Get color for a department
 */
function getDepartmentColor(department) {
  return departmentColors[department] || "#8686AC";
}

/**
 * Show toast notification - works across all pages
 */
function showToast(message, type = "success") {
  // Try all possible toast elements
  const toastIds = ["attToast", "toToast", "payToast"];
  let toast = null;

  for (const id of toastIds) {
    const el = document.getElementById(id);
    if (el) {
      toast = el;
      break;
    }
  }

  if (!toast) {
    // Create a toast if none exists
    toast = document.createElement("div");
    toast.id = "dynamicToast";
    toast.className = "toast-custom";
    document.body.appendChild(toast);

    // Add toast container if needed
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    container.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = "toast-custom " + type;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
    toast.className = "toast-custom";
  }, 3000);
}

// Expose to global scope
window.ModernTechUtils = {
  getInitials: getInitials,
  getEmployeeById: getEmployeeById,
  getEmployeeAttendance: getEmployeeAttendance,
  getEmployeeLeaveRequests: getEmployeeLeaveRequests,
  getTodayStatus: getTodayStatus,
  calculateDays: calculateDays,
  departmentColors: departmentColors,
  getDepartmentColor: getDepartmentColor,
  showToast: showToast,
};

console.log("✅ Utilities loaded successfully!");
