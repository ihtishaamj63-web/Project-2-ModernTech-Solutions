// Employee routes
import express from 'express';
import pool from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/employees - Get all employees
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query(
            'SELECT * FROM employees WHERE is_deleted = FALSE ORDER BY emp_id'
        );
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/employees/:id - Get one employee
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query(
            'SELECT * FROM employees WHERE emp_id = ? AND is_deleted = FALSE',
            [req.params.id]
        );
        if (employees.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        res.json({ success: true, data: employees[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/employees - Add new employee
router.post('/', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { first_name, last_name, email, phone, position, department, hire_date, employment_status } = req.body;

        if (!first_name || !last_name || !email || !position || !department || !hire_date) {
            connection.release();
            return res.status(400).json({
                success: false,
                error: 'All required fields must be filled'
            });
        }

        await connection.beginTransaction();

        // Insert employee
        const [employeeResult] = await connection.query(
            `INSERT INTO employees 
             (first_name, last_name, email, phone, position, department, hire_date, employment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone || null, position, department, hire_date, employment_status || 'active']
        );

        const emp_id = employeeResult.insertId;

        // Also create a user account for login
        const username = email;
        const tempPassword = 'password123';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const [userResult] = await connection.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [username, email, hashedPassword, first_name, last_name, 'employee']
        );

        await connection.query(
            'UPDATE employees SET user_id = ? WHERE emp_id = ?',
            [userResult.insertId, emp_id]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Employee added with login account',
            data: { emp_id, user_id: userResult.insertId }
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }
        res.status(500).json({ success: false, error: 'Failed to add employee' });
    }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, position, department, employment_status } = req.body;
        
        const [result] = await pool.query(
            `UPDATE employees 
             SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                 position = ?, department = ?, employment_status = ?
             WHERE emp_id = ? AND is_deleted = FALSE`,
            [first_name, last_name, email, phone || null, position, department, employment_status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already exists' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE employees SET is_deleted = TRUE, employment_status = "terminated" WHERE emp_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;