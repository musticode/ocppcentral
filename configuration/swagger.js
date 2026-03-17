/**
 * OpenAPI 3.0 specification for OCPP Central API
 * Served at /api-docs via swagger-ui-express
 */

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "OCPP Central API",
      version: "1.0.0",
      description:
        "REST API for OCPP Central System: auth, charge points, transactions, companies, tariffs, consumption, and central system (OCPP) operations.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from /api/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {},
            message: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication and user session" },
      { name: "Charge Points", description: "Charge point management" },
      { name: "Transactions", description: "Charging transactions" },
      { name: "Companies", description: "Company management" },
      { name: "Locations", description: "Location management" },
      { name: "Tariff", description: "Tariffs and pricing" },
      { name: "Consumption", description: "Consumption data" },
      { name: "Reservations", description: "Charge point reservations (OCPP)" },
      { name: "Cars", description: "Electric vehicle management" },
      { name: "Payment Methods", description: "User payment method management" },
      {
        name: "Central System",
        description: "OCPP central system (charge point control)",
      },
      { name: "Users", description: "User management" },
    ],
    paths: {
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login success; returns token and user" },
            401: { description: "Invalid credentials" },
            400: { description: "Email and password required" },
          },
        },
      },
      "/api/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Signup",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["user", "company"],
                  properties: {
                    user: {
                      type: "object",
                      required: ["name", "email", "password"],
                      properties: {
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        password: { type: "string" },
                      },
                    },
                    company: {
                      type: "object",
                      required: [
                        "name",
                        "email",
                        "phone",
                        "address",
                        "city",
                        "state",
                        "zipCode",
                        "country",
                      ],
                      properties: {
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        address: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zipCode: { type: "string" },
                        country: { type: "string" },
                        website: { type: "string" },
                        taxId: { type: "string" },
                        registrationNumber: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Forgot password",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                    resetToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            400: { description: "Bad request" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user profile",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User profile" } },
        },
      },
      "/api/charge-points/listAllChargePoints": {
        get: {
          tags: ["Charge Points"],
          summary: "List all charge points",
          responses: { 200: { description: "List of charge points" } },
        },
      },
      "/api/charge-points/{id}": {
        get: {
          tags: ["Charge Points"],
          summary: "Get charge point by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Charge point" },
            500: { description: "Error" },
          },
        },
      },
      "/api/charge-points/createChargePoint": {
        post: {
          tags: ["Charge Points"],
          summary: "Create charge point",
          requestBody: {
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Created" },
            500: { description: "Error" },
          },
        },
      },
      "/api/charge-points/{id}": {
        put: {
          tags: ["Charge Points"],
          summary: "Update charge point",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Updated" },
            404: { description: "Charge point not found" },
          },
        },
        delete: {
          tags: ["Charge Points"],
          summary: "Delete charge point",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Deleted" },
            404: { description: "Charge point not found" },
          },
        },
      },
      "/api/charge-points/{id}/location": {
        put: {
          tags: ["Charge Points"],
          summary: "Update charge point location relation",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    locationId: {
                      type: "string",
                      nullable: true,
                      description: "Location MongoDB _id or null to unassign",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Charge point with updated location" },
            404: { description: "Charge point or location not found" },
          },
        },
      },
      "/api/transactions/listAllTransactions": {
        get: {
          tags: ["Transactions"],
          summary: "List all transactions",
          responses: { 200: { description: "List of transactions" } },
        },
      },
      "/api/transactions/fetchTransactionsByCompanyName": {
        get: {
          tags: ["Transactions"],
          summary: "Fetch transactions by company name",
          parameters: [
            {
              name: "companyName",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Transactions" } },
        },
      },
      "/api/companies/listAllCompanies": {
        get: {
          tags: ["Companies"],
          summary: "List all companies",
          responses: { 200: { description: "List of companies" } },
        },
      },
      "/api/companies/{name}": {
        get: {
          tags: ["Companies"],
          summary: "Get company by name",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Company" } },
        },
      },
      "/api/locations/listAllLocations": {
        get: {
          tags: ["Locations"],
          summary: "List all locations",
          responses: { 200: { description: "List of locations" } },
        },
      },
      "/api/locations/createLocation": {
        post: {
          tags: ["Locations"],
          summary: "Create location",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address"],
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Created" },
            400: { description: "Name and address required" },
          },
        },
      },
      "/api/locations/{id}": {
        get: {
          tags: ["Locations"],
          summary: "Get location by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Location" },
            404: { description: "Location not found" },
          },
        },
        put: {
          tags: ["Locations"],
          summary: "Update location",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated" },
            404: { description: "Location not found" },
          },
        },
        delete: {
          tags: ["Locations"],
          summary: "Delete location (unassigns charge points first)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Deleted" },
            404: { description: "Location not found" },
          },
        },
      },
      "/api/locations/{id}/charge-points": {
        get: {
          tags: ["Locations"],
          summary: "Get charge points for a location",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Charge points at this location" },
            404: { description: "Location not found" },
          },
        },
      },
      "/api/companies/createCompany": {
        post: {
          tags: ["Companies"],
          summary: "Create company",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address"],
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" },
                    website: { type: "string" },
                    logo: { type: "string" },
                    description: { type: "string" },
                    paymentNeeded: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/tariff": {
        get: {
          tags: ["Tariff"],
          summary: "Get all tariffs (optional filters)",
          parameters: [
            { name: "companyId", in: "query", schema: { type: "string" } },
            { name: "chargePointId", in: "query", schema: { type: "string" } },
            { name: "connectorId", in: "query", schema: { type: "integer" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
          ],
          responses: { 200: { description: "List of tariffs" } },
        },
        post: {
          tags: ["Tariff"],
          summary: "Create tariff",
          requestBody: {
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            201: { description: "Created" },
            400: { description: "Error" },
          },
        },
      },
      "/api/tariff/company/{companyId}": {
        get: {
          tags: ["Tariff"],
          summary: "Get tariffs by company",
          parameters: [
            {
              name: "companyId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { name: "chargePointId", in: "query", schema: { type: "string" } },
            { name: "connectorId", in: "query", schema: { type: "integer" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
          ],
          responses: { 200: { description: "Tariffs" } },
        },
      },
      "/api/tariff/connector/{chargePointId}/{connectorId}": {
        get: {
          tags: ["Tariff"],
          summary: "Get active tariff for connector",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "connectorId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "dateTime",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: { 200: { description: "Tariff or null" } },
        },
        put: {
          tags: ["Tariff"],
          summary: "Update tariff for connector",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "connectorId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Updated" },
            400: { description: "Error" },
          },
        },
      },
      "/api/tariff/price/{chargePointId}/{connectorId}": {
        get: {
          tags: ["Tariff"],
          summary: "Get price for connector",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "connectorId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "dateTime",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: { 200: { description: "Price info" } },
        },
      },
      "/api/tariff/{id}": {
        get: {
          tags: ["Tariff"],
          summary: "Get tariff by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Tariff" },
            404: { description: "Not found" },
          },
        },
        put: {
          tags: ["Tariff"],
          summary: "Update tariff",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Updated" },
            400: { description: "Error" },
          },
        },
        delete: {
          tags: ["Tariff"],
          summary: "Delete tariff",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Deleted" },
            400: { description: "Error" },
          },
        },
      },
      "/api/tariff/{id}/deactivate": {
        patch: {
          tags: ["Tariff"],
          summary: "Deactivate tariff",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Deactivated" },
            400: { description: "Error" },
          },
        },
      },
      "/api/consumption": {
        get: {
          tags: ["Consumption"],
          summary: "Get all consumption",
          responses: { 200: { description: "List of consumption" } },
        },
      },
      "/api/consumption/{id}": {
        get: {
          tags: ["Consumption"],
          summary: "Get consumption by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Consumption" } },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/change-availability": {
        post: {
          tags: ["Central System"],
          summary: "Change availability (Operative | Inoperative)",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["connectorId", "type"],
                  properties: {
                    connectorId: { type: "integer" },
                    type: {
                      type: "string",
                      enum: ["Operative", "Inoperative"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Charge point not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/change-configuration":
        {
          post: {
            tags: ["Central System"],
            summary: "Change configuration",
            parameters: [
              {
                name: "chargePointId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["key", "value"],
                    properties: {
                      key: { type: "string" },
                      value: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "OK" },
              404: { description: "Not connected" },
            },
          },
        },
      "/api/central-system/charge-points/{chargePointId}/clear-cache": {
        post: {
          tags: ["Central System"],
          summary: "Clear authorization cache",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/get-configuration": {
        get: {
          tags: ["Central System"],
          summary: "Get configuration",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "keys",
              in: "query",
              description: "Comma-separated keys",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Configuration" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/remote-start-transaction":
        {
          post: {
            tags: ["Central System"],
            summary: "Remote start transaction",
            parameters: [
              {
                name: "chargePointId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["idTag"],
                    properties: {
                      idTag: { type: "string" },
                      connectorId: { type: "integer" },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "OK" },
              404: { description: "Not connected" },
            },
          },
        },
      "/api/central-system/charge-points/{chargePointId}/remote-stop-transaction":
        {
          post: {
            tags: ["Central System"],
            summary: "Remote stop transaction",
            parameters: [
              {
                name: "chargePointId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["transactionId"],
                    properties: { transactionId: { type: "integer" } },
                  },
                },
              },
            },
            responses: {
              200: { description: "OK" },
              404: { description: "Not connected" },
            },
          },
        },
      "/api/central-system/charge-points/{chargePointId}/reset": {
        post: {
          tags: ["Central System"],
          summary: "Reset charger (Hard | Soft)",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type"],
                  properties: {
                    type: { type: "string", enum: ["Hard", "Soft"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/unlock-connector": {
        post: {
          tags: ["Central System"],
          summary: "Unlock connector",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["connectorId"],
                  properties: { connectorId: { type: "integer" } },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/get-diagnostics": {
        post: {
          tags: ["Central System"],
          summary: "Get diagnostics",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["location"],
                  properties: {
                    location: { type: "string", format: "uri" },
                    startTime: { type: "string", format: "date-time" },
                    stopTime: { type: "string", format: "date-time" },
                    retries: { type: "integer" },
                    retryInterval: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/update-firmware": {
        post: {
          tags: ["Central System"],
          summary: "Update firmware",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    retries: { type: "integer" },
                    retryInterval: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/send-local-list": {
        post: {
          tags: ["Central System"],
          summary: "Send local authorization list",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "listVersion",
                    "localAuthorizationList",
                    "updateType",
                  ],
                  properties: {
                    listVersion: { type: "integer" },
                    localAuthorizationList: {
                      type: "array",
                      items: { type: "object" },
                    },
                    updateType: {
                      type: "string",
                      enum: ["Full", "Differential"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/get-local-list-version":
        {
          get: {
            tags: ["Central System"],
            summary: "Get local list version",
            parameters: [
              {
                name: "chargePointId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              200: { description: "Version" },
              404: { description: "Not connected" },
            },
          },
        },
      "/api/central-system/charge-points/{chargePointId}/reserve-now": {
        post: {
          tags: ["Central System"],
          summary: "Reserve connector",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["connectorId", "expiryDate", "idTag"],
                  properties: {
                    connectorId: { type: "integer" },
                    expiryDate: { type: "string", format: "date-time" },
                    idTag: { type: "string" },
                    reservationId: { type: "integer" },
                    parentIdTag: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/cancel-reservation": {
        post: {
          tags: ["Central System"],
          summary: "Cancel reservation",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["reservationId"],
                  properties: {
                    reservationId: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/trigger-message": {
        post: {
          tags: ["Central System"],
          summary: "Trigger message",
          parameters: [
            {
              name: "chargePointId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["requestedMessage"],
                  properties: {
                    requestedMessage: { type: "string" },
                    connectorId: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            404: { description: "Not connected" },
          },
        },
      },
      "/api/central-system/charge-points/{chargePointId}/trigger-message-types":
        {
          get: {
            tags: ["Central System"],
            summary: "List supported trigger message types",
            parameters: [
              {
                name: "chargePointId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "Trigger message types" } },
          },
        },
      "/api/reservations": {
        get: {
          tags: ["Reservations"],
          summary: "List all reservations with optional filters",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "chargePointId", in: "query", schema: { type: "string" } },
            { name: "idTag", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["Active", "Used", "Expired", "Cancelled"] } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
          ],
          responses: {
            200: { description: "List of reservations" },
            500: { description: "Error" },
          },
        },
        post: {
          tags: ["Reservations"],
          summary: "Create a new reservation",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["chargePointId", "idTag", "expiryDate"],
                  properties: {
                    chargePointId: { type: "string" },
                    connectorId: { type: "integer" },
                    idTag: { type: "string" },
                    expiryDate: { type: "string", format: "date-time" },
                    reservationId: { type: "integer" },
                    parentIdTag: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Reservation created" },
            400: { description: "Validation error" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/{reservationId}": {
        get: {
          tags: ["Reservations"],
          summary: "Get a specific reservation by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "reservationId", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "Reservation details" },
            404: { description: "Reservation not found" },
            500: { description: "Error" },
          },
        },
        delete: {
          tags: ["Reservations"],
          summary: "Delete a reservation (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "reservationId", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "Reservation deleted" },
            404: { description: "Reservation not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/{reservationId}/cancel": {
        post: {
          tags: ["Reservations"],
          summary: "Cancel a reservation",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "reservationId", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Reservation cancelled" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/charge-point/{chargePointId}": {
        get: {
          tags: ["Reservations"],
          summary: "Get reservations for a specific charge point",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "chargePointId", in: "path", required: true, schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
          ],
          responses: {
            200: { description: "Reservations for charge point" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/id-tag/{idTag}": {
        get: {
          tags: ["Reservations"],
          summary: "Get reservations for a specific idTag",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "idTag", in: "path", required: true, schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
          ],
          responses: {
            200: { description: "Reservations for idTag" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/validate": {
        post: {
          tags: ["Reservations"],
          summary: "Validate if a reservation can be made",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["chargePointId", "idTag"],
                  properties: {
                    chargePointId: { type: "string" },
                    connectorId: { type: "integer" },
                    idTag: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Validation result" },
            400: { description: "Validation error" },
            500: { description: "Error" },
          },
        },
      },
      "/api/reservations/expire-old": {
        post: {
          tags: ["Reservations"],
          summary: "Mark expired reservations as expired",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Expired reservations count" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars": {
        get: {
          tags: ["Cars"],
          summary: "List all cars with optional filters",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "query", schema: { type: "string" } },
            { name: "companyId", in: "query", schema: { type: "string" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
            { name: "make", in: "query", schema: { type: "string" } },
            { name: "model", in: "query", schema: { type: "string" } },
            { name: "year", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "List of cars" },
            500: { description: "Error" },
          },
        },
        post: {
          tags: ["Cars"],
          summary: "Create a new car",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["make", "model", "year", "licensePlate"],
                  properties: {
                    userId: { type: "string", description: "Admin only - assign to specific user" },
                    companyId: { type: "string" },
                    make: { type: "string" },
                    model: { type: "string" },
                    year: { type: "integer" },
                    color: { type: "string" },
                    licensePlate: { type: "string" },
                    vin: { type: "string" },
                    batteryCapacity: { type: "number" },
                    range: { type: "number" },
                    chargingPort: { type: "string", enum: ["Type 1", "Type 2", "CCS", "CHAdeMO", "Tesla", "Other"] },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Car created" },
            400: { description: "Validation error" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/my-cars": {
        get: {
          tags: ["Cars"],
          summary: "Get cars for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User's cars" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/stats": {
        get: {
          tags: ["Cars"],
          summary: "Get car statistics",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "query", schema: { type: "string" } },
            { name: "companyId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car statistics" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/user/{userId}": {
        get: {
          tags: ["Cars"],
          summary: "Get cars for a specific user",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "User's cars" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/company/{companyId}": {
        get: {
          tags: ["Cars"],
          summary: "Get cars for a specific company",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "companyId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Company's cars" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/license-plate/{licensePlate}": {
        get: {
          tags: ["Cars"],
          summary: "Get car by license plate",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "licensePlate", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car details" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/{carId}": {
        get: {
          tags: ["Cars"],
          summary: "Get a specific car by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "carId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car details" },
            403: { description: "Access denied" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
        put: {
          tags: ["Cars"],
          summary: "Update a car",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "carId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    make: { type: "string" },
                    model: { type: "string" },
                    year: { type: "integer" },
                    color: { type: "string" },
                    licensePlate: { type: "string" },
                    vin: { type: "string" },
                    batteryCapacity: { type: "number" },
                    range: { type: "number" },
                    chargingPort: { type: "string" },
                    notes: { type: "string" },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Car updated" },
            403: { description: "Access denied" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
        delete: {
          tags: ["Cars"],
          summary: "Delete a car (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "carId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car deleted" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/{carId}/deactivate": {
        post: {
          tags: ["Cars"],
          summary: "Deactivate a car",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "carId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car deactivated" },
            403: { description: "Access denied" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/cars/{carId}/activate": {
        post: {
          tags: ["Cars"],
          summary: "Activate a car",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "carId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Car activated" },
            403: { description: "Access denied" },
            404: { description: "Car not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods": {
        get: {
          tags: ["Payment Methods"],
          summary: "List all payment methods with optional filters (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "query", schema: { type: "string" } },
            { name: "isActive", in: "query", schema: { type: "boolean" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive", "expired", "failed", "pending"] } },
            { name: "type", in: "query", schema: { type: "string", enum: ["credit_card", "debit_card", "bank_account", "paypal", "stripe", "other"] } },
            { name: "provider", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of payment methods" },
            500: { description: "Error" },
          },
        },
        post: {
          tags: ["Payment Methods"],
          summary: "Create a new payment method",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type", "provider"],
                  properties: {
                    userId: { type: "string", description: "Admin only - assign to specific user" },
                    type: { type: "string", enum: ["credit_card", "debit_card", "bank_account", "paypal", "stripe", "other"] },
                    provider: { type: "string", enum: ["stripe", "paypal", "square", "manual", "other"] },
                    cardLast4: { type: "string", pattern: "^\\d{4}$" },
                    cardBrand: { type: "string", enum: ["visa", "mastercard", "amex", "discover", "other"] },
                    cardExpMonth: { type: "integer", minimum: 1, maximum: 12 },
                    cardExpYear: { type: "integer" },
                    bankAccountLast4: { type: "string", pattern: "^\\d{4}$" },
                    bankName: { type: "string" },
                    paypalEmail: { type: "string", format: "email" },
                    externalId: { type: "string" },
                    externalCustomerId: { type: "string" },
                    isActive: { type: "boolean" },
                    isVerified: { type: "boolean" },
                    isDefault: { type: "boolean" },
                    billingAddress: {
                      type: "object",
                      properties: {
                        street: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zipCode: { type: "string" },
                        country: { type: "string" },
                      },
                    },
                    metadata: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Payment method created" },
            400: { description: "Validation error" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/my-methods": {
        get: {
          tags: ["Payment Methods"],
          summary: "Get payment methods for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User's payment methods" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/active": {
        get: {
          tags: ["Payment Methods"],
          summary: "Get active payment method for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Active payment method" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/check-payment": {
        get: {
          tags: ["Payment Methods"],
          summary: "Check if user has active payment method and charging eligibility",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Payment status check result" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/stats": {
        get: {
          tags: ["Payment Methods"],
          summary: "Get payment method statistics (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method statistics" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/user/{userId}": {
        get: {
          tags: ["Payment Methods"],
          summary: "Get payment methods for a specific user (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "User's payment methods" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/expire-old": {
        post: {
          tags: ["Payment Methods"],
          summary: "Mark expired payment methods as expired (admin only)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Expired payment methods count" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/{paymentMethodId}": {
        get: {
          tags: ["Payment Methods"],
          summary: "Get a specific payment method by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method details" },
            403: { description: "Access denied" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
        put: {
          tags: ["Payment Methods"],
          summary: "Update a payment method",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cardExpMonth: { type: "integer", minimum: 1, maximum: 12 },
                    cardExpYear: { type: "integer" },
                    billingAddress: { type: "object" },
                    isDefault: { type: "boolean" },
                    metadata: { type: "object" },
                    status: { type: "string", enum: ["active", "inactive", "expired", "failed", "pending"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Payment method updated" },
            403: { description: "Access denied" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
        delete: {
          tags: ["Payment Methods"],
          summary: "Delete a payment method",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method deleted" },
            403: { description: "Access denied" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/{paymentMethodId}/set-active": {
        post: {
          tags: ["Payment Methods"],
          summary: "Set a payment method as active",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method set as active" },
            403: { description: "Access denied" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/{paymentMethodId}/verify": {
        post: {
          tags: ["Payment Methods"],
          summary: "Verify a payment method (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method verified" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
      },
      "/api/payment-methods/{paymentMethodId}/deactivate": {
        post: {
          tags: ["Payment Methods"],
          summary: "Deactivate a payment method",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "paymentMethodId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Payment method deactivated" },
            403: { description: "Access denied" },
            404: { description: "Payment method not found" },
            500: { description: "Error" },
          },
        },
      },
      "/users/listAllUsers": {
        get: {
          tags: ["Users"],
          summary: "List all users",
          responses: { 200: { description: "List of users" } },
        },
      },
      "/users/createNewUser": {
        post: {
          tags: ["Users"],
          summary: "Create user",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                    role: { type: "string" },
                    companyId: { type: "string" },
                    companyName: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Created" },
            500: { description: "Error" },
          },
        },
      },
    },
  },
  apis: [], // No JSDoc scanning; spec is fully in definition above
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
