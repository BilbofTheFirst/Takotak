const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../src/db/pool');

async function initializeDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✓ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
