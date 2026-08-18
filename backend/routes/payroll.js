// backend/routes/payroll.js
// Matches the employee_information / payroll / attendance_leave / reviews
// schema (payroll: employee_id, hours_worked, leave_deductions, final_salary).

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Shared calculation — used by both /payroll/calculate and
// /payslips/employee/:id, so the math only lives in one place.
function calculatePayslip({ hoursWorked, leaveDeductions, finalSalary }) {
  const chargeableHours = Math.max(1, hoursWorked - leaveDeductions);
  const hourlyRate = Math.round(finalSalary / chargeableHours);
  const gross = hourlyRate * hoursWorked;

  const paye = Math.round(gross * 0.18);
  const uif = Math.round(gross * 0.01);
  const medical = Math.round(gross * 0.22);
  const pension = Math.round(gross * 0.075);
  const deductions = paye + uif + medical + pension;
  const net = gross - deductions;

  return { hourlyRate, gross, paye, uif, medical, pension, deductions, net };
}

// GET /payroll -> all payroll records, joined with employee info, calculated
router.get('/payroll', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.employee_id, p.hours_worked, p.leave_deductions, p.final_salary,
           e.name, e.position, e.department, e.contact
    FROM payroll p
    INNER JOIN employee_information e ON p.employee_id = e.employee_id
  `);

  const payslips = rows.map((row) => {
    const calc = calculatePayslip({
      hoursWorked: row.hours_worked,
      leaveDeductions: row.leave_deductions,
      finalSalary: Number(row.final_salary),
    });
    return {
      employeeId: row.employee_id,
      name: row.name,
      position: row.position,
      department: row.department,
      contact: row.contact,
      hoursWorked: row.hours_worked,
      leaveDeductions: row.leave_deductions,
      finalSalary: Number(row.final_salary),
      ...calc,
    };
  });

  res.json(payslips);
});

// GET /payroll/:id -> one raw payroll record, by employee_id
router.get('/payroll/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM payroll WHERE employee_id = ?',
    [req.params.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Payroll record not found' });
  }
  res.json(rows[0]);
});

// POST /payroll -> create a new payroll config for an employee
router.post('/payroll', async (req, res) => {
  const { employee_id, hours_worked, leave_deductions, final_salary } = req.body;

  await pool.query(
    'INSERT INTO payroll (employee_id, hours_worked, leave_deductions, final_salary) VALUES (?, ?, ?, ?)',
    [employee_id, hours_worked, leave_deductions, final_salary]
  );

  const [rows] = await pool.query('SELECT * FROM payroll');
  res.json(rows);
});

// POST /payroll/calculate -> calculate a payslip from raw numbers
router.post('/payroll/calculate', (req, res) => {
  const { hoursWorked, leaveDeductions, finalSalary } = req.body;

  if (hoursWorked == null || leaveDeductions == null || finalSalary == null) {
    return res.status(400).json({
      message: 'hoursWorked, leaveDeductions, and finalSalary are all required',
    });
  }

  const calc = calculatePayslip({ hoursWorked, leaveDeductions, finalSalary });
  res.json(calc);
});

// GET /payslips/employee/:id -> full calculated payslip for one employee
router.get('/payslips/employee/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.employee_id, p.hours_worked, p.leave_deductions, p.final_salary,
            e.name, e.position, e.department, e.contact
     FROM payroll p
     INNER JOIN employee_information e ON p.employee_id = e.employee_id
     WHERE p.employee_id = ?`,
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Employee payroll not found' });
  }

  const row = rows[0];
  const calc = calculatePayslip({
    hoursWorked: row.hours_worked,
    leaveDeductions: row.leave_deductions,
    finalSalary: Number(row.final_salary),
  });

  res.json({
    employeeId: row.employee_id,
    name: row.name,
    position: row.position,
    department: row.department,
    contact: row.contact,
    hoursWorked: row.hours_worked,
    leaveDeductions: row.leave_deductions,
    finalSalary: Number(row.final_salary),
    ...calc,
  });
});

export default router;