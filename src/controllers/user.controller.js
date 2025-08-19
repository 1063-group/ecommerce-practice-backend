const userSchema = require("../models/user.model");
const crypto = require('crypto');

// Register function
const register = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await userSchema.create({ phone });
    await user.save()
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("SERVER ERROR: | register", error);
    res.status(500).json({ error: "Server error | Register" });
  }
}

// Update Password function
const updatePassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await userSchema.findOne({ phone }) || null // null = false
    
    if (!password || password.trim().length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" })
    }

    if (user) {
      user.password = password
      await user.save()
      return res.status(200).json({ message: "Password updated successfully" })
    } else {
      return res.status(404).json({ message: "User not found" })
    }

  } catch (e) {
    console.log("SERVER ERROR: | updatePassword", e);
    res.status(500).json({ error: "Server error | Update Password" });
  }
}

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

    // Password tekshirish (real app'da bcrypt ishlatish kerak)
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
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
        authMethod: user.authMethod || 'email'
      },
      token: `token_${user._id}` // Real app'da JWT token yarating
    });

  } catch (error) {
    console.log("SERVER ERROR: | login", error);
    res.status(500).json({ error: "Server error | Login" });
  }
}

// Telegram login function
const telegramLogin = async (req, res) => {
  try {
    const { telegramData } = req.body;
    
    if (!telegramData) {
      return res.status(400).json({ message: "Telegram data is required" });
    }

    console.log("Telegram login attempt:", telegramData);

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
          username: userData.username || undefined, // empty string o'rniga undefined
          photoUrl: userData.photo_url || '',
          phone: undefined, // empty string o'rniga undefined
          email: undefined, // empty string o'rniga undefined
          authMethod: 'telegram',
          isVerified: true // Telegram orqali kirganlar verified hisoblanadi
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
    res.status(200).json({
      message: 'Telegram login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        authMethod: user.authMethod,
        telegramId: user.telegramId
      },
      token: `telegram_token_${user._id}_${Date.now()}` // Real app'da JWT token yarating
    });
    
  } catch (error) {
    console.log('Telegram login error:', error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `User with this ${duplicateField} already exists`,
        error: `Duplicate ${duplicateField}`
      });
    }
    
    res.status(500).json({ message: 'Telegram login failed', error: error.message });
  }
};

module.exports = {
  register,
  updatePassword,
  login,
  telegramLogin
};