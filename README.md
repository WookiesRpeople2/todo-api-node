# Todo API

[![codecov](https://codecov.io/gh/user/todo-api-node/branch/main/graph/badge.svg)](https://codecov.io/gh/user/todo-api-node)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)

Simple Express API for managing todos with a file-backed SQLite database (sql.js).

## Prerequisites

- Node.js 18+

## Install

```
npm install
```

## Run

```
npm start
```

Server starts on `http://localhost:3000` by default.

## Tests

```
npm test
```

## Environment variables

- `PORT`: server port (default 3000)

## Docker

Build the Docker image:

```bash
docker build -t todo-api .
```

Run the container:

```bash
# Without port mapping (uses default 3000)
docker run todo-api

# With custom port
docker run -p 8080:3000 todo-api

# With environment variables
docker run -e PORT=8080 todo-api
```

Run with docker-compose:

```bash
docker-compose up
```

The API will be available at `http://localhost:3000` (or your configured PORT).

### Health

#### `GET /`

Response:

```json
{
	"message": "Welcome to the Enhanced Express Todo App!"
}
```


### Todos


#### `GET /todos`

List todos with pagination.

Query params:

- `skip` (default 0)
- `limit` (default 10)

Example: `GET /todos?skip=0&limit=5`

Response:

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

#### `GET /todos/:id`

Response:

```json
{
	"id": 1,
	"title": "Buy milk",
	"description": "2 bottles",
	"status": "pending"
}
```

Error response (404):

```json
{
	"detail": "Todo not found"
}
```

#### `PUT /todos/:id`

Update any fields on a todo.

Body (any subset):

```json
{
	"title": "Buy oat milk",
	"description": "1 bottle",
	"status": "done"
}
```

Response:

```json
{
	"id": 1,
	"title": "Buy oat milk",
	"description": "1 bottle",
	"status": "done"
}
```

Error response (404):

```json
{
	"detail": "Todo not found"
}
```

#### `DELETE /todos/:id`

Response:

```json
{
	"detail": "Todo deleted"
}
```

Error response (404):

```json
{
	"detail": "Todo not found"
}
```

#### `GET /todos/search/all`

Search todos by title using a `LIKE` query.

Query params:

- `q` (default empty string)

Example: `GET /todos/search/all?q=milk`

Response:

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
