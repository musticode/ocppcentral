import Transaction from "../../model/ocpp/Transaction.js";

class TransactionService {
  constructor() {
    this.transaction = Transaction;
  }

  /**
   * Generate a unique transactionId
   * Uses sequential approach: gets the highest transactionId and increments
   * Falls back to timestamp-based if no transactions exist
   * @returns {Promise<number>} A unique transaction ID
   */
  async generateTransactionId() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        // Try to get the highest transactionId and increment
        const lastTransaction = await this.transaction
          .findOne()
          .sort({ transactionId: -1 })
          .select("transactionId");

        let newTransactionId;
        if (lastTransaction && lastTransaction.transactionId) {
          // Increment the last transactionId
          newTransactionId = lastTransaction.transactionId + 1;
        } else {
          // First transaction - use timestamp-based ID (seconds since epoch)
          // This gives us a reasonable starting point
          newTransactionId = Math.floor(Date.now() / 1000);
        }

        // Verify the ID doesn't exist (handle race conditions)
        const exists = await this.transaction.findOne({
          transactionId: newTransactionId,
        });

        if (!exists) {
          return newTransactionId;
        }

        // If ID exists, try again with incremented value
        attempts++;
        if (attempts < maxAttempts) {
          // Wait a bit and try again
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(
          `Error generating transactionId (attempt ${attempts + 1}):`,
          error
        );
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }

    // Fallback: use timestamp with random component
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  }

  async createTransaction(transactionData) {
    // Generate transactionId if not provided
    if (!transactionData.transactionId) {
      transactionData.transactionId = await this.generateTransactionId();
    }

    // Ensure status is set to Active for new transactions
    if (!transactionData.status) {
      transactionData.status = "Active";
    }

    const transaction = new this.transaction(transactionData);
    await transaction.save();
    return transaction;
  }

  async getTransactionById(id) {
    return await this.transaction.findById(id);
  }

  /**
   * Get transaction by OCPP transactionId (the number, not MongoDB _id)
   * @param {number} transactionId - The OCPP transaction ID
   * @returns {Promise<Transaction>} The transaction
   */
  async getTransactionByTransactionId(transactionId) {
    return await this.transaction.findOne({ transactionId: transactionId });
  }

  /**
   * Get active transactions for a charge point
   * @param {string} chargePointId - The charge point identifier
   * @returns {Promise<Array>} Array of active transactions
   */
  async getActiveTransactionsByChargePoint(chargePointId) {
    return await this.transaction.find({
      chargePointId: chargePointId,
      status: "Active",
    });
  }

  /**
   * Stop a transaction and update all relevant fields
   * @param {number} transactionId - The OCPP transaction ID
   * @param {object} stopData - Data from StopTransaction request (meterStop, timestamp, reason, idTag)
   * @returns {Promise<Transaction>} The updated transaction
   */
  async stopTransaction(transactionId, stopData) {
    const transaction = await this.getTransactionByTransactionId(transactionId);

    if (!transaction) {
      throw new Error(
        `Transaction with transactionId ${transactionId} not found`
      );
    }

    // Update transaction with stop data
    transaction.stoppedAt = new Date(); // Server timestamp when transaction stopped

    // Determine status based on stop reason
    if (
      stopData.reason === "EmergencyStop" ||
      stopData.reason === "HardReset"
    ) {
      transaction.status = "Stopped";
    } else {
      transaction.status = "Completed";
    }

    if (stopData.meterStop !== undefined) {
      transaction.meterStop = stopData.meterStop;
    }

    if (stopData.reason) {
      transaction.stopReason = stopData.reason;
    }

    // Note: stopData.timestamp is the charge point's stop timestamp
    // We store server timestamp in stoppedAt, but the charge point timestamp
    // could be stored if we add a stopTimestamp field to the model
    // For now, we use stoppedAt (server timestamp)

    await transaction.save();
    return transaction;
  }

  async getAllTransactions() {
    return await this.transaction.find();
  }

  async updateTransaction(id, transactionData) {
    return await this.transaction.findByIdAndUpdate(id, transactionData);
  }

  async deleteTransaction(id) {
    return await this.transaction.findByIdAndDelete(id);
  }
}

export default new TransactionService();
