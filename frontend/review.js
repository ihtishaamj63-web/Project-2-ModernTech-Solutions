// Reviews module - uses API only
const API_URL = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", function () {
    initReviews();
});

async function loadReviewsFromAPI() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error loading reviews:', error);
        return [];
    }
}

async function addReviewToAPI(reviewData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to add review');
        }
        return data.data;
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
}

async function deleteReviewFromAPI(reviewId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete review');
        }
        return data;
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}

function showToast(message, type) {
    if (window.ModernTechUtils && window.ModernTechUtils.showToast) {
        window.ModernTechUtils.showToast(message, type);
        return;
    }
    alert(message);
}

async function initReviews() {
    try {
        const currentUser = getCurrentUser();
        const isHR = currentUser && (currentUser.role === "HR Manager" || currentUser.role === "HR Admin");

        const revPageDate = document.getElementById("revPageDate");
        if (revPageDate) {
            revPageDate.textContent = new Date().toLocaleDateString("en-ZA", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
        }

        // Load reviews from API
        const apiReviews = await loadReviewsFromAPI();
        
        let reviews = [];
        if (apiReviews && apiReviews.length > 0) {
            reviews = apiReviews.map(r => ({
                review_id: r.review_id,
                name: r.first_name + ' ' + r.last_name,
                department: r.department || 'Unknown',
                reviewer: r.reviewer_name || 'HR Staff',
                date: new Date(r.review_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
                rating: ['poor', 'below_average', 'average', 'good', 'excellent'].indexOf(r.rating) + 1 || 3,
                comments: r.comments || 'No comments',
                initials: (r.first_name?.[0] || '') + (r.last_name?.[0] || ''),
                color: '#272757'
            }));
        }

        // Filter for employee view
        let visibleReviews = reviews;
        if (!isHR && currentUser && currentUser.name) {
            const currentName = String(currentUser.name).toLowerCase();
            visibleReviews = reviews.filter(r => r && r.name && String(r.name).toLowerCase() === currentName);
        }

        const tbody = document.getElementById("reviewsTableBody");
        if (!tbody) return;

        // Update table header
        const headerRow = tbody.closest("table").querySelector("thead tr");
        if (headerRow) {
            if (isHR) {
                headerRow.innerHTML = `<th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th><th>Actions</th>`;
            } else {
                headerRow.innerHTML = `<th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th>`;
            }
        }

        // Render table
        tbody.innerHTML = visibleReviews.map((review) => {
            const actionCell = isHR ? `<td><button class="btn btn-sm" style="background: #dc3545; color: white; border: none;" onclick="deleteReviewByIndex(${review.review_id})">Delete</button></td>` : "";
            return `<tr>
                <td><div class="att-employee-cell"><div class="att-employee-avatar" style="background: ${review.color || '#272757'}">${review.initials}</div><span class="att-employee-name">${review.name}</span></div></td>
                <td>${review.department}</td><td>${review.reviewer}</td><td>${review.date}</td>
                <td>${"⭐".repeat(review.rating)}</td>
                <td>${review.comments}</td>
                ${actionCell}
            </tr>`;
        }).join("");

        // Remove search for non-HR
        const searchContainer = document.querySelector(".rev-search");
        if (searchContainer && !isHR) {
            searchContainer.remove();
        }

        // Add button
        const addBtn = document.getElementById("revAddBtn");
        if (addBtn) {
            if (!isHR) {
                addBtn.style.display = "none";
            } else {
                addBtn.addEventListener("click", function () {
                    loadEmployeesForDropdown();
                    new bootstrap.Modal(document.getElementById("reviewModal")).show();
                });
            }
        }

        // Save button
        const saveBtn = document.getElementById("saveReviewBtn");
        if (saveBtn) {
            saveBtn.addEventListener("click", async function () {
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

                try {
                    const reviewData = {
                        emp_id: parseInt(empSelect.value),
                        reviewer_id: currentUser ? currentUser.user_id : 2,
                        review_date: new Date().toISOString().split('T')[0],
                        review_period_start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
                        review_period_end: new Date().toISOString().split('T')[0],
                        rating: ['poor', 'below_average', 'average', 'good', 'excellent'][parseInt(rating) - 1] || 'good',
                        performance_score: parseInt(rating),
                        comments: comments,
                        status: 'submitted'
                    };

                    const result = await addReviewToAPI(reviewData);
                    if (result) {
                        showToast("Review added successfully!", "success");
                        setTimeout(() => location.reload(), 1000);
                    }
                } catch (error) {
                    showToast("Error adding review", "danger");
                }
            });
        }

        // Delete function
        window.deleteReviewByIndex = async function (reviewId) {
            if (!isHR) {
                showToast("Only HR staff can delete reviews.", "danger");
                return;
            }
            if (confirm("Are you sure you want to delete this review?")) {
                try {
                    await deleteReviewFromAPI(reviewId);
                    showToast("Review deleted.", "success");
                    setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    showToast("Error deleting review", "danger");
                }
            }
        };

        // Download PDF
        const downloadBtn = document.getElementById("downloadPdfBtn");
        if (downloadBtn) {
            downloadBtn.addEventListener("click", function () {
                generatePDF(visibleReviews);
            });
        }

        console.log(`✅ Reviews module initialized (${isHR ? "HR Admin" : "Employee"} view)`);
    } catch (error) {
        console.error('Error initializing reviews:', error);
    }
}

function generatePDF(reviews) {
    if (!reviews || reviews.length === 0) {
        alert("No reviews to download.");
        return;
    }
    let tableRows = "";
    reviews.forEach((review) => {
        tableRows += `<tr><td>${review.name}</td><td>${review.department}</td><td>${review.reviewer}</td><td>${review.date}</td><td>${"⭐".repeat(review.rating)}</td><td>${review.comments}</td></tr>`;
    });
    const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const pdfContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>ModernTech Solutions - Performance Reviews</title><style>@page{size:A4 landscape;margin:15mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a2e;line-height:1.4}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #272757}.header h1{color:#272757;font-size:22px;margin-bottom:5px}.header p{color:#5a5a7a;font-size:13px}.meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px;color:#8686ac}table{width:100%;border-collapse:collapse;margin-bottom:20px;table-layout:fixed}thead th{background:#272757;color:white;padding:10px 8px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase}thead th:nth-child(1){width:15%}thead th:nth-child(2){width:12%}thead th:nth-child(3){width:12%}thead th:nth-child(4){width:13%}thead th:nth-child(5){width:13%}thead th:nth-child(6){width:35%}tbody td{padding:10px 8px;border-bottom:1px solid #ddd;word-wrap:break-word;vertical-align:top}tbody tr:nth-child(even){background:#f8f9fc}.footer{text-align:center;font-size:11px;color:#8686ac;margin-top:30px;padding-top:10px;border-top:1px solid #d8dce6}.footer span{color:#272757;font-weight:600}</style></head><body><div class="header"><h1>ModernTech Solutions</h1><p>Employee Performance Reviews Report</p></div><div class="meta"><div>Generated: ${today}</div><div>Total Reviews: ${reviews.length}</div></div><table><thead><tr><th>Employee</th><th>Department</th><th>Reviewer</th><th>Date</th><th>Rating</th><th>Comments</th></tr></thead><tbody>${tableRows}</tbody></table><div class="footer"><p><span>ModernTech Solutions</span> | HR Department | Confidential</p><p>Generated on ${today}</p></div></body></html>`;
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
}

function loadEmployeesForDropdown() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select employee...</option>';
    fetch('http://localhost:3000/api/employees', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            data.data.forEach(emp => {
                const option = document.createElement("option");
                option.value = emp.emp_id;
                option.textContent = `${emp.first_name} ${emp.last_name} (${emp.department})`;
                select.appendChild(option);
            });
        }
    })
    .catch(err => console.error('Error loading employees:', err));
}