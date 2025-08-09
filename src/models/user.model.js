const mongoose = require("mongoose");
const uuid = require("uuid");

const unique = uuid.v4().replace(/-/g, "").slice(0, 8);

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    // match:
  },
  password: {
    type: String,
    default: unique,
    minLength: 8,
  },
  firstName: {
    type: String,
    required: false,
    default: "user",
  },
  lastName: {
    type: String,
    default: unique,
    required: false,
  },
});
// userSchema.pre("init", (next) => {

//   this.password = unique() // 8 characters
//   this.lastName = unique
//   next();
// });
// userSchema.pre("save", (next) => {
//   this.password = uuid.v4(8); // 8 characters
//   next();
// });

module.exports = mongoose.model("Users", userSchema);
// module.exports = userSchema
