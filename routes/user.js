let express = require('express');

let router = express.Router();

let courses = require('./user/courses');
router.use('/courses', courses);

let grades = require('./user/grades');
router.use('/grades', grades);

module.exports = router;