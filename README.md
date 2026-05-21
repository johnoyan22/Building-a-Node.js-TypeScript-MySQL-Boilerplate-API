# Node.js + TypeScript + MySQL Boilerplate API

A robust, production-ready boilerplate API built with **Node.js, Express, TypeScript, Sequelize, and MySQL**. It includes built-in JWT authentication, refresh tokens, role-based access control, email verification, password reset functionalities, and Swagger API documentation.

## Features

- **TypeScript**: Written completely in TypeScript for strong typing and better developer experience.
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **Sequelize ORM & MySQL**: Uses Sequelize to interact with a MySQL database. Includes automatic table creation/alteration.
- **Authentication**: 
  - JWT (JSON Web Tokens) for access tokens (short-lived, 15m).
  - Refresh Tokens stored in the database for issuing new JWTs without re-authenticating (long-lived, 7d).
- **Role-Based Authorization**: Middleware to restrict routes to specific user roles (e.g., `Admin`, `User`).
- **Account Management**: 
  - User Registration
  - Email Verification
  - Forgot / Reset Password flow
- **Email Integration**: Integrated with [Resend](https://resend.com/) to send verification and password reset emails. *(Configured to work with Resend free tier).*
- **Request Validation**: Incoming request bodies are validated using `Joi`.
- **API Documentation**: Auto-generated Swagger UI accessible at `/api-docs`.

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v14 or higher)
- [MySQL](https://www.mysql.com/) server (local or remote, e.g., phpMyAdmin)
- [Resend API Key](https://resend.com/) (for emails)

## Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory (you can copy your existing one) and fill in the following variables:
   ```env
   PORT=4000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=your_mysql_host
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   DB_SSL=false

   # JWT Secret Key
   JWT_SECRET=your_super_secret_jwt_key

   # Resend Email Configuration
   EMAIL_FROM=onboarding@resend.dev
   EMAIL_TO=your_verified_resend_email@gmail.com
   RESEND_API_KEY=your_resend_api_key

   # Frontend & CORS
   ALLOWED_ORIGINS=http://localhost:4200,https://your-frontend.com
   API_URL=http://localhost:4000
   FRONTEND_URL=http://localhost:4200
   ```

## Running the Application

### Development
To start the application in development mode with hot-reloading (using `nodemon` and `ts-node`):
```bash
npm run dev
```

### Production
To compile the TypeScript code into JavaScript and run it:
```bash
# Compile TypeScript to JavaScript in the /dist folder
npm run build

# Start the production server
npm start
```

## API Documentation

Once the server is running, you can view and interact with the Swagger API documentation by visiting:
```
http://localhost:4000/api-docs
```
*(Make sure to adjust the port if you changed it in the `.env` file).*

## Project Structure

- `server.ts`: Entry point of the application.
- `_helpers/`: Contains utility configurations like database initialization (`db.ts`), config loading, Swagger setup, and email sending logic.
- `_middleware/`: Contains Express middlewares for handling errors, JWT authorization, and request validation.
- `accounts/`: The core module. Contains the controller, service, and Sequelize models (`account.model.ts`, `refresh-token.model.ts`) for user accounts.

## Notes on Email Sending (Resend Free Tier)

If you are using a free Resend account without a verified domain:
- The `sendEmail` helper function automatically overrides the recipient to send all emails to your `EMAIL_TO` address defined in `.env`. 
- The original intended recipient's email will be appended to the subject line (e.g., `[newuser@example.com] -> Verify Email`).
- The sender must remain `onboarding@resend.dev` (`EMAIL_FROM`).

## License

This project is licensed under the MIT License.
