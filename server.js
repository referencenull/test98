const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new Database(process.env.DATABASE_PATH || 'inventory.db');

// Create items table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert test data if table is empty (not in test mode)
if (process.env.NODE_ENV !== 'test') {
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO items (name, quantity, price, description) VALUES (?, ?, ?, ?)');
    
    const testItems = [
      ['Laptop', 15, 999.99, 'High-performance laptop for business'],
      ['Wireless Mouse', 50, 29.99, 'Ergonomic wireless mouse'],
      ['USB-C Cable', 100, 12.99, '6ft USB-C charging cable'],
      ['Monitor', 20, 299.99, '27-inch 4K monitor'],
      ['Keyboard', 35, 79.99, 'Mechanical keyboard with RGB lighting'],
      ['Webcam', 25, 89.99, '1080p HD webcam'],
      ['Headphones', 40, 149.99, 'Noise-cancelling wireless headphones'],
      ['External SSD', 30, 119.99, '1TB portable SSD'],
      ['Phone Case', 200, 19.99, 'Protective phone case'],
      ['Screen Protector', 150, 9.99, 'Tempered glass screen protector']
    ];
    
    testItems.forEach(item => insert.run(...item));
    console.log('Test data inserted successfully');
  }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Get all items
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

// Add new item
app.post('/api/items', (req, res) => {
  try {
    const { name, quantity, price, description } = req.body;
    
    // Validation
    if (!name || quantity == null || price == null) {
      return res.status(400).json({ error: 'Name, quantity, and price are required' });
    }
    
    const qty = Number(quantity);
    const prc = Number(price);
    
    if (isNaN(qty) || isNaN(prc)) {
      return res.status(400).json({ error: 'Quantity and price must be valid numbers' });
    }
    
    if (qty < 0 || prc < 0) {
      return res.status(400).json({ error: 'Quantity and price must be non-negative' });
    }
    
    const insert = db.prepare('INSERT INTO items (name, quantity, price, description) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, qty, prc, description || '');
    
    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Start server only if not in test mode
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Inventory Management Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    db.close();
    console.log('\nDatabase closed. Server shutting down...');
    process.exit(0);
  });
}

// Export for testing
module.exports = { app, db };
