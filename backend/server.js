// Main server - imports and mounts all routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import ALL routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import reviewRoutes from './routes/reviews.js';
import payrollRoutes from './routes/payroll.js';
import attendanceRoutes from './routes/attendance.js';
import timeoffRoutes from './routes/timeoff.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount ALL routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timeoff', timeoffRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});