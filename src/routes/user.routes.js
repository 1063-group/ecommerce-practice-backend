// Updated user.routes.js
const express = require("express");
const router = express.Router();

// Controller import
const { 
  register, 
  verifyAccount, 
  resendVerificationCode, 
  updatePassword, 
  login, 
  telegramLogin 
} = require("../controllers/user.controller");

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/telegram-login", telegramLogin);

// Verification routes
router.post("/verify-account", verifyAccount);
router.post("/resend-verification", resendVerificationCode);

// Password management
router.patch("/update-password", updatePassword);

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "User routes working!" });
});

module.exports = router;