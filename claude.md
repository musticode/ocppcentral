# OCPP Central AI Assistant Guidelines

Welcome to the OCPP Central project! This document serves as a guide for AI assistants (like Claude) working on this codebase.

## Project Overview
This project is an Open Charge Point Protocol (OCPP) Central System built using Node.js. It allows management and communication with EV charging stations.

## Tech Stack
- **Runtime Environment:** Node.js (ES Modules, `"type": "module"`)
- **Web Framework:** Express.js
- **Database:** MongoDB via Mongoose
- **OCPP Library:** `ocpp-rpc`
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs`
- **Testing:** Vitest
- **API Documentation:** Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Scheduling:** `node-cron`

## Project Structure
- `app.js` / `bin/www` - Application entry points
- `routes/` - Express route handlers defining API endpoints
- `service/` - Business logic and core operations
- `model/` - Mongoose database schemas and models
- `middleware/` - Express middlewares (e.g., auth, error handling)
- `config/` / `configuration/` - Configuration settings and constants
- `exception/` - Custom error handling logic
- `tests/` - Vitest test files

## Development Guidelines
1. **ES Modules**: Ensure all imports and exports use ES module syntax (`import`/`export`), including `.js` extensions in local file imports (e.g., `import UserService from '../service/user.js'`).
2. **Asynchronous Code**: Use `async`/`await` for asynchronous operations. Catch errors properly and pass them to error-handling middleware.
3. **Database Operations**: Keep database queries within the `service` layer or `model` methods; keep controllers (`routes/`) focused on handling HTTP requests and responses.
4. **Testing**: When adding new functionality, try to update or add tests in the `tests/` directory using Vitest.
5. **Environment Variables**: Configurations depend on environment files (e.g., `.env.development`, `.env.production`). Do not hardcode sensitive secrets.
6. **Code Style**: Ensure code is consistent with the current style (Prettier/ESLint if available), use camelCase for variables/functions and PascalCase for Classes/Models.
