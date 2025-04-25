require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const { auth } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://junoirjoypospro.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('POS Backend Running');
});

// Protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
