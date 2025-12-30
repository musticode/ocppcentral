import StatusNotification from "../../model/ocpp/StatusNotification.js";

class StatusNotificationService {
  constructor() {
    this.statusNotification = StatusNotification;
  }

  /**
   * Save a StatusNotification record
   * @param {string} chargePointId - The charge point identifier
   * @param {number} connectorId - The connector ID (0 = main, 1+ = physical connectors)
   * @param {string} status - The connector status
   * @param {object} additionalData - Optional additional data (errorCode, info, vendorId, vendorErrorCode, timestamp)
   * @returns {Promise<StatusNotification>} The saved status notification
   */
  async saveStatusNotification(
    chargePointId,
    connectorId,
    status,
    additionalData = {}
  ) {
    const statusNotificationData = {
      chargePointId: chargePointId,
      connectorId: connectorId,
      status: status,
      timestamp: additionalData.timestamp || new Date(),
      ...additionalData,
    };

    const statusNotification = new this.statusNotification(
      statusNotificationData
    );
    await statusNotification.save();

    return statusNotification;
  }

  /**
   * Get status notifications for a charge point
   * @param {string} chargePointId - The charge point identifier
   * @param {object} options - Query options (limit, connectorId, status)
   * @returns {Promise<Array>} Array of status notifications
   */
  async getStatusNotificationsByChargePoint(chargePointId, options = {}) {
    const query = { chargePointId: chargePointId };

    if (options.connectorId !== undefined) {
      query.connectorId = options.connectorId;
    }

    if (options.status) {
      query.status = options.status;
    }

    const notifications = this.statusNotification
      .find(query)
      .sort({ timestamp: -1 });

    if (options.limit) {
      notifications.limit(options.limit);
    }

    return await notifications.exec();
  }

  /**
   * Get the latest status notification for a connector
   * @param {string} chargePointId - The charge point identifier
   * @param {number} connectorId - The connector ID
   * @returns {Promise<StatusNotification>} The latest status notification
   */
  async getLatestStatusNotification(chargePointId, connectorId) {
    return await this.statusNotification
      .findOne({
        chargePointId: chargePointId,
        connectorId: connectorId,
      })
      .sort({ timestamp: -1 });
  }
}

export default new StatusNotificationService();
