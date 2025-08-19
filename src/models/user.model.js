const mongoose = require("mongoose");
const uuid = require("uuid");

const unique = uuid.v4().replace(/-/g, "").slice(0, 8);

const userSchema = new mongoose.Schema({
  // Email/Phone login uchun
  phone: {
    type: String,
    sparse: true, // Bu yerda sparse true, lekin empty string problem qiladi
    default: undefined, // null o'rniga undefined ishlatamiz
  },
  email: {
    type: String,
    sparse: true,
    default: undefined,
  },
  password: {
    type: String,
    default: unique,
    minLength: 8,
  },
  
  // Telegram login uchun
  telegramId: {
    type: String,
    sparse: true,
    unique: true,
  },
  username: {
    type: String,
    sparse: true,
    default: undefined,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  
  // Umumiy ma'lumotlar
  firstName: {
    type: String,
    required: true,
    default: "user",
  },
  lastName: {
    type: String,
    default: unique,
    required: false,
  },
  
  // Auth method
  authMethod: {
    type: String,
    enum: ['email', 'phone', 'telegram', 'google', 'apple'],
    default: 'email',
  },
  
  // Account status
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Index'lar yaratish performance uchun
userSchema.index({ telegramId: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });

// Pre-save middleware - empty string'larni undefined ga o'zgartirish
userSchema.pre('save', function(next) {
  // Empty string'larni undefined ga o'zgartiramiz
  if (this.phone === '') this.phone = undefined;
  if (this.email === '') this.email = undefined;
  if (this.username === '') this.username = undefined;
  next();
});

module.exports = mongoose.model("Users", userSchema);