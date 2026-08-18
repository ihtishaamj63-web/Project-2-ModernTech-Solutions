// backend/routes/payroll.js
// All payroll endpoints for ModernTech Solutions.
// Matches the real schema: employees (emp_id), payroll
// (payroll_id, base_salary, hourly_rate, tax_rate, benefits, deductions,
// effective_date), and a separate payslips history table.

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/payroll', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT pr.payroll_id, pr.emp_id, pr.base_salary, pr.hourly_rate,
           pr.tax_rate, pr.benefits, pr.deductions, pr.effective_date,
           pr.is_active,
           e.first_name, e.last_name, e.position, e.department
    FROM payroll pr
    INNER JOIN employees e ON pr.emp_id = e.emp_id
    WHERE pr.is_active = TRUE
  `);
  res.json(rows);
});


router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM payroll WHERE payroll_id = ?',
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Payroll record not found' });
  }
  res.json(rows[0]);
});

// ============================================================
// POST /payroll -> create a new payroll config for an employee.
// Body: { emp_id, base_salary, hourly_rate, tax_rate, benefits,
//         deductions, effective_date }
// ============================================================
router.post('/', async (req, res) => {
  const {
    emp_id,
    base_salary,
    hourly_rate,
    tax_rate,
    benefits,
    deductions,
    effective_date,
  } = req.body;

  await pool.query(
    `INSERT INTO payroll
       (emp_id, base_salary, hourly_rate, tax_rate, benefits, deductions, effective_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [emp_id, base_salary, hourly_rate, tax_rate, benefits, deductions, effective_date]
  );

  const [rows] = await pool.query('SELECT * FROM payroll');
  res.json(rows); // return all records, so you can confirm it was added
});

// ============================================================
// POST /payroll/calculate -> calculate gross/tax/net from raw numbers.
// Body: { baseSalary, taxRate, benefits = 0, deductions = 0,
//         overtimePay = 0, bonus = 0 }
//
// Formula used here (a design choice, since the schema doesn't fix
// one — adjust if your instructor specifies something different):
//   grossPay        = baseSalary + overtimePay + bonus + benefits
//   taxDeducted      = grossPay * (taxRate / 100)
//   totalDeductions = taxDeducted + deductions
//   netPay          = grossPay - totalDeductions
// ============================================================
router.post('/payroll/calculate', (req, res) => {
  const {
    baseSalary,
    taxRate,
    benefits = 0,
    deductions = 0,
    overtimePay = 0,
    bonus = 0,
  } = req.body;

  if (baseSalary == null || taxRate == null) {
    return res.status(400).json({ message: 'baseSalary and taxRate are required' });
  }

  const grossPay = baseSalary + overtimePay + bonus + benefits;
  const taxDeducted = Math.round(grossPay * (taxRate / 100) * 100) / 100;
  const totalDeductions = Math.round((taxDeducted + deductions) * 100) / 100;
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

  res.json({ grossPay, taxDeducted, totalDeductions, netPay });
});

// ============================================================
// GET /payslips/employee/:id -> all payslips on record for one employee
// ============================================================
router.get('/payslips/employee/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM payslips
     WHERE emp_id = ?
     ORDER BY payslip_period_start DESC`,
    [req.params.id]
  );
  res.json(rows); // empty array if the employee has no payslips yet — that's valid, not an error
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM payroll WHERE payroll_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Payroll record not found'
      });
    }

    res.json({
      message: 'Payroll record deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error deleting payroll record',
      error: error.message
    });
  }
});

export default router;