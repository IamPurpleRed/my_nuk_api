let express = require('express');

let router = express.Router();

let grades = require('./api/grades');
router.use('/grades', grades);

let elearning1 = require('./api/elearning1');
router.use('/elearning1', elearning1);

module.exports = router;