import IdTag from "../ocpp/IdTag.js";
import { Schema } from "mongoose";
import mongoose from "mongoose";
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["admin", "operator", "customer"],
    default: "customer",
  },
  companyId: { type: String }, // Optional: null for customers
  companyName: { type: String }, // Optional: null for customers
  IdTag: [{ type: mongoose.Schema.Types.ObjectId, ref: "IdTag" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
