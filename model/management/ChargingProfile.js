import mongoose from "mongoose";

const chargingSchedulePeriodSchema = new mongoose.Schema(
    {
        startPeriod: { type: Number, required: true }, // Offset in seconds from schedule start
        limit: { type: Number, required: true }, // Power limit in W or A
        numberPhases: { type: Number, default: 3 }, // Number of phases (1 or 3)
    },
    { _id: false }
);

const chargingScheduleSchema = new mongoose.Schema(
    {
        duration: { type: Number }, // Duration in seconds (optional)
        startSchedule: { type: Date }, // Absolute start time (optional)
        chargingRateUnit: {
            type: String,
            enum: ["W", "A"],
            required: true,
        },
        chargingSchedulePeriod: {
            type: [chargingSchedulePeriodSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "At least one charging schedule period is required",
            },
        },
        minChargingRate: { type: Number }, // Minimum charging rate (optional)
    },
    { _id: false }
);

const chargingProfileSchema = new mongoose.Schema(
    {
        // OCPP 1.6 fields
        chargingProfileId: {
            type: Number,
            required: true,
        },
        transactionId: { type: Number }, // Only for TxProfile purpose
        stackLevel: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        chargingProfilePurpose: {
            type: String,
            enum: ["ChargePointMaxProfile", "TxDefaultProfile", "TxProfile"],
            required: true,
        },
        chargingProfileKind: {
            type: String,
            enum: ["Absolute", "Recurring", "Relative"],
            required: true,
        },
        recurrencyKind: {
            type: String,
            enum: ["Daily", "Weekly"],
        },
        validFrom: { type: Date },
        validTo: { type: Date },
        chargingSchedule: {
            type: chargingScheduleSchema,
            required: true,
        },
        // Management fields
        chargePointId: { type: String, required: true, index: true },
        connectorId: { type: Number, required: true, default: 0, index: true },
        companyId: {
            type: String,
            index: true,
        },
        name: { type: String },
        description: { type: String },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: String },
        updatedBy: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes
chargingProfileSchema.index({ chargePointId: 1, connectorId: 1, isActive: 1 });
chargingProfileSchema.index({ chargePointId: 1, stackLevel: 1 });
chargingProfileSchema.index({ companyId: 1, isActive: 1 });
chargingProfileSchema.index({
    chargePointId: 1,
    connectorId: 1,
    chargingProfilePurpose: 1,
    stackLevel: 1,
});

const ChargingProfile = mongoose.model(
    "ChargingProfile",
    chargingProfileSchema
);

export default ChargingProfile;
