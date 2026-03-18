# OCPP Central Demo Data Scripts

This directory contains scripts to populate the OCPP Central database with realistic demo data for all models.

## Overview

The demo data creation scripts are organized into two main categories:

### Management Models
- **Users** - Admin, operators, and customer accounts
- **Companies** - Charging network operators
- **Locations** - Physical charging station locations
- **Cars** - Electric vehicles registered in the system
- **Fleets** - Company fleets, vehicles, assignments, and maintenance
- **Pricing** - General pricing plans
- **Tariffs** - Connector-specific pricing
- **Consumptions** - Energy consumption records
- **Payments** - Payment transactions
- **Notifications** - User and system notifications
- **Reports** - Usage and billing reports

### OCPP Models
- **ChargePoints** - Charging stations
- **Connectors** - Physical charging connectors
- **IdTags** - RFID authentication tags
- **Transactions** - Charging sessions
- **Authorizations** - Authorization requests
- **BootNotifications** - Charge point boot events
- **Heartbeats** - Connection health checks
- **MeterValues** - Energy meter readings
- **StatusNotifications** - Connector status updates
- **Reservations** - Charging slot reservations
- **Diagnostics** - Diagnostic file uploads
- **FirmwareUpdates** - Firmware update operations

## Usage

### Create All Demo Data

Run the master script to create all demo data at once:

```bash
node scripts/demo-data/index.js
```

### Create Specific Model Data

You can also run individual scripts to create data for specific models:

```bash
# Management models
node scripts/demo-data/management/createUsers.js
node scripts/demo-data/management/createCompanies.js
node scripts/demo-data/management/createLocations.js
node scripts/demo-data/management/createCars.js
node scripts/demo-data/management/createFleets.js
node scripts/demo-data/management/createFleetVehicles.js
node scripts/demo-data/management/createFleetAssignments.js
node scripts/demo-data/management/createFleetMaintenance.js
node scripts/demo-data/management/createPricing.js
node scripts/demo-data/management/createTariffs.js
node scripts/demo-data/management/createConsumptions.js
node scripts/demo-data/management/createPayments.js
node scripts/demo-data/management/createNotifications.js
node scripts/demo-data/management/createReports.js

# OCPP models
node scripts/demo-data/ocpp/createChargePoints.js
node scripts/demo-data/ocpp/createConnectors.js
node scripts/demo-data/ocpp/createIdTags.js
node scripts/demo-data/ocpp/createTransactions.js
node scripts/demo-data/ocpp/createAuthorizations.js
node scripts/demo-data/ocpp/createBootNotifications.js
node scripts/demo-data/ocpp/createHeartbeats.js
node scripts/demo-data/ocpp/createMeterValues.js
node scripts/demo-data/ocpp/createStatusNotifications.js
node scripts/demo-data/ocpp/createReservations.js
node scripts/demo-data/ocpp/createDiagnostics.js
node scripts/demo-data/ocpp/createFirmwareUpdates.js
```


### Run All Scripts

```bash
node scripts/demo-data/index.js
```

```bash
node scripts/demo-data/management/createUsers.js
node scripts/demo-data/ocpp/createChargePoints.js
# etc.
```

### Creating demo data for environment:

```bash
NODE_ENV=development node scripts/demo-data/index.js
```

### Default Login

```
Email: admin@ocppcentral.com
Password: Demo123!
```


## Dependencies

The scripts follow this dependency order:

1. **Base Data** (no dependencies)
   - Users
   - Companies
   - Locations

2. **Infrastructure** (depends on base data)
   - ChargePoints (depends on Companies, Locations)
   - Connectors (depends on ChargePoints)
   - IdTags (depends on Users, Companies)
   - Cars (depends on Users, Companies)
   - Fleets (depends on Companies, Users)
   - FleetVehicles (depends on Fleets, Cars)
   - FleetAssignments (depends on Fleets, FleetVehicles, Users)
   - FleetMaintenance (depends on Fleets, FleetVehicles)
   - Pricing (depends on Users)
   - Tariffs (depends on ChargePoints, Companies)

3. **Operations** (depends on infrastructure)
   - Transactions (depends on ChargePoints, IdTags)
   - Authorizations (depends on ChargePoints, IdTags)
   - BootNotifications (depends on ChargePoints)
   - Heartbeats (depends on ChargePoints)
   - MeterValues (depends on Transactions)
   - StatusNotifications (depends on Connectors)
   - Reservations (depends on ChargePoints, IdTags)

4. **Billing** (depends on operations)
   - Consumptions (depends on Transactions, Pricing, Tariffs)
   - Payments (depends on Consumptions, Users)
   - Reports (depends on ChargePoints, Consumptions)

5. **Maintenance** (depends on infrastructure)
   - Diagnostics (depends on ChargePoints)
   - FirmwareUpdates (depends on ChargePoints)

6. **Notifications** (depends on Users, Companies)

## Default Credentials

After running the demo data scripts, you can log in with:

- **Email**: admin@ocppcentral.com
- **Password**: Demo123!

Other test users:
- john.doe@example.com
- jane.smith@example.com
- operator@greencharge.com
- fleet@evfleet.com

All users have the same password: **Demo123!**

## Data Volume

The scripts create approximately:
- 7 Users
- 3 Companies
- 5 Locations
- 7 Cars
- 3 Fleets
- ~6 Fleet Vehicles
- ~6 Fleet Assignments
- ~6 Fleet Maintenance records
- 5 Pricing Plans
- ~15 Tariffs
- 6 Charge Points
- ~15 Connectors
- 10 ID Tags
- 15 Transactions
- 20 Authorizations
- ~12 Boot Notifications
- ~60 Heartbeats
- ~100+ Meter Values
- ~100+ Status Notifications
- 8 Reservations
- ~12 Consumptions
- ~13 Payments
- ~12 Reports
- ~5 Diagnostics
- ~5 Firmware Updates
- 8 Notifications

## Notes

- All scripts use **deleteMany()** to clear existing data before insertion
- Scripts can be run multiple times safely
- Each script can be imported and used programmatically
- All timestamps are relative to the current date/time
- The data includes various statuses (active, completed, failed, etc.) for realistic testing

## Environment Requirements

Make sure your `.env` file is configured with:
```
MONGO_URI=mongodb://localhost:27017/ocppcentral
```

Or your MongoDB connection string.
