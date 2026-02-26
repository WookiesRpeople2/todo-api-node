# Todo API


[![codecov](https://codecov.io/gh/user/todo-api-node/branch/main/graph/badge.svg)](https://codecov.io/gh/user/todo-api-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)
[![Docker Image](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Sentry](https://img.shields.io/badge/monitoring-Sentry-362d59?logo=sentry)](https://sentry.io)
[![Sentry Status](https://img.shields.io/website?url=https://status.sentry.io)](https://status.sentry.io)

Simple Express API for managing todos with a file-backed SQLite database (sql.js).

## Features

- ✅ RESTful API with full CRUD operations
- ✅ SQLite database with sql.js (file-backed)
- ✅ Parameterized queries for security
- ✅ Search functionality
- ✅ OpenAPI 3.0 documentation with Swagger UI
- ✅ Docker support
- ✅ Comprehensive test coverage
- ✅ GitHub Actions CI/CD
- ✅ Error monitoring with Sentry
- ✅ Structured logging with Pino

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Running the API

### Development

```bash
npm start
```

Server starts on `http://localhost:3000` by default.

### Custom Port

```bash
PORT=8080 npm start
```

**Environment Variables:**

- `PORT`: Server port (default: 3000)
- `SENTRY_DSN`: Sentry Data Source Name for error tracking (optional)
- `NODE_ENV`: Environment name - `development`, `production`, etc. (default: development)

## Testing

Run all tests:

```bash
npm test
```

View code coverage:

```bash
npm test -- --coverage
```

## Docker

### Build Image

```bash
docker build -t todo-api .
```

### Run Container

**Default port (3000):**

```bash
docker run -p 3000:3000 todo-api
```

**Custom port:**

```bash
docker run -p 8080:3000 -e PORT=3000 todo-api
```

**Using docker-compose:**

```bash
docker-compose up
```

The API will be available at `http://localhost:3000`.

## API Documentation

### Interactive Swagger UI

Visit `http://localhost:3000/docs` for interactive API documentation.

### Endpoints

#### Health Check

**`GET /`**

Check if the API is running.

**Response (200):**

```json
{
  "message": "Welcome to the Enhanced Express Todo App!"
}
```

#### Create Todo

**`POST /todos`**

Create a new todo item.

**Request Body:**

```json
{
  "title": "Buy milk",
  "description": "2 bottles",
  "status": "pending"
}
```

- `title` (required): Todo title
- `description` (optional): Todo description
- `status` (optional): One of `pending`, `in_progress`, `done` (default: `pending`)

**Response (201):**

```json
{
  "id": 1,
  "title": "Buy milk",
  "description": "2 bottles",
  "status": "pending"
}
```

**Error Response (422):**

```json
{
  "detail": "title is required"
}
```

#### List Todos

**`GET /todos`**

List todos with pagination.

**Query Parameters:**

- `skip` (default: 0): Number of items to skip
- `limit` (default: 10): Number of items to return

**Example:** `GET /todos?skip=0&limit=5`

**Response (200):**

```json
[
  {
    "id": 1,
    "title": "Buy milk",
    "description": "2 bottles",
    "status": "pending"
  },
  {
    "id": 2,
    "title": "Walk dog",
    "description": null,
    "status": "done"
  }
]
```

#### Get Todo by ID

**`GET /todos/:id`**

Get a single todo by ID.

**Example:** `GET /todos/1`

**Response (200):**

```json
{
  "id": 1,
  "title": "Buy milk",
  "description": "2 bottles",
  "status": "pending"
}
```

**Error Response (404):**

```json
{
  "detail": "Todo not found"
}
```

#### Update Todo

**`PUT /todos/:id`**

Update any fields on a todo.

**Request Body (any subset):**

```json
{
  "title": "Buy oat milk",
  "description": "1 bottle",
  "status": "done"
}
```

**Response (200):**

```json
{
  "id": 1,
  "title": "Buy oat milk",
  "description": "1 bottle",
  "status": "done"
}
```

**Error Response (404):**

```json
{
  "detail": "Todo not found"
}
```

#### Delete Todo

**`DELETE /todos/:id`**

Delete a todo.

**Example:** `DELETE /todos/1`

**Response (200):**

```json
{
  "detail": "Todo deleted"
}
```

**Error Response (404):**

```json
{
  "detail": "Todo not found"
}
```

#### Search Todos

**`GET /todos/search/all`**

Search todos by title using a LIKE query.

**Query Parameters:**

- `q` (default: ""): Search query

**Example:** `GET /todos/search/all?q=milk`

**Response (200):**

```json
[
  {
    "id": 1,
    "title": "Buy milk",
    "description": "2 bottles",
    "status": "pending"
  }
]
```

## Monitoring & Error Tracking

This project uses **[Sentry](https://sentry.io)** for real-time error tracking and performance monitoring.

### Setup Sentry

1. **Create a Sentry account** at [sentry.io](https://sentry.io) (free tier available)

2. **Create a new project** in Sentry dashboard:
   - Select "Node.js" as the platform
   - Copy your project's DSN (Data Source Name)

3. **Set the environment variable:**

   ```bash
   # Linux/macOS
   export SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
   npm start
   
   # Windows PowerShell
   $env:SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
   npm start
   
   # Windows CMD
   set SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   npm start
   ```

4. **For production deployment**, set `SENTRY_DSN` in your hosting environment (Docker, Kubernetes, cloud platform)

### What Sentry Monitors

- ❌ **Unhandled exceptions** and promise rejections
- 🐛 **Error stack traces** with source maps
- 📊 **Performance metrics** and transaction tracing
- 🌍 **Request context** (HTTP method, URL, user agent)
- 📍 **Environment tagging** (development, production, staging)

### Running Without Sentry

The application works perfectly fine without Sentry. If `SENTRY_DSN` is not set, Sentry will be disabled and errors will be logged normally with Pino.

## License

MIT
