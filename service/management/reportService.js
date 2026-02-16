import ChargePoint from "../../model/ocpp/ChargePoint.js";
import Consumption from "../../model/management/Consumption.js";
import Report from "../../model/management/Report.js";

class ReportService {
  async getChargePointReport({ companyId, chargePointId, periodFrom, periodTo, save }) {
    if (!chargePointId) {
      throw new Error("chargePointId is required");
    }

    const chargePoint = await ChargePoint.findOne({
      $or: [{ identifier: chargePointId }, { chargePointId: chargePointId }],
    });

    if (!chargePoint) {
      throw new Error("Charge point not found");
    }

    if (companyId && chargePoint.companyId?.toString() !== companyId.toString()) {
      throw new Error("Charge point does not belong to this company");
    }

    const match = {
      chargePointId: chargePoint.identifier,
    };

    if (periodFrom || periodTo) {
      match.timestamp = {};
      if (periodFrom) match.timestamp.$gte = new Date(periodFrom);
      if (periodTo) match.timestamp.$lte = new Date(periodTo);
    }

    const [totalsAgg, byConnectorAgg] = await Promise.all([
      Consumption.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            transactions: { $sum: 1 },
            energyConsumedKwh: { $sum: { $ifNull: ["$energyConsumed", 0] } },
            energyCost: { $sum: { $ifNull: ["$energyCost", 0] } },
            totalCost: { $sum: { $ifNull: ["$totalCost", 0] } },
            currency: { $first: "$currency" },
          },
        },
      ]),
      Consumption.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$connectorId",
            transactions: { $sum: 1 },
            energyConsumedKwh: { $sum: { $ifNull: ["$energyConsumed", 0] } },
            totalCost: { $sum: { $ifNull: ["$totalCost", 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totals = totalsAgg?.[0]
      ? {
          transactions: totalsAgg[0].transactions ?? 0,
          energyConsumedKwh: totalsAgg[0].energyConsumedKwh ?? 0,
          energyCost: totalsAgg[0].energyCost ?? 0,
          totalCost: totalsAgg[0].totalCost ?? 0,
          currency: totalsAgg[0].currency ?? "USD",
        }
      : {
          transactions: 0,
          energyConsumedKwh: 0,
          energyCost: 0,
          totalCost: 0,
          currency: "USD",
        };

    const byConnector = (byConnectorAgg || []).map((r) => ({
      connectorId: r._id,
      transactions: r.transactions ?? 0,
      energyConsumedKwh: r.energyConsumedKwh ?? 0,
      totalCost: r.totalCost ?? 0,
    }));

    const reportPayload = {
      companyId: chargePoint.companyId ?? null,
      chargePointId: chargePoint.identifier,
      periodFrom: periodFrom ? new Date(periodFrom) : null,
      periodTo: periodTo ? new Date(periodTo) : null,
      totals,
      byConnector,
      generatedAt: new Date(),
    };

    if (save) {
      const reportDoc = new Report(reportPayload);
      await reportDoc.save();
      return reportDoc;
    }

    return reportPayload;
  }
}

export default new ReportService();