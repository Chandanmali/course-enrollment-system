# Course Enrollment System

A full-stack course enrollment application built with React, Vite, Node.js, Express, and MongoDB.

## Features

- Role-based access for Admin, Teacher, and Student
- JWT-based authentication
- Course creation, editing, publishing, and deactivation
- Student course enrollment and enrollment status
- Teacher dashboard for assigned courses and enrolled students
- REST API with MongoDB persistence

## Project Structure

- `Backend/` — Express API, authentication, routes, controllers, and database models
- `Frontend/` — React application built with Vite

## Prerequisites

- Node.js and npm
- MongoDB database

## Backend Setup

Open a terminal in the project root and run:

```powershell
cd Backend
npm install
```

Create `Backend/.env` using `Backend/.env.example` as a reference. Set your actual MongoDB connection string and a strong, private JWT secret.

Start the backend:

```powershell
npm run dev
```

The API uses port 5000 by default.

## Frontend Setup

Open a second terminal from the project root:

```powershell
cd Frontend
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Validation

From the `Frontend` directory, run:

```powershell
npm run lint
npm run build
```

## API Routes

- `/api/auth`
- `/api/admin`
- `/api/courses`
- `/api/enrollments`
- `/api/teacher`

The `/` endpoint provides a basic API health response.

## Security

Never commit real `.env` files, database credentials, JWT secrets, or passwords. Use private environment variables for sensitive configuration.
