# Backend — Course Enrollment System

The backend is built with Node.js, Express, and MongoDB using Mongoose.

## Installation

From the project root:

```powershell
cd Backend
npm install
```

## Environment Configuration

Create a local `.env` file using `.env.example` as a reference.

Required variables:

- `PORT` — Server port; defaults to `5000`
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret used for JWT authentication

Never commit the real `.env` file or share its secrets.

## Run the Server

Development mode:

```powershell
npm run dev
```

Normal start:

```powershell
npm start
```

## API Endpoints

| Base path | Purpose |
|---|---|
| `/api/auth` | Authentication |
| `/api/admin` | Admin operations |
| `/api/courses` | Course operations |
| `/api/enrollments` | Enrollment operations |
| `/api/teacher` | Teacher operations |

The `/` endpoint returns a basic API health response.

## Main Dependencies

- Express
- Mongoose
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- nodemon (development)

## Security

Use a strong, private JWT secret and an authorized MongoDB connection. Never commit credentials or passwords.
