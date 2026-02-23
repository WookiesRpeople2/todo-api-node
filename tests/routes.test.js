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
