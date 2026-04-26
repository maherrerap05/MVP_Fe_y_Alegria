const express = require('express');
const router = express.Router();

const {
  createAsistencia,
  getAsistencias,
  generarReporteAsistenciaPDF
} = require('../controllers/asistenciaController');

router.get('/', getAsistencias);
router.get('/:id/reporte', generarReporteAsistenciaPDF);
router.post('/', createAsistencia);

module.exports = router;