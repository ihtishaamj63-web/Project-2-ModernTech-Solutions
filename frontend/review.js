document.addEventListener("DOMContentLoaded", function () {
  window.ModernTech.ready(function () {
    initReviews();
  });
});

function initReviews() {
  const { employeeInfo } = window.ModernTech;
  const { showToast } = window.ModernTechUtils;

  // ============================================================
  // API
  // ============================================================

  const API_URL = "http://localhost:3000/api/reviews";

  // ============================================================
  // CURRENT USER
  // ============================================================

  const currentUser = getCurrentUser();

  const isHR =
    currentUser &&
    (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");

  // ============================================================
  // PAGE DATE
  // ============================================================

  const revPageDate = document.getElementById("revPageDate");

  if (revPageDate) {
    revPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ============================================================
  // GET REVIEWS FROM DATABASE
  // ============================================================

  async function getReviews() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to fetch reviews",
        );
      }

      return result;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showToast("Failed to load reviews.", "danger");
      return [];
    }
  }

  // ============================================================
  // LOAD EMPLOYEES
  // ============================================================

  function loadEmployees() {
    const select = document.getElementById("employeeSelect");

    if (!select) {
      return;
    }

    select.innerHTML = '<option value="">Select employee...</option>';

    const liveEmployees = JSON.parse(
      localStorage.getItem("moderntech_employees_v1") || "[]",
    );

    const allEmployees =
      liveEmployees.length > 0 ? liveEmployees : employeeInfo;

    allEmployees.forEach(function (emp) {
      const option = document.createElement("option");

      /*
        Your employee objects may use employeeId.
        The database needs emp_id.
      */

      option.value = emp.employeeId || emp.emp_id || emp.id;
      option.textContent =
        emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim();

      select.appendChild(option);
    });
  }

  // ============================================================
  // GET EMPLOYEE NAME
  // ============================================================

  function getEmployeeName(review) {
    return review.employee_name || review.name || "Unknown Employee";
  }

  // ============================================================
  // GET REVIEWER NAME
  // ============================================================

  function getReviewerName(review) {
    return review.reviewer_name || review.reviewer || "Unknown Reviewer";
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ============================================================
  // RATING DISPLAY
  // ============================================================

  function displayRating(rating) {
    const ratingMap = {
      excellent: "⭐⭐⭐⭐⭐",
      good: "⭐⭐⭐⭐",
      average: "⭐⭐⭐",
      below_average: "⭐⭐",
      poor: "⭐",
    };

    return ratingMap[String(rating).toLowerCase()] || rating || "";
  }

  // ============================================================
  // RENDER REVIEWS TABLE
  // ============================================================

  async function renderReviewsTable() {
    const tbody = document.getElementById("reviewsTableBody");
    if (!tbody) return;

    const allReviews = await getReviews();
    let reviews = allReviews;

    // EMPLOYEE VIEW
    if (!isHR && currentUser && currentUser.name) {
      const currentName = String(currentUser.name).toLowerCase();
      reviews = allReviews.filter(function (review) {
        return String(getEmployeeName(review)).toLowerCase() === currentName;
      });
    }

    // TABLE HEADER
    const table = tbody.closest("table");
    if (table) {
      const headerRow = table.querySelector("thead tr");
      if (headerRow) {
        if (isHR) {
          headerRow.innerHTML = `
            <th>Employee</th>
            <th>Reviewer</th>
            <th>Date</th>
            <th>Rating</th>
            <th>Comments</th>
            <th>Actions</th>
          `;
        } else {
          headerRow.innerHTML = `
            <th>Employee</th>
            <th>Reviewer</th>
            <th>Date</th>
            <th>Rating</th>
            <th>Comments</th>
          `;
        }
      }
    }

    // NO REVIEWS
    if (reviews.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isHR ? 6 : 5}" class="text-center py-4">
            No reviews found.
          </td>
        </tr>
      `;
      return;
    }

    // DISPLAY REVIEWS
    tbody.innerHTML = reviews
      .map(function (review) {
        const employeeName = getEmployeeName(review);
        const reviewerName = getReviewerName(review);
        const date = formatDate(review.review_date || review.date);
        const rating = displayRating(review.rating);
        const comments = review.comments || "";

        let initials = employeeName
          .split(" ")
          .map(function (word) {
            return word.charAt(0);
          })
          .join("")
          .substring(0, 2)
          .toUpperCase();

        let actionCell = "";
        if (isHR) {
          actionCell = `
            <td>
              <button class="btn btn-sm" style="background: #dc3545; color: white; border: none;" onclick="deleteReview(${review.review_id})">
                Delete
              </button>
            </td>
          `;
        }

        return `
          <tr>
            <td>
              <div class="att-employee-cell">
                <div class="att-employee-avatar" style="background: #272757;">${initials}</div>
                <span class="att-employee-name">${employeeName}</span>
              </div>
            </td>
            <td>${reviewerName}</td>
            <td>${date}</td>
            <td>${rating}</td>
            <td>${comments}</td>
            ${actionCell}
          </tr>
        `;
      })
      .join("");
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const searchContainer = document.querySelector(".rev-search");
  if (searchContainer) {
    const searchInput = searchContainer.querySelector("#search");

    if (!isHR) {
      searchContainer.remove();
    } else if (searchInput) {
      searchInput.addEventListener("keyup", async function () {
        const filter = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll("#reviewsTableBody tr");

        rows.forEach(function (row) {
          const nameElement = row.querySelector(".att-employee-name");
          if (!nameElement) return;
          const name = nameElement.textContent.toLowerCase();
          row.style.display = name.includes(filter) ? "" : "none";
        });
      });
    }
  }

  // ============================================================
  // ADD REVIEW BUTTON
  // ============================================================

  const addBtn = document.getElementById("revAddBtn");
  if (addBtn) {
    if (!isHR) {
      addBtn.style.display = "none";
    } else {
      addBtn.addEventListener("click", function () {
        loadEmployees();
        const modalElement = document.getElementById("reviewModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
      });
    }
  }

  // ============================================================
  // SAVE REVIEW
  // ============================================================

  const saveBtn = document.getElementById("saveReviewBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      if (!isHR) {
        showToast("Only HR staff can add reviews.", "danger");
        return;
      }

      const reviewForm = document.getElementById("reviewForm");

      // Check required fields
      if (reviewForm && !reviewForm.checkValidity()) {
        reviewForm.reportValidity();
        return;
      }

      // FORM VALUES
      const employeeSelect = document.getElementById("employeeSelect");
      const rating = document.getElementById("rating").value;
      const performanceScore =
        document.getElementById("performanceScore").value;
      const strengths = document.getElementById("strengths").value;
      const areasForImprovement = document.getElementById(
        "areasForImprovement",
      ).value;
      const goalsForNextPeriod =
        document.getElementById("goalsForNextPeriod").value;
      const comments = document.getElementById("comments").value;

      // DATES
      const today = new Date();
      const reviewDate = today.toISOString().split("T")[0];
      const periodStartDate = new Date(today);
      periodStartDate.setMonth(periodStartDate.getMonth() - 3);
      const reviewPeriodStart = periodStartDate.toISOString().split("T")[0];

      // REVIEW DATA
      const reviewData = {
        emp_id: parseInt(employeeSelect.value),
        reviewer_id: 2,
        review_date: reviewDate,
        review_period_start: reviewPeriodStart,
        review_period_end: reviewDate,
        rating: rating,
        performance_score: parseFloat(performanceScore),
        strengths: strengths,
        areas_for_improvement: areasForImprovement,
        goals_for_next_period: goalsForNextPeriod,
        comments: comments,
        status: "submitted",
      };

      // DEBUG
      console.log("Sending review:", reviewData);

      // SEND TO BACKEND
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewData),
        });

        const result = await response.json();
        console.log("Server response:", result);

        if (!response.ok) {
          throw new Error(
            result.error || result.message || "Failed to create review",
          );
        }

        showToast("Review added successfully!", "success");

        // RESET FORM
        if (reviewForm) reviewForm.reset();

        // CLOSE MODAL
        const modalElement = document.getElementById("reviewModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        // RELOAD DATABASE REVIEWS
        await renderReviewsTable();
      } catch (error) {
        console.error("Error creating review:", error);
        showToast("Failed to create review.", "danger");
      }
    });
  }

  // ============================================================
  // DELETE REVIEW
  // ============================================================

  window.deleteReview = async function (reviewId) {
    if (!isHR) {
      showToast("Only HR staff can delete reviews.", "danger");
      return;
    }

    const confirmed = confirm("Are you sure you want to delete this review?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${reviewId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to delete review",
        );
      }

      showToast("Review deleted successfully.", "success");
      await renderReviewsTable();
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast("Failed to delete review.", "danger");
    }
  };

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", async function () {
      await generatePDF();
    });
  }

  async function generatePDF() {
    const allReviews = await getReviews();
    let reviews = allReviews;

    if (!isHR && currentUser && currentUser.name) {
      const currentName = String(currentUser.name).toLowerCase();
      reviews = allReviews.filter(function (review) {
        return String(getEmployeeName(review)).toLowerCase() === currentName;
      });
    }

    if (reviews.length === 0) {
      showToast("No reviews to download.", "danger");
      return;
    }

    let tableRows = "";
    reviews.forEach(function (review) {
      tableRows += `
        <tr>
          <td>${getEmployeeName(review)}</td>
          <td>${getReviewerName(review)}</td>
          <td>${formatDate(review.review_date || review.date)}</td>
          <td>${displayRating(review.rating)}</td>
          <td>${review.comments || ""}</td>
        </tr>
      `;
    });

    const today = new Date().toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>ModernTech Solutions - Performance Reviews</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; color: #1a1a2e; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #272757; }
          .header h1 { color: #272757; font-size: 22px; margin-bottom: 5px; }
          .header p { color: #5a5a7a; font-size: 13px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #8686ac; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
          thead th { background: #272757; color: white; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; }
          thead th:nth-child(1) { width: 20%; }
          thead th:nth-child(2) { width: 18%; }
          thead th:nth-child(3) { width: 15%; }
          thead th:nth-child(4) { width: 12%; }
          thead th:nth-child(5) { width: 35%; }
          tbody td { padding: 10px 8px; border-bottom: 1px solid #ddd; word-wrap: break-word; vertical-align: top; }
          tbody tr:nth-child(even) { background: #f8f9fc; }
          .footer { text-align: center; font-size: 11px; color: #8686ac; margin-top: 30px; padding-top: 10px; border-top: 1px solid #d8dce6; }
          .footer span { color: #272757; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ModernTech Solutions</h1>
          <p>Employee Performance Reviews Report</p>
        </div>
        <div class="meta">
          <div>Generated: ${today}</div>
          <div>Total Reviews: ${reviews.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Reviewer</th>
              <th>Date</th>
              <th>Rating</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <p><span>ModernTech Solutions</span> | HR Department | Confidential</p>
          <p>Generated on ${today}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      showToast("Please allow pop-ups to generate the PDF.", "danger");
      return;
    }

    printWindow.document.write(pdfContent);
    printWindow.document.close();

    setTimeout(function () {
      printWindow.print();
    }, 500);

    showToast("PDF generated! Save from the print dialog.", "success");
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  renderReviewsTable();

  console.log(
    `✅ Reviews module initialized (${isHR ? "HR Admin" : "Employee"} view)`,
  );
}
