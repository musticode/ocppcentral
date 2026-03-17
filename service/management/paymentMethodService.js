import PaymentMethod from "../../model/management/PaymentMethod.js";
import User from "../../model/management/User.js";

class PaymentMethodService {
  async createPaymentMethod({
    userId,
    type,
    provider,
    cardLast4,
    cardBrand,
    cardExpMonth,
    cardExpYear,
    bankAccountLast4,
    bankName,
    paypalEmail,
    externalId,
    externalCustomerId,
    isActive,
    isVerified,
    isDefault,
    billingAddress,
    metadata,
  }) {
    if (!userId) throw new Error("userId is required");
    if (!type) throw new Error("type is required");
    if (!provider) throw new Error("provider is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (type === "credit_card" || type === "debit_card") {
      if (!cardLast4) throw new Error("cardLast4 is required for card payments");
      if (!cardExpMonth) throw new Error("cardExpMonth is required for card payments");
      if (!cardExpYear) throw new Error("cardExpYear is required for card payments");
    }

    const userPaymentMethods = await PaymentMethod.countDocuments({ userId });
    const shouldBeActive = userPaymentMethods === 0 || isActive === true;

    const paymentMethod = new PaymentMethod({
      userId,
      type,
      provider,
      cardLast4,
      cardBrand,
      cardExpMonth,
      cardExpYear,
      bankAccountLast4,
      bankName,
      paypalEmail,
      externalId,
      externalCustomerId,
      isActive: shouldBeActive,
      isVerified: isVerified || false,
      isDefault: isDefault || false,
      billingAddress,
      metadata,
      status: "active",
    });

    await paymentMethod.save();
    return paymentMethod;
  }

  async getPaymentMethodById(paymentMethodId) {
    const paymentMethod = await PaymentMethod.findById(paymentMethodId).populate(
      "userId",
      "name email role"
    );
    if (!paymentMethod) throw new Error("Payment method not found");
    return paymentMethod;
  }

  async listPaymentMethods({ userId, isActive, status, type, provider } = {}) {
    const query = {};
    if (userId) query.userId = userId;
    if (isActive !== undefined) query.isActive = isActive;
    if (status) query.status = status;
    if (type) query.type = type;
    if (provider) query.provider = provider;

    return await PaymentMethod.find(query)
      .populate("userId", "name email role")
      .sort({ isActive: -1, isDefault: -1, createdAt: -1 });
  }

  async listPaymentMethodsByUser(userId) {
    if (!userId) throw new Error("userId is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    return await PaymentMethod.find({ userId }).sort({
      isActive: -1,
      isDefault: -1,
      createdAt: -1,
    });
  }

  async getActivePaymentMethod(userId) {
    if (!userId) throw new Error("userId is required");

    const paymentMethod = await PaymentMethod.findOne({
      userId,
      isActive: true,
      status: "active",
    });

    return paymentMethod;
  }

  async setActivePaymentMethod(userId, paymentMethodId) {
    if (!userId) throw new Error("userId is required");
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId,
    });

    if (!paymentMethod) throw new Error("Payment method not found");

    if (paymentMethod.status === "expired") {
      throw new Error("Cannot activate expired payment method");
    }

    await PaymentMethod.updateMany({ userId }, { isActive: false });

    paymentMethod.isActive = true;
    paymentMethod.status = "active";
    await paymentMethod.save();

    return paymentMethod;
  }

  async updatePaymentMethod(paymentMethodId, updateData) {
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) throw new Error("Payment method not found");

    const allowedUpdates = [
      "cardExpMonth",
      "cardExpYear",
      "billingAddress",
      "isDefault",
      "metadata",
      "status",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        paymentMethod[key] = updateData[key];
      }
    });

    paymentMethod.updatedAt = new Date();
    await paymentMethod.save();

    return await this.getPaymentMethodById(paymentMethodId);
  }

  async verifyPaymentMethod(paymentMethodId) {
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) throw new Error("Payment method not found");

    paymentMethod.isVerified = true;
    paymentMethod.status = "active";
    await paymentMethod.save();

    return paymentMethod;
  }

  async recordPaymentAttempt(paymentMethodId, success = true) {
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) throw new Error("Payment method not found");

    if (success) {
      paymentMethod.lastUsedAt = new Date();
      paymentMethod.failedAttempts = 0;
      paymentMethod.status = "active";
    } else {
      paymentMethod.failedAttempts += 1;
      if (paymentMethod.failedAttempts >= 3) {
        paymentMethod.status = "failed";
        paymentMethod.isActive = false;
      }
    }

    await paymentMethod.save();
    return paymentMethod;
  }

  async deletePaymentMethod(paymentMethodId) {
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) throw new Error("Payment method not found");

    if (paymentMethod.isActive) {
      const otherMethods = await PaymentMethod.find({
        userId: paymentMethod.userId,
        _id: { $ne: paymentMethodId },
        status: "active",
      }).sort({ createdAt: -1 });

      if (otherMethods.length > 0) {
        otherMethods[0].isActive = true;
        await otherMethods[0].save();
      }
    }

    await PaymentMethod.findByIdAndDelete(paymentMethodId);
    return paymentMethod;
  }

  async deactivatePaymentMethod(paymentMethodId) {
    if (!paymentMethodId) throw new Error("paymentMethodId is required");

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) throw new Error("Payment method not found");

    paymentMethod.isActive = false;
    paymentMethod.status = "inactive";
    paymentMethod.updatedAt = new Date();
    await paymentMethod.save();

    return paymentMethod;
  }

  async checkUserHasActivePayment(userId) {
    if (!userId) throw new Error("userId is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.role === "admin" || user.role === "operator") {
      return {
        hasActivePayment: true,
        requiresPayment: false,
        role: user.role,
      };
    }

    const activePayment = await this.getActivePaymentMethod(userId);

    return {
      hasActivePayment: !!activePayment,
      requiresPayment: user.role === "customer",
      role: user.role,
      paymentMethod: activePayment,
    };
  }

  async expireOldPaymentMethods() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const expiredMethods = await PaymentMethod.find({
      $or: [
        { cardExpYear: { $lt: currentYear } },
        {
          cardExpYear: currentYear,
          cardExpMonth: { $lt: currentMonth },
        },
      ],
      status: { $ne: "expired" },
    });

    for (const method of expiredMethods) {
      method.status = "expired";
      method.isActive = false;
      await method.save();
    }

    return expiredMethods.length;
  }

  async getPaymentStats(userId = null) {
    const query = userId ? { userId } : {};

    const totalMethods = await PaymentMethod.countDocuments(query);
    const activeMethods = await PaymentMethod.countDocuments({
      ...query,
      isActive: true,
    });
    const verifiedMethods = await PaymentMethod.countDocuments({
      ...query,
      isVerified: true,
    });
    const expiredMethods = await PaymentMethod.countDocuments({
      ...query,
      status: "expired",
    });

    const typeDistribution = await PaymentMethod.aggregate([
      { $match: query },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const providerDistribution = await PaymentMethod.aggregate([
      { $match: query },
      { $group: { _id: "$provider", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalMethods,
      activeMethods,
      verifiedMethods,
      expiredMethods,
      typeDistribution,
      providerDistribution,
    };
  }
}

export default new PaymentMethodService();
