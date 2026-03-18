import User from "../../../model/management/User.js";
import bcrypt from "bcryptjs";

const createDemoUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash("Demo123!", 10);

    const demoUsers = [
      {
        name: "Admin User",
        email: "admin@ocppcentral.com",
        password: hashedPassword,
        role: "admin",
        companyId: null,
        companyName: null,
      },
      {
        name: "John Doe",
        email: "john.doe@example.com",
        password: hashedPassword,
        role: "customer",
        companyId: null,
        companyName: null,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        password: hashedPassword,
        role: "customer",
        companyId: null,
        companyName: null,
      },
      {
        name: "Company Operator",
        email: "operator@greencharge.com",
        password: hashedPassword,
        role: "operator",
        companyId: "company_001",
        companyName: "GreenCharge Solutions",
      },
      {
        name: "Fleet Manager",
        email: "fleet@evfleet.com",
        password: hashedPassword,
        role: "operator",
        companyId: "company_002",
        companyName: "EV Fleet Services",
      },
      {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        password: hashedPassword,
        role: "customer",
        companyId: null,
        companyName: null,
      },
      {
        name: "Bob Williams",
        email: "bob.williams@example.com",
        password: hashedPassword,
        role: "customer",
        companyId: null,
        companyName: null,
      },
    ];

    await User.deleteMany({});
    const createdUsers = await User.insertMany(demoUsers);

    console.log(`✅ Created ${createdUsers.length} demo users`);
    console.log("Default password for all users: Demo123!");

    return createdUsers;
  } catch (error) {
    console.error("Error creating demo users:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoUsers()
    .then(() => {
      console.log("Demo users creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo users:", error);
      process.exit(1);
    });
}

export default createDemoUsers;
