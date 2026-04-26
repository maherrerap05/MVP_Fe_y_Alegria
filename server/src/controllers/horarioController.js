const pool = require('../config/db');

const getHorarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.id,
        h.curso_id,
        c.nombre AS curso_nombre,
        c.paralelo,
        c.nivel,
        h.materia,
        h.docente,
        h.dia_semana,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin
      FROM horarios h
      INNER JOIN cursos c 
        ON h.curso_id = c.id
      WHERE h.estado = 'ACT'
      ORDER BY 
        CASE h.dia_semana
          WHEN 'Lunes' THEN 1
          WHEN 'Martes' THEN 2
          WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4
          WHEN 'Viernes' THEN 5
          WHEN 'Sábado' THEN 6
          WHEN 'Domingo' THEN 7
          ELSE 8
        END,
        h.hora_inicio
    `);

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener horarios',
      error: error.message
    });
  }
};

const getEstudiantesPorHorario = async (req, res) => {
  try {
    const { id } = req.params;

    const horarioResult = await pool.query(
      `
      SELECT 
        h.id,
        h.curso_id,
        c.nombre AS curso_nombre,
        c.paralelo,
        h.materia,
        h.docente,
        h.dia_semana,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin
      FROM horarios h
      INNER JOIN cursos c 
        ON h.curso_id = c.id
      WHERE h.id = $1
        AND h.estado = 'ACT'
      `,
      [id]
    );

    if (horarioResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No se encontró el horario solicitado'
      });
    }

    const estudiantesResult = await pool.query(
      `
      SELECT 
        e.id,
        e.codigo,
        e.nombre_completo
      FROM horario_estudiantes he
      INNER JOIN estudiantes e
        ON he.estudiante_id = e.id
      WHERE he.horario_id = $1
        AND he.estado = 'ACT'
        AND e.estado = 'ACT'
      ORDER BY e.nombre_completo
      `,
      [id]
    );

    return res.json({
      ok: true,
      horario: horarioResult.rows[0],
      estudiantes: estudiantesResult.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener estudiantes del horario',
      error: error.message
    });
  }
};

module.exports = {
  getHorarios,
  getEstudiantesPorHorario
};