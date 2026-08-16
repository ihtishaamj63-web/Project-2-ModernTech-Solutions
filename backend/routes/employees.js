import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/employees - Fetch all active employees
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.emp_id AS id,
        CONCAT(e.first_name, ' ', e.last_name) AS name,
        e.first_name,
        e.last_name,
        e.position,
        e.department,
        COALESCE(p.base_salary, 0) AS salary,
        e.email AS contact,
        e.phone,
        e.hire_date AS startDate,
        e.employment_status AS status
      FROM employees e
      LEFT JOIN payroll p ON e.emp_id = p.emp_id
      WHERE e.is_deleted = 0 OR e.is_deleted IS NULL
      ORDER BY e.emp_id ASC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/employees/:id - Fetch single employee
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.emp_id AS id,
        CONCAT(e.first_name, ' ', e.last_name) AS name,
        e.first_name,
        e.last_name,
        e.position,
        e.department,
        COALESCE(p.base_salary, 0) AS salary,
        e.email AS contact,
        e.phone,
        e.hire_date AS startDate,
        e.employment_status AS status
      FROM employees e
      LEFT JOIN payroll p ON e.emp_id = p.emp_id
      WHERE e.emp_id = ? AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
    `;
    const [rows] = await db.query(query, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/employees - Add new employee
router.post('/', async (req, res) => {
  const { name, position, department, salary, contact, phone, startDate } = req.body;

  if (!name || !position || !department || !contact || !startDate) {
    return res.status(400).json({ message: 'Please complete all required fields.' });
  }

  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [empResult] = await connection.query(
      `INSERT INTO employees (first_name, last_name, email, phone, position, department, hire_date, employment_status, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)`,
      [firstName, lastName, contact, phone || null, position, department, startDate]
    );

    const empId = empResult.insertId;

    if (salary) {
      await connection.query(
        `INSERT INTO payroll (emp_id, base_salary) VALUES (?, ?)`,
        [empId, salary]
      );
    }

    await connection.commit();
    res.status(201).json({ id: empId, message: 'Employee added successfully!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding employee:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
  const { name, position, department, salary, contact, phone, startDate, status } = req.body;
  const empId = req.params.id;

  const nameParts = name ? name.trim().split(' ') : [];
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE employees 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, position = ?, department = ?, hire_date = ?, employment_status = ?
       WHERE emp_id = ?`,
      [firstName, lastName, contact, phone || null, position, department, startDate, status || 'active', empId]
    );

    if (salary !== undefined) {
      const [payrollCheck] = await connection.query(`SELECT * FROM payroll WHERE emp_id = ?`, [empId]);
      if (payrollCheck.length > 0) {
        await connection.query(`UPDATE payroll SET base_salary = ? WHERE emp_id = ?`, [salary, empId]);
      } else {
        await connection.query(`INSERT INTO payroll (emp_id, base_salary) VALUES (?, ?)`, [empId, salary]);
      }
    }

    await connection.commit();
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating employee:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE employees SET is_deleted = 1 WHERE emp_id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;