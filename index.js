require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const productRoutes = require('./routes/products');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/products', productRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('POS Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
