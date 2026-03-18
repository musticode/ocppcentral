import connectDB from "../../configuration/db.js";
import createDemoAuthorizations from "./ocpp/createAuthorizations.js";
import createDemoBootNotifications from "./ocpp/createBootNotifications.js";
import createDemoCars from "./management/createCars.js";
import createDemoChargePoints from "./ocpp/createChargePoints.js";
import createDemoCompanies from "./management/createCompanies.js";
import createDemoConnectors from "./ocpp/createConnectors.js";
import createDemoConsumptions from "./management/createConsumptions.js";
import createDemoDiagnostics from "./ocpp/createDiagnostics.js";
import createDemoFirmwareUpdates from "./ocpp/createFirmwareUpdates.js";
import createDemoFleetAssignments from "./management/createFleetAssignments.js";
import createDemoFleetMaintenance from "./management/createFleetMaintenance.js";
import createDemoFleetVehicles from "./management/createFleetVehicles.js";
import createDemoFleets from "./management/createFleets.js";
import createDemoHeartbeats from "./ocpp/createHeartbeats.js";
import createDemoIdTags from "./ocpp/createIdTags.js";
import createDemoLocations from "./management/createLocations.js";
import createDemoMeterValues from "./ocpp/createMeterValues.js";
import createDemoNotifications from "./management/createNotifications.js";
import createDemoPaymentMethods from "./management/createPaymentMethods.js";
import createDemoPayments from "./management/createPayments.js";
import createDemoPricing from "./management/createPricing.js";
import createDemoReports from "./management/createReports.js";
import createDemoReservations from "./ocpp/createReservations.js";
import createDemoStatusNotifications from "./ocpp/createStatusNotifications.js";
import createDemoTariffs from "./management/createTariffs.js";
import createDemoTransactions from "./ocpp/createTransactions.js";
import createDemoUsers from "./management/createUsers.js";

const createAllDemoData = async () => {
  console.log("🚀 Starting demo data creation for OCPP Central...\n");

  try {
    await connectDB();

    console.log("📋 Step 1: Creating Management Data");
    console.log("=====================================");
    await createDemoUsers();
    await createDemoCompanies();
    await createDemoLocations();
    await createDemoCars();
    await createDemoPricing();
    await createDemoPaymentMethods();
    await createDemoNotifications();

    console.log("\n🚚 Step 2: Creating Fleet Data");
    console.log("=====================================");
    await createDemoFleets();
    await createDemoFleetVehicles();
    await createDemoFleetAssignments();
    await createDemoFleetMaintenance();

    console.log("\n⚡ Step 3: Creating OCPP Infrastructure");
    console.log("=====================================");
    await createDemoChargePoints();
    await createDemoConnectors();
    await createDemoIdTags();
    await createDemoTariffs();

    console.log("\n🔋 Step 4: Creating OCPP Operations");
    console.log("=====================================");
    await createDemoTransactions();
    await createDemoAuthorizations();
    await createDemoBootNotifications();
    await createDemoHeartbeats();
    await createDemoMeterValues();
    await createDemoStatusNotifications();
    await createDemoReservations();

    console.log("\n💰 Step 5: Creating Billing & Reports");
    console.log("=====================================");
    await createDemoConsumptions();
    await createDemoPayments();
    await createDemoReports();

    console.log("\n🔧 Step 6: Creating Maintenance Data");
    console.log("=====================================");
    await createDemoDiagnostics();
    await createDemoFirmwareUpdates();

    console.log("\n✅ Demo data creation completed successfully!");
    console.log("=====================================");
    console.log("You can now use the application with realistic demo data.");
    console.log("\nDefault user credentials:");
    console.log("  Email: admin@ocppcentral.com");
    console.log("  Password: Demo123!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating demo data:", error);
    process.exit(1);
  }
};

createAllDemoData();
