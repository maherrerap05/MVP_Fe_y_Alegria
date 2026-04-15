const pool = require('../config/db');

const createAsistencia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cursoId, fechaRegistro, observacionGeneral, estudiantes } = req.body;

    if (!cursoId || !fechaRegistro || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'cursoId, fechaRegistro y estudiantes son obligatorios'
      });
    }

    const estadosValidos = ['ASISTIO', 'FALTO', 'SIN_MARCAR'];

    for (const estudiante of estudiantes) {
      if (!estudiante.estudianteId || !estudiante.estado) {
        return res.status(400).json({
          ok: false,
          message: 'Cada estudiante debe tener estudianteId y estado'
        });
      }

      if (!estadosValidos.includes(estudiante.estado)) {
        return res.status(400).json({
          ok: false,
          message: `Estado inválido: ${estudiante.estado}`
        });
      }
    }

    const asistieron = estudiantes.filter(e => e.estado === 'ASISTIO').length;
    const faltaron = estudiantes.filter(e => e.estado === 'FALTO').length;
    const sinMarcar = estudiantes.filter(e => e.estado === 'SIN_MARCAR').length;

    await client.query('BEGIN');

    const asistenciaResult = await client.query(
      `
      INSERT INTO asistencias (
        curso_id,
        fecha_registro,
        total_asistieron,
        total_faltaron,
        total_sin_marcar,
        observacion_general
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [cursoId, fechaRegistro, asistieron, faltaron, sinMarcar, observacionGeneral || null]
    );

    const asistenciaId = asistenciaResult.rows[0].id;

    for (const estudiante of estudiantes) {
      await client.query(
        `
        INSERT INTO asistencia_detalle (
          asistencia_id,
          estudiante_id,
          estado_asistencia
        )
        VALUES ($1, $2, $3)
        `,
        [asistenciaId, estudiante.estudianteId, estudiante.estado]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      message: 'Asistencia registrada correctamente',
      asistenciaId,
      resumen: {
        asistieron,
        faltaron,
        sinMarcar
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');

    res.status(500).json({
      ok: false,
      message: 'Error al registrar la asistencia',
      error: error.message
    });
  } finally {
    client.release();
  }
};

const getAsistencias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.curso_id,
        c.nombre AS curso_nombre,
        c.paralelo,
        a.fecha_registro,
        a.total_asistieron,
        a.total_faltaron,
        a.total_sin_marcar,
        a.observacion_general,
        a.creado_en
      FROM asistencias a
      INNER JOIN cursos c ON a.curso_id = c.id
      ORDER BY a.id DESC
    `);

    res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener asistencias',
      error: error.message
    });
  }
};

module.exports = {
  createAsistencia,
  getAsistencias
};