/**
 * MODERNTECH SOLUTIONS - SHARED UTILITIES
 * Reusable functions used across multiple pages
 */

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("");
}

function getEmployeeById(id) {
  if (window.ModernTech && window.ModernTech.employeeInfo) {
    return window.ModernTech.employeeInfo.find((e) => e.employeeId === id);
  }
  return null;
}

function getEmployeeAttendance(employeeId) {
  if (window.ModernTech && window.ModernTech.attendanceAndLeave) {
    const record = window.ModernTech.attendanceAndLeave.find(
      (a) => a.employeeId === employeeId,
    );
    return record ? record.attendance : [];
  }
  return [];
}

function getEmployeeLeaveRequests(employeeId) {
  if (window.ModernTech && window.ModernTech.attendanceAndLeave) {
    const record = window.ModernTech.attendanceAndLeave.find(
      (a) => a.employeeId === employeeId,
    );
    return record ? record.leaveRequests : [];
  }
  return [];
}

function getTodayStatus(employeeId) {
  const attendance = getEmployeeAttendance(employeeId);
  if (!attendance || attendance.length === 0) return "Not Recorded";

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find((a) => a.date === today);
  return todayRecord ? todayRecord.status : "Not Recorded";
}

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

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

function getDepartmentColor(department) {
  return departmentColors[department] || "#8686AC";
}

// Enhanced toast notification with fallback
function showToast(message, type = "success") {
  // Try to use existing toast system
  if (window.ModernTechUtils && typeof window.ModernTechUtils.showToast === 'function') {
    window.ModernTechUtils.showToast(message, type);
    return;
  }
  
  // Create our own toast if none exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    background: ${type === 'success' ? '#1b5e20' : type === 'danger' ? '#b71c1c' : '#272757'};
    color: white;
    padding: 14px 22px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    margin-bottom: 4px;
  `;
  container.appendChild(toast);
  
  // Trigger show animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
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