const pool = require('../config/db');
const PDFDocument = require('pdfkit');

const createAsistencia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cursoId, horarioId, fechaRegistro, observacionGeneral, estudiantes } = req.body;

    if (!cursoId || !horarioId || !fechaRegistro || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'cursoId, horarioId, fechaRegistro y estudiantes son obligatorios'
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
        horario_id,
        fecha_registro,
        total_asistieron,
        total_faltaron,
        total_sin_marcar,
        observacion_general
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [cursoId, horarioId, fechaRegistro, asistieron, faltaron, sinMarcar, observacionGeneral || null]
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

    return res.status(201).json({
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

    return res.status(500).json({
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
        a.horario_id,
        c.nombre AS curso_nombre,
        c.paralelo,
        h.materia,
        h.docente,
        h.dia_semana,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
        a.fecha_registro,
        a.total_asistieron,
        a.total_faltaron,
        a.total_sin_marcar,
        a.observacion_general,
        a.creado_en
      FROM asistencias a
      INNER JOIN cursos c 
        ON a.curso_id = c.id
      LEFT JOIN horarios h
        ON a.horario_id = h.id
      ORDER BY a.id DESC
    `);

    return res.json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener asistencias',
      error: error.message
    });
  }
};

const generarReporteAsistenciaPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const asistenciaResult = await pool.query(
      `
      SELECT 
        a.id,
        a.fecha_registro,
        a.total_asistieron,
        a.total_faltaron,
        a.total_sin_marcar,
        a.observacion_general,
        c.nombre AS curso_nombre,
        c.paralelo,
        c.nivel,
        h.materia,
        h.docente,
        h.dia_semana,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin
      FROM asistencias a
      INNER JOIN cursos c
        ON a.curso_id = c.id
      LEFT JOIN horarios h
        ON a.horario_id = h.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (asistenciaResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No se encontró la asistencia solicitada'
      });
    }

    const asistencia = asistenciaResult.rows[0];

    const detalleResult = await pool.query(
      `
      SELECT 
        e.codigo,
        e.nombre_completo,
        ad.estado_asistencia
      FROM asistencia_detalle ad
      INNER JOIN estudiantes e
        ON ad.estudiante_id = e.id
      WHERE ad.asistencia_id = $1
      ORDER BY e.nombre_completo
      `,
      [id]
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const filename = `reporte_asistencia_${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(18)
      .text('Reporte de Asistencia', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .text('Red Educativa Fe y Alegría', { align: 'center' });

    doc.moveDown(1.5);

    // Datos generales
    doc
      .fontSize(13)
      .text('Datos generales', { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Curso: ${asistencia.curso_nombre} - Paralelo ${asistencia.paralelo}`);
    doc.text(`Nivel: ${asistencia.nivel || 'No especificado'}`);
    doc.text(`Materia: ${asistencia.materia || 'No especificada'}`);
    doc.text(`Docente: ${asistencia.docente || 'No especificado'}`);
    doc.text(`Horario: ${asistencia.dia_semana || ''} ${asistencia.hora_inicio || ''} - ${asistencia.hora_fin || ''}`);
    doc.text(`Fecha de registro: ${new Date(asistencia.fecha_registro).toLocaleDateString('es-EC')}`);

    if (asistencia.observacion_general) {
      doc.text(`Observación: ${asistencia.observacion_general}`);
    }

    doc.moveDown(1);

    // Resumen
    doc
      .fontSize(13)
      .text('Resumen de asistencia', { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Asistieron: ${asistencia.total_asistieron}`);
    doc.text(`No asistieron: ${asistencia.total_faltaron}`);
    doc.text(`Sin marcar: ${asistencia.total_sin_marcar}`);

    doc.moveDown(1);

    // Detalle
    doc
      .fontSize(13)
      .text('Detalle por estudiante', { underline: true });

    doc.moveDown(0.5);

    // Cabecera de tabla
    const startX = 50;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Código', startX, y);
    doc.text('Estudiante', startX + 90, y);
    doc.text('Estado', startX + 360, y);

    y += 18;
    doc.moveTo(startX, y - 4).lineTo(545, y - 4).stroke();

    doc.font('Helvetica');

    detalleResult.rows.forEach((estudiante) => {
      if (y > 750) {
        doc.addPage();
        y = 50;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Código', startX, y);
        doc.text('Estudiante', startX + 90, y);
        doc.text('Estado', startX + 360, y);
        y += 18;
        doc.moveTo(startX, y - 4).lineTo(545, y - 4).stroke();
        doc.font('Helvetica');
      }

      const estadoTexto =
        estudiante.estado_asistencia === 'ASISTIO'
          ? 'Asistió'
          : estudiante.estado_asistencia === 'FALTO'
          ? 'No asistió'
          : 'Sin marcar';

      doc.text(estudiante.codigo, startX, y);
      doc.text(estudiante.nombre_completo, startX + 90, y);
      doc.text(estadoTexto, startX + 360, y);

      y += 18;
    });

    doc.moveDown(2);

    doc
      .fontSize(9)
      .text('Reporte generado automáticamente por el MVP de asistencia.', {
        align: 'center'
      });

    doc.end();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al generar el reporte PDF',
      error: error.message
    });
  }
};

module.exports = {
  createAsistencia,
  getAsistencias,
  generarReporteAsistenciaPDF
};