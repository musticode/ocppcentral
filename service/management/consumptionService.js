import Consumption from "../../model/management/Consumption.js";
import Transaction from "../../model/ocpp/Transaction.js";
import {
  getActivePricingForChargePoint,
  getPricePerKwh,
} from "./pricingService.js";
import tariffService from "./tariffService.js";
import chargePointService from "./chargePointService.js";

/**
 * Resolve tariff for the transaction's charge point and connector.
 * Tries both charge point identifier (OCPP identity) and ChargePoint._id so tariffs
 * work whether they were created with identifier or MongoDB id.
 */
async function getTariffForTransaction(transaction) {
  const dateTime = transaction.startedAt || new Date();
  // First try with transaction.chargePointId (OCPP identifier, e.g. client.identity)
  let priceInfo = await tariffService.getPriceForConnector(
    transaction.chargePointId,
    transaction.connectorId,
    dateTime,
  );
  if (priceInfo && priceInfo.tariff) return priceInfo;
  // Resolve charge point and try with MongoDB _id (in case tariff was created with _id)
  const chargePoint = await chargePointService.getChargePointByIdentifier(
    transaction.chargePointId,
  );
  if (chargePoint && chargePoint._id) {
    priceInfo = await tariffService.getPriceForConnector(
      chargePoint._id.toString(),
      transaction.connectorId,
      dateTime,
    );
    if (priceInfo && priceInfo.tariff) return priceInfo;
  }
  return null;
}

/**
 * Create consumption record from transaction when charge stops.
 * Uses the related charge point's connector tariff (or charge point pricing fallback).
 */
export const createConsumptionFromTransaction = async (transactionId) => {
  // Find the transaction
  const transaction = await Transaction.findOne({ transactionId });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  if (!transaction.meterStop) {
    throw new Error(`Transaction ${transactionId} has no meterStop value`);
  }

  // Get pricing for the transaction
  // Priority: 1. Tariff (connector-specific for this charge point), 2. Pricing (charge point level)
  let pricing = null;
  let tariff = null;
  let pricePerKwh = null;
  let connectionFee = 0;
  let currency = "USD";

  try {
    // First, get connector tariff for this charge point (tries identifier and ChargePoint _id)
    const priceInfo = await getTariffForTransaction(transaction);

    if (priceInfo && priceInfo.tariff) {
      tariff = priceInfo.tariff;
      pricePerKwh = priceInfo.pricePerKwh;
      connectionFee = priceInfo.connectionFee || 0;
      currency = priceInfo.currency || "USD";
      console.log(
        `Using tariff for transaction ${transactionId} (chargePoint ${transaction.chargePointId}, connector ${transaction.connectorId}): ${tariff.name}`,
      );
    } else {
      // Fall back to pricing (charge point level)
      pricing = await getActivePricingForChargePoint(
        transaction.chargePointId,
        transaction.startedAt,
      );

      if (pricing) {
        pricePerKwh = pricing.getPriceForDateTime(transaction.startedAt);
        connectionFee = pricing.connectionFee || 0;
        currency = pricing.currency || "USD";
        console.log(
          `Using pricing for transaction ${transactionId}: ${pricing.name}`,
        );
      }
    }
  } catch (error) {
    console.warn(
      `Could not get pricing/tariff for transaction ${transactionId}:`,
      error.message,
    );
  }

  // Check if consumption already exists for this transaction
  const existingConsumption = await Consumption.findOne({ transactionId });
  if (existingConsumption) {
    throw new Error(
      `Consumption record already exists for transaction ${transactionId}`,
    );
  }

  // Calculate energy consumed (assuming meter values are in Wh)
  const energyConsumed =
    (transaction.meterStop - transaction.meterStart) / 1000; // Convert to kWh

  // Calculate costs
  const energyCost = pricePerKwh ? energyConsumed * pricePerKwh : null;
  const totalCost = energyCost ? energyCost + connectionFee : null;

  // Calculate duration
  const duration =
    transaction.stoppedAt && transaction.startedAt
      ? (transaction.stoppedAt - transaction.startedAt) / 1000
      : null;

  // Create consumption record
  const consumptionData = {
    transactionId: transaction.transactionId,
    chargePointId: transaction.chargePointId,
    connectorId: transaction.connectorId,
    idTag: transaction.idTag,
    meterStart: transaction.meterStart,
    meterStop: transaction.meterStop,
    energyConsumed,
    pricingId: pricing?._id, // Keep pricingId for backward compatibility
    tariffId: tariff?._id, // Store tariff ID if tariff was used
    pricePerKwh,
    connectionFee,
    energyCost,
    totalCost,
    currency,
    transactionStartTime: transaction.startedAt,
    transactionStopTime: transaction.stoppedAt,
    timestamp: transaction.stoppedAt || new Date(),
    duration,
  };

  const consumption = new Consumption(consumptionData);
  await consumption.save();

  return consumption;
};

/**
 * Create consumption record manually
 */
export const createConsumption = async (consumptionData) => {
  // If transactionId is provided, try to get pricing from transaction
  if (consumptionData.transactionId) {
    const transaction = await Transaction.findOne({
      transactionId: consumptionData.transactionId,
    });

    if (transaction) {
      consumptionData.chargePointId =
        consumptionData.chargePointId || transaction.chargePointId;
      consumptionData.connectorId =
        consumptionData.connectorId || transaction.connectorId;
      consumptionData.idTag = consumptionData.idTag || transaction.idTag;
      consumptionData.meterStart =
        consumptionData.meterStart || transaction.meterStart;
      consumptionData.transactionStartTime =
        consumptionData.transactionStartTime || transaction.startedAt;

      // Get pricing/tariff if not provided
      if (!consumptionData.pricePerKwh && transaction.chargePointId) {
        try {
          // First, check for tariff (connector-specific)
          const priceInfo = await tariffService.getPriceForConnector(
            transaction.chargePointId,
            transaction.connectorId,
            transaction.startedAt || new Date(),
          );

          if (priceInfo && priceInfo.tariff) {
            consumptionData.tariffId = priceInfo.tariff._id;
            consumptionData.pricePerKwh = priceInfo.pricePerKwh;
            consumptionData.connectionFee = priceInfo.connectionFee || 0;
            consumptionData.currency = priceInfo.currency || "USD";
          } else {
            // Fall back to pricing (charge point level)
            const pricing = await getActivePricingForChargePoint(
              transaction.chargePointId,
              transaction.startedAt || new Date(),
            );
            if (pricing) {
              consumptionData.pricingId = pricing._id;
              consumptionData.pricePerKwh = pricing.getPriceForDateTime(
                transaction.startedAt || new Date(),
              );
              consumptionData.connectionFee = pricing.connectionFee || 0;
              consumptionData.currency = pricing.currency || "USD";
            }
          }
        } catch (error) {
          console.warn("Could not get pricing/tariff:", error.message);
        }
      }
    }
  }

  const consumption = new Consumption(consumptionData);
  await consumption.save();

  return consumption;
};

/**
 * Get consumption by ID
 */
export const getConsumptionById = async (id) => {
  const consumption = await Consumption.findById(id).populate("pricingId");

  // Get transaction separately since transactionId is a Number, not ObjectId
  if (consumption && consumption.transactionId) {
    const Transaction = (await import("../../model/ocpp/Transaction.js"))
      .default;
    consumption.transaction = await Transaction.findOne({
      transactionId: consumption.transactionId,
    });
  }

  return consumption;
};

/**
 * Get all consumption records
 */
export const getAllConsumption = async (filters = {}) => {
  const query = {};

  if (filters.chargePointId) {
    query.chargePointId = filters.chargePointId;
  }

  if (filters.idTag) {
    query.idTag = filters.idTag;
  }

  if (filters.transactionId) {
    query.transactionId = filters.transactionId;
  }

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const consumptions = await Consumption.find(query)
    .populate("pricingId")
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100);

  // Optionally populate transactions if needed
  if (filters.populateTransaction) {
    const Transaction = (await import("../../model/ocpp/Transaction.js"))
      .default;
    for (const consumption of consumptions) {
      if (consumption.transactionId) {
        consumption.transaction = await Transaction.findOne({
          transactionId: consumption.transactionId,
        });
      }
    }
  }

  return consumptions;
};

/**
 * Get consumption statistics
 */
export const getConsumptionStatistics = async (filters = {}) => {
  const matchQuery = {};

  if (filters.chargePointId) {
    matchQuery.chargePointId = filters.chargePointId;
  }

  if (filters.idTag) {
    matchQuery.idTag = filters.idTag;
  }

  if (filters.startDate || filters.endDate) {
    matchQuery.timestamp = {};
    if (filters.startDate) {
      matchQuery.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchQuery.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const stats = await Consumption.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalEnergyConsumed: { $sum: "$energyConsumed" },
        totalCost: { $sum: "$totalCost" },
        totalTransactions: { $sum: 1 },
        averageEnergyPerTransaction: { $avg: "$energyConsumed" },
        averageCostPerTransaction: { $avg: "$totalCost" },
        totalDuration: { $sum: "$duration" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalEnergyConsumed: 0,
      totalCost: 0,
      totalTransactions: 0,
      averageEnergyPerTransaction: 0,
      averageCostPerTransaction: 0,
      totalDuration: 0,
    }
  );
};

/**
 * Update consumption record
 */
export const updateConsumption = async (id, consumptionData) => {
  return await Consumption.findByIdAndUpdate(id, consumptionData, {
    new: true,
  });
};

/**
 * Delete consumption record
 */
export const deleteConsumption = async (id) => {
  return await Consumption.findByIdAndDelete(id);
};
