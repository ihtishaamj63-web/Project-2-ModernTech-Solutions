// Dashboard module - uses API only
// API_URL is defined in auth.js

document.addEventListener("DOMContentLoaded", function () {
    initDashboard();
});

async function getDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}

function showToast(message, type) {
    if (window.ModernTechUtils && typeof window.ModernTechUtils.showToast === 'function') {
        window.ModernTechUtils.showToast(message, type);
        return;
    }
    alert(message);
}

async function initDashboard() {
    const currentUser = getCurrentUser();
    const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");

    try {
        const greetingEl = document.getElementById("dashGreeting");
        const subEl = document.getElementById("dashHeroSub");
        const empBtn = document.getElementById("heroEmployeesBtn");
        const payBtn = document.getElementById("heroPayrollBtn");

        if (greetingEl && currentUser) {
            greetingEl.textContent = `Welcome back, ${currentUser.name}.`;
        }
        if (!isHR) {
            if (subEl) subEl.textContent = "View your personal dashboard.";
            if (empBtn) empBtn.style.display = "none";
            if (payBtn) payBtn.style.display = "none";
        } else {
            if (subEl) subEl.textContent = "Manage employee records, reviews and payroll.";
            if (empBtn) empBtn.style.display = "inline-block";
            if (payBtn) payBtn.style.display = "inline-block";
        }

        const stats = await getDashboardStats();

        if (stats) {
            document.getElementById("dashTotalEmployees").textContent = stats.total_employees || 0;
            document.getElementById("dashPayrollTotal").textContent = "R " + (stats.payroll_total || 0).toLocaleString("en-ZA");
            document.getElementById("dashAttRate").textContent = (stats.attendance_rate || 0) + "%";
            document.getElementById("dashPendingCount").textContent = stats.pending_timeoff || 0;
            document.getElementById("dashReviewCount").textContent = stats.total_reviews || 0;
        }

        const today = new Date();
        const dateEl = document.getElementById("dashTodayDate");
        if (dateEl) {
            dateEl.textContent = "Today: " + today.toLocaleDateString("en-ZA", {
                day: "numeric", month: "long", year: "numeric"
            });
        }

        renderWeeklyChart();

        console.log("✅ Dashboard initialized");
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load dashboard data', 'danger');
    }
}

function renderWeeklyChart() {
    const container = document.getElementById("homeWeeklyChart");
    if (!container) return;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const data = [8, 7, 9, 6, 8];

    container.innerHTML = `
        <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 150px; padding: 10px 0;">
            ${days.map((day, i) => `
                <div style="display: flex; flex-direction: column; align-items: center; width: 40px;">
                    <div style="height: ${data[i] * 15}px; width: 30px; background: #272757; border-radius: 4px 4px 0 0; min-height: 10px;"></div>
                    <span style="margin-top: 6px; font-size: 12px; color: var(--text-muted);">${day}</span>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 13px; color: var(--text-muted);">
            <span>This Week's Attendance</span>
        </div>
    `;
}