const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desription: { type: String, required: true },
  stock: { type: Number, required: false },
  views: { type: Number, required: false, default: 0 },
  rating: { type: Number, required: false, default: 0 },
  costPrice: { type: Number, required: false },
  price: { type: Number, required: true },
  discount: { type: Number, required: false },
  sales: { type: Number, required: false , default: 0},
  priceWithDiscount: { type: Number, required: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Categories", required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brands", required: true },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  this.priceWithDiscount = this.price - (this.price / 100 * this.discount);
  
  next();
});

module.exports = mongoose.model("Products", productSchema);
