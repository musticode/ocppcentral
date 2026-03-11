# Fleet Management API Examples

Complete API examples for the EV Fleet Management System.

## Authentication

All API requests require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Fleet Management

### Create Fleet

```bash
POST /api/fleets
Content-Type: application/json

{
  "name": "Downtown Delivery Fleet",
  "description": "Electric delivery vehicles for downtown area",
  "companyId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "managerId": "65f1a2b3c4d5e6f7g8h9i0j2",
  "fleetType": "Delivery",
  "location": {
    "address": "100 Fleet Street",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "operatingHours": {
    "start": "06:00",
    "end": "22:00"
  },
  "contactInfo": {
    "email": "fleet@company.com",
    "phone": "+1-555-0100"
  },
  "settings": {
    "autoAssignment": true,
    "maintenanceAlerts": true,
    "chargingAlerts": true,
    "lowBatteryThreshold": 25
  }
}
```

### Get Fleet Statistics

```bash
GET /api/fleets/65f1a2b3c4d5e6f7g8h9i0j3/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fleetId": "65f1a2b3c4d5e6f7g8h9i0j3",
    "fleetName": "Downtown Delivery Fleet",
    "totalVehicles": 20,
    "availableVehicles": 12,
    "assignedVehicles": 6,
    "chargingVehicles": 1,
    "maintenanceVehicles": 1,
    "statusDistribution": [
      { "_id": "Available", "count": 12 },
      { "_id": "InUse", "count": 6 },
      { "_id": "Charging", "count": 1 },
      { "_id": "Maintenance", "count": 1 }
    ],
    "avgBatteryLevel": 68,
    "lowBatteryVehicles": 2,
    "utilizationRate": 35
  }
}
```

## Vehicle Management

### Add Vehicle to Fleet

```bash
POST /api/fleet-vehicles
Content-Type: application/json

{
  "fleetId": "65f1a2b3c4d5e6f7g8h9i0j3",
  "carId": "65f1a2b3c4d5e6f7g8h9i0j4",
  "vehicleNumber": "DLV-001",
  "status": "Available",
  "currentLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "100 Fleet Street, San Francisco, CA"
  },
  "batteryStatus": {
    "currentLevel": 85,
    "estimatedRange": 220
  },
  "odometer": 12500
}
```

### Update Vehicle Location (Real-time)

```bash
POST /api/fleet-vehicles/65f1a2b3c4d5e6f7g8h9i0j5/location
Content-Type: application/json

{
  "latitude": 37.7849,
  "longitude": -122.4094,
  "address": "Market Street, San Francisco, CA"
}
```

### Update Battery Status

```bash
POST /api/fleet-vehicles/65f1a2b3c4d5e6f7g8h9i0j5/battery
Content-Type: application/json

{
  "currentLevel": 72,
  "estimatedRange": 185
}
```

### Get Available Vehicles

```bash
GET /api/fleet-vehicles/available/65f1a2b3c4d5e6f7g8h9i0j3
```

### Get Vehicles Due for Maintenance

```bash
GET /api/fleet-vehicles/maintenance-due/65f1a2b3c4d5e6f7g8h9i0j3?daysAhead=14
```

## Assignment Management

### Create Assignment

```bash
POST /api/fleet-assignments
Content-Type: application/json

{
  "fleetId": "65f1a2b3c4d5e6f7g8h9i0j3",
  "fleetVehicleId": "65f1a2b3c4d5e6f7g8h9i0j5",
  "driverId": "65f1a2b3c4d5e6f7g8h9i0j6",
  "assignmentType": "Temporary",
  "scheduledStart": "2024-03-15T08:00:00Z",
  "scheduledEnd": "2024-03-15T18:00:00Z",
  "purpose": "Downtown deliveries - Route A"
}
```

### Start Assignment (Driver Action)

```bash
POST /api/fleet-assignments/65f1a2b3c4d5e6f7g8h9i0j7/start
Content-Type: application/json

{
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "100 Fleet Street, San Francisco, CA"
  },
  "odometer": 12500,
  "batteryLevel": 85
}
```

### Complete Assignment (Driver Action)

```bash
POST /api/fleet-assignments/65f1a2b3c4d5e6f7g8h9i0j7/complete
Content-Type: application/json

{
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "100 Fleet Street, San Francisco, CA"
  },
  "odometer": 12625,
  "batteryLevel": 42,
  "checklistCompleted": true,
  "damageReported": false,
  "notes": "All deliveries completed successfully. Vehicle cleaned and ready for next shift."
}
```

### Get My Active Assignments (Driver)

```bash
GET /api/fleet-assignments/my-assignments
```

### Get Upcoming Assignments

```bash
GET /api/fleet-assignments/upcoming/65f1a2b3c4d5e6f7g8h9i0j3?days=7
```

### Get Assignment Statistics

```bash
GET /api/fleet-assignments/stats/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAssignments": 245,
    "completedAssignments": 230,
    "activeAssignments": 8,
    "cancelledAssignments": 7,
    "completedWithDamage": 3,
    "totalDistance": 18750,
    "completionRate": 94
  }
}
```

## Maintenance Management

### Schedule Maintenance

```bash
POST /api/fleet-maintenance
Content-Type: application/json

{
  "fleetId": "65f1a2b3c4d5e6f7g8h9i0j3",
  "fleetVehicleId": "65f1a2b3c4d5e6f7g8h9i0j5",
  "maintenanceType": "Scheduled",
  "category": "Battery",
  "priority": "Medium",
  "scheduledDate": "2024-03-20T09:00:00Z",
  "description": "Quarterly battery health check and software update",
  "serviceProvider": {
    "name": "Tesla Service Center",
    "contact": "+1-555-0200",
    "location": "500 Service Avenue, San Francisco, CA"
  }
}
```

### Start Maintenance

```bash
POST /api/fleet-maintenance/65f1a2b3c4d5e6f7g8h9i0j8/start
Content-Type: application/json

{
  "odometerReading": 12625
}
```

### Complete Maintenance

```bash
POST /api/fleet-maintenance/65f1a2b3c4d5e6f7g8h9i0j8/complete
Content-Type: application/json

{
  "workPerformed": "Battery health check completed. Software updated to v2.5.1. Tire rotation performed. Brake pads inspected - 60% remaining.",
  "partsReplaced": [
    {
      "partName": "Cabin Air Filter",
      "partNumber": "CAF-2024-A",
      "quantity": 1,
      "cost": 45.00
    }
  ],
  "laborCost": 120.00,
  "partsCost": 45.00,
  "performedBy": "John Smith - Certified EV Technician",
  "nextServiceOdometer": 17625,
  "nextServiceDate": "2024-06-20T09:00:00Z"
}
```

### Get Overdue Maintenance

```bash
GET /api/fleet-maintenance/overdue/65f1a2b3c4d5e6f7g8h9i0j3
```

### Get Maintenance Statistics

```bash
GET /api/fleet-maintenance/stats/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-01-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMaintenance": 45,
    "completed": 38,
    "scheduled": 5,
    "inProgress": 2,
    "cancelled": 0,
    "totalCost": 8450.75,
    "avgCost": 222.39,
    "categoryDistribution": [
      { "_id": "Battery", "count": 15, "totalCost": 3200.50 },
      { "_id": "Tires", "count": 12, "totalCost": 2800.00 },
      { "_id": "Brakes", "count": 8, "totalCost": 1650.25 },
      { "_id": "Software", "count": 10, "totalCost": 800.00 }
    ],
    "completionRate": 84
  }
}
```

## Analytics & Reporting

### Get Fleet Dashboard

```bash
GET /api/fleet-analytics/dashboard/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fleetInfo": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j3",
      "name": "Downtown Delivery Fleet",
      "type": "Delivery",
      "status": "Active"
    },
    "vehicleStats": {
      "total": 20,
      "available": 12,
      "inUse": 6,
      "charging": 1,
      "maintenance": 1,
      "outOfService": 0
    },
    "assignmentStats": {
      "total": 245,
      "active": 8,
      "completed": 230,
      "cancelled": 7
    },
    "maintenanceStats": {
      "total": 45,
      "scheduled": 5,
      "inProgress": 2,
      "completed": 38,
      "totalCost": 8450.75
    },
    "batteryStats": {
      "avgLevel": 68,
      "lowBatteryCount": 2,
      "threshold": 25
    },
    "utilizationRate": 35,
    "period": {
      "startDate": "2024-03-01",
      "endDate": "2024-03-31"
    }
  }
}
```

### Get Vehicle Utilization

```bash
GET /api/fleet-analytics/vehicle-utilization/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "vehicleNumber": "DLV-001",
      "vehicleId": "65f1a2b3c4d5e6f7g8h9i0j5",
      "carInfo": {
        "make": "Tesla",
        "model": "Model 3",
        "year": 2023
      },
      "totalAssignments": 28,
      "completedAssignments": 27,
      "totalDistance": 1850,
      "totalHours": 156.5
    }
  ]
}
```

### Get Driver Performance

```bash
GET /api/fleet-analytics/driver-performance/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "driverId": "65f1a2b3c4d5e6f7g8h9i0j6",
      "driverName": "Alice Johnson",
      "driverEmail": "alice.j@company.com",
      "totalAssignments": 32,
      "completedAssignments": 32,
      "totalDistance": 2150,
      "totalHours": 184.5,
      "damageReports": 0,
      "avgBatteryUsage": 38
    }
  ]
}
```

### Get Maintenance Cost Analysis

```bash
GET /api/fleet-analytics/maintenance-cost/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-01-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMaintenance": 45,
      "totalCost": 8450.75,
      "totalLaborCost": 5200.00,
      "totalPartsCost": 3250.75,
      "avgCostPerMaintenance": 187.79
    },
    "categoryBreakdown": [
      {
        "_id": "Battery",
        "count": 15,
        "totalCost": 3200.50,
        "avgCost": 213.37
      },
      {
        "_id": "Tires",
        "count": 12,
        "totalCost": 2800.00,
        "avgCost": 233.33
      }
    ],
    "vehicleBreakdown": [
      {
        "vehicleId": "65f1a2b3c4d5e6f7g8h9i0j5",
        "vehicleNumber": "DLV-001",
        "maintenanceCount": 5,
        "totalCost": 950.25
      }
    ]
  }
}
```

### Get Charging Analytics

```bash
GET /api/fleet-analytics/charging/65f1a2b3c4d5e6f7g8h9i0j3?startDate=2024-03-01&endDate=2024-03-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSessions": 185,
      "totalEnergy": 4625.50,
      "totalCost": 1850.75,
      "avgEnergyPerSession": 25.00,
      "avgCostPerSession": 10.00
    },
    "byVehicle": [
      {
        "idTag": "TAG-DLV-001",
        "sessions": 28,
        "totalEnergy": 700.00,
        "totalCost": 280.00
      }
    ]
  }
}
```

### Compare Fleets

```bash
GET /api/fleet-analytics/comparison/65f1a2b3c4d5e6f7g8h9i0j0
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "fleetId": "65f1a2b3c4d5e6f7g8h9i0j3",
      "fleetName": "Downtown Delivery Fleet",
      "fleetType": "Delivery",
      "totalVehicles": 20,
      "activeVehicles": 19,
      "totalAssignments": 245,
      "completedAssignments": 230,
      "totalDistance": 18750,
      "maintenanceCount": 45,
      "maintenanceCost": 8450.75,
      "utilizationRate": 35
    }
  ]
}
```

## Common Query Parameters

### Filtering

Most list endpoints support filtering:

```bash
# Filter by status
GET /api/fleet-vehicles?status=Available

# Filter by fleet
GET /api/fleet-assignments?fleetId=65f1a2b3c4d5e6f7g8h9i0j3

# Filter by date range
GET /api/fleet-maintenance?startDate=2024-03-01&endDate=2024-03-31

# Multiple filters
GET /api/fleet-vehicles?fleetId=65f1a2b3c4d5e6f7g8h9i0j3&status=Available&isActive=true
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Fleet ID is required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Fleet not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Cannot delete fleet with active vehicles. Please remove or deactivate all vehicles first."
}
```

## Webhook Events (Future)

Future webhook support for real-time notifications:

- `fleet.vehicle.low_battery` - Vehicle battery below threshold
- `fleet.vehicle.maintenance_due` - Maintenance due soon
- `fleet.assignment.started` - Assignment started
- `fleet.assignment.completed` - Assignment completed
- `fleet.maintenance.completed` - Maintenance completed
- `fleet.vehicle.damage_reported` - Damage reported

## Rate Limiting

API requests are rate-limited to:
- 100 requests per minute for authenticated users
- 1000 requests per hour for company operators
- Unlimited for admin users

## Best Practices

1. **Batch Operations**: Use bulk endpoints when available
2. **Caching**: Cache fleet and vehicle data for 5 minutes
3. **Real-time Updates**: Use WebSocket connections for live tracking
4. **Error Handling**: Always check `success` field in responses
5. **Pagination**: Use limit/offset for large datasets (future feature)
6. **Date Formats**: Always use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
