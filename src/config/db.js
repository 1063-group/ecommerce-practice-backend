const mongoose = require("mongoose");

const dbConnection = async () => {
  const uri = process.env.MONGODB_CNN;

  if (!uri) {
    console.error("❌ ENV MONGODB_CNN topilmadi. .env joylashuvini va nomini tekshiring.");
    throw new Error("Database connection failed");
  }

  try {
    // Mongoose v7+ da qo'shimcha opts shart emas
    const conn = await mongoose.connect(uri);
    console.log(`✅ Database connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error("❌ Mongo connect error:", error.message);
    throw new Error("Database connection failed");
  }
};

module.exports = { dbConnection };
