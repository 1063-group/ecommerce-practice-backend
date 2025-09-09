const express = require("express");
const Category = require("../models/category.model");
const router = express.Router();

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories.controller");

// API:
// CRUD - CREATE , READ, UPDATE, DELETE

router.post("/", createCategory);
router.get("/", getCategories);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;

// http://localhost:8000/api/v1/category/3ji12o3u21893u21ioihe | PATCH | { name: "New name" }
