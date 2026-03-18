import connectDB from "../../../configuration/db.js";
import Company from "../../../model/management/Company.js";
import Fleet from "../../../model/management/Fleet.js";
import User from "../../../model/management/User.js";

const createDemoFleets = async () => {
  try {
    await connectDB();

    const companies = await Company.find({});
    const operators = await User.find({ role: "operator" });

    if (companies.length === 0) {
      console.log("⚠️  No companies found. Please create companies first.");
      return [];
    }

    if (operators.length === 0) {
      console.log("⚠️  No operator users found. Please create users with role=operator first.");
      return [];
    }

    const demoFleets = [];

    const pickOperatorForCompany = (company) => {
      const byCompany = operators.filter((o) => o.companyId === company.id);
      if (byCompany.length > 0) return byCompany[0];
      return operators[0];
    };

    // Create one fleet per company (best-effort)
    companies.forEach((company, index) => {
      const manager = pickOperatorForCompany(company);
      demoFleets.push({
        name: `${company.name} Fleet`,
        description: `Demo fleet for ${company.name}`,
        companyId: company._id,
        managerId: manager._id,
        fleetType: index % 2 === 0 ? "Corporate" : "Delivery",
        status: "Active",
        totalVehicles: 0,
        activeVehicles: 0,
        location: {
          address: company.address,
          city: company.city,
          state: company.state,
          country: company.country,
        },
        contactInfo: {
          email: company.email,
          phone: company.phone,
        },
        settings: {
          autoAssignment: index % 2 === 0,
          maintenanceAlerts: true,
          chargingAlerts: true,
          lowBatteryThreshold: 20,
        },
        metadata: { demo: true, companyKey: company.id },
      });
    });

    await Fleet.deleteMany({});
    const created = await Fleet.insertMany(demoFleets);

    console.log(`✅ Created ${created.length} demo fleets`);
    return created;
  } catch (error) {
    console.error("Error creating demo fleets:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoFleets()
    .then(() => {
      console.log("Demo fleets creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo fleets:", error);
      process.exit(1);
    });
}

export default createDemoFleets;
