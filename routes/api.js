let express = require('express');

let router = express.Router();

let grades = require('./api/grades');
router.use('/grades', grades);

module.exports = router;