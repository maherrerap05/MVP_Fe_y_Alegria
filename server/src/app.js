const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const demoRoutes = require('./routes/demoRoutes');
const interesRoutes = require('./routes/interesRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client')));

// Probar conexión a PostgreSQL al iniciar
pool.connect()
  .then(client => {
    console.log('Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('Error al conectar con PostgreSQL:', err.message);
  });

// Ruta base de prueba
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'API operativa'
  });
});

// Ruta de prueba de base de datos
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      message: 'Conexión a PostgreSQL correcta',
      serverTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al consultar la base de datos',
      error: error.message
    });
  }
});

// Rutas API
app.use('/api/demo', demoRoutes);
app.use('/api/interesados', interesRoutes);
app.use('/api/asistencias', asistenciaRoutes);

// Fallback para frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});