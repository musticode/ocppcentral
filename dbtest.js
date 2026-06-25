import mongoose from "mongoose";

const MONGO_URI = "mongodb://admin:langenfeld@localhost:27017/ocppcentral?authSource=admin";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  role: { type: String },
  companyId: { type: String },
  companyName: { type: String },
});

const CompanySchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
});

const User = mongoose.model("User", UserSchema);
const Company = mongoose.model("Company", CompanySchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const users = await User.find({});
    console.log("\n--- Users ---");
    console.log(users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      companyName: u.companyName
    })));

    const companies = await Company.find({});
    console.log("\n--- Companies ---");
    console.log(companies.map(c => ({
      _id: c._id,
      id: c.id,
      name: c.name
    })));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error running script:", err);
  }
}

run();
