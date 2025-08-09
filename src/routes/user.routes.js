const express = require("express");
const userSchema = require("../models/user.model");
const router = express.Router();
const { register, updatePassword } = require("../controllers/user.module");

router.post("/register", register);
router.patch("/update/password", updatePassword)


module.exports = router;