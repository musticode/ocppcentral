import Notification from "../../model/management/Notification.js";

class NotificationService {
  constructor() {
    this.notification = Notification;
  }

  async getAllNotifications(filters = {}) {
    const { userId, isRead, isDeleted = false, limit, skip } = filters;
    const query = { isDeleted };
    if (userId != null) query.userId = userId;
    if (typeof isRead === "boolean") query.isRead = isRead;

    const q = this.notification.find(query).sort({ createdAt: -1 });
    if (skip != null) q.skip(skip);
    if (limit != null) q.limit(limit);
    return await q.lean();
  }

  async getNotificationById(id) {
    return await this.notification.findOne({ _id: id, isDeleted: false });
  }

  async createNotification(notificationData) {
    const notification = new this.notification(notificationData);
    await notification.save();
    return notification;
  }

  async updateNotification(id, updateData) {
    const allowed = ["title", "message", "type", "isRead", "isArchived"];
    const payload = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) payload[key] = updateData[key];
    }
    payload.updatedAt = new Date();
    return await this.notification.findOneAndUpdate(
      { _id: id, isDeleted: false },
      payload,
      { new: true }
    );
  }

  async markAsRead(id) {
    return await this.notification.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isRead: true, updatedAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId = null) {
    const query = { isDeleted: false, isRead: false };
    if (userId != null) query.userId = userId;
    const result = await this.notification.updateMany(query, {
      isRead: true,
      updatedAt: new Date(),
    });
    return result.modifiedCount;
  }

  async getUnreadCount(userId = null) {
    const query = { isDeleted: false, isRead: false };
    if (userId != null) query.userId = userId;
    return await this.notification.countDocuments(query);
  }

  async softDelete(id) {
    return await this.notification.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );
  }

  async hardDelete(id) {
    return await this.notification.findByIdAndDelete(id);
  }
}

export default new NotificationService();
