let express = require('express');

let router = express.Router();

let courses = require('./api/courses');
router.use('/courses', courses);

let grades = require('./api/grades');
router.use('/grades', grades);

let elearning1 = require('./api/elearning1');
router.use('/elearning1', elearning1);

module.exports = router;