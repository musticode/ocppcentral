import mongoose from "mongoose";

const chargingPreferencesSchema = new mongoose.Schema(
  {
    // User's preferred charging rate unit
    preferredChargingRateUnit: {
      type: String,
      enum: ["W", "A"],
      default: "W",
    },
    // User's preferred max power limit (W) or current limit (A)
    preferredMaxLimit: { type: Number },
    // Preferred charging time window
    preferredStartTime: { type: String }, // HH:mm format
    preferredEndTime: { type: String }, // HH:mm format
    // Whether user wants eco/off-peak charging
    ecoChargingEnabled: { type: Boolean, default: false },
    // Max budget per session (currency units)
    maxBudgetPerSession: { type: Number },
    // Target SoC percentage (if supported)
    targetSoC: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const computedStatsSchema = new mongoose.Schema(
  {
    // Calculated from transaction history
    totalTransactions: { type: Number, default: 0 },
    totalEnergyConsumed: { type: Number, default: 0 }, // kWh
    avgEnergyPerSession: { type: Number, default: 0 }, // kWh
    avgSessionDuration: { type: Number, default: 0 }, // minutes
    avgDailyConsumption: { type: Number, default: 0 }, // kWh
    peakHourUsagePercent: { type: Number, default: 0 }, // % of sessions during peak hours (07-19)
    offPeakHourUsagePercent: { type: Number, default: 0 }, // % of sessions during off-peak
    // Most used charge point & connector
    mostUsedChargePointId: { type: String },
    mostUsedConnectorId: { type: Number },
    // Recommended charging profile values (computed)
    recommendedMaxLimit: { type: Number }, // Watts
    recommendedChargingRateUnit: { type: String, enum: ["W", "A"] },
    // Time window analysis
    mostFrequentStartHour: { type: Number }, // 0-23
    mostFrequentEndHour: { type: Number }, // 0-23
    // Last calculation metadata
    calculationPeriodStart: { type: Date },
    calculationPeriodEnd: { type: Date },
    lastCalculatedAt: { type: Date },
  },
  { _id: false }
);

const userChargingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      index: true,
    },
    name: { type: String, default: "My Charging Profile" },
    description: { type: String },
    // User-defined preferences
    preferences: {
      type: chargingPreferencesSchema,
      default: () => ({}),
    },
    // Computed stats from transaction history (updated by cron)
    computedStats: {
      type: computedStatsSchema,
      default: () => ({}),
    },
    // Generated OCPP-compatible charging schedule (updated by cron)
    generatedSchedule: {
      chargingRateUnit: { type: String, enum: ["W", "A"], default: "W" },
      chargingSchedulePeriod: [
        {
          startPeriod: { type: Number }, // seconds offset
          limit: { type: Number }, // W or A
          numberPhases: { type: Number, default: 3 },
          _id: false,
        },
      ],
      duration: { type: Number }, // seconds
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
userChargingProfileSchema.index({ userId: 1, isActive: 1 });
userChargingProfileSchema.index({ companyId: 1, isActive: 1 });

const UserChargingProfile = mongoose.model(
  "UserChargingProfile",
  userChargingProfileSchema
);

export default UserChargingProfile;
