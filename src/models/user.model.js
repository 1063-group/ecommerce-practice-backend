const mongoose = require("mongoose");
const uuid = require("uuid");

const unique = uuid.v4().replace(/-/g, "").slice(0, 8);

const userSchema = new mongoose.Schema({
  // Email/Phone login uchun
  phone: {
    type: String,
    sparse: true, // Telegram user'larda phone bo'lmasligi mumkin
  },
  email: {
    type: String,
    sparse: true,
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
  timestamps: true // createdAt va updatedAt avtomatik qo'shiladi
});

// Index'lar yaratish performance uchun
userSchema.index({ telegramId: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });

module.exports = mongoose.model("Users", userSchema);