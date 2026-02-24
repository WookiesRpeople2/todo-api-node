# Todo API

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
- `SECRET_KEY`: used only by `/debug`
- `API_KEY`: used only by `/debug`

## API documentation

Base URL: `http://localhost:3000`

### Health

#### `GET /`

Response:

```json
{
	"message": "Welcome to the Enhanced Express Todo App!"
}
```

### Debug

#### `GET /debug`

Returns environment secrets. Do not expose in production.

Response:

```json
{
	"secret": "...",
	"api_key": "..."
}
```

### Todos

#### `POST /todos`

Create a todo.

Body:

```json
{
	"title": "Buy milk",
	"description": "2 bottles",
	"status": "pending"
}
```

Rules:

- `title` is required
- `description` is optional (default `null`)
- `status` is optional (default `pending`)

Success response (201):

```json
{
	"id": 1,
	"title": "Buy milk",
	"description": "2 bottles",
	"status": "pending"
}
```

Error response (422):

```json
{
	"detail": "title is required"
}
```

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
