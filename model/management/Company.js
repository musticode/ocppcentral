import mongoose from "mongoose";
import { randomUUID } from "crypto";

const companySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyId: {
    type: String,
    default: () => randomUUID()
  },
  name: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: true, sparse: true },
  phone: { type: String, required: false },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  country: { type: String, required: false },
  website: { type: String, required: false },
  taxId: { type: String, required: false },
  registrationNumber: { type: String, required: false },
  logo: { type: String, required: false },
  description: { type: String, required: false },
  paymentNeeded: { type: Boolean, default: true }, // If false, company users get idTag automatically
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

companySchema.index({ companyId: 1 }, { unique: true });

const Company = mongoose.model("Company", companySchema);

export default Company;
