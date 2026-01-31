import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  description: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Location = mongoose.model("Location", locationSchema);

export default Location;
