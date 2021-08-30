let express = require('express');

let router = express.Router();

let courses = require('./user/courses');
router.use('/courses', courses);

module.exports = router;