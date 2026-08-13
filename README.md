ModernTech Solutions – HR Management System

📋 Overview:

The ModernTech Solutions HR Management System is a front-end web application that centralizes human resource management. It replaces disconnected spreadsheets, email chains, and Word documents with a single platform for managing employees, tracking attendance, processing payroll, handling leave requests, and storing performance reviews. The system uses dummy data to simulate full functionality and demonstrates role-based access, distinguishing between HR administrators and regular employees.

✨ Features:

🔐 Login System:

Mock authentication with hardcoded credentials

Role-based access: HR sees full system, employees see only their own data

Demo credentials displayed on the login page

📊 Dashboard:

Company-wide statistics: total employees, attendance rate, pending leave requests, completed reviews, payroll summary

Attendance trend chart and payroll breakdown chart

Recent time off requests and performance reviews side by side

All stat cards link directly to their respective pages

Employee view shows personalized stats only

👥 Employee Management:

Centralized directory with search and department filters

Add new employees with smart forms: department-specific positions and salary ranges

Edit and delete existing employees

Employee view hides salary, contact information, employee ID, and action buttons

🏖️ Time Off Management:

Employees submit leave requests for themselves only

HR approves or denies requests with Approve, Deny, Cancel, and Reverse actions

Date validation prevents past dates, limits 30 days per request and 60 days per year

Expired pending requests are auto-denied

Confirmation modals replace browser popups for all actions

Employee view shows only their own requests

📅 Attendance Tracking:

Visual stacked bar chart: green for present, red for absent, orange for leave

Summary cards show present, absent, on leave counts and attendance rate

One-click attendance logging for HR

Full weekly history view with day-by-day breakdown

Leave approvals automatically update attendance records

Excel export with three sheets: Summary, Detailed Attendance, Leave Requests

Employee view shows only their own record

💰 Payroll Management:

Automated calculations: PAYE (18%), UIF (1%), Medical Aid (22%), Pension (7.5%)

Digital payslips with full breakdown for each employee

Excel export of payroll register

PDF payslip download for individual employees

Employee view shows only their own payslip

⭐ Performance Reviews:

Centralized, searchable review database

Add reviews with employee selector and star ratings

Delete outdated reviews

PDF download for reporting

Employee view is read-only with no add or delete buttons

🔧 Shared Features:

Night mode toggle across all pages

Dynamic date display with calendar icon

Toast notifications for user feedback

Responsive design for desktop, tablet, and mobile

Data persistence using browser localStorage

Changes on one page reflect across all connected pages

🚀 How to Launch:

🌐 Live Demo (GitHub Pages)
Access the hosted application directly at your GitHub Pages URL — no local setup required.

💻 Running Locally
If running from your local machine, a local server is required because browsers block JSON file loading from file:// paths.

Option 1: Using Python
bash
cd Project-1-ModernTech-Solutions
python -m http.server 8000
Open http://localhost:8000/login.html in your browser.

Option 2: Using Node.js
bash
cd Project-1-ModernTech-Solutions
npx serve .
Open the URL shown in the terminal.

Option 3: Using VS Code Live Server

Install the Live Server extension
Right-click login.html and select "Open with Live Server"

🔑 Login Credentials:

HR Manager: lungile.moyo@moderntech.com / hrpass123

HR Admin: hr@moderntech.com / hrpass

Employee: sibongile.nkosi@moderntech.com / password123

🧭 Navigating the Application:

After logging in, use the navigation bar at the top of each page to move between sections:

Dashboard — Overview of all HR metrics

Employees — View, search, filter, add, edit, and delete employee records

Payroll — View payslips and export payroll data

Time Off — Submit and manage leave requests

Attendance — Log and track employee attendance

Review — Manage performance reviews

The user profile in the navigation bar shows the logged-in user's name and role. The moon icon toggles between light and dark mode. The logout button returns to the login page.

➕ Adding an Employee
To add a new employee, navigate to the Employees page and click the "Add Employee" button. The form uses smart dropdowns that adapt based on your selections:

Select a department first — this determines which positions and salary ranges become available. For example, choosing "Engineering" will show roles like Junior Developer, Senior Developer, and Tech Lead, while "Marketing" will show roles like Marketing Coordinator and Brand Manager.

Choose a position — once a department is selected, the position dropdown updates automatically with relevant roles. Each position is tied to a predefined salary range to ensure consistency.

Fill in the remaining details — enter the employee's personal information, contact details, and other required fields. The employee ID is auto-generated by the system.

Submit the form — the new employee will appear immediately in the directory and become available across all other pages (Payroll, Time Off, Attendance, Reviews).

Edit or delete — use the action buttons next to any employee in the directory to update their information or remove them from the system.

🛠️ Technologies Used/Tech-stack:

HTML5
CSS3
Bootstrap 5
Vanilla JavaScript
Chart.js
SheetJS (xlsx)
JSON and localStorage
GitHub Pages

📁 Project Structure:

text
Project-1-ModernTech-Solutions
├── login.html
├── home.html
├── employees.html
├── add-employee.html
├── payroll.html
├── timeoff.html
├── attendance.html
├── reviews.html
├── shared.css
├── data.js
├── auth.js
├── utils.js
├── dashboard.js
├── employeescript.js
├── payroll.js
├── timeoff.js
├── attendance.js
├── review.js
├── data.json
├── employee_info.json
└── payroll.json

👨‍💻 Team Roles:

Ihtishaam Johnson — Login system, Time Off page, Attendance page, dynamic data flow between all pages

Owam Gobińca — Dashboard page, Reviews page

Zahraa Moerat — Figma design, Employees page, Add-Employee page

Migcobo Macilikishe — Payroll page and pay slips

All team members contributed to the shared styling.

🔄 Data Flow:

The system uses shared localStorage keys so pages communicate with each other. Adding an employee on the Employees page makes them available on the Time Off, Attendance, and Payroll pages. Approving a leave request on the Time Off page automatically updates the Attendance page. The Dashboard reflects live changes from every section.
