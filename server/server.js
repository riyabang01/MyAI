import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI && mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api', aiRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
