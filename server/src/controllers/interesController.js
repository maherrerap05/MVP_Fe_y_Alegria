const pool = require('../config/db');

const getInteresadosCount = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS total
      FROM interesados
    `);

    res.json({
      ok: true,
      total: Number(result.rows[0].total)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al contar interesados',
      error: error.message
    });
  }
};

const createInteresado = async (req, res) => {
  try {
    const { nombre, correo, comentario } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        message: 'Los campos nombre y correo son obligatorios'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        ok: false,
        message: 'El correo no tiene un formato válido'
      });
    }

    await pool.query(`
      INSERT INTO interesados (nombre, correo, comentario)
      VALUES ($1, $2, $3)
    `, [nombre.trim(), correo.trim(), comentario?.trim() || null]);

    const countResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM interesados
    `);

    res.status(201).json({
      ok: true,
      message: 'Interés registrado correctamente',
      nuevoTotal: Number(countResult.rows[0].total)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al registrar el interés',
      error: error.message
    });
  }
};

module.exports = {
  getInteresadosCount,
  createInteresado
};