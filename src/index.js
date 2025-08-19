// imports
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const { dbConnection } = require("./config/db");
const userRouter = require("./routes/user.routes");

// config
dotenv.config();

// settings
const app = express();

// Connection to Database
dbConnection()

// Enhanced CORS for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://one063development.onrender.com',
    'https://ecommerce-client-1063.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

// middlewares
app.use(morgan("dev"));
app.use(cors(corsOptions)); // Enhanced CORS
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT 
  });
});

// routes
app.use("/api/v1/auth", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ 
//     message: 'Route not found',
//     path: req.originalUrl
//   });
// });

// starting the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT}`);
    console.log(`📡 CORS enabled for production and development`);
});

// ecommerce - электронный коммерция - интернет магазин
// CRUD - create, read, update, delete