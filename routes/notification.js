import express from "express";
import notificationService from "../service/management/notificationService.js";

const router = express.Router();

// List notifications (optional: userId, isRead, limit, skip) - before /:id
router.get("/", async (req, res) => {
  try {
    const { userId, isRead, limit, skip } = req.query;
    const filters = {
      userId: userId || undefined,
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      limit: limit != null ? parseInt(limit, 10) : undefined,
      skip: skip != null ? parseInt(skip, 10) : undefined,
    };
    const notifications = await notificationService.getAllNotifications(
      filters
    );
    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Unread count (optional: userId) - before /:id
router.get("/unread-count", async (req, res) => {
  try {
    const { userId } = req.query;
    const count = await notificationService.getUnreadCount(userId || null);
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Mark all as read (optional: userId in body)
router.patch("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    const modifiedCount = await notificationService.markAllAsRead(
      userId ?? null
    );
    res.json({
      success: true,
      data: { modifiedCount },
      message: `${modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required",
      });
    }
    const notification = await notificationService.createNotification({
      title,
      message,
      type,
      userId: userId || null,
    });
    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get notification by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.getNotificationById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update notification
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, isRead, isArchived } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const notification = await notificationService.updateNotification(
      id,
      updateData
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Mark single notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }
    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Soft delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.softDelete(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }
    res.json({
      success: true,
      data: notification,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
