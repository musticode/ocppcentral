import Transaction from "../../model/ocpp/Transaction.js";

class TransactionService {
  constructor() {
    this.transaction = Transaction;
  }

  async createTransaction(transactionData) {
    const transaction = new this.transaction(transactionData);
    await transaction.save();
    return transaction;
  }

  async getTransactionById(id) {
    return await this.transaction.findById(id);
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

// export const createTransaction = async (transactionData) => {
//   const transaction = new Transaction(transactionData);
//   await transaction.save();
//   return transaction;
// };

// export const fetchTransactionsByCompanyName = async (companyName) => {
//   return await Transaction.find({ companyName: companyName }).populate(
//     "chargePointId"
//   );
// };

// export const getTransactionById = async (id) => {
//   return await Transaction.findById(id);
// };

// export const getAllTransactions = async () => {
//   return await Transaction.find();
// };

// export const updateTransaction = async (id, transactionData) => {
//   return await Transaction.findByIdAndUpdate(id, transactionData);
// };

// export const deleteTransaction = async (id) => {
//   return await Transaction.findByIdAndDelete(id);
// };
