import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import ALL routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import reviewRoutes from './routes/reviews.js';
import payrollRoutes from './routes/payroll.js';
import attendanceRoutes from './routes/attendance-timeoff.js';

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
app.use('/api/timeoff', attendanceRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});