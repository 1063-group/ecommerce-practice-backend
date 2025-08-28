// models/user.model.js
const mongoose = require("mongoose");
const uuid = require("uuid");
const bcrypt = require("bcrypt"); // ✅ qo'shildi

const unique = uuid.v4().replace(/-/g, "").slice(0, 8);

const userSchema = new mongoose.Schema({
  phone: { type: String, sparse: true, default: undefined },
  email: { type: String, sparse: true, default: undefined },
  password: {
    type: String,
    default: unique,   // default bo'lsa ham hook hash qiladi
    minLength: 8,
    select: true       // istasangiz false qilib, login'da `.select('+password')` bilan chaqirasiz
  },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: undefined },
  verificationCodeCreatedAt: { type: Number, default: undefined },
  telegramId: { type: String, sparse: true, unique: true, default: undefined },
  username: { type: String, sparse: true, default: undefined },
  photoUrl: { type: String, default: '' },
  firstName: { type: String, required: true, default: "user" },
  lastName: { type: String, default: unique, required: false },
  authMethod: {
    type: String,
    enum: ['email', 'phone', 'telegram', 'google', 'apple'],
    default: 'email',
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexlar
userSchema.index({ telegramId: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ verificationCode: 1 }, { sparse: true });

// ✅ Null/empty -> undefined
userSchema.pre('save', function(next) {
  if (this.phone === '' || this.phone === null) this.phone = undefined;
  if (this.email === '' || this.email === null) this.email = undefined;
  if (this.username === '' || this.username === null) this.username = undefined;
  if (this.verificationCode === '' || this.verificationCode === null) this.verificationCode = undefined;
  if (this.telegramId === '' || this.telegramId === null) this.telegramId = undefined;
  next();
});

// ✅ Parolni faqat kerak bo'lganda hash qilish (double-hashni oldini oladi)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // allaqachon bcrypt ko‘rinishida bo‘lsa ( $2a/$2b/$2y ), qayta hash QILMAYMIZ
  const looksHashed = /^\$2[aby]\$/.test(this.password);
  if (looksHashed) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// (ixtiyoriy) Model method: parolni solishtirish
userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(String(plain), String(this.password));
};

module.exports = mongoose.model("Users", userSchema);
