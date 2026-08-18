// backend/app.js
// REFERENCE FILE — only needed if your project doesn't already have a
// main server file. If you already have one, just make sure it mounts
// the payroll router at '/api', like this:
//
//   import payrollRouter from './routes/payroll.js';
//   app.use('/api', payrollRouter);
//
// That one line is the important part — it's what makes the routes
// inside payroll.js (e.g. '/payroll', '/payslips/employee/:id') respond
// at '/api/payroll', '/api/payslips/employee/:id', etc.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import payroll from './routes/payroll.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());          // allows payroll.html (a different origin) to fetch from this server
app.use(express.json());  // lets Express read JSON in request bodies

app.use('/payroll', payroll);

app.listen(PORT, () => {
  console.log(`ModernTech backend running at http://localhost:${PORT}`);
});