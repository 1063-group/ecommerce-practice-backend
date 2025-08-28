const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: [
        { ref: 'Categories', type: mongoose.Schema.Types.ObjectId, }, // notebooks
    ]
})

module.exports = mongoose.model('Brands', brandSchema);
