// models/user.model.js - Improved Schema
const mongoose = require("mongoose");
const uuid = require("uuid");

const unique = uuid.v4().replace(/-/g, "").slice(0, 8);

const userSchema = new mongoose.Schema({
  // ✅ FIX: null o'rniga undefined default qiymat
  phone: {
    type: String,
    sparse: true,
    default: undefined, // ❌ null emas!
  },
  email: {
    type: String,
    sparse: true,
    default: undefined, // ❌ null emas!
  },
  password: {
    type: String,
    default: unique,
    minLength: 8,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    default: undefined,
  },
  verificationCodeCreatedAt: {
    type: Number,
    default: undefined,
  },
  telegramId: {
    type: String,
    sparse: true,
    unique: true,
    default: undefined, // ❌ null emas!
  },
  username: {
    type: String,
    sparse: true,
    default: undefined, // ❌ null emas!
  },
  photoUrl: {
    type: String,
    default: '',
  },
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
  authMethod: {
    type: String,
    enum: ['email', 'phone', 'telegram', 'google', 'apple'],
    default: 'email',
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
userSchema.index({ verificationCode: 1 }, { sparse: true });

// ✅ Pre-save middleware - null va empty string'larni undefined ga o'zgartirish
userSchema.pre('save', function(next) {
  // null va empty string'larni undefined ga o'zgartiramiz
  if (this.phone === '' || this.phone === null) this.phone = undefined;
  if (this.email === '' || this.email === null) this.email = undefined;
  if (this.username === '' || this.username === null) this.username = undefined;
  if (this.verificationCode === '' || this.verificationCode === null) this.verificationCode = undefined;
  if (this.telegramId === '' || this.telegramId === null) this.telegramId = undefined;
  next();
});

module.exports = mongoose.model("Users", userSchema);