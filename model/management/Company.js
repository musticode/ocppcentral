import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phone: { type: String, required: false },
  email: { type: String, required: false, unique: true },
  website: { type: String, required: false },
  logo: { type: String, required: false },
  description: { type: String, required: false },
  paymentNeeded: { type: Boolean, default: true }, // If false, company users get idTag automatically
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Company = mongoose.model("Company", companySchema);

export default Company;
