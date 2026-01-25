import User from "../../model/management/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check if password is hashed or plain text (for migration purposes)
    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      // Password is hashed
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      // Password is plain text (legacy), compare and hash it
      isPasswordValid = user.password === password;
      if (isPasswordValid) {
        // Update to hashed password
        user.password = await hashPassword(password);
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.companyName,
    };

    return {
      success: true,
      message: "Login successful",
      token,
      user: userData,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const registerUser = async (name, email, password) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword });

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.companyName,
    };

    return {
      success: true,
      message: "User registered successfully",
      token,
      user: userData,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const logoutUser = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    // With JWT, logout is typically handled client-side by removing the token
    // Server-side logout would require token blacklisting (not implemented here)
    return { success: true, message: "Logout successful" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: "If user exists, password reset email will be sent",
      };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: "password-reset" },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "1h" }
    );

    // TODO: Send email with reset token
    // For now, return the token (in production, send via email)
    return {
      success: true,
      message: "Password reset token generated",
      resetToken, // Remove this in production and send via email instead
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const resetPassword = async (email, password, resetToken = null) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // If resetToken is provided, verify it
    if (resetToken) {
      try {
        const decoded = jwt.verify(
          resetToken,
          process.env.JWT_SECRET || "your-secret-key-change-in-production"
        );
        if (
          decoded.type !== "password-reset" ||
          decoded.userId !== user._id.toString()
        ) {
          return { success: false, message: "Invalid or expired reset token" };
        }
      } catch (error) {
        return { success: false, message: "Invalid or expired reset token" };
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Verify JWT token (for middleware use)
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );
    return { success: true, decoded };
  } catch (error) {
    return { success: false, message: "Invalid or expired token" };
  }
};
