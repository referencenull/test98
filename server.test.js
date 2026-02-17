const request = require('supertest');
const Database = require('better-sqlite3');
const path = require('path');

// Set test environment variables before requiring server
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';

const { app, db } = require('./server');

describe('Inventory Management API', () => {
  // Clean up database after all tests
  afterAll(() => {
    db.close();
  });

  // Clear items table before each test
  beforeEach(() => {
    db.prepare('DELETE FROM items').run();
  });

  describe('GET /api/items', () => {
    test('should return empty array when no items exist', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return all items', async () => {
      // Insert test data
      const insert = db.prepare('INSERT INTO items (name, quantity, price, description) VALUES (?, ?, ?, ?)');
      insert.run('Test Item 1', 10, 99.99, 'Description 1');
      insert.run('Test Item 2', 20, 199.99, 'Description 2');

      const response = await request(app)
        .get('/api/items')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Verify both items are present
      const names = response.body.map(item => item.name);
      expect(names).toContain('Test Item 1');
      expect(names).toContain('Test Item 2');
    });
  });

  describe('POST /api/items', () => {
    test('should create a new item with valid data', async () => {
      const newItem = {
        name: 'Laptop',
        quantity: 5,
        price: 999.99,
        description: 'High-performance laptop'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Laptop',
        quantity: 5,
        price: 999.99,
        description: 'High-performance laptop'
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
    });

    test('should create item without description', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: 10,
        price: 29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.name).toBe('Mouse');
      expect(response.body.description).toBe('');
    });

    test('should reject item without name', async () => {
      const newItem = {
        quantity: 10,
        price: 29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Name, quantity, and price are required');
    });

    test('should reject item without quantity', async () => {
      const newItem = {
        name: 'Mouse',
        price: 29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Name, quantity, and price are required');
    });

    test('should reject item without price', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Name, quantity, and price are required');
    });

    test('should reject item with non-numeric quantity', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: 'ten',
        price: 29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Quantity and price must be valid numbers');
    });

    test('should reject item with non-numeric price', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: 10,
        price: 'expensive'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Quantity and price must be valid numbers');
    });

    test('should reject item with negative quantity', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: -5,
        price: 29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Quantity and price must be non-negative');
    });

    test('should reject item with negative price', async () => {
      const newItem = {
        name: 'Mouse',
        quantity: 10,
        price: -29.99
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Quantity and price must be non-negative');
    });

    test('should accept quantity and price as zero', async () => {
      const newItem = {
        name: 'Free Item',
        quantity: 0,
        price: 0
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.quantity).toBe(0);
      expect(response.body.price).toBe(0);
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('should delete an existing item', async () => {
      // Insert test item
      const insert = db.prepare('INSERT INTO items (name, quantity, price, description) VALUES (?, ?, ?, ?)');
      const result = insert.run('Test Item', 10, 99.99, 'Test Description');
      const itemId = result.lastInsertRowid;

      const response = await request(app)
        .delete(`/api/items/${itemId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('Item deleted successfully');

      // Verify item is deleted
      const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
      expect(item).toBeUndefined();
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    test('should reject invalid item ID', async () => {
      const response = await request(app)
        .delete('/api/items/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Invalid item ID');
    });
  });

  describe('Integration tests', () => {
    test('should create and then delete an item', async () => {
      // Create item
      const newItem = {
        name: 'Temporary Item',
        quantity: 1,
        price: 10.00,
        description: 'Will be deleted'
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body.id;

      // Verify item exists in GET
      let getResponse = await request(app)
        .get('/api/items')
        .expect(200);
      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].id).toBe(itemId);

      // Delete item
      await request(app)
        .delete(`/api/items/${itemId}`)
        .expect(200);

      // Verify item no longer exists
      getResponse = await request(app)
        .get('/api/items')
        .expect(200);
      expect(getResponse.body).toHaveLength(0);
    });

    test('should create multiple items and retrieve them', async () => {
      const items = [
        { name: 'Item 1', quantity: 10, price: 10.00 },
        { name: 'Item 2', quantity: 20, price: 20.00 },
        { name: 'Item 3', quantity: 30, price: 30.00 }
      ];

      // Create items sequentially
      for (const item of items) {
        await request(app)
          .post('/api/items')
          .send(item)
          .expect(201);
      }

      // Get all items
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(3);
      // Verify all items are present
      const names = response.body.map(item => item.name);
      expect(names).toContain('Item 1');
      expect(names).toContain('Item 2');
      expect(names).toContain('Item 3');
    });
  });
});
