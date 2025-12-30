import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  website: { type: String, required: true },
  logo: { type: String, required: true },
  description: { type: String, required: true },
  paymentNeeded: { type: Boolean, default: true }, // If false, company users get idTag automatically
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Company = mongoose.model("Company", companySchema);

export default Company;
