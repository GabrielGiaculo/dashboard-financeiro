require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('Aplicando migracoes no banco de dados...');
    await pool.query(sql);
    console.log('Migracoes aplicadas com sucesso!');
  } catch (err) {
    console.error('Erro ao aplicar migracoes:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();