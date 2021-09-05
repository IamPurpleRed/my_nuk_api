let express = require('express');

let router = express.Router();

let href = require('./elearning1/href');
router.use('/href', href);

let handouts = require('./elearning1/handouts');
router.use('/handouts', handouts);

module.exports = router;