const express = require("express");
const router = express.Router();

// Controller import
const { register, updatePassword, login, telegramLogin } = require("../controllers/user.controller");

// Routes - to'g'ri format
router.post("/register", register);
router.post("/login", login);
router.post("/telegram-login", telegramLogin);
router.patch("/update-password", updatePassword); // "/" o'rniga "-" ishlatdik

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "User routes working!" });
});

module.exports = router;