// backend/routes/timeoff.js
import express from 'express';
import pool from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/timeoff
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, e.first_name, e.last_name, e.department, e.position 
             FROM timeoff t
             JOIN employees e ON t.emp_id = e.emp_id
             ORDER BY t.request_date DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/timeoff/cleanup - Auto-deny old pending requests
router.put('/cleanup', authMiddleware, async (req, res) => {
    try {
        await pool.query(
            "UPDATE timeoff SET status = 'denied', denial_reason = 'Automatically rejected (past date)' WHERE status = 'pending' AND start_date < CURDATE()"
        );
        res.json({ success: true, message: 'Old requests cleaned up' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/timeoff
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { emp_id, start_date, end_date, timeoff_type, reason } = req.body;
        if (!emp_id || !start_date || !end_date || !timeoff_type) {
            return res.status(400).json({
                success: false,
                error: 'emp_id, start_date, end_date, and timeoff_type are required'
            });
        }
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

// PUT /api/timeoff/:id/approve
router.put('/:id/approve', authMiddleware, async (req, res) => {
    try {
        const [existing] = await pool.query(
            'SELECT * FROM timeoff WHERE timeoff_id = ?',
            [req.params.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        if (existing[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${existing[0].status}`
            });
        }
        await pool.query(
            `UPDATE timeoff 
             SET status = 'approved', approver_id = ?, approved_date = NOW()
             WHERE timeoff_id = ?`,
            [req.user.user_id, req.params.id]
        );
        res.json({ success: true, message: 'Request approved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/timeoff/:id/deny
router.put('/:id/deny', authMiddleware, async (req, res) => {
    try {
        const [existing] = await pool.query(
            'SELECT * FROM timeoff WHERE timeoff_id = ?',
            [req.params.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        if (existing[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Request is already ${existing[0].status}`
            });
        }
        const { denial_reason } = req.body;
        await pool.query(
            `UPDATE timeoff 
             SET status = 'denied', approver_id = ?, approved_date = NOW(), denial_reason = ?
             WHERE timeoff_id = ?`,
            [req.user.user_id, denial_reason || null, req.params.id]
        );
        res.json({ success: true, message: 'Request denied' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// FIX: PUT /api/timeoff/:id/cancel - Employee cancels pending request
router.put('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const timeoffId = req.params.id;
        const [existing] = await pool.query('SELECT * FROM timeoff WHERE timeoff_id = ?', [timeoffId]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Time-off request not found' });
        }
        if (existing[0].status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Can only cancel pending requests' });
        }

        await pool.query('UPDATE timeoff SET status = ? WHERE timeoff_id = ?', ['cancelled', timeoffId]);
        res.json({ success: true, message: 'Request cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// FIX: PUT /api/timeoff/:id/reverse - HR reverses approved/denied request back to pending
router.put('/:id/reverse', authMiddleware, async (req, res) => {
    try {
        const timeoffId = req.params.id;
        const [existing] = await pool.query('SELECT * FROM timeoff WHERE timeoff_id = ?', [timeoffId]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Time-off request not found' });
        }
        if (existing[0].status === 'pending') {
            return res.status(400).json({ success: false, error: 'Request is already pending' });
        }

        await pool.query(
            'UPDATE timeoff SET status = ?, approver_id = NULL, approved_date = NULL WHERE timeoff_id = ?',
            ['pending', timeoffId]
        );
        res.json({ success: true, message: 'Request reversed to pending' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;