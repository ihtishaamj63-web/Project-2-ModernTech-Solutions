// Import what we need
import express from 'express';
import pool from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// =========================================
// ATTENDANCE ENDPOINTS
// =========================================

// GET /api/attendance - Get all attendance records
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Join attendance with employees to get names
        const [rows] = await pool.query(
            `SELECT a.*, e.first_name, e.last_name 
             FROM attendance a
             JOIN employees e ON a.emp_id = e.emp_id
             ORDER BY a.attendance_date DESC`
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance - Log new attendance
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { emp_id, attendance_date, status, check_in_time, check_out_time, hours_worked, notes } = req.body;

        // Check required fields
        if (!emp_id || !attendance_date || !status) {
            return res.status(400).json({
                success: false,
                error: 'emp_id, attendance_date, and status are required'
            });
        }

        // Make sure no duplicate for same employee on same day
        const [existing] = await pool.query(
            'SELECT * FROM attendance WHERE emp_id = ? AND attendance_date = ?',
            [emp_id, attendance_date]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Attendance already recorded for this employee on this date'
            });
        }

        // Insert new attendance record
        const [result] = await pool.query(
            `INSERT INTO attendance 
             (emp_id, attendance_date, status, check_in_time, check_out_time, hours_worked, notes, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [emp_id, attendance_date, status, check_in_time || null, check_out_time || null, hours_worked || null, notes || null, req.user.user_id]
        );

        res.status(201).json({
            success: true,
            message: 'Attendance logged successfully',
            data: { attendance_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================
// TIME-OFF ENDPOINTS
// =========================================

// GET /api/timeoff - Get all time-off requests
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Join timeoff with employees to get names
        const [rows] = await pool.query(
            `SELECT t.*, e.first_name, e.last_name 
             FROM timeoff t
             JOIN employees e ON t.emp_id = e.emp_id
             ORDER BY t.request_date DESC`
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/timeoff - Submit new time-off request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { emp_id, start_date, end_date, timeoff_type, reason } = req.body;

        // Check required fields
        if (!emp_id || !start_date || !end_date || !timeoff_type) {
            return res.status(400).json({
                success: false,
                error: 'emp_id, start_date, end_date, and timeoff_type are required'
            });
        }

        // End date must be after start date
        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                error: 'End date must be after start date'
            });
        }

        // Cannot request leave for past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(start_date) < today) {
            return res.status(400).json({
                success: false,
                error: 'Cannot request leave for past dates'
            });
        }

        // Insert new time-off request
        const [result] = await pool.query(
            `INSERT INTO timeoff 
             (emp_id, request_date, start_date, end_date, timeoff_type, reason, status)
             VALUES (?, NOW(), ?, ?, ?, ?, 'pending')`,
            [emp_id, start_date, end_date, timeoff_type, reason || null]
        );

        res.status(201).json({
            success: true,
            message: 'Time-off request submitted',
            data: { timeoff_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/timeoff/:id/approve - Approve a time-off request
router.put('/:id/approve', authMiddleware, async (req, res) => {
    try {
        const timeoffId = req.params.id;
        const approverId = req.user.user_id;

        // Check if request exists
        const [existing] = await pool.query(
            'SELECT * FROM timeoff WHERE timeoff_id = ?',
            [timeoffId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Time-off request not found'
            });
        }

        // Only pending requests can be approved
        if (existing[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${existing[0].status}`
            });
        }

        // Update status to approved
        await pool.query(
            `UPDATE timeoff 
             SET status = 'approved', approver_id = ?, approved_date = NOW()
             WHERE timeoff_id = ?`,
            [approverId, timeoffId]
        );

        res.json({
            success: true,
            message: 'Time-off request approved'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/timeoff/:id/deny - Deny a time-off request
router.put('/:id/deny', authMiddleware, async (req, res) => {
    try {
        const timeoffId = req.params.id;
        const approverId = req.user.user_id;
        const { denial_reason } = req.body;

        // Check if request exists
        const [existing] = await pool.query(
            'SELECT * FROM timeoff WHERE timeoff_id = ?',
            [timeoffId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Time-off request not found'
            });
        }

        // Only pending requests can be denied
        if (existing[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${existing[0].status}`
            });
        }

        // Update status to denied
        await pool.query(
            `UPDATE timeoff 
             SET status = 'denied', approver_id = ?, approved_date = NOW(), denial_reason = ?
             WHERE timeoff_id = ?`,
            [approverId, denial_reason || null, timeoffId]
        );

        res.json({
            success: true,
            message: 'Time-off request denied'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;