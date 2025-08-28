// controllers/auth.controller.js
const Users = require("../models/user.model");
const bcrypt = require("bcrypt");

// ---------- Helpers ----------
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: true, error: null };

  const clean = phone.replace(/\D/g, '');
  const isValid =
    (clean.length === 12 && clean.startsWith('998')) || // 998991234567
    (clean.length === 9);                                // 991234567

  if (!isValid) {
    let error;
    if (clean.length < 9) error = "Phone number is too short";
    else if (clean.length > 12) error = "Phone number is too long";
    else if (clean.length === 12 && !clean.startsWith('998')) error = "Phone must start with +998";
    else if (clean.length === 10 || clean.length === 11) error = "Invalid phone format. Use +998XXXXXXXXX or XXXXXXXXX";
    else error = "Enter valid Uzbekistan phone number";
    return { isValid: false, error };
  }
  return { isValid: true, error: null };
};

const normalizeEmail = (email) =>
  email ? String(email).toLowerCase().trim() : undefined;
const normalizePhone = (phone) =>
  phone ? String(phone).replace(/\D/g, "") : undefined;

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendVerificationCode = async (user, code) => {
  // TODO: haqiqiy email/SMS yuborish integratsiyasi (nodemailer, SMS provider)
  if (user.authMethod === "email") {
    console.log(`📧 Send ${code} to email: ${user.email}`);
  } else if (user.authMethod === "phone") {
    console.log(`📱 Send ${code} to phone: ${user.phone}`);
  } else {
    console.log(`ℹ️ Code ${code} generated for user ${user._id}`);
  }
};

// ---------- REGISTER ----------
/**
 * POST /api/auth/register
 * Body:
 * {
 *   email?: string,
 *   phone?: string,
 *   password: string,
 *   firstName: string,
 *   lastName?: string,
 *   authMethod?: 'email'|'phone'|'telegram'|'google'|'apple'
 * }
 */
const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      authMethod = "email",
    } = req.body || {};

    // 1) Validate
    const errors = {};

    if (!email && !phone) {
      errors.auth = "Email or phone number is required";
    }

    if (email) {
      const emailNorm = normalizeEmail(email);
      if (!emailRegex.test(emailNorm)) errors.email = "Invalid email format";
    }

    if (phone) {
      const { isValid, error } = validatePhoneNumber(phone);
      if (!isValid) errors.phone = error;
    }

    if (!password || String(password).trim().length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else {
      const pw = String(password);
      const hasUpper = /[A-Z]/.test(pw);
      const hasLower = /[a-z]/.test(pw);
      const hasNumber = /\d/.test(pw);
      if (!hasUpper || !hasLower || !hasNumber) {
        errors.password = "Password must contain uppercase, lowercase, and number";
      }
    }

    if (!firstName || String(firstName).trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters long";
    }

    const validAuthMethods = ["email", "phone", "telegram", "google", "apple"];
    if (!validAuthMethods.includes(authMethod)) {
      errors.authMethod = "Invalid authentication method";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // 2) Normalization
    const emailNorm = normalizeEmail(email);
    const phoneNorm = normalizePhone(phone);

    // 3) Conflict check
    const conflictUser = await Users.findOne({
      $or: [
        ...(emailNorm ? [{ email: emailNorm }] : []),
        ...(phoneNorm ? [{ phone: phoneNorm }] : []),
      ],
    });

    if (conflictUser) {
      const field =
        emailNorm && conflictUser.email === emailNorm ? "email" : "phone";
      return res.status(409).json({
        message: `User with this ${field} already exists`,
        field,
      });
    }

    // 4) Prepare user (hashing model pre('save') da bo'ladi)
    const verificationCode = generateVerificationCode();
    const userData = {
      email: emailNorm,
      phone: phoneNorm,
      password: String(password), // plain -> model hook hash qiladi
      firstName: String(firstName).trim(),
      lastName: lastName ? String(lastName).trim() : undefined,
      authMethod,
      isVerified: false,
      verificationCode,
      verificationCodeCreatedAt: Date.now(),
      createdAt: new Date(),
    };

    // 5) Create
    const newUser = await Users.create(userData);

    // 6) Send code
    await sendVerificationCode(newUser, verificationCode);

    // 7) Response
    const safeUser = {
      id: newUser._id,
      email: newUser.email,
      phone: newUser.phone,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      authMethod: newUser.authMethod,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email/phone for verification code.",
      user: safeUser,
      nextStep: "verify_account",
    });
  } catch (error) {
    console.error("❌ Registration error:", error);

    if (error?.code === 11000 && error?.keyValue) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        message: `User with this ${duplicateField} already exists`,
        field: duplicateField,
      });
    }

    if (error?.name === "ValidationError") {
      const validationErrors = {};
      for (const k of Object.keys(error.errors)) {
        validationErrors[k] = error.errors[k].message;
      }
      return res
        .status(400)
        .json({ message: "Validation failed", errors: validationErrors });
    }

    return res.status(500).json({
      message: "Registration failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ---------- VERIFY ACCOUNT ----------
/**
 * POST /api/auth/verify
 * Body: { userId: string, verificationCode: string }
 */
const verifyAccount = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body || {};

    if (!userId || !verificationCode) {
      return res
        .status(400)
        .json({ message: "User ID and verification code are required" });
    }
    if (!/^\d{6}$/.test(String(verificationCode))) {
      return res
        .status(400)
        .json({ message: "Verification code must be 6 digits" });
    }

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    if (!user.verificationCode || user.verificationCode !== String(verificationCode)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // 5 minutes expiry
    const age = Date.now() - (user.verificationCodeCreatedAt || 0);
    if (age > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ message: "Verification code has expired. Please request a new one." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeCreatedAt = undefined;
    await user.save();

    // No JWT — istasangiz shunchaki session token qaytarishingiz mumkin
    const sessionToken = `verified_token_${user._id}_${Date.now()}`;

    return res.status(200).json({
      message: "Account verified successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        authMethod: user.authMethod,
        isVerified: user.isVerified,
      },
      token: sessionToken, // xohlasangiz olib tashlang
    });
  } catch (error) {
    console.error("❌ Account verification error:", error);
    return res.status(500).json({
      message: "Verification failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ---------- RESEND CODE ----------
/**
 * POST /api/auth/resend-code
 * Body: { userId: string, authMethod?: 'email'|'phone' }
 */
const resendVerificationCode = async (req, res) => {
  try {
    const { userId, authMethod } = req.body || {};
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // rate limit: 60s
    const last = user.verificationCodeCreatedAt || 0;
    if (Date.now() - last < 60 * 1000) {
      return res
        .status(429)
        .json({ message: "Please wait 60 seconds before requesting a new code" });
    }

    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeCreatedAt = Date.now();
    await user.save();

    await sendVerificationCode(user, code);

    return res.status(200).json({
      message: `Verification code sent to your ${
        (authMethod || user.authMethod) === "phone" ? "phone number" : "email address"
      }`,
      canResendAfter: 60,
    });
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    return res.status(500).json({
      message: "Failed to resend verification code",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ---------- UPDATE PASSWORD ----------
/**
 * POST /api/auth/update-password
 * Body: { phone: string, password: string }
 */
const updatePassword = async (req, res) => {
  try {
    const { phone, password } = req.body || {};

    if (!phone) return res.status(400).json({ message: "Phone is required" });
    if (!password || String(password).trim().length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const phoneNorm = normalizePhone(phone);
    const user = await Users.findOne({ phone: phoneNorm });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ❗️Hash controllerda emas — model hook qiladi
    user.password = String(password);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    console.error("SERVER ERROR: | updatePassword", e);
    return res.status(500).json({ error: "Server error | Update Password" });
  }
};

// ---------- LOGIN (no JWT) ----------
/**
 * POST /api/auth/login
 * Body: { email?: string, phone?: string, password: string }
 */
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body || {};

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }
    if (!password || String(password).trim().length < 1) {
      return res.status(400).json({ message: "Password is required" });
    }

    const emailNorm = normalizeEmail(email);
    const phoneNorm = normalizePhone(phone);

    const user = await Users.findOne({
      $or: [
        ...(emailNorm ? [{ email: emailNorm }] : []),
        ...(phoneNorm ? [{ phone: phoneNorm }] : []),
      ],
    }).select("+password"); // agar schema’da select:false bo‘lsa — shart

    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(
      String(password),
      String(user.password)
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // if (!user.isVerified) {
    //   return res.status(403).json({
    //     message: "Please verify your account first",
    //     requiresVerification: true,
    //     userId: user._id,
    //   });
    // }

    // JWTsiz shunchaki opaque session token (ixtiyoriy)
    const token = `token_${user._id}_${Date.now()}`;

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        authMethod: user.authMethod || "email",
        isVerified: user.isVerified,
        username: user.username,
        photoUrl: user.photoUrl,
        telegramId: user.telegramId,
        createdAt: user.createdAt,
      },
      token, // xohlasangiz olib tashlang
    });
  } catch (error) {
    console.error("SERVER ERROR | login:", error);
    return res.status(500).json({
      message: "Server error | Login",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ---------- TELEGRAM LOGIN (no JWT) ----------
/**
 * POST /api/auth/telegram
 * Body: { telegramData: {...from Telegram WebApp/User} }
 * Eslatma: bu sample hash verifikatsiyasiz — prod’da Telegram login hash tekshiruvini qo‘shing.
 */
const telegramLogin = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { telegramData } = req.body || {};
    if (!telegramData) {
      return res.status(400).json({ message: "Telegram data is required" });
    }

    const { hash, ...tg } = telegramData; // TODO: prod’da hashni tekshirish
    let user = await Users.findOne({ telegramId: String(tg.id) });

    if (!user) {
      const newUserData = {
        telegramId: String(tg.id),
        firstName: tg.first_name || "User",
        lastName: tg.last_name || "",
        username: tg.username || undefined,
        photoUrl:
          tg.photo_url && String(tg.photo_url).trim() !== "" ? tg.photo_url : "",
        phone: undefined,
        email: undefined,
        authMethod: "telegram",
        isVerified: true, // Telegram foydalanuvchilarni auto-verified deb qabul qilamiz
      };

      try {
        user = await Users.create(newUserData);
      } catch (createError) {
        if (createError?.code === 11000 && createError?.keyValue) {
          const duplicateField = Object.keys(createError.keyValue)[0];
          return res.status(400).json({
            message: `User with this ${duplicateField} already exists`,
            field: duplicateField,
          });
        }
        throw createError;
      }
    } else {
      // mavjud userni yangilash
      user.firstName = tg.first_name || user.firstName;
      user.lastName = tg.last_name || user.lastName;
      user.photoUrl = tg.photo_url || user.photoUrl;
      if (tg.username && tg.username !== user.username) {
        user.username = tg.username;
      }
      await user.save();
    }

    const token = `telegram_token_${user._id}_${Date.now()}`; // JWT emas

    return res.status(200).json({
      message: "Telegram login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        authMethod: user.authMethod,
        telegramId: user.telegramId,
        isVerified: user.isVerified,
      },
      token, // xohlasangiz olib tashlang
    });
  } catch (error) {
    console.error("❌ Telegram login error:", error);

    if (error?.code === 11000 && error?.keyValue) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `User with this ${duplicateField} already exists`,
        error: `Duplicate ${duplicateField}`,
      });
    }

    return res.status(500).json({
      message: "Telegram login failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  register,
  verifyAccount,
  resendVerificationCode,
  updatePassword,
  login,
  telegramLogin,
};
