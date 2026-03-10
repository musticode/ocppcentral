import mongoose from "mongoose";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoCompanies = async () => {
  try {
    await connectDB();

    const demoCompanies = [
      {
        id: "company_001",
        name: "GreenCharge Solutions",
        email: "contact@greencharge.com",
        phone: "+1-555-0101",
        address: "123 Electric Avenue",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        country: "USA",
        website: "https://greencharge.com",
        taxId: "TAX-GCS-001",
        registrationNumber: "REG-GCS-2020",
        logo: "https://example.com/logos/greencharge.png",
        description: "Leading provider of EV charging solutions",
        paymentNeeded: true,
      },
      {
        id: "company_002",
        name: "EV Fleet Services",
        email: "info@evfleet.com",
        phone: "+1-555-0202",
        address: "456 Battery Street",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "USA",
        website: "https://evfleet.com",
        taxId: "TAX-EVF-002",
        registrationNumber: "REG-EVF-2021",
        logo: "https://example.com/logos/evfleet.png",
        description: "Fleet management and charging infrastructure",
        paymentNeeded: false,
      },
      {
        id: "company_003",
        name: "PowerGrid Charging",
        email: "support@powergrid.com",
        phone: "+1-555-0303",
        address: "789 Volt Boulevard",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "USA",
        website: "https://powergrid.com",
        taxId: "TAX-PGC-003",
        registrationNumber: "REG-PGC-2019",
        logo: "https://example.com/logos/powergrid.png",
        description: "Smart charging network operator",
        paymentNeeded: true,
      },
    ];

    await Company.deleteMany({});
    const createdCompanies = await Company.insertMany(demoCompanies);

    console.log(`✅ Created ${createdCompanies.length} demo companies`);

    return createdCompanies;
  } catch (error) {
    console.error("Error creating demo companies:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoCompanies()
    .then(() => {
      console.log("Demo companies creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo companies:", error);
      process.exit(1);
    });
}

export default createDemoCompanies;
