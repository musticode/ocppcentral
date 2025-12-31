import ChargePoint from "../../model/ocpp/ChargePoint.js";
import Connector from "../../model/ocpp/Connector.js";

export class ChargePointService {
  constructor() {
    this.chargePoint = ChargePoint;
    this.connector = Connector;
  }

  async createChargePoint(chargePointData) {
    console.log(chargePointData);

    if (
      await ChargePoint.exists({ chargePointId: chargePointData.chargePointId })
    ) {
      throw new Error("Charge point already exists");
    }

    const chargePoint = new ChargePoint(chargePointData);
    await chargePoint.save();
    return chargePoint;
  }

  async getChargePointByIdentifier(identifier) {
    return await this.chargePoint.findOne({ identifier: identifier });
  }

  async getChargePointById(id) {
    return await this.chargePoint.findById(id);
  }

  async getAllChargePoints() {
    return await this.chargePoint.find();
  }

  async updateChargePointStatus(identifier, status) {
    return await this.chargePoint.findOneAndUpdate(
      { identifier: identifier },
      { connectionStatus: status },
      { new: true }
    );
  }

  /**
   * Create or update a connector's status for a charge point
   * @param {string} chargePointIdentifier - The charge point identifier
   * @param {number} connectorId - The connector ID (0 = main, 1+ = physical connectors)
   * @param {string} status - The connector status
   * @param {object} additionalData - Optional additional data (errorCode, info, vendorId, vendorErrorCode)
   * @returns {Promise<Connector>} The created or updated connector
   */
  async createOrUpdateConnectorStatus(
    chargePointIdentifier,
    connectorId,
    status,
    additionalData = {}
  ) {
    const chargePoint = await this.getChargePointByIdentifier(
      chargePointIdentifier
    );

    if (!chargePoint) {
      throw new Error(
        `Charge point with identifier ${chargePointIdentifier} not found`
      );
    }

    // Find existing connector or create new one
    let connector = await this.connector.findOne({
      chargePointId: chargePointIdentifier,
      connectorId: connectorId,
    });

    const connectorData = {
      chargePointId: chargePointIdentifier,
      connectorId: connectorId,
      status: status,
      lastStatusUpdate: new Date(),
      ...additionalData,
    };

    if (connector) {
      // Update existing connector
      Object.assign(connector, connectorData);
      await connector.save();
    } else {
      // Create new connector
      connector = new this.connector(connectorData);
      await connector.save();
    }

    return connector;
  }

  /**
   * Get all connectors for a charge point
   * @param {string} chargePointIdentifier - The charge point identifier
   * @returns {Promise<Array>} Array of connectors
   */
  async getConnectorsByChargePoint(chargePointIdentifier) {
    return await this.connector.find({
      chargePointId: chargePointIdentifier,
    });
  }

  /**
   * Get a specific connector
   * @param {string} chargePointIdentifier - The charge point identifier
   * @param {number} connectorId - The connector ID
   * @returns {Promise<Connector>} The connector
   */
  async getConnector(chargePointIdentifier, connectorId) {
    return await this.connector.findOne({
      chargePointId: chargePointIdentifier,
      connectorId: connectorId,
    });
  }

  async updateChargePoint(id, chargePointData) {
    return await this.chargePoint.findByIdAndUpdate(id, chargePointData);
  }

  async deleteChargePoint(id) {
    return await this.chargePoint.findByIdAndDelete(id);
  }
}

export default new ChargePointService();
