var express = require('express');

var router = express.Router();

var courses = require('./user/courses');
router.use('/courses', courses);

module.exports = router;