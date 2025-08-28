//let price = 100000
//let discount = 30
//let priceWithDiscount = price - (price / 100 * 3)

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desription: { type: String, required: true },
  stock: { type: Number, required: false },
  
});

module.exports = mongoose.model("Products", productSchema);
