// Authentication system - uses backend API only
const API_URL = 'http://localhost:3000';

function isLoggedIn() {
    const token = localStorage.getItem('token');
    return token !== null;
}

function getCurrentUser() {
    const userData = localStorage.getItem('authUser');
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
    return fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            username: email, 
            password: password 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('authUser', JSON.stringify(data.data.user));
            return { success: true, user: data.data.user };
        } else {
            return { success: false, error: data.error };
        }
    })
    .catch(() => {
        return { success: false, error: 'Server not responding. Is it running?' };
    });
}

function logoutUser() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (window.location.pathname.includes('login.html')) return;
    if (!isLoggedIn()) {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
    }
}

function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        const redirect = localStorage.getItem('redirectAfterLogin') || 'index.html';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirect;
    }
}

function updateUserUI() {
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-role').forEach(el => el.textContent = user.role + ' · ModernTech');
    const initials = user.name.split(' ').map(word => word[0]).join('');
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', logoutUser);
        logoutBtn.addEventListener('click', logoutUser);
    }
}

function toggleNightMode() {
    const body = document.body;
    const icon = document.querySelector('#themeIcon') || document.querySelector('[id$="NightModeToggle"] i') || document.querySelector('.btn-toggle i');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        if (icon) icon.className = 'bi bi-sun-fill';
        localStorage.setItem('nightMode', 'enabled');
    } else {
        if (icon) icon.className = 'bi bi-moon-fill';
        localStorage.setItem('nightMode', 'disabled');
    }
}

function loadNightModePreference() {
    const savedMode = localStorage.getItem('nightMode');
    const icon = document.querySelector('#themeIcon') || document.querySelector('[id$="NightModeToggle"] i') || document.querySelector('.btn-toggle i');
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (icon) icon.className = 'bi bi-sun-fill';
    } else {
        document.body.classList.remove('dark-mode');
        if (icon) icon.className = 'bi bi-moon-fill';
    }
}

function setupNightModeToggle() {
    const toggleBtn = document.querySelector('[id$="NightModeToggle" i]');
    if (!toggleBtn) return;
    toggleBtn.removeEventListener('click', toggleNightMode);
    toggleBtn.addEventListener('click', toggleNightMode);
}

function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorElement = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    errorElement.classList.remove('show');
    
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        errorElement.classList.add('show');
        return;
    }
    
    const result = loginUser(email, password);
    if (result.success) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = 'index.html';
    } else {
        errorMessage.textContent = result.error;
        errorElement.classList.add('show');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

// INIT
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        redirectIfLoggedIn();
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('passwordInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        document.getElementById('emailInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
} else {
    document.addEventListener('DOMContentLoaded', function () {
        requireAuth();
        updateUserUI();
        setupLogout();
        loadNightModePreference();
        setupNightModeToggle();
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

console.log('🔐 Authentication loaded with API');