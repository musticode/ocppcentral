import ChargePoint from "../../model/ocpp/ChargePoint.js";

export const createChargePoint = async (chargePointData) => {
  console.log(chargePointData);

  if (
    await ChargePoint.exists({ chargePointId: chargePointData.chargePointId })
  ) {
    throw new Error("Charge point already exists");
  }

  const chargePoint = new ChargePoint(chargePointData);
  await chargePoint.save();
  return chargePoint;
};

const getChargePointById = async (id) => {
  return await ChargePoint.findById(id);
};

const getAllChargePoints = async () => {
  return await ChargePoint.find();
};

const updateChargePoint = async (id, chargePointData) => {
  return await ChargePoint.findByIdAndUpdate(id, chargePointData);
};

const deleteChargePoint = async (id) => {
  return await ChargePoint.findByIdAndDelete(id);
};

export {
  getChargePointById,
  getAllChargePoints,
  updateChargePoint,
  deleteChargePoint,
};
