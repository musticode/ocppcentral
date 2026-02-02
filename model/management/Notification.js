import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["info", "warning", "alert", "success"],
    default: "info",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null,
  },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

notificationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
