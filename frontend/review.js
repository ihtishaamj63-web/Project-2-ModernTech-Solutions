document.addEventListener("DOMContentLoaded", function () {
  window.ModernTech.ready(function () {
    initReviews();
  });
});

function initReviews() {
  const { employeeInfo } = window.ModernTech;
  const { showToast } = window.ModernTechUtils;

  const REVIEWS_STORAGE_KEY = "sharedReviews";

  const currentUser = getCurrentUser();
  const isHR =
    currentUser &&
    (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");

  // Set dynamic date
  const revPageDate = document.getElementById("revPageDate");
  if (revPageDate) {
    revPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function loadSavedReviews() {
    const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function saveReviews(reviews) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  }

  function getAllReviews() {
    const savedReviews = loadSavedReviews();
    if (savedReviews.length === 0) {
      const defaults = [
        {
          name: "Zanele Khumalo",
          department: "Marketing",
          reviewer: "Angelo Martin",
          date: "26-May-2026",
          rating: 4,
          comments:
            "Great performance in Q2 campaigns. Shows strong leadership and initiative.",
          initials: "ZK",
          color: "#10b981",
        },
        {
          name: "Sibongile Nkosi",
          department: "Development",
          reviewer: "Angelo Martin",
          date: "26-May-2026",
          rating: 4,
          comments:
            "Consistent code quality. Meets deadlines reliably. Good team player.",
          initials: "SN",
          color: "#3b82f6",
        },
        {
          name: "Karabo Dlamini",
          department: "Finance",
          reviewer: "Angelo Martin",
          date: "26-May-2026",
          rating: 4,
          comments:
            "Excellent attention to detail. Handles financial reporting accurately.",
          initials: "KD",
          color: "#8b5cf6",
        },
        {
          name: "Fatima Patel",
          department: "Support",
          reviewer: "Angelo Martin",
          date: "26-May-2026",
          rating: 4,
          comments:
            "Great customer satisfaction scores. Resolves tickets efficiently.",
          initials: "FP",
          color: "#f59e0b",
        },
      ];
      saveReviews(defaults);
      return defaults;
    }
    return savedReviews;
  }

  function getVisibleReviews() {
    const all = getAllReviews();
    if (isHR || !currentUser || !currentUser.name) return all;
    const currentName = String(currentUser.name).toLowerCase();
    return all.filter(
      (r) => r && r.name && String(r.name).toLowerCase() === currentName,
    );
  }

  function renderReviewsTable() {
    const reviews = getVisibleReviews();
    const tbody = document.getElementById("reviewsTableBody");
    if (!tbody) return;

    const headerRow = document
      .querySelector("#reviewsTableBody")
      .closest("table")
      .querySelector("thead tr");
    if (headerRow) {
      if (isHR) {
        headerRow.innerHTML = `<th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th><th>Actions</th>`;
      } else {
        headerRow.innerHTML = `<th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th>`;
      }
    }

    tbody.innerHTML = reviews
      .map((review) => {
        const actionCell = isHR
          ? `<td><button class="btn btn-sm" style="background: #dc3545; color: white; border: none;" onclick="deleteReviewByIndex(${reviews.indexOf(review)})">Delete</button></td>`
          : "";
        return `<tr>
        <td><div class="att-employee-cell"><div class="att-employee-avatar" style="background: ${review.color || "#272757"}">${
          review.initials ||
          review.name
            .split(" ")
            .map((w) => w[0])
            .join("")
        }</div><span class="att-employee-name">${review.name}</span></div></td>
        <td>${review.department}</td><td>${review.reviewer}</td><td>${review.date}</td><td>${"⭐".repeat(review.rating)}</td><td>${review.comments}</td>${actionCell}</tr>`;
      })
      .join("");
  }

  const searchContainer = document.querySelector(".rev-search");
  if (searchContainer) {
    const searchInput = searchContainer.querySelector("#search");
    if (!isHR) {
      // Remove the whole search container for non-HR users to hide input and button
      searchContainer.remove();
    } else if (searchInput) {
      searchInput.addEventListener("keyup", function () {
        const filter = searchInput.value.toLowerCase();
        document.querySelectorAll("#reviewsTableBody tr").forEach((row) => {
          const nameEl = row.querySelector(".att-employee-name");
          if (nameEl)
            row.style.display = nameEl.textContent
              .toLowerCase()
              .includes(filter)
              ? ""
              : "none";
        });
      });
    }
  }

  function loadEmployees() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select employee...</option>';
    const liveEmployees = JSON.parse(
      localStorage.getItem("moderntech_employees_v1") || "[]",
    );
    const allEmployees =
      liveEmployees.length > 0 ? liveEmployees : employeeInfo;
    allEmployees.forEach((emp) => {
      const option = document.createElement("option");
      option.value = emp.employeeId;
      option.textContent = `${emp.name} (${emp.department})`;
      select.appendChild(option);
    });
  }

  const addBtn = document.getElementById("revAddBtn");
  if (addBtn) {
    if (!isHR) {
      addBtn.style.display = "none";
    } else {
      addBtn.addEventListener("click", function () {
        loadEmployees();
        new bootstrap.Modal(document.getElementById("reviewModal")).show();
      });
    }
  }

  const saveBtn = document.getElementById("saveReviewBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      if (!isHR) {
        showToast("Only HR staff can add reviews.", "danger");
        return;
      }
      const empSelect = document.getElementById("employeeSelect");
      const rating = document.getElementById("rating").value;
      const comments = document.getElementById("comments").value;
      if (!empSelect.value) {
        showToast("Please select an employee.", "danger");
        return;
      }
      if (!comments) {
        showToast("Please write a comment.", "danger");
        return;
      }

      const liveEmployees = JSON.parse(
        localStorage.getItem("moderntech_employees_v1") || "[]",
      );
      const allEmployees =
        liveEmployees.length > 0 ? liveEmployees : employeeInfo;
      const employee = allEmployees.find(
        (e) => e.employeeId == empSelect.value,
      );
      if (!employee) return;

      const today = new Date();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = `${String(today.getDate()).padStart(2, "0")}-${months[today.getMonth()]}-${today.getFullYear()}`;
      const initials = employee.name
        .split(" ")
        .map((w) => w[0])
        .join("");
      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#ec4899",
      ];

      const reviews = getAllReviews();
      reviews.push({
        name: employee.name,
        department: employee.department,
        reviewer: "Angelo Martin",
        date,
        rating: parseInt(rating),
        comments,
        initials,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      saveReviews(reviews);
      renderReviewsTable();
      bootstrap.Modal.getInstance(
        document.getElementById("reviewModal"),
      ).hide();
      document.getElementById("comments").value = "";
      showToast("Review added successfully!", "success");
    });
  }

  window.deleteReviewByIndex = function (index) {
    if (!isHR) {
      showToast("Only HR staff can delete reviews.", "danger");
      return;
    }
    if (confirm("Are you sure you want to delete this review?")) {
      const reviews = getAllReviews();
      reviews.splice(index, 1);
      saveReviews(reviews);
      renderReviewsTable();
      showToast("Review deleted.", "success");
    }
  };

  window.deleteReview = function (button) {
    if (!isHR) {
      showToast("Only HR staff can delete reviews.", "danger");
      return;
    }
    const row = button.closest("tr");
    window.deleteReviewByIndex(
      Array.from(document.getElementById("reviewsTableBody").children).indexOf(
        row,
      ),
    );
  };

  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      generatePDF();
    });
  }

  function generatePDF() {
    const reviews = getVisibleReviews();
    if (reviews.length === 0) {
      showToast("No reviews to download.", "danger");
      return;
    }
    let tableRows = "";
    reviews.forEach((review) => {
      tableRows += `<tr><td>${review.name}</td><td>${review.department}</td><td>${review.reviewer}</td><td>${review.date}</td><td>${"⭐".repeat(review.rating)}</td><td>${review.comments}</td></tr>`;
    });
    const today = new Date().toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const pdfContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>ModernTech Solutions - Performance Reviews</title><style>@page{size:A4 landscape;margin:15mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a2e;line-height:1.4}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #272757}.header h1{color:#272757;font-size:22px;margin-bottom:5px}.header p{color:#5a5a7a;font-size:13px}.meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px;color:#8686ac}table{width:100%;border-collapse:collapse;margin-bottom:20px;table-layout:fixed}thead th{background:#272757;color:white;padding:10px 8px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase}thead th:nth-child(1){width:15%}thead th:nth-child(2){width:12%}thead th:nth-child(3){width:12%}thead th:nth-child(4){width:13%}thead th:nth-child(5){width:13%}thead th:nth-child(6){width:35%}tbody td{padding:10px 8px;border-bottom:1px solid #ddd;word-wrap:break-word;vertical-align:top}tbody tr:nth-child(even){background:#f8f9fc}.footer{text-align:center;font-size:11px;color:#8686ac;margin-top:30px;padding-top:10px;border-top:1px solid #d8dce6}.footer span{color:#272757;font-weight:600}</style></head><body><div class="header"><h1>ModernTech Solutions</h1><p>Employee Performance Reviews Report</p></div><div class="meta"><div>Generated: ${today}</div><div>Total Reviews: ${reviews.length}</div></div><table><thead><tr><th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th></tr></thead><tbody>${tableRows}</tbody></table><div class="footer"><p><span>ModernTech Solutions</span> | HR Department | Confidential</p><p>Generated on ${today}</p></div></body></html>`;
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    showToast("PDF generated! Save from the print dialog.", "success");
  }

  renderReviewsTable();
  console.log(
    `✅ Reviews module initialized (${isHR ? "HR Admin" : "Employee"} view)`,
  );
}
