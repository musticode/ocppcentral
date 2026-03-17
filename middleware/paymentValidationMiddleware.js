import paymentMethodService from "../service/management/paymentMethodService.js";
import User from "../model/management/User.js";

/**
 * Middleware to validate that a customer has an active payment method before charging
 * Admin and operator roles can charge without payment methods
 * Customers must have an active, verified payment method
 */
export const validatePaymentForCharging = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin" || user.role === "operator") {
      req.userCanCharge = true;
      req.requiresPayment = false;
      return next();
    }

    if (user.role === "customer") {
      const paymentCheck = await paymentMethodService.checkUserHasActivePayment(userId);

      if (!paymentCheck.hasActivePayment) {
        return res.status(403).json({
          success: false,
          message: "Active payment method required. Please add a payment method to start charging.",
          requiresPayment: true,
          hasActivePayment: false,
        });
      }

      const activePayment = paymentCheck.paymentMethod;
      
      if (!activePayment.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Payment method must be verified before charging.",
          requiresPayment: true,
          hasActivePayment: true,
          isVerified: false,
        });
      }

      if (activePayment.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Payment method is ${activePayment.status}. Please update or add a new payment method.`,
          requiresPayment: true,
          hasActivePayment: true,
          paymentStatus: activePayment.status,
        });
      }

      req.userCanCharge = true;
      req.requiresPayment = true;
      req.activePaymentMethod = activePayment;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Invalid user role",
    });
  } catch (error) {
    console.error("Payment validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating payment method",
      error: error.message,
    });
  }
};

/**
 * Middleware to check payment status without blocking the request
 * Adds payment information to the request object
 */
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);
    if (!user) {
      return next();
    }

    const paymentCheck = await paymentMethodService.checkUserHasActivePayment(userId);
    
    req.paymentStatus = {
      role: user.role,
      hasActivePayment: paymentCheck.hasActivePayment,
      requiresPayment: paymentCheck.requiresPayment,
      paymentMethod: paymentCheck.paymentMethod,
      canCharge: user.role === "admin" || user.role === "operator" || paymentCheck.hasActivePayment,
    };

    return next();
  } catch (error) {
    console.error("Payment status check error:", error);
    return next();
  }
};

/**
 * Middleware to validate payment for specific operations
 * Can be configured with options
 */
export const requireActivePayment = (options = {}) => {
  const { allowOperator = true, allowAdmin = true } = options;

  return async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (allowAdmin && user.role === "admin") {
        return next();
      }

      if (allowOperator && user.role === "operator") {
        return next();
      }

      const paymentCheck = await paymentMethodService.checkUserHasActivePayment(userId);

      if (!paymentCheck.hasActivePayment) {
        return res.status(403).json({
          success: false,
          message: "Active payment method required",
          requiresPayment: true,
        });
      }

      return next();
    } catch (error) {
      console.error("Payment requirement error:", error);
      return res.status(500).json({
        success: false,
        message: "Error validating payment requirement",
        error: error.message,
      });
    }
  };
};
