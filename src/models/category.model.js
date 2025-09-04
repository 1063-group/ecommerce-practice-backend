const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }, // notebooks
    image: { type: String, required: true }, // https:adopskadopkaopdkjdoi2ji03u13ui.com
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
