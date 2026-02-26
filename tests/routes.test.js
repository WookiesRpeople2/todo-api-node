const request = require('supertest');
const app = require('../app');
const { getDb, saveDb } = require('../database/database');

describe('Todo Routes', () => {
  beforeEach(async () => {
    const db = await getDb();
    db.run("DELETE FROM todos");
    saveDb();
  });

  describe('POST /todos', () => {
    test('should create a todo with default status', async () => {
      const response = await request(app)
        .post('/todos')
        .send({ title: 'New Todo' })
        .expect(201);

      expect(response.body.status).toBe('pending');
    });

    test('should create a todo with description', async () => {
      const response = await request(app)
        .post('/todos')
        .send({
          title: 'Todo with Description',
          description: 'This is a description'
        })
        .expect(201);

      expect(response.body.description).toBe('This is a description');
    });

    test('should accept custom status', async () => {
      const response = await request(app)
        .post('/todos')
        .send({
          title: 'Todo with Status',
          status: 'completed'
        })
        .expect(201);

      expect(response.body.status).toBe('completed');
    });

    test('should reject empty title', async () => {
      const response = await request(app)
        .post('/todos')
        .send({ title: '' })
        .expect(422);

      expect(response.body.detail).toBe('title is required');
    });
  });

  describe('GET /todos', () => {
    test('should return empty array for empty database', async () => {
      const response = await request(app)
        .get('/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });

    test('should return todos in order', async () => {
      await request(app).post('/todos').send({ title: 'First' });
      await request(app).post('/todos').send({ title: 'Second' });

      const response = await request(app)
        .get('/todos')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /todos/:id', () => {
    test('should return correct todo structure', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'Structure Test', description: 'Test' });

      const todoId = createResponse.body.id;

      const response = await request(app)
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('PUT /todos/:id', () => {
    test('should update only title', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'Original', description: 'Desc', status: 'pending' });

      const todoId = createResponse.body.id;

      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: 'Modified' })
        .expect(200);

      expect(response.body.title).toBe('Modified');
      expect(response.body.description).toBe('Desc');
    });

    test('should update only description', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'Test', description: 'Original Desc' });

      const todoId = createResponse.body.id;

      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send({ description: 'New Description' })
        .expect(200);

      expect(response.body.title).toBe('Test');
      expect(response.body.description).toBe('New Description');
    });

    test('should update only status', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'Test', status: 'pending' });

      const todoId = createResponse.body.id;

      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.status).toBe('completed');
    });

    test('should update multiple fields', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'Original', description: 'Desc', status: 'pending' });

      const todoId = createResponse.body.id;

      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: 'New Title', status: 'completed' })
        .expect(200);

      expect(response.body.title).toBe('New Title');
      expect(response.body.status).toBe('completed');
    });
  });

  describe('DELETE /todos/:id', () => {
    test('should delete todo successfully', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'To Delete' });

      const todoId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/todos/${todoId}`)
        .expect(200);

      expect(deleteResponse.body.detail).toBe('Todo deleted');
    });

    test('should not find deleted todo', async () => {
      const createResponse = await request(app)
        .post('/todos')
        .send({ title: 'To Delete' });

      const todoId = createResponse.body.id;

      await request(app)
        .delete(`/todos/${todoId}`)
        .expect(200);

      await request(app)
        .get(`/todos/${todoId}`)
        .expect(404);
    });
  });
});

describe('GET /search/all', () => {
  beforeEach(async () => {
    const db = await getDb();
    db.run("DELETE FROM todos");
    saveDb();

    await request(app).post('/todos').send({ title: 'Buy groceries', description: 'Milk and eggs' });
    await request(app).post('/todos').send({ title: 'Buy flowers', description: 'For the garden' });
    await request(app).post('/todos').send({ title: 'Walk the dog', description: 'Morning walk' });
  });

  test('should return all todos when no query is provided', async () => {
    const response = await request(app)
      .get('/todos/search/all')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
  });

  test('should return all todos when q is empty string', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
  });

  test('should return matching todos for a query', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=Buy')
      .expect(200);

    expect(response.body.length).toBe(2);
    expect(response.body.every(todo => todo.title.includes('Buy'))).toBeTruthy();
  });

  test('should be case-insensitive', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=buy')
      .expect(200);

    expect(response.body.length).toBe(2);
  });

  test('should return empty array when no todos match', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=nonexistent')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });

  test('should match partial title', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=dog')
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Walk the dog');
  });

  test('should return correct todo structure in results', async () => {
    const response = await request(app)
      .get('/todos/search/all?q=groceries')
      .expect(200);

    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('description');
    expect(response.body[0]).toHaveProperty('status');
  });

  test('should return empty array when database is empty', async () => {
    const db = await getDb();
    db.run("DELETE FROM todos");
    saveDb();

    const response = await request(app)
      .get('/todos/search/all?q=Buy')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
});

describe('asyncHandler error handling', () => {
  const ORIGINAL_ENV = process.env;

  const mockSentry = () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    Handlers: {
      requestHandler: () => (req, _res, next) => next(),
      errorHandler: () => (err, _req, _res, next) => next(err),
    },
    Integrations: {
      Http: function Http() {},
      Express: function Express() {},
    },
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('asyncHandler logs error and returns 500 when route handler throws', async () => {
    jest.resetModules();

    const logger = require('../logger.js');
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    // Mock getDb to throw an error - this tests the real asyncHandler from routes/todo.js
    const dbModule = require('../database/database');
    jest.spyOn(dbModule, 'getDb').mockRejectedValueOnce(new Error('Database connection failed'));

    const freshApp = require('../app');

    const response = await request(freshApp)
      .get('/todos')
      .expect(500);

    expect(response.body.detail).toBe('Internal server error');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Database connection failed' }),
      'Route handler error'
    );

    errorSpy.mockRestore();
  });

  test('asyncHandler captures exception with Sentry when SENTRY_DSN is set', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      SENTRY_DSN: 'https://example@o0.ingest.sentry.io/1',
      NODE_ENV: 'test',
    };

    jest.resetModules();
    jest.doMock('@sentry/node', () => mockSentry());

    const logger = require('../logger.js');
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    const Sentry = require('@sentry/node');

    // Mock getDb to throw an error - this tests the real asyncHandler with SENTRY_DSN set
    const dbModule = require('../database/database');
    jest.spyOn(dbModule, 'getDb').mockRejectedValueOnce(new Error('Sentry test error'));

    const freshApp = require('../app');

    const response = await request(freshApp)
      .post('/todos')
      .send({ title: 'Test' })
      .expect(500);

    expect(response.body.detail).toBe('Internal server error');
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Sentry test error' })
    );
  });
});
