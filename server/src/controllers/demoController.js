const pool = require('../config/db');

const getDemoData = async (req, res) => {
  try {
    const cursoResult = await pool.query(`
      SELECT id, nombre, paralelo, nivel
      FROM cursos
      ORDER BY id
      LIMIT 1
    `);

    const curso = cursoResult.rows[0];

    if (!curso) {
      return res.status(404).json({
        ok: false,
        message: 'No se encontró un curso demo'
      });
    }

    const estudiantesResult = await pool.query(`
      SELECT id, codigo, nombre_completo
      FROM estudiantes
      WHERE curso_id = $1 AND estado = 'ACT'
      ORDER BY id
    `, [curso.id]);

    const interesadosCountResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM interesados
    `);

    res.json({
      ok: true,
      curso,
      estudiantes: estudiantesResult.rows,
      profesoresInteresados: Number(interesadosCountResult.rows[0].total)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los datos demo',
      error: error.message
    });
  }
};

module.exports = {
  getDemoData
};