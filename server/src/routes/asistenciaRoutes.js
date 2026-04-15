const express = require('express');
const router = express.Router();
const {
  createAsistencia,
  getAsistencias
} = require('../controllers/asistenciaController');

router.get('/', getAsistencias);
router.post('/', createAsistencia);

module.exports = router;