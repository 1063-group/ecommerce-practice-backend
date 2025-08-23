const userSchema = require("../models/user.model");
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // npm install bcrypt

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone validation regex (Uzbekistan format)
const phoneRegex = /^(\+998)?[0-9]{9}$/;

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code (you'll need to implement email/SMS service)
const sendVerificationCode = async (user, code) => {
  if (user.authMethod === 'email') {
    // Implement email sending logic here
    console.log(`📧 Sending verification code ${code} to email: ${user.email}`);
    // Example: await emailService.send(user.email, 'Verification Code', `Your code is: ${code}`);
  } else if (user.authMethod === 'phone') {
    // Implement SMS sending logic here
    console.log(`📱 Sending verification code ${code} to phone: ${user.phone}`);
    // Example: await smsService.send(user.phone, `Your verification code is: ${code}`);
  }
};

// Register function with verification
const register = async (req, res) => {
  try {
    const { 
      email, 
      phone, 
      password, 
      firstName, 
      lastName, 
      authMethod = 'email' 
    } = req.body;

    // 1. Input validation
    const errors = {};

    // Email yoki phone kamida bittasi bo'lishi kerak
    if (!email && !phone) {
      errors.auth = "Email or phone number is required";
    }

    // Email validation
    if (email) {
      if (!emailRegex.test(email)) {
        errors.email = "Invalid email format";
      }
    }

    // Phone validation  
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, ''); // faqat raqamlar
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = "Invalid phone format. Use +998XXXXXXXXX or 9 digits";
      }
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else {
      if (password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      }
      // Password strength check
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      
      if (!hasUpper || !hasLower || !hasNumber) {
        errors.password = "Password must contain uppercase, lowercase, and number";
      }
    }

    // firstName validation
    if (!firstName || firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters long";
    }

    // lastName validation (optional)
    if (lastName && lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters long";
    }

    // Auth method validation
    const validAuthMethods = ['email', 'phone', 'telegram', 'google', 'apple'];
    if (!validAuthMethods.includes(authMethod)) {
      errors.authMethod = "Invalid authentication method";
    }

    // Agar validation error'lar bo'lsa, qaytarish
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    // 2. Check if user already exists
    const existingUser = await userSchema.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone: phone.replace(/\D/g, '') }] : [])
      ]
    });

    if (existingUser) {
      const conflictField = existingUser.email === email?.toLowerCase() ? 'email' : 'phone';
      return res.status(409).json({ 
        message: `User with this ${conflictField} already exists`,
        field: conflictField
      });
    }

    // 3. Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Generate verification code
    const verificationCode = generateVerificationCode();

    // 5. Clean and prepare user data
    const userData = {
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone ? phone.replace(/\D/g, '') : null,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : undefined,
      authMethod: authMethod,
      isVerified: false,
      verificationCode: verificationCode,
      verificationCodeCreatedAt: Date.now(),
      createdAt: new Date()
    };

    // 6. Create user
    const newUser = await userSchema.create(userData);

    // 7. Send verification code
    await sendVerificationCode(newUser, verificationCode);

    // 8. Prepare response (don't include verification code or password)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      phone: newUser.phone,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      authMethod: newUser.authMethod,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt
    };

    // 9. Success response
    res.status(201).json({
      message: "User registered successfully. Please check your email/phone for verification code.",
      user: userResponse,
      nextStep: "verify_account"
    });

    console.log(`✅ User registered with verification: ${newUser._id} (${authMethod})`);

  } catch (error) {
    console.error("❌ Registration error:", error);

    // MongoDB duplicate key error handling
    // if (error.code === 11000) {
    //   const duplicateField = Object.keys(error.keyValue)[0];
    //   return res.status(409).json({ 
    //     message: `User with this ${duplicateField} already exists`,
    //     field: duplicateField
    //   });
    // }

    // MongoDB validation error
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Generic server error
    res.status(500).json({ 
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};

// Verify Account function
const verifyAccount = async (req, res) => {
  try {
    const { userId, verificationCode, authMethod } = req.body;

    // Validation
    if (!userId || !verificationCode) {
      return res.status(400).json({ 
        message: "User ID and verification code are required" 
      });
    }

    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({ 
        message: "Verification code must be 6 digits" 
      });
    }

    // Find user
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        message: "Account is already verified" 
      });
    }

    // Check verification code
    if (!user.verificationCode || user.verificationCode !== verificationCode) {
      return res.status(400).json({ 
        message: "Invalid verification code" 
      });
    }

    // Check expiration (5 minutes)
    const codeAge = Date.now() - user.verificationCodeCreatedAt;
    if (codeAge > 5 * 60 * 1000) {
      return res.status(400).json({ 
        message: "Verification code has expired. Please request a new one." 
      });
    }

    // Verify the account
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeCreatedAt = undefined;
    await user.save();

    // Generate JWT token (real app'da JWT library ishlatish kerak)
    const token = `verified_token_${user._id}_${Date.now()}`;

    // Success response
    res.status(200).json({
      message: "Account verified successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        authMethod: user.authMethod,
        isVerified: user.isVerified
      },
      token: token
    });

    console.log(`✅ Account verified successfully: ${user._id}`);

  } catch (error) {
    console.error("❌ Account verification error:", error);
    res.status(500).json({ 
      message: "Verification failed", 
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};

// Resend Verification Code function
const resendVerificationCode = async (req, res) => {
  try {
    const { userId, authMethod } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        message: "User ID is required" 
      });
    }

    // Find user
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        message: "Account is already verified" 
      });
    }

    // Check rate limiting (prevent spam)
    const lastCodeTime = user.verificationCodeCreatedAt;
    if (lastCodeTime && (Date.now() - lastCodeTime) < 60 * 1000) {
      return res.status(429).json({ 
        message: "Please wait 60 seconds before requesting a new code" 
      });
    }

    // Generate new verification code
    const newVerificationCode = generateVerificationCode();
    
    // Update user with new code
    user.verificationCode = newVerificationCode;
    user.verificationCodeCreatedAt = Date.now();
    await user.save();

    // Send verification code
    await sendVerificationCode(user, newVerificationCode);

    res.status(200).json({
      message: `Verification code sent to your ${authMethod === 'phone' ? 'phone number' : 'email address'}`,
      canResendAfter: 60 // seconds
    });

    console.log(`📤 Verification code resent to user: ${user._id}`);

  } catch (error) {
    console.error("❌ Resend verification error:", error);
    res.status(500).json({ 
      message: "Failed to resend verification code", 
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};

// Update Password function
const updatePassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await userSchema.findOne({ phone }) || null;
    
    if (!password || password.trim().length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (user) {
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      user.password = hashedPassword;
      await user.save();
      return res.status(200).json({ message: "Password updated successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }

  } catch (e) {
    console.log("SERVER ERROR: | updatePassword", e);
    res.status(500).json({ error: "Server error | Update Password" });
  }
};

// Regular Login function
const login = async (req, res) => {
  try {
    const { email, password, phone } = req.body;

    // Email yoki phone orqali user qidirish
    const user = await userSchema.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Password tekshirish (bcrypt bilan)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Check if account is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your account first",
        requiresVerification: true,
        userId: user._id
      });
    }

    // Success response
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        authMethod: user.authMethod || 'email',
        isVerified: user.isVerified
      },
      token: `token_${user._id}_${Date.now()}`
    });

  } catch (error) {
    console.log("SERVER ERROR: | login", error);
    res.status(500).json({ error: "Server error | Login" });
  }
};

// Telegram login function
const telegramLogin = async (req, res) => {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { telegramData } = req.body;
    
    if (!telegramData) {
      return res.status(400).json({ message: "Telegram data is required" });
    }

    console.log("✅ Telegram login attempt:", telegramData);

    // Telegram ma'lumotlarini verificatsiya qilish
    const { hash, ...userData } = telegramData;
    
    // Bot token bilan hash tekshirish (security uchun)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.log("TELEGRAM_BOT_TOKEN is not set in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // User'ni database'da qidirish yoki yaratish
    let user = await userSchema.findOne({ 
      telegramId: userData.id.toString()
    });
    
    if (!user) {
      // Yangi user yaratish
      try {
        // Empty string'lar o'rniga undefined yoki null ishlatamiz
        const newUserData = {
          telegramId: userData.id.toString(),
          firstName: userData.first_name || 'User',
          lastName: userData.last_name || '',
          username: userData.username || undefined,
          photoUrl: userData.photo_url && userData.photo_url.trim() !== '' ? userData.photo_url : '',
          phone: undefined,
          email: undefined,
          authMethod: 'telegram',
          isVerified: true // Telegram users are auto-verified
        };

        user = await userSchema.create(newUserData);
        
        console.log("New Telegram user created:", user._id);
      } catch (createError) {
        console.log("Error creating Telegram user:", createError);
        
        // Agar duplicate key error bo'lsa, boshqa field'da conflict bor
        if (createError.code === 11000) {
          const duplicateField = Object.keys(createError.keyValue)[0];
          return res.status(400).json({ 
            message: `User with this ${duplicateField} already exists`,
            field: duplicateField
          });
        }
        
        return res.status(500).json({ message: "Error creating user account" });
      }
    } else {
      // Mavjud user ma'lumotlarini yangilash
      user.firstName = userData.first_name || user.firstName;
      user.lastName = userData.last_name || user.lastName;
      user.photoUrl = userData.photo_url || user.photoUrl;
      
      // Username faqat agar yangi qiymat bo'lsa update qilamiz
      if (userData.username && userData.username !== user.username) {
        user.username = userData.username;
      }
      
      await user.save();
      console.log("Existing Telegram user updated:", user._id);
    }
    
    // Success response
    console.log("✅ Telegram login successful for user:", user._id);
    return res.status(200).json({
      message: 'Telegram login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        authMethod: user.authMethod,
        telegramId: user.telegramId,
        isVerified: user.isVerified
      },
      token: `telegram_token_${user._id}_${Date.now()}`
    });
    
  } catch (error) {
    console.error('❌ Telegram login error:', error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `User with this ${duplicateField} already exists`,
        error: `Duplicate ${duplicateField}`
      });
    }
    
    return res.status(500).json({ 
      message: 'Telegram login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  register,
  verifyAccount,
  resendVerificationCode,
  updatePassword,
  login,
  telegramLogin
};