import Category from "../models/category.model.js";

export const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;

    // validation:
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!image) return res.status(400).json({ message: "Image is required" });

    const newCategory = await Category.create({ name, image });
    newCategory.save();

    return res
      .status(201)
      .json({ message: "Category created successfully", newCategory });
  } catch (e) {
    console.error("SERVER ERROR: | createCategory", e);
    return res.status(500).json({ error: "Server error | Create Category" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    // validation
    if (categories.length === 0)
      return res.status(404).json({ message: "Categories not found" });

    return res.status(200).json({ categories });
  } catch (e) {
    console.error("SERVER ERROR: | createCategory", e);
    return res.status(500).json({ error: "Server error | Create Category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    // validation:
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!image) return res.status(400).json({ message: "Image is required" });

    const foundCategory = await Category.findById(id);

    if (!foundCategory)
      return res.status(404).json({ message: "Category not found" });

    foundCategory.name = name;
    foundCategory.image = image;

    await foundCategory.save();

    return res
      .status(200)
      .json({ message: "Category updated successfully", foundCategory });
  } catch (e) {
    console.error("SERVER ERROR: | createCategory", e);
    return res.status(500).json({ error: "Server error | Create Category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const {id} = req.params;

    const foundCategory = await Category.findByIdAndDelete(id)

    if (!foundCategory)
      return res.status(404).json({ message: "Category not found" });

    return res
      .status(200)
      .json({ message: "Category deleted successfully", foundCategory });
  } catch (e) {
    console.error("SERVER ERROR: | createCategory", e);
    return res.status(500).json({ error: "Server error | Create Category" });
  }
}