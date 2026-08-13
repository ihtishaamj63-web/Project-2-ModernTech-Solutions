/**
 * ============================================================
 * MODERNTECH SOLUTIONS - AUTHENTICATION SYSTEM
 * ============================================================
 */

// ============================================================
// 1. HARDCODED CREDENTIALS
// ============================================================
const VALID_USERS = [
  {
    email: "lungile.moyo@moderntech.com",
    password: "hrpass123",
    name: "Lungile Moyo",
    role: "HR Manager",
    employeeId: 2,
  },
  {
    email: "hr@moderntech.com",
    password: "hrpass",
    name: "HR Administrator",
    role: "HR Admin",
    employeeId: null,
  },
  {
    email: "sibongile.nkosi@moderntech.com",
    password: "password123",
    name: "Sibongile Nkosi",
    role: "Software Engineer",
    employeeId: 1,
  },
  {
    email: "thabo.molefe@moderntech.com",
    password: "qapass456",
    name: "Thabo Molefe",
    role: "Quality Analyst",
    employeeId: 3,
  },
  {
    email: "keshav.naidoo@moderntech.com",
    password: "sales789",
    name: "Keshav Naidoo",
    role: "Sales Representative",
    employeeId: 4,
  },
  {
    email: "zanele.khumalo@moderntech.com",
    password: "marketing123",
    name: "Zanele Khumalo",
    role: "Marketing Specialist",
    employeeId: 5,
  },
  {
    email: "sipho.zulu@moderntech.com",
    password: "design456",
    name: "Sipho Zulu",
    role: "UI/UX Designer",
    employeeId: 6,
  },
  {
    email: "naledi.moeketsi@moderntech.com",
    password: "devops789",
    name: "Naledi Moeketsi",
    role: "DevOps Engineer",
    employeeId: 7,
  },
  {
    email: "farai.gumbo@moderntech.com",
    password: "content123",
    name: "Farai Gumbo",
    role: "Content Strategist",
    employeeId: 8,
  },
  {
    email: "karabo.dlamini@moderntech.com",
    password: "finance456",
    name: "Karabo Dlamini",
    role: "Accountant",
    employeeId: 9,
  },
  {
    email: "fatima.patel@moderntech.com",
    password: "support789",
    name: "Fatima Patel",
    role: "Customer Support Lead",
    employeeId: 10,
  },
];

// ============================================================
// 2. AUTHENTICATION
// ============================================================
function isLoggedIn() {
  return localStorage.getItem("authUser") !== null;
}

function getCurrentUser() {
  const userData = localStorage.getItem("authUser");
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function loginUser(email, password) {
  const user = VALID_USERS.find(
    (u) => u.email === email.trim() && u.password === password.trim(),
  );
  if (user) {
    const userData = {
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    };
    localStorage.setItem("authUser", JSON.stringify(userData));
    return { success: true, user: userData };
  }
  return { success: false, error: "Invalid email or password" };
}

function logoutUser() {
  localStorage.removeItem("authUser");
  window.location.href = "login.html";
}

function requireAuth() {
  if (window.location.pathname.includes("login.html")) return;
  if (!isLoggedIn()) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "login.html";
  }
}

function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    const redirect = localStorage.getItem("redirectAfterLogin") || "index.html";
    localStorage.removeItem("redirectAfterLogin");
    window.location.href = redirect;
  }
}

function updateUserUI() {
  const user = getCurrentUser();
  if (!user) return;
  document
    .querySelectorAll(".user-name")
    .forEach((el) => (el.textContent = user.name));
  document
    .querySelectorAll(".user-role")
    .forEach((el) => (el.textContent = user.role + " · ModernTech"));
  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("");
  document
    .querySelectorAll(".user-avatar")
    .forEach((el) => (el.textContent = initials));
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.removeEventListener("click", logoutUser);
    logoutBtn.addEventListener("click", logoutUser);
  }
}

// ============================================================
// 3. NOTIFICATION SYSTEM (Centralized)
// ============================================================

window._notificationGenerators = {};

function registerNotificationGenerator(pageId, generatorFn) {
  window._notificationGenerators[pageId] = generatorFn;
  try {
    refreshAllNotificationBadges();
  } catch (e) {
    console.warn("Failed to refresh badges after registering generator", e);
  }
}

if (
  window._pendingNotificationGenerators &&
  Array.isArray(window._pendingNotificationGenerators)
) {
  window._pendingNotificationGenerators.forEach((it) => {
    try {
      if (it && it.pageId && typeof it.gen === "function")
        registerNotificationGenerator(it.pageId, it.gen);
    } catch (e) {
      console.warn("Failed to register pending notification generator", e);
    }
  });
  window._pendingNotificationGenerators = [];
}

function getCurrentPageGenerator() {
  const path = window.location.pathname;
  if (path.includes("attendance")) return "attendance";
  if (path.includes("timeoff")) return "timeoff";
  if (path.includes("employees") || path.includes("add-employee"))
    return "employees";
  if (path.includes("payroll")) return "payroll";
  if (path.includes("reviews")) return "reviews";
  if (path.includes("home")) return "home";
  return "default";
}

function setupNotificationButton() {
  const notificationBtns = document.querySelectorAll(
    '[id$="NotificationBtn" i]',
  );
  notificationBtns.forEach((btn) => {
    btn.removeEventListener("click", handleNotificationClick);
    btn.addEventListener("click", handleNotificationClick);
  });
}

function handleNotificationClick() {
  const modalId = this.id.replace(/Btn$/i, "Modal");
  const modalElement = document.getElementById(modalId);

  if (modalElement) {
    const listContainer = modalElement.querySelector(
      '[id$="NotificationList" i]',
    );
    if (listContainer) {
      renderCentralizedNotifications(listContainer);
    }
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  } else {
    console.warn(
      `No matching modal "${modalId}" found for button "${this.id}"`,
    );
  }
}

function renderCentralizedNotifications(container) {
  if (!container) return;

  const pageId = getCurrentPageGenerator();
  const generator = window._notificationGenerators[pageId];
  let notifications = [];

  if (generator) {
    notifications = generator();
  } else {
    notifications = [
      {
        icon: "bi-bell",
        text: "No new notifications",
        time: "Now",
        type: "info",
      },
    ];
  }

  function _getDismissed() {
    try {
      const raw = localStorage.getItem("moderntech_dismissedNotifications");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _makeId(n) {
    const key = (n.id || n.text || JSON.stringify(n)) + "|" + (n.time || "");
    return encodeURIComponent(key);
  }

  const dismissed = _getDismissed()[pageId] || [];

  const visible = (notifications || []).filter((n) => {
    const id = _makeId(n);
    return !dismissed.includes(id);
  });

  const html = visible
    .map((n) => {
      const id = _makeId(n);
      const bgColors = {
        warning: "rgba(255, 152, 0, 0.1)",
        success: "rgba(76, 175, 80, 0.1)",
        danger: "rgba(244, 67, 54, 0.1)",
        info: "rgba(33, 150, 243, 0.1)",
      };
      const iconColors = {
        warning: "#FF9800",
        success: "#4CAF50",
        danger: "#F44336",
        info: "#2196F3",
      };

      return `
      <div class="d-flex align-items-start gap-3 p-2 border-bottom notification-item" data-notif-id="${id}">
        <div class="rounded-circle p-2" style="background: ${bgColors[n.type] || bgColors.info};">
          <i class="bi ${n.icon}" style="color: ${iconColors[n.type] || iconColors.info};"></i>
        </div>
        <div style="flex:1;cursor:pointer;">
          <div class="small">${n.text}</div>
          <div class="text-muted small">${n.time}</div>
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML =
    html ||
    `<div class="p-3 text-muted text-center">No new notifications</div>`;
  container.dataset.notificationPage = pageId;

  Array.from(container.querySelectorAll(".notification-item")).forEach((el) => {
    el.addEventListener("click", function () {
      const nid = this.dataset.notifId;
      if (nid) markNotificationRead(container.dataset.notificationPage, nid);
    });
  });
}

function markNotificationRead(pageId, notifId) {
  try {
    const raw = localStorage.getItem("moderntech_dismissedNotifications");
    const obj = raw ? JSON.parse(raw) : {};
    obj[pageId] = obj[pageId] || [];
    if (!obj[pageId].includes(notifId)) obj[pageId].push(notifId);
    localStorage.setItem(
      "moderntech_dismissedNotifications",
      JSON.stringify(obj),
    );
  } catch (e) {
    console.error("Failed to save dismissed notification", e);
  }
  try {
    refreshAllNotificationBadges();
    const modal = document.querySelector(`#${pageId}NotificationModal`);
    if (modal) {
      const list = modal.querySelector('[id$="NotificationList" i]');
      if (list) renderCentralizedNotifications(list);
    }
  } catch (e) {}
}

window.markNotificationRead = markNotificationRead;

function refreshAllNotificationBadges() {
  try {
    const generators = window._notificationGenerators || {};
    const raw = localStorage.getItem("moderntech_dismissedNotifications");
    const dismissedObj = raw ? JSON.parse(raw) : {};
    Object.keys(generators).forEach((pageId) => {
      try {
        const gen = generators[pageId];
        const notes = typeof gen === "function" ? gen() : [];
        const makeId = (n) =>
          encodeURIComponent(
            (n.id || n.text || JSON.stringify(n)) + "|" + (n.time || ""),
          );
        const dismissedForPage = Array.isArray(dismissedObj[pageId])
          ? dismissedObj[pageId]
          : [];
        const count = Array.isArray(notes)
          ? notes.filter((n) => !dismissedForPage.includes(makeId(n))).length
          : 0;
        updateNotificationBadge(pageId, count);
      } catch (err) {
        console.error("Notification generator failed for", pageId, err);
      }
    });
  } catch (e) {
    console.error("Failed to refresh notification badges", e);
  }
}

function updateNotificationBadge(pageId, count) {
  const badgeMap = {
    attendance: "attNotificationCount",
    timeoff: "toNotificationCount",
    employees: "empNotificationCount",
    payroll: "payNotificationCount",
    reviews: "revNotificationCount",
    home: "notificationCount",
  };

  const badgeId = badgeMap[pageId];
  if (!badgeId) return;

  let badge = document.getElementById(badgeId);
  if (!badge) {
    badge = document.getElementById("notificationCount");
  }
  if (badge) {
    badge.textContent = count || "0";
  }
}

// ============================================================
// 4. NIGHT MODE
// ============================================================
function toggleNightMode() {
  const body = document.body;
  const icon =
    document.querySelector("#themeIcon") ||
    document.querySelector('[id$="NightModeToggle"] i') ||
    document.querySelector(".btn-toggle i");
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    if (icon) icon.className = "bi bi-sun-fill";
    localStorage.setItem("nightMode", "enabled");
  } else {
    if (icon) icon.className = "bi bi-moon-fill";
    localStorage.setItem("nightMode", "disabled");
  }
}

function loadNightModePreference() {
  const savedMode = localStorage.getItem("nightMode");
  const icon =
    document.querySelector("#themeIcon") ||
    document.querySelector('[id$="NightModeToggle"] i') ||
    document.querySelector(".btn-toggle i");
  if (savedMode === "enabled") {
    document.body.classList.add("dark-mode");
    if (icon) icon.className = "bi bi-sun-fill";
  } else {
    document.body.classList.remove("dark-mode");
    if (icon) icon.className = "bi bi-moon-fill";
  }
}

function setupNightModeToggle() {
  const toggleBtn = document.querySelector('[id$="NightModeToggle" i]');
  if (!toggleBtn) return;
  toggleBtn.removeEventListener("click", toggleNightMode);
  toggleBtn.addEventListener("click", toggleNightMode);
}

// ============================================================
// 5. LOGIN
// ============================================================
function handleLogin() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  const errorElement = document.getElementById("loginError");
  const errorMessage = document.getElementById("errorMessage");
  errorElement.classList.remove("show");
  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password.";
    errorElement.classList.add("show");
    return;
  }
  const result = loginUser(email, password);
  if (result.success) {
    localStorage.removeItem("redirectAfterLogin");
    window.location.href = "index.html";
  } else {
    errorMessage.textContent = result.error;
    errorElement.classList.add("show");
    document.getElementById("passwordInput").value = "";
    document.getElementById("passwordInput").focus();
  }
}

// ============================================================
// 6. INIT
// ============================================================
if (window.location.pathname.includes("login.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    redirectIfLoggedIn();
    document.getElementById("loginBtn").addEventListener("click", handleLogin);
    document
      .getElementById("passwordInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    document.getElementById("emailInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  });
} else {
  document.addEventListener("DOMContentLoaded", function () {
    requireAuth();
    updateUserUI();
    setupLogout();
    loadNightModePreference();
    setupNightModeToggle();
    // Delay badge refresh to ensure page generators are registered
  });
}

window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.requireAuth = requireAuth;
window.redirectIfLoggedIn = redirectIfLoggedIn;
window.updateUserUI = updateUserUI;
window.setupLogout = setupLogout;
window.toggleNightMode = toggleNightMode;
window.loadNightModePreference = loadNightModePreference;
window.setupNightModeToggle = setupNightModeToggle;
window.handleLogin = handleLogin;

console.log("🔐 Authentication loaded with centralized notifications");
