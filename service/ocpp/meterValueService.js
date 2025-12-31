import MeterValue from "../../model/ocpp/MeterValue.js";
import Transaction from "../../model/ocpp/Transaction.js";

/**
 * Create meter value record
 */
export const createMeterValue = async (meterValueData) => {
  const meterValue = new MeterValue(meterValueData);
  await meterValue.save();
  return meterValue;
};

/**
 * Create meter value from OCPP MeterValues message
 */
export const createMeterValueFromOCPP = async (chargePointId, params) => {
  // OCPP MeterValues structure:
  // params.meterValue is an array where each entry has {timestamp, sampledValue[]}
  // We process each entry to extract all sampledValues
  const sampledValues = [];

  if (params.meterValue && Array.isArray(params.meterValue)) {
    for (const mv of params.meterValue) {
      if (mv.sampledValue && Array.isArray(mv.sampledValue)) {
        // Extract all sampledValues from this meterValue entry
        for (const sv of mv.sampledValue) {
          sampledValues.push({
            value: sv.value || "",
            context: sv.context || "Sample.Periodic",
            format: sv.format || "Raw",
            measurand: sv.measurand,
            location: sv.location,
            unit: sv.unit,
            phase: sv.phase,
          });
        }
      }
    }
  }

  const meterValueData = {
    chargePointId,
    connectorId: params.connectorId,
    transactionId: params.transactionId || null,
    timestamp: new Date(params.timestamp),
    sampledValue: sampledValues,
  };

  const meterValue = new MeterValue(meterValueData);
  await meterValue.save();
  return meterValue;
};

/**
 * Get meter value by ID
 */
export const getMeterValueById = async (id) => {
  return await MeterValue.findById(id);
};

/**
 * Get meter values with filters
 */
export const getMeterValues = async (filters = {}) => {
  const query = {};

  if (filters.chargePointId) {
    query.chargePointId = filters.chargePointId;
  }

  if (filters.connectorId !== undefined) {
    query.connectorId = filters.connectorId;
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

  return await MeterValue.find(query)
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100);
};

/**
 * Get latest meter value for a charge point and connector
 */
export const getLatestMeterValue = async (chargePointId, connectorId) => {
  return await MeterValue.findOne({
    chargePointId,
    connectorId,
  })
    .sort({ timestamp: -1 })
    .limit(1);
};

/**
 * Get meter values for a specific transaction
 */
export const getMeterValuesForTransaction = async (transactionId) => {
  return await MeterValue.find({ transactionId }).sort({ timestamp: 1 });
};

/**
 * Get energy consumption from meter values for a transaction
 */
export const getEnergyFromMeterValues = async (transactionId) => {
  const meterValues = await getMeterValuesForTransaction(transactionId);

  if (meterValues.length === 0) {
    return null;
  }

  // Find Energy.Active.Import.Register values
  let startValue = null;
  let stopValue = null;

  for (const mv of meterValues) {
    for (const sv of mv.sampledValue) {
      if (
        sv.measurand === "Energy.Active.Import.Register" &&
        sv.context === "Transaction.Begin"
      ) {
        startValue = parseFloat(sv.value);
      }
      if (
        sv.measurand === "Energy.Active.Import.Register" &&
        sv.context === "Transaction.End"
      ) {
        stopValue = parseFloat(sv.value);
      }
    }
  }

  // If we don't have transaction begin/end, use first and last values
  if (startValue === null || stopValue === null) {
    const firstMv = meterValues[0];
    const lastMv = meterValues[meterValues.length - 1];

    for (const sv of firstMv.sampledValue) {
      if (sv.measurand === "Energy.Active.Import.Register") {
        startValue = parseFloat(sv.value);
        break;
      }
    }

    for (const sv of lastMv.sampledValue) {
      if (sv.measurand === "Energy.Active.Import.Register") {
        stopValue = parseFloat(sv.value);
        break;
      }
    }
  }

  if (startValue !== null && stopValue !== null) {
    // Determine unit (assuming Wh or kWh)
    const firstMv = meterValues[0];
    let unit = "Wh";
    for (const sv of firstMv.sampledValue) {
      if (sv.measurand === "Energy.Active.Import.Register" && sv.unit) {
        unit = sv.unit;
        break;
      }
    }

    const energyWh = stopValue - startValue;
    // Convert to kWh if needed
    const energyKwh = unit === "kWh" ? energyWh : energyWh / 1000;

    return {
      startValue,
      stopValue,
      energyWh,
      energyKwh,
      unit,
      meterValueCount: meterValues.length,
    };
  }

  return null;
};

/**
 * Get power statistics from meter values
 */
export const getPowerStatistics = async (
  chargePointId,
  connectorId,
  filters = {}
) => {
  const query = {
    chargePointId,
    connectorId,
  };

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const meterValues = await MeterValue.find(query).sort({ timestamp: 1 });

  const powerValues = [];
  for (const mv of meterValues) {
    for (const sv of mv.sampledValue) {
      if (
        sv.measurand === "Power.Active.Import" ||
        sv.measurand === "Power.Active.Export"
      ) {
        const power = parseFloat(sv.value);
        if (!isNaN(power)) {
          // Convert to kW if needed
          const powerKw = sv.unit === "kW" ? power : power / 1000;
          powerValues.push({
            timestamp: mv.timestamp,
            power: powerKw,
            unit: "kW",
          });
        }
      }
    }
  }

  if (powerValues.length === 0) {
    return null;
  }

  const powers = powerValues.map((pv) => pv.power);
  const averagePower = powers.reduce((a, b) => a + b, 0) / powers.length;
  const maxPower = Math.max(...powers);
  const minPower = Math.min(...powers);

  return {
    averagePower,
    maxPower,
    minPower,
    sampleCount: powerValues.length,
    powerValues,
  };
};

/**
 * Delete meter values (with caution - usually for cleanup)
 */
export const deleteMeterValues = async (filters = {}) => {
  const query = {};

  if (filters.chargePointId) {
    query.chargePointId = filters.chargePointId;
  }

  if (filters.beforeDate) {
    query.timestamp = { $lt: new Date(filters.beforeDate) };
  }

  return await MeterValue.deleteMany(query);
};
