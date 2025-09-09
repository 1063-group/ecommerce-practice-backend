const express = require('express');
const router = express.Router();
const { createBrand, getBrands, updateBrand, deleteBrand } = require('../controllers/brand.controller');

router.post('/', createBrand);
router.get('/', getBrands);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

module.exports = router;
