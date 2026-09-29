# Client Request Desk

A multi-workspace Client Request Desk application built using React, TypeScript, Node.js, Express and SQLite.

The application allows local businesses to manage customer requests, update request status, view request activity and convert qualified requests into work items.

---

## Features

- Workspace-aware request management
- JWT-based authentication
- Create customer requests
- View request details
- Edit customer requests
- Filter requests by status
- Request activity timeline
- Convert QUALIFIED requests into work items
- Human confirmation before conversion
- Duplicate conversion prevention
- Workspace isolation
- Input validation
- API error handling
- Responsive frontend
- Backend automated tests
- Frontend interaction test

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Testing Library
- Vitest

### Backend

- Node.js
- Express
- TypeScript
- JWT
- bcryptjs
- SQLite
- better-sqlite3

### Testing

- Vitest
- Supertest
- React Testing Library

---

## Project Structure

```text
client-request-desk/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   └── routes/
│   │
│   ├── tests/
│   │   └── request.test.ts
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── test/
│   │   │   ├── setup.ts
│   │   │   └── App.test.tsx
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   └── package.json
│
└── README.md


//
Architecture

The project uses a simple frontend-backend architecture.

React Frontend
      |
      | HTTP / REST API
      ↓
Node.js + Express Backend
      |
      ↓
SQLite Database

The frontend communicates with the backend using REST APIs.

Authentication is handled using JWT tokens.

The JWT contains the authenticated user's ID and workspace ID.

The backend uses the workspace ID from the authenticated token when accessing request data.

Workspace Isolation

Workspace isolation is enforced on the backend.

Every request belongs to a workspace.

For example:

Workspace 1
    ├── User 1
    └── Customer Requests

Workspace 2
    ├── User 2
    └── Customer Requests

Request queries always use the authenticated user's workspace ID.

Example:

WHERE id = ? AND workspace_id = ?

This prevents a user from accessing another workspace's request by manually changing the request ID.

The backend also applies workspace checks during:

Request listing
Request details
Request creation
Request update
Work item conversion
Activity retrieval
Authentication

The application uses JWT authentication.

Users log in using their email and password.

The backend verifies the password and returns a JWT token.

The frontend stores the token and sends it with protected API requests:

Authorization: Bearer <token>

Protected request APIs require a valid JWT.

Request Statuses

The application supports three request statuses:

NEW
QUALIFIED
CLOSED

Only QUALIFIED requests can be converted into work items.

After successful conversion, the request status becomes CLOSED.

Request Conversion

The conversion flow requires human confirmation.

Before conversion, the frontend displays:

Customer name
Requested service
Scheduled date

The user must click:

Confirm Conversion

before the conversion API is called.

The backend also validates that the request is QUALIFIED.

A database-level unique constraint on request_id prevents multiple work items from being created for the same request.

An activity record is created when the conversion succeeds.

Database

SQLite is used for this assignment.

Main tables:

workspaces
users
customer_requests
work_items
activities

Relationships are protected using foreign keys.

The work_items.request_id field has a unique constraint to prevent duplicate work items.

Seed Data

The project contains sample data for two workspaces.

Workspace 1
Workspace: ABC Plumbing
User: Rohit
Email: rohit@abcplumbing.com
Password: password123
Workspace 2
Workspace: XYZ Plumbing
User: Amit
Email: amit@xyzplumbing.com
Password: password123

Sample customer requests are included for both workspaces.

Environment Variables

Create a .env file inside the backend folder.

Example:

PORT=5000
JWT_SECRET=your_secret_here

A .env.example file is included in the project:

PORT=5000
JWT_SECRET=change_this_secret

Never commit real secrets to source control.

Installation
Backend

Open terminal inside the backend folder:

npm install

Run the database seed:

npm run seed

Start the backend:

npm run dev

Backend runs on:

http://localhost:5000
Frontend

Open another terminal inside the frontend folder:

npm install

Start the frontend:

npm run dev

Open the URL shown by Vite in the terminal.

Testing
Backend Tests

Inside the backend folder:

npm test

Backend tests cover:

Cross-workspace access prevention
Duplicate conversion prevention
Frontend Test

Inside the frontend folder:

npm test

The frontend test covers the login interaction.

Production Build
Frontend

Inside the frontend folder:

npm run build

This creates the production build using Vite.

API Endpoints
Authentication
POST /api/auth/login
Requests
GET    /api/requests
GET    /api/requests/:id
POST   /api/requests
PUT    /api/requests/:id
POST   /api/requests/:id/convert
Validation and Error Handling

The backend validates:

Required request fields
Request status values
Request IDs
Authentication tokens
Workspace access
Request conversion status

Useful HTTP status codes are returned for errors:

400 Bad Request
401 Unauthorized
404 Not Found
409 Conflict
500 Internal Server Error
Key Decisions
SQLite

SQLite was selected because it is lightweight and easy to run locally for the assignment.

JWT Authentication

JWT provides a simple way to identify the authenticated user and workspace for protected API requests.

Backend Workspace Enforcement

Workspace isolation is enforced on the backend rather than relying only on the frontend.

This prevents users from bypassing the UI and accessing another workspace by manually changing an ID.

Database Unique Constraint

The work_items.request_id field is unique so the database also protects against duplicate work items.

Assumptions
Each user belongs to one workspace.
A request belongs to exactly one workspace.
A request can have only one work item.
Only QUALIFIED requests can be converted.
SQLite is sufficient for this assignment's local environment.
JWT authentication is sufficient for the demonstration application.
Trade-offs
SQLite instead of PostgreSQL

SQLite keeps the project simple and easy to run locally.

For a larger production system, PostgreSQL would provide stronger concurrency and scalability options.

Simple JWT Authentication

The authentication implementation is intentionally lightweight for the assignment.

A production system could add refresh tokens, password reset, email verification and stronger authentication controls.

Simple React State Management

The frontend uses React state instead of a dedicated state-management library.

This keeps the application smaller and easier to understand for the current scope.

Future Improvements

Possible future improvements include:

PostgreSQL support
Role-based access control
Refresh tokens
Pagination
Search functionality
Better audit logging
Automated API documentation
More frontend tests
More detailed activity history
Production deployment
CI/CD pipeline
Improved authentication and security controls
AI Tools Used

AI assistance was used during development for:

Understanding assignment requirements
Debugging TypeScript and configuration issues
Structuring backend APIs
Creating test cases
Improving frontend interaction handling
Reviewing workspace isolation logic
Preparing project documentation

All generated code was reviewed and tested manually before being included in the project.

Test Results

Backend automated tests:

Test Files: 1 passed
Tests: 2 passed

Frontend interaction test:

Test Files: 1 passed
Tests: 1 passed

The tests verify workspace isolation, duplicate conversion prevention and a frontend login interaction.