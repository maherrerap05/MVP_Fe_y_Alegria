const express = require('express');
const router = express.Router();

const {
  getHorarios,
  getEstudiantesPorHorario
} = require('../controllers/horarioController');

router.get('/', getHorarios);
router.get('/:id/estudiantes', getEstudiantesPorHorario);

module.exports = router;