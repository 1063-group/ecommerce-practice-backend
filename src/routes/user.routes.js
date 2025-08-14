const express = require("express");
const userSchema = require("../models/user.model");
const router = express.Router();

// Controller file'dan import qiling (fayl nomi aniq bo'lishi kerak)
// Agar fayl nomi user.module.js bo'lsa:
// const { register, updatePassword, login, telegramLogin } = require("../controllers/user.module");

// Agar fayl nomi user.controller.js bo'lsa:
const { register, updatePassword, login, telegramLogin } = require("../controllers/user.controller");

// Routes
router.post("/register", register);
router.post("/login", login);
router.post("/telegram-login", telegramLogin);
router.patch("/update/password", updatePassword);

module.exports = router;