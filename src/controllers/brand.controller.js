const Brand = require('../models/brands.model');

// Create Brand
const createBrand = async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!image) return res.status(400).json({ message: 'Image is required' });

    const newBrand = new Brand({ name, image });
    await newBrand.save();

    return res.status(201).json({
      message: 'Brand created successfully',
      brand: newBrand
    });
  } catch (error) {
    console.error('SERVER ERROR: | createBrand', error);
    return res.status(500).json({ error: 'Server error | Create Brand' });
  }
};

// Read Brands (All)
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    return res.status(200).json(brands);
  } catch (error) {
    console.error('SERVER ERROR: | getBrands', error);
    return res.status(500).json({ error: 'Server error | Get Brands' });
  }
};

// Update Brand
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      id,
      { name, image },
      { new: true, runValidators: true }
    );

    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    return res.status(200).json({ message: 'Brand updated successfully', brand });
  } catch (error) {
    console.error('SERVER ERROR: | updateBrand', error);
    return res.status(500).json({ error: 'Server error | Update Brand' });
  }
};

// Delete Brand
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    return res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('SERVER ERROR: | deleteBrand', error);
    return res.status(500).json({ error: 'Server error | Delete Brand' });
  }
};

module.exports = {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand
};
