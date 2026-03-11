# EV Fleet Management System

Comprehensive fleet management system for electric vehicles with assignment tracking, maintenance scheduling, and analytics.

## Table of Contents

- [Overview](#overview)
- [Models](#models)
- [Services](#services)
- [API Routes](#api-routes)
- [Features](#features)
- [Usage Examples](#usage-examples)

## Overview

The EV Fleet Management System provides complete functionality for managing electric vehicle fleets including:

- Fleet creation and management
- Vehicle assignment and tracking
- Driver assignment and scheduling
- Maintenance scheduling and tracking
- Real-time vehicle location and battery monitoring
- Comprehensive analytics and reporting

## Models

### Fleet
Main fleet entity representing a collection of vehicles.

**Fields:**
- `name` - Fleet name
- `description` - Fleet description
- `companyId` - Reference to Company
- `managerId` - Reference to fleet manager (User)
- `fleetType` - Type: Corporate, Rental, Delivery, Taxi, Public, Other
- `status` - Active, Inactive, Maintenance
- `totalVehicles` - Total vehicle count
- `activeVehicles` - Active vehicle count
- `location` - Fleet base location
- `operatingHours` - Operating hours (start/end)
- `contactInfo` - Contact email and phone
- `settings` - Fleet settings (auto-assignment, alerts, thresholds)

### FleetVehicle
Represents a vehicle assigned to a fleet.

**Fields:**
- `fleetId` - Reference to Fleet
- `carId` - Reference to Car
- `vehicleNumber` - Unique vehicle identifier
- `assignedDriverId` - Currently assigned driver
- `status` - Available, Assigned, InUse, Charging, Maintenance, OutOfService
- `currentLocation` - Current GPS location
- `batteryStatus` - Current battery level and range
- `odometer` - Current odometer reading
- `lastServiceDate` - Last maintenance date
- `nextServiceDate` - Next scheduled maintenance
- `serviceDueOdometer` - Odometer reading when service is due
- `assignmentHistory` - Historical assignments
- `maintenanceRecords` - Maintenance history

### FleetAssignment
Tracks vehicle assignments to drivers.

**Fields:**
- `fleetId` - Reference to Fleet
- `fleetVehicleId` - Reference to FleetVehicle
- `driverId` - Reference to assigned driver
- `assignedBy` - User who created assignment
- `assignmentType` - Temporary, Permanent, Scheduled
- `status` - Pending, Active, Completed, Cancelled
- `scheduledStart/End` - Scheduled times
- `actualStart/End` - Actual times
- `startLocation/endLocation` - GPS locations
- `startOdometer/endOdometer` - Odometer readings
- `startBatteryLevel/endBatteryLevel` - Battery levels
- `purpose` - Assignment purpose
- `checklistCompleted` - Pre/post-trip checklist
- `damageReported` - Damage flag and details

### FleetMaintenance
Manages vehicle maintenance scheduling and tracking.

**Fields:**
- `fleetId` - Reference to Fleet
- `fleetVehicleId` - Reference to FleetVehicle
- `maintenanceType` - Scheduled, Unscheduled, Emergency, Recall, Inspection
- `category` - Battery, Tires, Brakes, Software, Charging, Body, Interior, Other
- `status` - Scheduled, InProgress, Completed, Cancelled, Delayed
- `priority` - Low, Medium, High, Critical
- `scheduledDate` - Scheduled maintenance date
- `completedDate` - Completion date
- `description` - Maintenance description
- `workPerformed` - Work details
- `partsReplaced` - Parts list with costs
- `laborCost/partsCost/totalCost` - Cost breakdown
- `serviceProvider` - Service provider details
- `odometerReading` - Odometer at service
- `nextServiceOdometer/Date` - Next service schedule
- `attachments` - Documents and photos

## Services

### FleetService
Core fleet management operations.

**Methods:**
- `createFleet(fleetData)` - Create new fleet
- `getFleetById(fleetId)` - Get fleet details
- `listFleets(filters)` - List fleets with filters
- `updateFleet(fleetId, updateData)` - Update fleet
- `deleteFleet(fleetId)` - Delete fleet
- `getFleetStats(fleetId)` - Get fleet statistics
- `getFleetsByCompany(companyId)` - Get company fleets
- `updateFleetVehicleCounts(fleetId)` - Update vehicle counts

### FleetVehicleService
Vehicle management within fleets.

**Methods:**
- `addVehicleToFleet(vehicleData)` - Add vehicle to fleet
- `getFleetVehicleById(vehicleId)` - Get vehicle details
- `listFleetVehicles(filters)` - List vehicles with filters
- `updateFleetVehicle(vehicleId, updateData)` - Update vehicle
- `updateVehicleLocation(vehicleId, location)` - Update GPS location
- `updateVehicleBatteryStatus(vehicleId, batteryStatus)` - Update battery
- `assignDriver(vehicleId, driverId)` - Assign driver to vehicle
- `unassignDriver(vehicleId)` - Unassign driver
- `addMaintenanceRecord(vehicleId, data)` - Add maintenance record
- `addAssignmentHistory(vehicleId, data)` - Add assignment history
- `removeVehicleFromFleet(vehicleId)` - Remove vehicle
- `getVehiclesByDriver(driverId)` - Get driver's vehicles
- `getAvailableVehicles(fleetId)` - Get available vehicles
- `getVehiclesDueForMaintenance(fleetId, daysAhead)` - Get maintenance due

### FleetAssignmentService
Assignment and scheduling management.

**Methods:**
- `createAssignment(assignmentData)` - Create new assignment
- `getAssignmentById(assignmentId)` - Get assignment details
- `listAssignments(filters)` - List assignments with filters
- `startAssignment(assignmentId, startData)` - Start assignment
- `completeAssignment(assignmentId, completionData)` - Complete assignment
- `cancelAssignment(assignmentId, reason)` - Cancel assignment
- `updateAssignment(assignmentId, updateData)` - Update assignment
- `getActiveAssignmentsByDriver(driverId)` - Get active assignments
- `getUpcomingAssignments(fleetId, days)` - Get upcoming assignments
- `getAssignmentHistory(fleetVehicleId, limit)` - Get history
- `getAssignmentStats(fleetId, startDate, endDate)` - Get statistics

### FleetMaintenanceService
Maintenance scheduling and tracking.

**Methods:**
- `scheduleMaintenance(maintenanceData)` - Schedule maintenance
- `getMaintenanceById(maintenanceId)` - Get maintenance details
- `listMaintenance(filters)` - List maintenance with filters
- `startMaintenance(maintenanceId, startData)` - Start maintenance
- `completeMaintenance(maintenanceId, completionData)` - Complete maintenance
- `cancelMaintenance(maintenanceId, reason)` - Cancel maintenance
- `updateMaintenance(maintenanceId, updateData)` - Update maintenance
- `getUpcomingMaintenance(fleetId, days)` - Get upcoming maintenance
- `getOverdueMaintenance(fleetId)` - Get overdue maintenance
- `getMaintenanceHistory(fleetVehicleId, limit)` - Get history
- `getMaintenanceStats(fleetId, startDate, endDate)` - Get statistics
- `addAttachment(maintenanceId, attachment)` - Add attachment

### FleetAnalyticsService
Analytics and reporting.

**Methods:**
- `getFleetDashboard(fleetId, startDate, endDate)` - Get dashboard data
- `getVehicleUtilization(fleetId, startDate, endDate)` - Get utilization metrics
- `getDriverPerformance(fleetId, startDate, endDate)` - Get driver metrics
- `getMaintenanceCostAnalysis(fleetId, startDate, endDate)` - Get cost analysis
- `getChargingAnalytics(fleetId, startDate, endDate)` - Get charging metrics
- `getFleetComparison(companyId)` - Compare fleets

## API Routes

### Fleet Routes (`/api/fleets`)

```
POST   /api/fleets                      - Create fleet
GET    /api/fleets                      - List fleets
GET    /api/fleets/company/:companyId   - Get company fleets
GET    /api/fleets/:fleetId             - Get fleet details
GET    /api/fleets/:fleetId/stats       - Get fleet statistics
PUT    /api/fleets/:fleetId             - Update fleet
DELETE /api/fleets/:fleetId             - Delete fleet
```

### Fleet Vehicle Routes (`/api/fleet-vehicles`)

```
POST   /api/fleet-vehicles                           - Add vehicle to fleet
GET    /api/fleet-vehicles                           - List fleet vehicles
GET    /api/fleet-vehicles/available/:fleetId        - Get available vehicles
GET    /api/fleet-vehicles/driver/:driverId          - Get driver's vehicles
GET    /api/fleet-vehicles/maintenance-due/:fleetId  - Get vehicles due for maintenance
GET    /api/fleet-vehicles/:vehicleId                - Get vehicle details
PUT    /api/fleet-vehicles/:vehicleId                - Update vehicle
POST   /api/fleet-vehicles/:vehicleId/location       - Update location
POST   /api/fleet-vehicles/:vehicleId/battery        - Update battery status
POST   /api/fleet-vehicles/:vehicleId/assign-driver  - Assign driver
POST   /api/fleet-vehicles/:vehicleId/unassign-driver - Unassign driver
POST   /api/fleet-vehicles/:vehicleId/maintenance-record - Add maintenance record
DELETE /api/fleet-vehicles/:vehicleId                - Remove from fleet
```

### Fleet Assignment Routes (`/api/fleet-assignments`)

```
POST   /api/fleet-assignments                        - Create assignment
GET    /api/fleet-assignments                        - List assignments
GET    /api/fleet-assignments/my-assignments         - Get my assignments
GET    /api/fleet-assignments/active/:driverId       - Get active assignments
GET    /api/fleet-assignments/upcoming/:fleetId      - Get upcoming assignments
GET    /api/fleet-assignments/history/:fleetVehicleId - Get assignment history
GET    /api/fleet-assignments/stats/:fleetId         - Get assignment statistics
GET    /api/fleet-assignments/:assignmentId          - Get assignment details
POST   /api/fleet-assignments/:assignmentId/start    - Start assignment
POST   /api/fleet-assignments/:assignmentId/complete - Complete assignment
POST   /api/fleet-assignments/:assignmentId/cancel   - Cancel assignment
PUT    /api/fleet-assignments/:assignmentId          - Update assignment
```

### Fleet Maintenance Routes (`/api/fleet-maintenance`)

```
POST   /api/fleet-maintenance                         - Schedule maintenance
GET    /api/fleet-maintenance                         - List maintenance
GET    /api/fleet-maintenance/upcoming/:fleetId       - Get upcoming maintenance
GET    /api/fleet-maintenance/overdue/:fleetId        - Get overdue maintenance
GET    /api/fleet-maintenance/history/:fleetVehicleId - Get maintenance history
GET    /api/fleet-maintenance/stats/:fleetId          - Get maintenance statistics
GET    /api/fleet-maintenance/:maintenanceId          - Get maintenance details
POST   /api/fleet-maintenance/:maintenanceId/start    - Start maintenance
POST   /api/fleet-maintenance/:maintenanceId/complete - Complete maintenance
POST   /api/fleet-maintenance/:maintenanceId/cancel   - Cancel maintenance
POST   /api/fleet-maintenance/:maintenanceId/attachment - Add attachment
PUT    /api/fleet-maintenance/:maintenanceId          - Update maintenance
```

### Fleet Analytics Routes (`/api/fleet-analytics`)

```
GET    /api/fleet-analytics/dashboard/:fleetId           - Get dashboard
GET    /api/fleet-analytics/vehicle-utilization/:fleetId - Get vehicle utilization
GET    /api/fleet-analytics/driver-performance/:fleetId  - Get driver performance
GET    /api/fleet-analytics/maintenance-cost/:fleetId    - Get maintenance costs
GET    /api/fleet-analytics/charging/:fleetId            - Get charging analytics
GET    /api/fleet-analytics/comparison/:companyId        - Compare fleets
```

## Features

### 1. Fleet Management
- Create and manage multiple fleets
- Configure fleet settings (auto-assignment, alerts, thresholds)
- Track fleet statistics and metrics
- Manage fleet locations and operating hours

### 2. Vehicle Management
- Add vehicles to fleets with unique identifiers
- Track vehicle status in real-time
- Monitor battery levels and range
- Update GPS location
- Track odometer readings
- Manage vehicle availability

### 3. Driver Assignment
- Assign vehicles to drivers
- Schedule assignments (temporary, permanent, scheduled)
- Track assignment start/end times
- Record odometer and battery levels
- Pre/post-trip checklists
- Damage reporting

### 4. Maintenance Management
- Schedule maintenance (scheduled, emergency, recall)
- Track maintenance status and priority
- Record work performed and parts replaced
- Calculate costs (labor, parts, total)
- Set next service dates and odometer readings
- Attach documents and photos
- Track overdue maintenance

### 5. Analytics & Reporting
- Fleet dashboard with key metrics
- Vehicle utilization analysis
- Driver performance metrics
- Maintenance cost analysis
- Charging analytics
- Fleet comparison

### 6. Real-time Tracking
- GPS location updates
- Battery status monitoring
- Low battery alerts
- Maintenance alerts
- Vehicle status changes

## Usage Examples

### Create a Fleet

```javascript
POST /api/fleets
{
  "name": "Corporate Fleet A",
  "description": "Main corporate vehicle fleet",
  "companyId": "company_id_here",
  "managerId": "manager_user_id",
  "fleetType": "Corporate",
  "location": {
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "operatingHours": {
    "start": "08:00",
    "end": "18:00"
  },
  "settings": {
    "autoAssignment": false,
    "maintenanceAlerts": true,
    "chargingAlerts": true,
    "lowBatteryThreshold": 20
  }
}
```

### Add Vehicle to Fleet

```javascript
POST /api/fleet-vehicles
{
  "fleetId": "fleet_id_here",
  "carId": "car_id_here",
  "vehicleNumber": "FLEET-001",
  "status": "Available",
  "odometer": 15000,
  "batteryStatus": {
    "currentLevel": 85,
    "estimatedRange": 250
  }
}
```

### Create Assignment

```javascript
POST /api/fleet-assignments
{
  "fleetId": "fleet_id_here",
  "fleetVehicleId": "vehicle_id_here",
  "driverId": "driver_user_id",
  "assignmentType": "Temporary",
  "scheduledStart": "2024-03-15T08:00:00Z",
  "scheduledEnd": "2024-03-15T17:00:00Z",
  "purpose": "Client meetings downtown"
}
```

### Start Assignment

```javascript
POST /api/fleet-assignments/:assignmentId/start
{
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Main St, San Francisco"
  },
  "odometer": 15050,
  "batteryLevel": 85
}
```

### Schedule Maintenance

```javascript
POST /api/fleet-maintenance
{
  "fleetId": "fleet_id_here",
  "fleetVehicleId": "vehicle_id_here",
  "maintenanceType": "Scheduled",
  "category": "Battery",
  "priority": "Medium",
  "scheduledDate": "2024-03-20T09:00:00Z",
  "description": "Regular battery health check and software update",
  "serviceProvider": {
    "name": "EV Service Center",
    "contact": "+1-555-0123",
    "location": "456 Service Rd"
  }
}
```

### Get Fleet Dashboard

```javascript
GET /api/fleet-analytics/dashboard/:fleetId?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fleetInfo": {
      "id": "fleet_id",
      "name": "Corporate Fleet A",
      "type": "Corporate",
      "status": "Active"
    },
    "vehicleStats": {
      "total": 25,
      "available": 15,
      "inUse": 8,
      "charging": 1,
      "maintenance": 1,
      "outOfService": 0
    },
    "assignmentStats": {
      "total": 156,
      "active": 8,
      "completed": 142,
      "cancelled": 6
    },
    "maintenanceStats": {
      "total": 12,
      "scheduled": 3,
      "inProgress": 1,
      "completed": 8,
      "totalCost": 4250.50
    },
    "batteryStats": {
      "avgLevel": 72,
      "lowBatteryCount": 2,
      "threshold": 20
    },
    "utilizationRate": 36
  }
}
```

## Access Control

- **Admin**: Full access to all fleet management features
- **Company Operator**: Access to fleets within their company
- **User/Driver**: Access to their own assignments and vehicles

## Best Practices

1. **Vehicle Assignment**
   - Always check vehicle availability before assignment
   - Record accurate odometer and battery readings
   - Complete pre/post-trip checklists

2. **Maintenance Scheduling**
   - Schedule maintenance proactively based on odometer and time
   - Set appropriate priority levels
   - Keep detailed records of work performed
   - Attach receipts and documentation

3. **Fleet Monitoring**
   - Monitor battery levels regularly
   - Track vehicle utilization rates
   - Review driver performance metrics
   - Analyze maintenance costs

4. **Data Accuracy**
   - Update vehicle locations regularly
   - Record accurate battery status
   - Keep odometer readings current
   - Document all damage reports

## Integration with OCPP

The fleet management system integrates with the OCPP charging infrastructure:

- Track charging sessions per vehicle
- Monitor charging costs
- Analyze charging patterns
- Optimize charging schedules
- Track energy consumption per fleet

## Future Enhancements

- Route optimization
- Predictive maintenance using AI
- Automated assignment scheduling
- Mobile app for drivers
- Geofencing and alerts
- Integration with telematics systems
- Carbon footprint tracking
- Cost per mile/km analytics
