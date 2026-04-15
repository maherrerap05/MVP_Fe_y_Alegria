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

// Rutas reales
app.use('/api/demo', demoRoutes);
app.use('/api/interesados', interesRoutes);
app.use('/api/asistencias', asistenciaRoutes);

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});