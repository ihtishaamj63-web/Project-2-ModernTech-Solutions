import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import payroll from './routes/payroll.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


// app.use('/api', payroll);
app.use('/payroll', payroll);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});