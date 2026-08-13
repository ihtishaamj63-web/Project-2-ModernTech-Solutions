document.addEventListener("DOMContentLoaded", function () {
  Promise.all([
    fetch("data.json").then((r) => r.json()),
    fetch("payroll.json").then((r) => r.json()),
  ])
    .then(([appData, payrollJson]) => {
      window.ModernTech = window.ModernTech || {};
      const liveEmployees = JSON.parse(
        localStorage.getItem("moderntech_employees_v1") || "[]",
      );
      window.ModernTech.employeeInfo =
        liveEmployees.length > 0 ? liveEmployees : appData.employeeInfo;
      window.ModernTech.payrollData = payrollJson.payrollData;
      window.ModernTech._ready = true;
      initPayroll();
    })
    .catch((error) => {
      console.error("Failed to load data:", error);
      const container = document.querySelector(".pay-container");
      if (container) {
        container.innerHTML = `<div class="text-center py-5"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i><h3 class="mt-3 text-danger">Data Load Error</h3><p class="text-muted">Failed to load payroll data.</p></div>`;
      }
    });
});

function initPayroll() {
  const { employeeInfo, payrollData } = window.ModernTech;
  const { getInitials, getDepartmentColor, showToast } = window.ModernTechUtils;

  const currentUser = getCurrentUser();
  const isHR =
    currentUser &&
    (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");
  const userEmployeeId = currentUser ? currentUser.employeeId : null;

  const visibleEmployees = isHR
    ? employeeInfo
    : employeeInfo.filter((e) => e.employeeId === userEmployeeId);

  const payroll = visibleEmployees.map((emp) => {
    const existingPayroll = payrollData.find(
      (p) => p.employeeId === emp.employeeId,
    );
    if (existingPayroll) {
      const chargeableHours = Math.max(
        1,
        existingPayroll.hoursWorked - existingPayroll.leaveDeductions,
      );
      const hourlyRate = Math.round(
        existingPayroll.finalSalary / chargeableHours,
      );
      const gross = hourlyRate * existingPayroll.hoursWorked;
      const paye = Math.round(gross * 0.18);
      const uif = Math.round(gross * 0.01);
      const medical = Math.round(gross * 0.22);
      const pension = Math.round(gross * 0.075);
      const deductions = paye + uif + medical + pension;
      const net = gross - deductions;
      return {
        ...emp,
        id: "MT-" + String(emp.employeeId).padStart(3, "0"),
        hoursWorked: existingPayroll.hoursWorked,
        leaveDeductions: existingPayroll.leaveDeductions,
        finalSalary: existingPayroll.finalSalary,
        hourlyRate,
        gross,
        deductions,
        net,
        paye,
        uif,
        medical,
        pension,
        color: getDepartmentColor(emp.department),
      };
    } else {
      const salary = emp.salary || 50000;
      const hoursWorked = 0;
      const leaveDeductions = 0;
      const chargeableHours = Math.max(1, hoursWorked - leaveDeductions);
      const hourlyRate =
        hoursWorked > 0 ? Math.round(salary / chargeableHours) : 0;
      const gross = hourlyRate * hoursWorked;
      const paye = Math.round(gross * 0.18);
      const uif = Math.round(gross * 0.01);
      const medical = Math.round(gross * 0.22);
      const pension = Math.round(gross * 0.075);
      const deductions = paye + uif + medical + pension;
      const net = gross - deductions;
      return {
        ...emp,
        id: "MT-" + String(emp.employeeId).padStart(3, "0"),
        hoursWorked,
        leaveDeductions,
        finalSalary: salary,
        hourlyRate,
        gross,
        deductions,
        net,
        paye,
        uif,
        medical,
        pension,
        color: getDepartmentColor(emp.department),
      };
    }
  });

  let query = "";

  function fmt(n) {
    return "R " + n.toLocaleString("en-ZA");
  }

  function renderTable() {
    const tbody = document.getElementById("payBody");
    if (!tbody) return;
    const q = query.trim().toLowerCase();

    const filtered = payroll.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );

    tbody.innerHTML = filtered.length
      ? filtered
          .map(
            (p) => `
        <tr onclick="openPayslip(${p.employeeId})" style="cursor:pointer;">
          <td>
            <div class="pay-slip-emp" style="margin:0;padding:0;border:none;">
              <div class="pay-slip-avatar" style="background:${p.color}">${getInitials(p.name)}</div>
              <div>
                <div class="pay-emp-name">${p.name}</div>
                <div class="pay-emp-id">${p.id} · ${p.position}</div>
                <span class="pay-dept-tag">${p.department}</span>
              </div>
            </div>
          </td>
          <td>${p.hoursWorked}h ${p.leaveDeductions ? `<span style="color:var(--text-muted)">(-${p.leaveDeductions}h leave)</span>` : ""}</td>
          <td>${fmt(p.hourlyRate)}</td>
          <td>${fmt(p.gross)}</td>
          <td>- ${fmt(p.deductions)}</td>
          <td class="pay-net-cell">${fmt(p.net)}</td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);cursor:default;padding:20px;">No payslips found.</td></tr>`;

    const footer = document.getElementById("tableFooter");
    if (footer)
      footer.textContent = `Showing ${filtered.length} of ${payroll.length} payslips`;

    document.getElementById("totalGross").textContent = fmt(
      payroll.reduce((s, p) => s + p.gross, 0),
    );
    document.getElementById("totalCount").textContent = payroll.length;

    const subtitle = document.querySelector(".pay-card-sub");
    if (subtitle)
      subtitle.textContent = isHR
        ? "Click a row to preview the digital payslip"
        : "Your payslip - click to view details";
  }

  window.openPayslip = function (employeeId) {
    const p = payroll.find((x) => x.employeeId === employeeId);
    if (!p) return;
    const modal = document.getElementById("payslipModal");
    const body = document.getElementById("payslipBody");
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="pay-slip-emp"><div class="pay-slip-avatar" style="background:${p.color}">${getInitials(p.name)}</div>
        <div><div style="font-weight:700;color:var(--text-dark)">${p.name}</div><div style="font-size:12px;color:var(--text-muted)">${p.position} · ${p.id} · ${p.department}</div><div style="font-size:12px;color:var(--text-muted)">${p.contact || ""}</div></div></div>
      <div class="pay-row"><span>Hours worked</span><span>${p.hoursWorked}h</span></div>
      <div class="pay-row"><span>Leave deductions</span><span>${p.leaveDeductions}h</span></div>
      <div class="pay-row"><span>Hourly rate</span><span>${fmt(p.hourlyRate)}</span></div>
      <div class="pay-row pay-row-calc"><span>Calc: ${fmt(p.finalSalary)} / (${p.hoursWorked} − ${p.leaveDeductions})</span><span></span></div>
      <div class="pay-row"><span>Gross pay</span><span>${fmt(p.gross)}</span></div>
      <div class="pay-row"><span>PAYE (18%)</span><span>- ${fmt(p.paye)}</span></div>
      <div class="pay-row"><span>UIF (1%)</span><span>- ${fmt(p.uif)}</span></div>
      <div class="pay-row"><span>Medical aid (22%)</span><span>- ${fmt(p.medical)}</span></div>
      <div class="pay-row"><span>Pension (7.5%)</span><span>- ${fmt(p.pension)}</span></div>
      <div class="pay-net-bar"><div><div style="font-size:12px;opacity:.8">Net pay</div><div style="font-size:20px;font-weight:700">${fmt(p.net)}</div></div>
        <button class="btn btn-sm" style="background:#fff;color:#0f6e6e;border:none;" onclick="event.stopPropagation();exportPayslipPDF(${p.employeeId})"><i class="bi bi-download me-1"></i> PDF</button></div>`;
    modal.classList.add("open");
    modal.onclick = (e) => {
      if (e.target === modal) closePayslip();
    };
  };

  window.closePayslip = function () {
    document.getElementById("payslipModal")?.classList.remove("open");
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePayslip();
  });

  window.exportCSV = function () {
    if (!isHR) {
      showToast("Only HR staff can export payroll data.", "danger");
      return;
    }
    const rows = payroll.map((p) => ({
      Employee: p.name,
      ID: p.id,
      Position: p.position,
      Department: p.department,
      "Hours Worked": p.hoursWorked,
      "Leave Deductions": p.leaveDeductions,
      "Hourly Rate": p.hourlyRate,
      "Gross Pay": p.gross,
      Deductions: p.deductions,
      "Net Pay": p.net,
    }));
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(rows);
    Object.keys(rows[0]).forEach((key, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws1[cellRef])
        ws1[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "272757" } },
        };
    });
    ws1["!cols"] = Object.keys(rows[0]).map((h) => ({
      wch:
        h === "Employee" || h === "Position"
          ? 22
          : h === "Department"
            ? 16
            : 14,
    }));
    XLSX.utils.book_append_sheet(wb, ws1, "Payslip Register");
    XLSX.writeFile(
      wb,
      `payroll_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    showToast(`Excel report exported.`, "success");
  };

  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    query = e.target.value;
    renderTable();
  });

  const payPageDate = document.getElementById("payPageDate");
  if (payPageDate)
    payPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  renderTable();
  console.log(
    `✅ Payroll module initialized (${isHR ? "HR Admin" : "Employee"} view)`,
  );
}