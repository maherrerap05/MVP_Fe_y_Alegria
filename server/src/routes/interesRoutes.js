const express = require('express');
const router = express.Router();
const {
  getInteresadosCount,
  createInteresado
} = require('../controllers/interesController');

router.get('/count', getInteresadosCount);
router.post('/', createInteresado);

module.exports = router;