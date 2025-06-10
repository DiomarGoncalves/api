const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão PostgreSQL via connection string
const pool = new Pool({
  connectionString: 'postgresql://sistema%20pos%20venda_owner:npg_y8MoLnHElwd9@ep-cool-math-ac3hfcao-pooler.sa-east-1.aws.neon.tech/sistema%20pos%20venda?sslmode=require'
});

// Teste de conexão
app.get('/ping', (req, res) => {
  res.json({ status: 'ok' });
});

// Sincronizar service_records (upsert)
app.post('/sync/service-records', async (req, res) => {
  const records = req.body.records || [];
  try {
    for (const record of records) {
      await pool.query(
        `INSERT INTO service_records (id, order_number, equipment, client, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           order_number = EXCLUDED.order_number,
           equipment = EXCLUDED.equipment,
           client = EXCLUDED.client,
           updated_at = EXCLUDED.updated_at`,
        [record.id, record.order_number, record.equipment, record.client, record.updated_at]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao sincronizar registros' });
  }
});

// Buscar todos os service_records
app.get('/sync/service-records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_records');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar registros' });
  }
});

// Sincronizar attachments (upsert)
app.post('/sync/attachments', async (req, res) => {
  const attachments = req.body.attachments || [];
  try {
    for (const att of attachments) {
      await pool.query(
        `INSERT INTO attachments (id, service_record_id, filename, url, mimetype, size, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           service_record_id = EXCLUDED.service_record_id,
           filename = EXCLUDED.filename,
           url = EXCLUDED.url,
           mimetype = EXCLUDED.mimetype,
           size = EXCLUDED.size,
           created_at = EXCLUDED.created_at`,
        [att.id, att.service_record_id, att.filename, att.url, att.mimetype, att.size, att.created_at]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao sincronizar anexos' });
  }
});

// Buscar todos os attachments
app.get('/sync/attachments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attachments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar anexos' });
  }
});

// Inicie o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Sync API rodando na porta ${PORT}`);
});
