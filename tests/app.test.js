const request = require('supertest');
const app = require('../app');
const { getDb, saveDb } = require('../database/database');

describe('Express App', () => {
  beforeEach(async () => {
    const db = await getDb();
    db.run("DELETE FROM todos");
    saveDb();
  });

  test('GET / should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Welcome to the Enhanced Express Todo App!');
  });

  test('GET /health should return health status with all fields', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.status).toBe('UP');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.environment).toBeDefined();
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('GET /health should include current NODE_ENV', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const currentEnv = process.env.NODE_ENV || 'development';
    expect(response.body.environment).toBe(currentEnv);
  });

  test('GET /debug should return debug info object', async () => {
    const response = await request(app)
      .get('/debug')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(typeof response.body).toBe('object');
  });

  test('GET /todos should return todos array', async () => {
    const response = await request(app)
      .get('/todos')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('POST /todos should create a new todo', async () => {
    const todo = {
      title: 'Test Todo',
      description: 'Test Description',
      status: 'pending'
    };

    const response = await request(app)
      .post('/todos')
      .send(todo)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Todo');
  });

  test('POST /todos should return 422 if title is missing', async () => {
    const response = await request(app)
      .post('/todos')
      .send({ description: 'No title' })
      .expect('Content-Type', /json/)
      .expect(422);

    expect(response.body.detail).toBe('title is required');
  });

  test('GET /todos/:id should retrieve a specific todo', async () => {
    const createResponse = await request(app)
      .post('/todos')
      .send({ title: 'Get Test', status: 'pending' });

    const todoId = createResponse.body.id;

    const response = await request(app)
      .get(`/todos/${todoId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).toBe(todoId);
    expect(response.body.title).toBe('Get Test');
  });

  test('GET /todos/:id should return 404 for non-existent todo', async () => {
    const response = await request(app)
      .get('/todos/99999')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.detail).toBe('Todo not found');
  });

  test('PUT /todos/:id should update a todo', async () => {
    const createResponse = await request(app)
      .post('/todos')
      .send({ title: 'Update Test', status: 'pending' });

    const todoId = createResponse.body.id;

    const response = await request(app)
      .put(`/todos/${todoId}`)
      .send({ title: 'Updated Title', status: 'completed' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.title).toBe('Updated Title');
    expect(response.body.status).toBe('completed');
  });

  test('PUT /todos/:id should return 404 for non-existent todo', async () => {
    const response = await request(app)
      .put('/todos/99999')
      .send({ title: 'New Title' })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.detail).toBe('Todo not found');
  });

  test('DELETE /todos/:id should delete a todo', async () => {
    const createResponse = await request(app)
      .post('/todos')
      .send({ title: 'Delete Test', status: 'pending' });

    const todoId = createResponse.body.id;

    const response = await request(app)
      .delete(`/todos/${todoId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.detail).toBe('Todo deleted');

    await request(app)
      .get(`/todos/${todoId}`)
      .expect(404);
  });

  test('DELETE /todos/:id should return 404 for non-existent todo', async () => {
    const response = await request(app)
      .delete('/todos/99999')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.detail).toBe('Todo not found');
  });

  test('GET /todos should support skip and limit parameters', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/todos')
        .send({ title: `Todo ${i}`, status: 'pending' });
    }

    const response = await request(app)
      .get('/todos?skip=2&limit=2')
      .expect(200);

    expect(response.body.length).toBeLessThanOrEqual(2);
  });

  test('PUT should preserve fields not provided in request body', async () => {
    const createResponse = await request(app)
      .post('/todos')
      .send({ title: 'Full Todo', description: 'Full Description', status: 'pending' });

    const todoId = createResponse.body.id;

    const response = await request(app)
      .put(`/todos/${todoId}`)
      .send({ title: 'Updated Title Only' })
      .expect(200);

    expect(response.body.title).toBe('Updated Title Only');
    expect(response.body.description).toBe('Full Description');
    expect(response.body.status).toBe('pending');
  });

  test('Server should start and listen on specified port', async () => {
    const { startServer } = require('../app');
    
    // Use a test port to avoid conflicts
    const testPort = 9999;
    const server = startServer(testPort);
    
    // Verify server is listening
    expect(server.listening).toBe(true);
    
    // Clean up: close the server
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });
});
