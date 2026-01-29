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
      { name: "Tariff", description: "Tariffs and pricing" },
      { name: "Consumption", description: "Consumption data" },
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
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
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
