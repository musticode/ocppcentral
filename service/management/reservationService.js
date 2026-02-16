import ChargePoint from "../../model/ocpp/ChargePoint.js";
import Connector from "../../model/ocpp/Connector.js";
import Reservation from "../../model/ocpp/Reservation.js";

/**
 * ReservationService - Handles OCPP 1.6 Reservation operations
 *
 * OCPP 1.6 ReservationStatus:
 * - Accepted: Reservation accepted, connector reserved
 * - Faulted: Reservation failed due to fault
 * - Occupied: Connector in use, cannot reserve
 * - Rejected: Reservation rejected (other reasons)
 * - Unavailable: Connector unavailable
 */
class ReservationService {
  constructor() {
    this.reservation = Reservation;
  }

  /**
   * Generate a unique reservationId
   * Uses sequential approach: gets the highest reservationId and increments
   * @returns {Promise<number>} A unique reservation ID
   */
  async generateReservationId() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const lastReservation = await this.reservation
          .findOne()
          .sort({ reservationId: -1 })
          .select("reservationId");

        let newReservationId;
        if (lastReservation && lastReservation.reservationId) {
          newReservationId = lastReservation.reservationId + 1;
        } else {
          newReservationId = Math.floor(Date.now() / 1000);
        }

        const exists = await this.reservation.findOne({
          reservationId: newReservationId,
        });

        if (!exists) {
          return newReservationId;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(
          `Error generating reservationId (attempt ${attempts + 1}):`,
          error
        );
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }

    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  }

  /**
   * Create a new reservation in the database
   * @param {Object} reservationData - Reservation data
   * @param {string} reservationData.chargePointId - Charge point identifier
   * @param {number} [reservationData.connectorId] - Connector ID (optional, null = any connector)
   * @param {string} reservationData.idTag - IdTag for the reservation
   * @param {string} reservationData.expiryDate - ISO 8601 expiry date
   * @param {number} [reservationData.reservationId] - Optional reservation ID (auto-generated if not provided)
   * @param {string} [reservationData.parentIdTag] - Parent idTag for group authorization
   * @returns {Promise<Reservation>} The created reservation
   */
  async createReservation(reservationData) {
    const { chargePointId, connectorId, idTag, expiryDate, reservationId, parentIdTag } = reservationData;

    if (!chargePointId) throw new Error("chargePointId is required");
    if (!idTag) throw new Error("idTag is required");
    if (!expiryDate) throw new Error("expiryDate is required");

    const chargePoint = await ChargePoint.findOne({ identifier: chargePointId });
    if (!chargePoint) {
      throw new Error(`Charge point ${chargePointId} not found`);
    }

    if (connectorId != null) {
      const connector = await Connector.findOne({
        chargePointId: chargePointId,
        connectorId: connectorId,
      });
      if (!connector) {
        throw new Error(`Connector ${connectorId} not found for charge point ${chargePointId}`);
      }
    }

    const newReservationId = reservationId || await this.generateReservationId();

    const reservation = new this.reservation({
      reservationId: newReservationId,
      chargePointId,
      connectorId: connectorId || null,
      idTag,
      expiryDate: new Date(expiryDate),
      parentIdTag: parentIdTag || null,
      status: "Active",
    });

    await reservation.save();
    return reservation;
  }

  /**
   * Update reservation status based on OCPP ReserveNow response
   * @param {number} reservationId - The reservation ID
   * @param {string} status - OCPP status (Accepted, Faulted, Occupied, Rejected, Unavailable)
   * @returns {Promise<Reservation>} The updated reservation
   */
  async updateReservationStatus(reservationId, status) {
    const reservation = await this.reservation.findOne({ reservationId });
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (status === "Accepted") {
      reservation.status = "Active";
    } else {
      reservation.status = "Cancelled";
      reservation.cancelledAt = new Date();
      reservation.cancelledBy = "system";
      reservation.cancellationReason = `OCPP ReserveNow response: ${status}`;
    }

    await reservation.save();
    return reservation;
  }

  /**
   * Mark a reservation as used when a transaction starts
   * @param {number} reservationId - The reservation ID
   * @param {number} transactionId - The transaction ID that used this reservation
   * @returns {Promise<Reservation>} The updated reservation
   */
  async markReservationAsUsed(reservationId, transactionId) {
    const reservation = await this.reservation.findOne({ reservationId });
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    reservation.status = "Used";
    reservation.transactionId = transactionId;
    await reservation.save();
    return reservation;
  }

  /**
   * Cancel a reservation
   * @param {number} reservationId - The reservation ID to cancel
   * @param {string} [cancelledBy] - Who cancelled the reservation (user/system)
   * @param {string} [reason] - Cancellation reason
   * @returns {Promise<Reservation>} The cancelled reservation
   */
  async cancelReservation(reservationId, cancelledBy = "user", reason = null) {
    const reservation = await this.reservation.findOne({ reservationId });
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (reservation.status === "Used") {
      throw new Error("Cannot cancel a reservation that has already been used");
    }

    if (reservation.status === "Cancelled") {
      throw new Error("Reservation is already cancelled");
    }

    if (reservation.status === "Expired") {
      throw new Error("Cannot cancel an expired reservation");
    }

    reservation.status = "Cancelled";
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = cancelledBy;
    if (reason) {
      reservation.cancellationReason = reason;
    }

    await reservation.save();
    return reservation;
  }

  /**
   * Get reservation by reservationId
   * @param {number} reservationId - The reservation ID
   * @returns {Promise<Reservation>} The reservation
   */
  async getReservationById(reservationId) {
    return await this.reservation.findOne({ reservationId });
  }

  /**
   * Get reservation by MongoDB _id
   * @param {string} id - The MongoDB document ID
   * @returns {Promise<Reservation>} The reservation
   */
  async getReservationByMongoId(id) {
    return await this.reservation.findById(id);
  }

  /**
   * List reservations with optional filters
   * @param {Object} filters - Query filters
   * @param {string} [filters.chargePointId] - Filter by charge point
   * @param {string} [filters.idTag] - Filter by idTag
   * @param {string} [filters.status] - Filter by status (Active, Used, Expired, Cancelled)
   * @param {boolean} [filters.isActive] - Filter active reservations (not expired/cancelled/used)
   * @returns {Promise<Array>} Array of reservations
   */
  async listReservations(filters = {}) {
    const query = {};

    if (filters.chargePointId) query.chargePointId = filters.chargePointId;
    if (filters.idTag) query.idTag = filters.idTag;
    if (filters.status) query.status = filters.status;
    if (filters.isActive) {
      query.status = "Active";
      query.expiryDate = { $gt: new Date() };
    }

    return await this.reservation
      .find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get active reservation for a specific connector
   * @param {string} chargePointId - Charge point identifier
   * @param {number} connectorId - Connector ID
   * @returns {Promise<Reservation|null>} Active reservation or null
   */
  async getActiveReservationForConnector(chargePointId, connectorId) {
    return await this.reservation.findOne({
      chargePointId,
      connectorId,
      status: "Active",
      expiryDate: { $gt: new Date() },
    });
  }

  /**
   * Get active reservation for a charge point (any connector)
   * @param {string} chargePointId - Charge point identifier
   * @returns {Promise<Reservation|null>} Active reservation or null
   */
  async getActiveReservationForChargePoint(chargePointId) {
    return await this.reservation.findOne({
      chargePointId,
      status: "Active",
      expiryDate: { $gt: new Date() },
    });
  }

  /**
   * Check if an idTag has an active reservation
   * @param {string} idTag - The idTag to check
   * @param {string} [chargePointId] - Optional charge point to check
   * @returns {Promise<Reservation|null>} Active reservation or null
   */
  async getActiveReservationForIdTag(idTag, chargePointId = null) {
    const query = {
      idTag,
      status: "Active",
      expiryDate: { $gt: new Date() },
    };
    if (chargePointId) query.chargePointId = chargePointId;
    return await this.reservation.findOne(query);
  }

  /**
   * Expire outdated reservations (status = Active but expiryDate passed)
   * @returns {Promise<number>} Number of reservations expired
   */
  async expireOldReservations() {
    const result = await this.reservation.updateMany(
      {
        status: "Active",
        expiryDate: { $lte: new Date() },
      },
      {
        $set: {
          status: "Expired",
        },
      }
    );
    return result.modifiedCount;
  }

  /**
   * Delete a reservation (only for admin/cleanup purposes)
   * @param {number} reservationId - The reservation ID
   * @returns {Promise<Reservation>} The deleted reservation
   */
  async deleteReservation(reservationId) {
    const reservation = await this.reservation.findOne({ reservationId });
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }
    await this.reservation.deleteOne({ reservationId });
    return reservation;
  }

  /**
   * Validate if a reservation can be made
   * @param {string} chargePointId - Charge point identifier
   * @param {number} [connectorId] - Connector ID (optional)
   * @param {string} idTag - IdTag requesting reservation
   * @returns {Promise<Object>} Validation result
   */
  async validateReservation(chargePointId, connectorId, idTag) {
    const chargePoint = await ChargePoint.findOne({ identifier: chargePointId });
    if (!chargePoint) {
      return { valid: false, reason: "Charge point not found" };
    }

    if (chargePoint.connectionStatus !== "Connected") {
      return { valid: false, reason: "Charge point not connected" };
    }

    if (connectorId != null) {
      const connector = await Connector.findOne({
        chargePointId: chargePointId,
        connectorId: connectorId,
      });
      if (!connector) {
        return { valid: false, reason: "Connector not found" };
      }
      if (connector.status === "Occupied") {
        return { valid: false, reason: "Connector is occupied" };
      }
      if (connector.status === "Faulted") {
        return { valid: false, reason: "Connector is faulted" };
      }
      if (connector.status === "Unavailable") {
        return { valid: false, reason: "Connector is unavailable" };
      }

      const existingReservation = await this.getActiveReservationForConnector(
        chargePointId,
        connectorId
      );
      if (existingReservation) {
        return { valid: false, reason: "Connector already reserved" };
      }
    } else {
      const existingReservation = await this.getActiveReservationForChargePoint(
        chargePointId
      );
      if (existingReservation) {
        return { valid: false, reason: "Charge point already has a reservation" };
      }
    }

    return { valid: true };
  }
}

export default new ReservationService();