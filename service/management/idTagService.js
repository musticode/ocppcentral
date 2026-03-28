import Company from "../../model/management/Company.js";
import IdTag from "../../model/ocpp/IdTag.js";
import User from "../../model/management/User.js";

class IdTagService {
  async createIdTagByAdmin({ idTag, companyId, userId, parentIdTag, expiryDate, description, status }) {
    if (!idTag) throw new Error("idTag is required");
    if (!companyId) throw new Error("companyId is required");

    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");

    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) throw new Error("User not found");
    }

    if (await IdTag.exists({ idTag })) {
      throw new Error("IdTag already exists");
    }

    const idTagDoc = new IdTag({
      idTag,
      companyId: company._id,
      userId: user?._id,
      parentIdTag: parentIdTag || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description || null,
      status: status || "Accepted",
      isActive: true,
      notes: "Created by admin",
    });

    await idTagDoc.save();

    if (user) {
      if (!user.IdTag) user.IdTag = [];
      if (!user.IdTag.map(String).includes(String(idTagDoc._id))) {
        user.IdTag.push(idTagDoc._id);
        await user.save();
      }
    }

    return idTagDoc;
  }

  async createIdTagByCustomer({ userId, idTag, parentIdTag, expiryDate, description }) {
    if (!userId) throw new Error("userId is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.companyId) {
      throw new Error("Only customers (no company) can use this endpoint");
    }

    const idTagString =
      idTag ||
      user.email.split("@")[0].toUpperCase() + "_" + user._id.toString().slice(-6);

    if (await IdTag.exists({ idTag: idTagString })) {
      throw new Error("IdTag already exists");
    }

    const idTagDoc = new IdTag({
      idTag: idTagString,
      companyId: null,
      userId: user._id,
      parentIdTag: parentIdTag || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description || null,
      status: "Accepted",
      isActive: true,
      notes: "Created by customer",
    });

    await idTagDoc.save();

    if (!user.IdTag) user.IdTag = [];
    user.IdTag.push(idTagDoc._id);
    await user.save();

    return idTagDoc;
  }

  async listIdTags({ companyId, userId, isActive } = {}) {
    const query = {};

    if (companyId) {
      const company = await Company.findOne({ id: companyId }).select("_id");
      if (!company) throw new Error(`Company ${companyId} not found`);
      query.companyId = company._id;
    }

    if (userId) query.userId = userId;
    if (isActive !== undefined) query.isActive = isActive;

    return await IdTag.find(query).sort({ createdAt: -1 });
  }
}

export default new IdTagService();