import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


import db from './config/database.js';

import reviewsRoutes from './routes/reviews.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/reviews', reviewsRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'ModernTech Solutions API is running'
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});