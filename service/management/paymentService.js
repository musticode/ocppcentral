import Payment from "../../model/management/Payment.js";

class PaymentService {
  constructor() {
    this.payment = Payment;
  }

  /**
   * Create a new payment
   * @param {object} paymentData - Payment data
   * @returns {Promise<Payment>} Created payment
   */
  async createPayment(paymentData) {
    if (paymentData.amount === undefined || paymentData.amount === null) {
      throw new Error("amount is required");
    }
    if (paymentData.amount < 0) {
      throw new Error("amount must be non-negative");
    }

    const payment = new this.payment(paymentData);
    await payment.save();
    return payment;
  }

  /**
   * Get payment by ID
   * @param {string} id - Payment ID
   * @returns {Promise<Payment|null>} Payment or null
   */
  async getPaymentById(id) {
    return await this.payment.findById(id);
  }

  /**
   * Get all payments with optional filters
   * @param {object} filters - Filter options (companyId, userId, status, chargePointId, idTag, from, to)
   * @returns {Promise<Array>} Array of payments
   */
  async getAllPayments(filters = {}) {
    const query = {};

    if (filters.companyId) {
      query.companyId = filters.companyId;
    }
    if (filters.userId) {
      query.userId = filters.userId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.chargePointId) {
      query.chargePointId = filters.chargePointId;
    }
    if (filters.idTag) {
      query.idTag = filters.idTag;
    }
    if (filters.transactionId !== undefined) {
      query.transactionId = filters.transactionId;
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }

    return await this.payment.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get payments by company
   * @param {string} companyId - Company ID
   * @param {object} filters - Additional filters (status, from, to)
   * @returns {Promise<Array>} Array of payments
   */
  async getPaymentsByCompany(companyId, filters = {}) {
    const query = { companyId };
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }
    return await this.payment.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get payments by user
   * @param {string} userId - User ID
   * @param {object} filters - Additional filters (status, from, to)
   * @returns {Promise<Array>} Array of payments
   */
  async getPaymentsByUser(userId, filters = {}) {
    const query = { userId };
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }
    return await this.payment.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update payment
   * @param {string} id - Payment ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Payment>} Updated payment
   */
  async updatePayment(id, updateData) {
    const payment = await this.payment.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!payment) {
      throw new Error(`Payment with id ${id} not found`);
    }

    return payment;
  }

  /**
   * Mark payment as completed (and set paidAt if not set)
   * @param {string} id - Payment ID
   * @param {object} [extra] - Extra fields (e.g. externalPaymentId)
   * @returns {Promise<Payment>} Updated payment
   */
  async completePayment(id, extra = {}) {
    const update = { status: "Completed", ...extra };
    if (!update.paidAt) update.paidAt = new Date();
    return await this.updatePayment(id, update);
  }

  /**
   * Check payment status for OCPP Authorization: block if user has outstanding
   * Pending payments or too many recent Failed payments.
   * @param {string} idTag - OCPP idTag (used to find payments by idTag)
   * @param {string} [userId] - Optional user ID (if known from IdTag) to also check payments by user
   * @returns {Promise<{ allowed: boolean, status?: string, reason?: string }>}
   */
  async checkPaymentStatusForAuthorization(idTag, userId = null) {
    const query = { status: "Pending" };
    const orConditions = [{ idTag }];
    if (userId) {
      orConditions.push({ userId });
    }
    query.$or = orConditions;

    const pendingCount = await this.payment.countDocuments(query);
    if (pendingCount > 0) {
      return {
        allowed: false,
        status: "Blocked",
        reason: "Outstanding payment(s) must be completed before charging",
      };
    }

    // Optional: block on too many recent Failed payments (e.g. last 30 days)
    const failedQuery = { status: "Failed" };
    const failedOr = [{ idTag }];
    if (userId) failedOr.push({ userId });
    failedQuery.$or = failedOr;
    failedQuery.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    const failedCount = await this.payment.countDocuments(failedQuery);
    if (failedCount >= 5) {
      return {
        allowed: false,
        status: "Blocked",
        reason: "Too many failed payments; please update payment method",
      };
    }

    return { allowed: true };
  }
}

export default new PaymentService();
