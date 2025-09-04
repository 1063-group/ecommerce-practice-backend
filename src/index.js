// .env ni ENG BOSHIDA yuklang (va yo'lni aniq ko'rsating)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { dbConnection } = require("./config/db");
const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");
const categoryRouter = require("./routes/category.routes");

const app = express();
const PORT = process.env.PORT || 8000;

// Tez diagnostika (istasaiz keyin olib tashlang)
console.log("[DEBUG] cwd=", process.cwd());
console.log("[DEBUG] __dirname=", __dirname);
console.log("[DEBUG] has MONGODB_CNN?", !!process.env.MONGODB_CNN);

// CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://one063development.onrender.com",
    "https://ecommerce-client-1063.onrender.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

// middlewares
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    env: process.env.NODE_ENV,
  });
});

// routes
app.use("/api/v1/auth", userRouter);
// app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);


// error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// === MUHIM: Serverni DB dan keyin ishga tushiring ===
(async () => {
  await dbConnection(); // 1) avval DB

  app.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT}`);
    console.log(`📡 CORS enabled for production and development`);
  });
})().catch((e) => {
  console.error("❌ Fatal startup error:", e);
  process.exit(1);
});
