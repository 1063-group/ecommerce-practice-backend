const mongoose = require('mongoose');

const reviewsProductSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReviewsProduct', reviewsProductSchema);