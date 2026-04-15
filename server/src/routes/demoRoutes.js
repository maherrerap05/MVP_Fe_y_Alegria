const express = require('express');
const router = express.Router();
const { getDemoData } = require('../controllers/demoController');

router.get('/', getDemoData);

module.exports = router;